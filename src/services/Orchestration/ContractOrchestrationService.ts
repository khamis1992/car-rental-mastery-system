import { BaseOrchestrationService } from './BaseOrchestrationService';
import { OrchestrationResult, TransactionStep, EventBus } from './types';
import { ContractBusinessService } from '../BusinessServices/ContractBusinessService';
import { VehicleBusinessService } from '../BusinessServices/VehicleBusinessService';
import { InvoiceBusinessService } from '../BusinessServices/InvoiceBusinessService';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';

export interface ContractActivationRequest {
  contractId: string;
  actualStartDate: string;
  pickupMileage?: number;
  pickupPhotos?: string[];
  pickupConditionNotes?: string;
  fuelLevelPickup?: string;
}

export interface ContractCompletionRequest {
  contractId: string;
  actualEndDate: string;
  returnMileage?: number;
  returnPhotos?: string[];
  returnConditionNotes?: string;
  fuelLevelReturn?: string;
  additionalCharges?: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

export class ContractOrchestrationService extends BaseOrchestrationService {
  constructor(
    eventBus: EventBus,
    private contractService: ContractBusinessService,
    private vehicleService: VehicleBusinessService,
    private invoiceService: InvoiceBusinessService
  ) {
    super(eventBus);
  }

  async activateContract(request: ContractActivationRequest): Promise<OrchestrationResult> {
    const steps: TransactionStep[] = [
      {
        name: 'validateContract',
        execute: async () => {
          const contract = await this.contractService.getContractById(request.contractId);
          if (!contract) {
            throw new Error('Contract not found');
          }
          if (contract.status !== 'pending') {
            throw new Error('Contract is not in pending status');
          }
          return contract;
        },
        rollback: async () => {
          // No rollback needed for validation
        },
      },
      {
        name: 'updateVehicleStatus',
        execute: async () => {
          const contract = await this.contractService.getContractById(request.contractId);
          await this.vehicleService.updateVehicleStatus(contract!.vehicle_id, 'rented');
        },
        rollback: async () => {
          const contract = await this.contractService.getContractById(request.contractId);
          await this.vehicleService.updateVehicleStatus(contract!.vehicle_id, 'available');
        },
      },
      {
        name: 'activateContract',
        execute: async () => {
          await this.contractService.updateContractStatus(request.contractId, 'active');
          
          // Update additional details if provided
          const updateData: any = {
            actual_start_date: request.actualStartDate,
            status: 'active'
          };

          if (request.pickupMileage !== undefined) {
            updateData.pickup_mileage = request.pickupMileage;
          }
          if (request.pickupPhotos) {
            updateData.pickup_photos = request.pickupPhotos;
          }
          if (request.pickupConditionNotes) {
            updateData.pickup_condition_notes = request.pickupConditionNotes;
          }
          if (request.fuelLevelPickup) {
            updateData.fuel_level_pickup = request.fuelLevelPickup;
          }

          await this.contractService.updateContract(request.contractId, updateData);
        },
        rollback: async () => {
          await this.contractService.updateContractStatus(request.contractId, 'pending');
        },
      },
    ];

    const result = await this.executeWithRollback(steps);
    
    if (result.success) {
      await this.emitEvent({
        type: 'CONTRACT_ACTIVATED',
        payload: { contractId: request.contractId },
        timestamp: new Date(),
        source: 'ContractOrchestrationService',
      });
    }

    return result;
  }

