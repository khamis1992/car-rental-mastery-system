import { IRepository } from './IRepository';
import { Employee } from '@/types/hr';

export interface IEmployeeRepository extends IRepository<Employee> {
  getByDepartment(department: string): Promise<Employee[]>;
  getByStatus(status: string): Promise<Employee[]>;
  getByUserId(userId: string): Promise<Employee | null>;
  getByEmployeeNumber(employeeNumber: string): Promise<Employee | null>;
}