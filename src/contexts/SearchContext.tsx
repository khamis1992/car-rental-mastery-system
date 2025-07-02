import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'customer' | 'vehicle' | 'contract' | 'invoice' | 'employee';
  data: any;
}

interface SearchContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isLoading: boolean;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results: SearchResult[] = [];

      // البحث في العملاء
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, email, customer_number')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%,customer_number.ilike.%${query}%`)
        .limit(5);

      if (customers) {
        customers.forEach(customer => {
          results.push({
            id: customer.id,
            title: customer.name,
            description: `العميل: ${customer.customer_number} - ${customer.phone}`,
            type: 'customer',
            data: customer
          });
        });
      }

      // البحث في المركبات
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, vehicle_number')
        .or(`make.ilike.%${query}%,model.ilike.%${query}%,license_plate.ilike.%${query}%,vehicle_number.ilike.%${query}%`)
        .limit(5);

      if (vehicles) {
        vehicles.forEach(vehicle => {
          results.push({
            id: vehicle.id,
            title: `${vehicle.make} ${vehicle.model}`,
            description: `المركبة: ${vehicle.vehicle_number} - ${vehicle.license_plate}`,
            type: 'vehicle',
            data: vehicle
          });
        });
      }

      // البحث في العقود
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, contract_number, status, customers(name)')
        .or(`contract_number.ilike.%${query}%`)
        .limit(5);

      if (contracts) {
        contracts.forEach(contract => {
          results.push({
            id: contract.id,
            title: `عقد ${contract.contract_number}`,
            description: `العميل: ${(contract as any).customers?.name || 'غير محدد'} - الحالة: ${contract.status}`,
            type: 'contract',
            data: contract
          });
        });
      }

      // البحث في الفواتير
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, total_amount, customers(name)')
        .or(`invoice_number.ilike.%${query}%`)
        .limit(5);

      if (invoices) {
        invoices.forEach(invoice => {
          results.push({
            id: invoice.id,
            title: `فاتورة ${invoice.invoice_number}`,
            description: `${(invoice as any).customers?.name || 'غير محدد'} - ${invoice.total_amount} د.ك`,
            type: 'invoice',
            data: invoice
          });
        });
      }

      // البحث في الموظفين
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number, position')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,employee_number.ilike.%${query}%,position.ilike.%${query}%`)
        .limit(5);

      if (employees) {
        employees.forEach(employee => {
          results.push({
            id: employee.id,
            title: `${employee.first_name} ${employee.last_name}`,
            description: `الموظف: ${employee.employee_number} - ${employee.position}`,
            type: 'employee',
            data: employee
          });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const value = {
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    performSearch,
    clearSearch
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};