  async completeContract(request: ContractCompletionRequest): Promise<OrchestrationResult> {
    let createdInvoiceId: string | null = null;

    const steps: TransactionStep[] = [
      {
        name: 'validateContract',
        execute: async () => {
          const contract = await this.contractService.getContractById(request.contractId);
          if (!contract) {
            throw new Error('Contract not found');
          }
          if (contract.status !== 'active') {
            throw new Error('Contract is not active');
          }
          return contract;
        },
        rollback: async () => {
          // No rollback needed for validation
        },
      },
      {
        name: 'updateVehicleStatus',
        execute: async () => {
          const contract = await this.contractService.getContractById(request.contractId);
          await this.vehicleService.updateVehicleStatus(contract!.vehicle_id, 'available');
        },
        rollback: async () => {
          const contract = await this.contractService.getContractById(request.contractId);
          await this.vehicleService.updateVehicleStatus(contract!.vehicle_id, 'rented');
        },
      },
      {
        name: 'completeContract',
        execute: async () => {
          const updateData: any = {
            actual_end_date: request.actualEndDate,
            status: 'completed'
          };

          if (request.returnMileage !== undefined) {
            updateData.return_mileage = request.returnMileage;
          }
          if (request.returnPhotos) {
            updateData.return_photos = request.returnPhotos;
          }
          if (request.returnConditionNotes) {
            updateData.return_condition_notes = request.returnConditionNotes;
          }
          if (request.fuelLevelReturn) {
            updateData.fuel_level_return = request.fuelLevelReturn;
          }

          await this.contractService.updateContract(request.contractId, updateData);
        },
        rollback: async () => {
          await this.contractService.updateContractStatus(request.contractId, 'active');
        },
      },
      {
        name: 'generateFinalInvoice',
        execute: async () => {
          const invoice = await this.invoiceService.generateRentalInvoice(request.contractId);
          createdInvoiceId = invoice.id;
          
          // Add additional charges if any
          if (request.additionalCharges && request.additionalCharges.length > 0) {
            // This would require implementing additional charges in the invoice service
            // For now, we'll emit an event that can be handled by other services
            await this.emitEvent({
              type: 'ADDITIONAL_CHARGES_NEEDED',
              payload: { 
                contractId: request.contractId,
                invoiceId: invoice.id,
                charges: request.additionalCharges 
              },
              timestamp: new Date(),
              source: 'ContractOrchestrationService',
            });
          }
        },
        rollback: async () => {
          if (createdInvoiceId) {
            await this.invoiceService.deleteInvoice(createdInvoiceId);
          }
        },
      },
    ];

    const result = await this.executeWithRollback(steps);
    
    if (result.success) {
      await this.emitEvent({
        type: 'CONTRACT_COMPLETED',
        payload: { 
          contractId: request.contractId,
          invoiceId: createdInvoiceId 
        },
        timestamp: new Date(),
        source: 'ContractOrchestrationService',
      });
    }

    return result;
  }

  async cancelContract(contractId: string, reason: string): Promise<OrchestrationResult> {
    const steps: TransactionStep[] = [
      {
        name: 'validateContract',
        execute: async () => {
          const contract = await this.contractService.getContractById(contractId);
          if (!contract) {
            throw new Error('Contract not found');
          }
          if (contract.status === 'completed' || contract.status === 'cancelled') {
            throw new Error('Contract cannot be cancelled');
          }
          return contract;
        },
        rollback: async () => {
          // No rollback needed for validation
        },
      },
      {
        name: 'updateVehicleStatus',
        execute: async () => {
          const contract = await this.contractService.getContractById(contractId);
          if (contract!.status === 'active') {
            await this.vehicleService.updateVehicleStatus(contract!.vehicle_id, 'available');
          }
        },
        rollback: async () => {
          const contract = await this.contractService.getContractById(contractId);
          if (contract!.status === 'active') {
            await this.vehicleService.updateVehicleStatus(contract!.vehicle_id, 'rented');
          }
        },
      },
      {
        name: 'cancelContract',
        execute: async () => {
          await this.contractService.updateContract(contractId, {
            status: 'cancelled',
            notes: reason
          });
        },
        rollback: async () => {
          const contract = await this.contractService.getContractById(contractId);
          await this.contractService.updateContractStatus(contractId, contract!.status);
        },
      },
    ];

    const result = await this.executeWithRollback(steps);
    
    if (result.success) {
      await this.emitEvent({
        type: 'CONTRACT_CANCELLED',
        payload: { contractId, reason },
        timestamp: new Date(),
        source: 'ContractOrchestrationService',
      });
    }

    return result;
  }
}