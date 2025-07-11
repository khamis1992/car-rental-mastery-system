import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Copy,
  RefreshCw,
  Plus,
  Trash2
} from "lucide-react";
import { domainService, DomainService, DomainVerification, SSLCertificate, DomainVerificationInstructions } from '@/services/domainService';
import { useToast } from '@/hooks/use-toast';

interface DomainManagementProps {
  tenantId: string;
  tenantName: string;
  currentDomain?: string;
}

const DomainManagement: React.FC<DomainManagementProps> = ({ 
  tenantId, 
  tenantName, 
  currentDomain 
}) => {
  const [verifications, setVerifications] = useState<DomainVerification[]>([]);
  const [certificates, setCertificates] = useState<SSLCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [verificationType, setVerificationType] = useState<'dns' | 'txt' | 'cname'>('dns');
  const [verificationInstructions, setVerificationInstructions] = useState<DomainVerificationInstructions | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [verificationsData, certificatesData] = await Promise.all([
        domainService.getDomainVerifications(tenantId),
        domainService.getSSLCertificates(tenantId)
      ]);
      setVerifications(verificationsData);
      setCertificates(certificatesData);
    } catch (error) {
      console.error('Error loading domain data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الدومين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    if (!DomainService.validateDomain(newDomain)) {
      toast({
        title: "خطأ",
        description: "الدومين غير صحيح",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const instructions = await domainService.initiateDomainVerification(
        tenantId, 
        newDomain, 
        verificationType
      );
      setVerificationInstructions(instructions);
      setNewDomain('');
      await loadData();
      toast({
        title: "تم إنشاء التحقق",
        description: "تم إنشاء طلب التحقق من الدومين بنجاح"
      });
    } catch (error) {
      console.error('Error adding domain:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الدومين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async (verificationId: string) => {
    try {
      setLoading(true);
      const verified = await domainService.verifyDomain(verificationId);
      if (verified) {
        toast({
          title: "تم التحقق",
          description: "تم التحقق من الدومين بنجاح"
        });
        await loadData();
      } else {
        toast({
          title: "فشل التحقق",
          description: "لم يتم العثور على سجل التحقق في DNS",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast({
        title: "خطأ",
        description: "فشل في التحقق من الدومين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVerification = async (verificationId: string) => {
    try {
      setLoading(true);
      await domainService.deleteDomainVerification(verificationId);
      await loadData();
      toast({
        title: "تم الحذف",
        description: "تم حذف طلب التحقق بنجاح"
      });
    } catch (error) {
      console.error('Error deleting verification:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف طلب التحقق",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة"
    });
  };

  const getStatusBadge = (verification: DomainVerification) => {
    if (verification.verified) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">تم التحقق</Badge>;
    }
    if (new Date(verification.expires_at) < new Date()) {
      return <Badge variant="destructive">منتهي الصلاحية</Badge>;
    }
    return <Badge variant="secondary">في انتظار التحقق</Badge>;
  };

  const getSSLStatusBadge = (certificate: SSLCertificate) => {
    const statusMap = {
      active: { variant: "default" as const, text: "نشط", class: "bg-green-100 text-green-800 border-green-200" },
      pending: { variant: "secondary" as const, text: "معلق", class: "" },
      expired: { variant: "destructive" as const, text: "منتهي الصلاحية", class: "" },
      failed: { variant: "destructive" as const, text: "فشل", class: "" }
    };
    
    const status = statusMap[certificate.status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge 
        variant={status.variant}
        className={status.class}
      >
        {status.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            إدارة الدومين - {tenantName}
          </h2>
          {currentDomain && (
            <p className="text-muted-foreground mt-1">
              الدومين الحالي: <span className="font-medium">{currentDomain}</span>
            </p>
          )}
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة دومين مخصص
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة دومين مخصص</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain">الدومين</Label>
                <Input
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="text-left"
                  dir="ltr"
                />
              </div>
              
              <div>
                <Label htmlFor="verification-type">نوع التحقق</Label>
                <Select value={verificationType} onValueChange={(value: 'dns' | 'txt' | 'cname') => setVerificationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dns">DNS TXT Record</SelectItem>
                    <SelectItem value="cname">CNAME Record</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddDomain} disabled={loading} className="flex-1">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "إضافة"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Verification Instructions */}
      {verificationInstructions && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">تعليمات التحقق من الدومين:</p>
              <p>{verificationInstructions.instructions.description}</p>
              {verificationInstructions.instructions.type && (
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span>
                      {verificationInstructions.instructions.type}: {verificationInstructions.instructions.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(verificationInstructions.instructions.value || '')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {verificationInstructions.instructions.value}
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Domain Verifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            حالة التحقق من الدومين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              لا توجد طلبات تحقق من الدومين
            </p>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <div key={verification.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{verification.domain}</p>
                      <p className="text-sm text-muted-foreground">
                        تم الإنشاء: {new Date(verification.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(verification)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyDomain(verification.id)}
                        disabled={verification.verified || loading}
                      >
                        <RefreshCw className="w-4 h-4 ml-1" />
                        التحقق
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVerification(verification.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {verification.error_message && (
                    <Alert variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>{verification.error_message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSL Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            شهادات SSL
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              لا توجد شهادات SSL
            </p>
          ) : (
            <div className="space-y-4">
              {certificates.map((certificate) => (
                <div key={certificate.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{certificate.domain}</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {certificate.issued_at && (
                          <p>تاريخ الإصدار: {new Date(certificate.issued_at).toLocaleDateString('ar-EG')}</p>
                        )}
                        {certificate.expires_at && (
                          <p>تاريخ انتهاء الصلاحية: {new Date(certificate.expires_at).toLocaleDateString('ar-EG')}</p>
                        )}
                        <p>المزود: {certificate.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSSLStatusBadge(certificate)}
                      {certificate.auto_renew && (
                        <Badge variant="outline" className="text-xs">
                          تجديد تلقائي
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainManagement;