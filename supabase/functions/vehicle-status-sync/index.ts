import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 بدء تشغيل مزامنة حالات المركبات');

    // إنشاء عميل Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // الحصول على جميع العقود النشطة والمعلقة
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, vehicle_id, status, start_date, end_date, actual_start_date, actual_end_date')
      .in('status', ['active', 'pending']);

    if (contractsError) {
      throw contractsError;
    }

    // الحصول على جميع المركبات
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, status, vehicle_number, make, model');

    if (vehiclesError) {
      throw vehiclesError;
    }

    const currentDate = new Date();
    const vehicleContractMap = new Map();
    const updatedVehicles: any[] = [];
    const expiredContracts: any[] = [];

    // إنشاء خريطة المركبات والعقود
    contracts?.forEach(contract => {
      vehicleContractMap.set(contract.vehicle_id, contract);
    });

    console.log(`📊 تم العثور على ${contracts?.length || 0} عقد و ${vehicles?.length || 0} مركبة`);

    // مراجعة كل مركبة
    for (const vehicle of vehicles || []) {
      const contract = vehicleContractMap.get(vehicle.id);
      let expectedStatus: string;
      let shouldUpdate = false;

      if (contract) {
        if (contract.status === 'active') {
          expectedStatus = 'rented';
        } else if (contract.status === 'pending') {
          expectedStatus = 'available'; // في الانتظار
        } else {
          expectedStatus = 'available';
        }
      } else {
        // البحث عن عقود منتهية حديثاً لهذه المركبة
        const { data: recentExpired } = await supabase
          .from('contracts')
          .select('id, end_date, actual_end_date, status')
          .eq('vehicle_id', vehicle.id)
          .eq('status', 'completed')
          .gte('actual_end_date', new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .order('actual_end_date', { ascending: false })
          .limit(1);

        expectedStatus = 'available';
      }

      // تحديث الحالة إذا كانت مختلفة
      if (vehicle.status !== expectedStatus) {
        shouldUpdate = true;
        updatedVehicles.push({
          id: vehicle.id,
          vehicle_number: vehicle.vehicle_number,
          old_status: vehicle.status,
          new_status: expectedStatus,
          contract_id: contract?.id
        });

        // تحديث الحالة في قاعدة البيانات
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ 
            status: expectedStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', vehicle.id);

        if (updateError) {
          console.error(`❌ خطأ في تحديث المركبة ${vehicle.vehicle_number}:`, updateError);
        } else {
          console.log(`✅ تم تحديث المركبة ${vehicle.vehicle_number}: ${vehicle.status} → ${expectedStatus}`);
        }
      }
    }

    // فحص العقود المنتهية الصلاحية
    const { data: expiredContractsData, error: expiredError } = await supabase
      .from('contracts')
      .select('id, vehicle_id, end_date, contract_number, customers(name), vehicles(vehicle_number)')
      .eq('status', 'active')
      .lt('end_date', currentDate.toISOString().split('T')[0]);

    if (expiredError) {
      console.error('❌ خطأ في البحث عن العقود المنتهية:', expiredError);
    } else if (expiredContractsData && expiredContractsData.length > 0) {
      console.log(`⏰ وجد ${expiredContractsData.length} عقد منتهي الصلاحية`);

      for (const contract of expiredContractsData) {
        try {
          // تحديث حالة العقد إلى مكتمل
          const { error: contractUpdateError } = await supabase
            .from('contracts')
            .update({ 
              status: 'completed',
              actual_end_date: contract.end_date,
              updated_at: new Date().toISOString()
            })
            .eq('id', contract.id);

          if (contractUpdateError) {
            throw contractUpdateError;
          }

          // تحديث حالة المركبة إلى متاحة
          const { error: vehicleUpdateError } = await supabase
            .from('vehicles')
            .update({ 
              status: 'available',
              updated_at: new Date().toISOString()
            })
            .eq('id', contract.vehicle_id);

          if (vehicleUpdateError) {
            throw vehicleUpdateError;
          }

          expiredContracts.push({
            id: contract.id,
            contract_number: contract.contract_number,
            vehicle_id: contract.vehicle_id,
            customer_name: contract.customers?.name,
            vehicle_number: contract.vehicles?.vehicle_number
          });

          console.log(`✅ تم إكمال العقد المنتهي ${contract.contract_number} وتحرير المركبة ${contract.vehicles?.vehicle_number}`);

        } catch (contractError) {
          console.error(`❌ خطأ في معالجة العقد المنتهي ${contract.id}:`, contractError);
        }
      }
    }

    // إنشاء تقرير النتائج
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_vehicles_checked: vehicles?.length || 0,
        total_contracts_checked: contracts?.length || 0,
        vehicles_updated: updatedVehicles.length,
        contracts_expired: expiredContracts.length
      },
      details: {
        updated_vehicles: updatedVehicles,
        expired_contracts: expiredContracts
      }
    };

    console.log('📊 نتائج المزامنة:', result.summary);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ خطأ في مزامنة حالات المركبات:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});