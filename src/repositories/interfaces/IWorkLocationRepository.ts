import { IRepository } from './IRepository';
import { WorkLocation } from '@/types/hr';

export interface IWorkLocationRepository extends IRepository<WorkLocation> {
  getActiveLocations(): Promise<WorkLocation[]>;
  getByName(name: string): Promise<WorkLocation | null>;
}