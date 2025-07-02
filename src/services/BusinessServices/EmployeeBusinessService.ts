import { IEmployeeRepository } from '@/repositories/interfaces/IEmployeeRepository';
import { Employee } from '@/types/hr';

export class EmployeeBusinessService {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async getAllEmployees(): Promise<Employee[]> {
    return this.employeeRepository.getAll();
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return this.employeeRepository.getById(id);
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    return this.employeeRepository.create(employeeData);
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    return this.employeeRepository.update(id, updates);
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.employeeRepository.delete(id);
  }

  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return this.employeeRepository.getByDepartment(department);
  }

  async getEmployeesByStatus(status: string): Promise<Employee[]> {
    return this.employeeRepository.getByStatus(status);
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    return this.employeeRepository.getByUserId(userId);
  }

  async getEmployeeByNumber(employeeNumber: string): Promise<Employee | null> {
    return this.employeeRepository.getByEmployeeNumber(employeeNumber);
  }

  async getActiveEmployees(): Promise<Employee[]> {
    return this.employeeRepository.getByStatus('active');
  }
}