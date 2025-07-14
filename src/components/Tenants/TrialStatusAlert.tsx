import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Crown } from 'lucide-react';
import { Tenant } from '@/types/tenant';

interface TrialStatusAlertProps {
  tenant: Tenant;
}

const TrialStatusAlert: React.FC<TrialStatusAlertProps> = ({ tenant }) => {
  if (tenant.status !== 'trial' || !tenant.trial_ends_at) {
    return null;
  }

  const trialEndDate = new Date(tenant.trial_ends_at);
  const now = new Date();
  const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return (
      <Alert className="border-destructive bg-destructive/5 mb-6">
        <Clock className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive font-medium">
          انتهت الفترة التجريبية لهذه المؤسسة. يرجى تجديد الاشتراك للمتابعة.
        </AlertDescription>
      </Alert>
    );
  }

  if (daysLeft <= 7) {
    return (
      <Alert className="border-orange-200 bg-orange-50 mb-6">
        <Clock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="text-orange-800">
            <span className="font-medium">تنتهي الفترة التجريبية خلال {daysLeft} أيام</span>
            <span className="block text-sm">
              ({trialEndDate.toLocaleDateString('ar-SA')})
            </span>
          </div>
          <Button size="sm" className="mr-4">
            <Crown className="w-4 h-4 ml-2" />
            ترقية الاشتراك
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-6">
      <Clock className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <span className="font-medium">الفترة التجريبية نشطة</span>
        <span className="block text-sm">
          تنتهي في {trialEndDate.toLocaleDateString('ar-SA')} ({daysLeft} يوماً متبقياً)
        </span>
      </AlertDescription>
    </Alert>
  );
};

export default TrialStatusAlert;