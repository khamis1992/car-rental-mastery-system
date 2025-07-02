import { IRepository } from './IRepository';
import { ViolationType } from '@/types/violation';

export interface IViolationTypeRepository extends IRepository<ViolationType> {
  getActiveTypes(): Promise<ViolationType[]>;
  getByCategory(category: string): Promise<ViolationType[]>;
  getBySeverity(severity: string): Promise<ViolationType[]>;
}