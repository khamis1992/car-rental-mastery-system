import { IVehicleRepository, Vehicle } from '@/repositories/interfaces/IVehicleRepository';

export class VehicleBusinessService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async getAllVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.getAll();
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    return this.vehicleRepository.getById(id);
  }

  async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle> {
    return this.vehicleRepository.create(vehicleData);
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    return this.vehicleRepository.update(id, updates);
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.vehicleRepository.delete(id);
  }

  async getAvailableVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.getAvailableVehicles();
  }

  async getVehiclesByStatus(status: string): Promise<Vehicle[]> {
    return this.vehicleRepository.getByStatus(status);
  }

  async getVehicleByNumber(vehicleNumber: string): Promise<Vehicle | null> {
    return this.vehicleRepository.getByVehicleNumber(vehicleNumber);
  }

  async getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return this.vehicleRepository.getByLicensePlate(licensePlate);
  }

  async generateVehicleNumber(): Promise<string> {
    return this.vehicleRepository.generateVehicleNumber();
  }

  async updateVehicleStatus(id: string, status: 'available' | 'rented' | 'maintenance' | 'out_of_service'): Promise<Vehicle> {
    return this.vehicleRepository.update(id, { status });
  }
}