import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractDetailsDialog } from './ContractDetailsDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ContractStageWrapperProps {
  children: React.ReactNode;
  stageName: string;
  stageDescription: string;
}

export const ContractStageWrapper: React.FC<ContractStageWrapperProps> = ({
  children,
  stageName,
  stageDescription,
}) => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isValidContract, setIsValidContract] = useState<boolean | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (contractId) {
      // Validate contract ID format (basic validation)
      const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId);
      setIsValidContract(isValid);
      
      if (isValid && isMountedRef.current) {
        setDialogOpen(true);
      } else if (!isValid) {
        console.error('❌ Invalid contract ID format:', contractId);
        // Use setTimeout to avoid React navigation warnings
        setTimeout(() => {
          if (isMountedRef.current) {
            navigate('/contracts');
          }
        }, 100);
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [contractId, navigate]);

  const handleDialogClose = (open: boolean) => {
    if (!open && isMountedRef.current) {
      setDialogOpen(false);
      // Use setTimeout to ensure smooth navigation and avoid race conditions
      setTimeout(() => {
        if (isMountedRef.current) {
          navigate('/contracts');
        }
      }, 100);
    }
  };

  // Show loading while validating
  if (contractId && isValidContract === null) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحقق من العقد...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('❌ Contract stage error:', { error, errorInfo, contractId, stageName });
      }}
    >
      <div className="p-6 space-y-6">
        {children}

        {contractId && isValidContract && (
          <ContractDetailsDialog
            contractId={contractId}
            open={dialogOpen}
            onOpenChange={handleDialogClose}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};