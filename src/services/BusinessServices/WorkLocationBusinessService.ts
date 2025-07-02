import { IWorkLocationRepository } from '@/repositories/interfaces/IWorkLocationRepository';
import { WorkLocation } from '@/types/hr';

export class WorkLocationBusinessService {
  constructor(private workLocationRepository: IWorkLocationRepository) {}

  async getAllWorkLocations(): Promise<WorkLocation[]> {
    return this.workLocationRepository.getAll();
  }

  async getWorkLocationById(id: string): Promise<WorkLocation | null> {
    return this.workLocationRepository.getById(id);
  }

  async createWorkLocation(locationData: Omit<WorkLocation, 'id' | 'created_at' | 'updated_at'>): Promise<WorkLocation> {
    return this.workLocationRepository.create(locationData);
  }

  async updateWorkLocation(id: string, updates: Partial<WorkLocation>): Promise<WorkLocation> {
    return this.workLocationRepository.update(id, updates);
  }

  async deleteWorkLocation(id: string): Promise<void> {
    return this.workLocationRepository.delete(id);
  }

  async getActiveWorkLocations(): Promise<WorkLocation[]> {
    return this.workLocationRepository.getActiveLocations();
  }

  async getWorkLocationByName(name: string): Promise<WorkLocation | null> {
    return this.workLocationRepository.getByName(name);
  }
}