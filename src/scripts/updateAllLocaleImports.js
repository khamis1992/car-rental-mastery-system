// Script to update all remaining date-fns locale imports
// This addresses the "Cannot access 'Ms' before initialization" error

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/Attendance/AttendanceReports.tsx',
  'src/components/Contracts/ContractActions.tsx',
  'src/components/Contracts/ContractDetailsDialogOld.tsx',
  'src/components/Contracts/ContractHistory.tsx',
  'src/components/Contracts/ContractInfoSections.tsx',
  'src/components/Contracts/ContractSignatureSection.tsx',
  'src/components/Contracts/QuotationFilters.tsx',
  'src/components/Contracts/QuotationPreview.tsx',
  'src/components/Employees/AddEmployeeForm.tsx',
  'src/components/Employees/EmployeeDetailsDialog.tsx',
  'src/components/Invoicing/PaymentsList.tsx',
  'src/components/Maintenance/MaintenanceCostTracker.tsx',
  'src/components/Maintenance/MaintenanceHistory.tsx',
  'src/components/Maintenance/MaintenanceOverview.tsx',
  'src/components/Maintenance/MaintenanceScheduler.tsx',
  'src/components/Reports/PayrollReportTemplate.tsx',
  'src/components/Violations/ViolationDetailsDialog.tsx',
  'src/components/Violations/ViolationReports.tsx',
  'src/pages/ContractStages/PaymentStage.tsx',
  'src/pages/Leaves.tsx',
  'src/pages/PublicQuotation.tsx'
];

function updateFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the problematic import
    const oldImport = "import { ar } from 'date-fns/locale';";
    const newImport = "import { ar } from 'date-fns/locale/ar';";
    
    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
}

// Update all files
filesToUpdate.forEach(updateFile);

console.log('All locale imports updated successfully!');