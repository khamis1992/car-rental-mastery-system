// Event Types Definition for the EDA System

export interface BaseEventPayload {
  timestamp?: Date;
  userId?: string;
  source?: string;
}

// Contract Events
export interface ContractEventPayload extends BaseEventPayload {
  contractId: string;
  customerId?: string;
  vehicleId?: string;
  amount?: number;
}

export interface ContractActivatedPayload extends ContractEventPayload {
  actualStartDate: string;
  pickupDetails?: {
    mileage?: number;
    photos?: string[];
    conditionNotes?: string;
    fuelLevel?: string;
  };
}

export interface ContractCompletedPayload extends ContractEventPayload {
  actualEndDate: string;
  invoiceId?: string;
  returnDetails?: {
    mileage?: number;
    photos?: string[];
    conditionNotes?: string;
    fuelLevel?: string;
  };
  additionalCharges?: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

// Invoice Events
export interface InvoiceEventPayload extends BaseEventPayload {
  invoiceId: string;
  customerId?: string;
  contractId?: string;
  amount?: number;
}

export interface PaymentProcessedPayload extends InvoiceEventPayload {
  paymentId: string;
  paymentAmount: number;
  paymentMethod: string;
  remainingBalance: number;
}

// Vehicle Events
export interface VehicleEventPayload extends BaseEventPayload {
  vehicleId: string;
  vehiclePlate?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface VehicleMaintenancePayload extends VehicleEventPayload {
  maintenanceType: 'scheduled' | 'emergency' | 'repair';
  description: string;
  cost?: number;
  scheduledDate?: string;
}

// Customer Events
export interface CustomerEventPayload extends BaseEventPayload {
  customerId: string;
  customerName?: string;
  customerType?: 'individual' | 'company';
}

export interface CustomerRatingUpdatedPayload extends CustomerEventPayload {
  oldRating?: number;
  newRating: number;
  evaluationId?: string;
}

// Employee Events
export interface EmployeeEventPayload extends BaseEventPayload {
  employeeId: string;
  employeeName?: string;
  department?: string;
}

export interface AttendanceEventPayload extends EmployeeEventPayload {
  attendanceId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'on_break';
}

// System Events
export interface SystemEventPayload extends BaseEventPayload {
  systemComponent: string;
  eventData?: Record<string, any>;
}

export interface ErrorEventPayload extends BaseEventPayload {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

// Event Type Constants
export const EventTypes = {
  // Contract Events
  CONTRACT_CREATED: 'CONTRACT_CREATED',
  CONTRACT_ACTIVATED: 'CONTRACT_ACTIVATED',
  CONTRACT_COMPLETED: 'CONTRACT_COMPLETED',
  CONTRACT_CANCELLED: 'CONTRACT_CANCELLED',
  CONTRACT_EXTENDED: 'CONTRACT_EXTENDED',
  CONTRACT_MODIFIED: 'CONTRACT_MODIFIED',
  
  // Invoice Events
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_SENT: 'INVOICE_SENT',
  INVOICE_PAYMENT_PROCESSED: 'INVOICE_PAYMENT_PROCESSED',
  INVOICE_OVERDUE: 'INVOICE_OVERDUE',
  INVOICE_VOIDED: 'INVOICE_VOIDED',
  INVOICE_WITH_CHARGES_CREATED: 'INVOICE_WITH_CHARGES_CREATED',
  
  // Vehicle Events
  VEHICLE_STATUS_CHANGED: 'VEHICLE_STATUS_CHANGED',
  VEHICLE_MAINTENANCE_SCHEDULED: 'VEHICLE_MAINTENANCE_SCHEDULED',
  VEHICLE_MAINTENANCE_COMPLETED: 'VEHICLE_MAINTENANCE_COMPLETED',
  VEHICLE_AVAILABILITY_CHANGED: 'VEHICLE_AVAILABILITY_CHANGED',
  VEHICLE_MILEAGE_UPDATED: 'VEHICLE_MILEAGE_UPDATED',
  
  // Customer Events
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_RATING_UPDATED: 'CUSTOMER_RATING_UPDATED',
  CUSTOMER_BLACKLISTED: 'CUSTOMER_BLACKLISTED',
  
  // Employee Events
  EMPLOYEE_CHECKED_IN: 'EMPLOYEE_CHECKED_IN',
  EMPLOYEE_CHECKED_OUT: 'EMPLOYEE_CHECKED_OUT',
  EMPLOYEE_LATE_ARRIVAL: 'EMPLOYEE_LATE_ARRIVAL',
  EMPLOYEE_OVERTIME: 'EMPLOYEE_OVERTIME',
  
  // Additional Charge Events
  ADDITIONAL_CHARGE_CREATED: 'ADDITIONAL_CHARGE_CREATED',
  ADDITIONAL_CHARGE_INVOICED: 'ADDITIONAL_CHARGE_INVOICED',
  ADDITIONAL_CHARGES_NEEDED: 'ADDITIONAL_CHARGES_NEEDED',
  
  // System Events
  SYSTEM_BACKUP_COMPLETED: 'SYSTEM_BACKUP_COMPLETED',
  SYSTEM_MAINTENANCE_MODE: 'SYSTEM_MAINTENANCE_MODE',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  
  // Saga Events
  SAGA_STARTED: 'SAGA_STARTED',
  SAGA_COMPLETED: 'SAGA_COMPLETED',
  SAGA_FAILED: 'SAGA_FAILED',
  STEP_COMPLETED: 'STEP_COMPLETED',
  STEP_ROLLED_BACK: 'STEP_ROLLED_BACK',
  
  // Event System Events
  EVENT_HANDLER_FAILED: 'EVENT_HANDLER_FAILED',
  EVENT_PROCESSING_DELAYED: 'EVENT_PROCESSING_DELAYED',
  
  // Notification Events
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  ALERT_TRIGGERED: 'ALERT_TRIGGERED',
  REMINDER_DUE: 'REMINDER_DUE'
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

// Event Categories
export const EventCategories = {
  CONTRACTS: 'contracts',
  INVOICING: 'invoicing',
  FLEET: 'fleet',
  CUSTOMERS: 'customers',
  HR: 'hr',
  SYSTEM: 'system',
  NOTIFICATIONS: 'notifications',
  
} as const;

export type EventCategory = typeof EventCategories[keyof typeof EventCategories];

// Event Priorities
export const EventPriorities = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export type EventPriority = typeof EventPriorities[keyof typeof EventPriorities];