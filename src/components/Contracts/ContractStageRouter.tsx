import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractDetailsDialog } from './ContractDetailsDialog';

export const ContractStageRouter: React.FC = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/contracts');
  };

  return (
    <ContractDetailsDialog
      contractId={contractId || null}
      open={!!contractId}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    />
  );
};