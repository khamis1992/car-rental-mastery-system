import { IViolationTypeRepository } from '@/repositories/interfaces/IViolationTypeRepository';
import { ViolationType } from '@/types/violation';

export class ViolationTypeBusinessService {
  constructor(private violationTypeRepository: IViolationTypeRepository) {}

  async getAllViolationTypes(): Promise<ViolationType[]> {
    return this.violationTypeRepository.getAll();
  }

  async getViolationTypeById(id: string): Promise<ViolationType | null> {
    return this.violationTypeRepository.getById(id);
  }

  async createViolationType(typeData: Omit<ViolationType, 'id' | 'created_at' | 'updated_at'>): Promise<ViolationType> {
    return this.violationTypeRepository.create(typeData);
  }

  async updateViolationType(id: string, updates: Partial<ViolationType>): Promise<ViolationType> {
    return this.violationTypeRepository.update(id, updates);
  }

  async deleteViolationType(id: string): Promise<void> {
    return this.violationTypeRepository.delete(id);
  }

  async getActiveViolationTypes(): Promise<ViolationType[]> {
    return this.violationTypeRepository.getActiveTypes();
  }

  async getViolationTypesByCategory(category: string): Promise<ViolationType[]> {
    return this.violationTypeRepository.getByCategory(category);
  }

  async getViolationTypesBySeverity(severity: string): Promise<ViolationType[]> {
    return this.violationTypeRepository.getBySeverity(severity);
  }
}