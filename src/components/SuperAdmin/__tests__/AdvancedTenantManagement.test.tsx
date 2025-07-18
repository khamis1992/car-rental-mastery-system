import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdvancedTenantManagement from '../AdvancedTenantManagement';

// Mock the services
vi.mock('@/services/tenantService', () => ({
  TenantService: vi.fn().mockImplementation(() => ({
    getTenants: vi.fn().mockResolvedValue([
      {
        id: '1',
        name: 'شركة النقل المتميز',
        slug: 'transport-company',
        contact_email: 'admin@transport.com',
        contact_phone: '+966501234567',
        address: 'شارع الملك فهد',
        city: 'الرياض',
        country: 'SA',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        status: 'active',
        subscription_plan: 'premium',
        max_users: 100,
        max_vehicles: 200,
        max_contracts: 1000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'مؤسسة البشائر للتأجير',
        slug: 'bashaer-rental',
        contact_email: 'info@bashaer.com',
        contact_phone: '+966501234568',
        address: 'طريق الملك عبدالعزيز',
        city: 'جدة',
        country: 'SA',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        status: 'trial',
        subscription_plan: 'basic',
        max_users: 5,
        max_vehicles: 10,
        max_contracts: 50,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      }
    ]),
    createTenant: vi.fn().mockResolvedValue({ id: '3', name: 'New Company' }),
    updateTenant: vi.fn().mockResolvedValue({ id: '1', name: 'Updated Company' }),
    deleteTenant: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Building2: () => <div data-testid="building-icon">Building</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  Loader2: () => <div data-testid="loader-icon" className="animate-spin">Loading</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  MapPin: () => <div data-testid="mappin-icon">MapPin</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  CreditCard: () => <div data-testid="creditcard-icon">CreditCard</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  AlertTriangle: () => <div data-testid="alert-icon">Alert</div>,
  MoreHorizontal: () => <div data-testid="more-icon">More</div>,
  ChevronLeft: () => <div data-testid="chevron-left-icon">Left</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">Right</div>,
  FileText: () => <div data-testid="file-icon">File</div>,
  CheckSquare: () => <div data-testid="check-icon">Check</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  TrendingUp: () => <div data-testid="trending-icon">Trending</div>,
  RefreshCw: () => <div data-testid="refresh-icon">Refresh</div>,
  ArrowUpCircle: () => <div data-testid="arrow-up-icon">ArrowUp</div>,
  ArrowDownCircle: () => <div data-testid="arrow-down-icon">ArrowDown</div>,
  PauseCircle: () => <div data-testid="pause-icon">Pause</div>
}));

describe('AdvancedTenantManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main title and description', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('إدارة المؤسسات المتقدمة')).toBeInTheDocument();
      expect(screen.getByText('إدارة شاملة لجميع المؤسسات المشتركة في النظام')).toBeInTheDocument();
    });
  });

  it('loads and displays tenants correctly', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('شركة النقل المتميز')).toBeInTheDocument();
      expect(screen.getByText('مؤسسة البشائر للتأجير')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<AdvancedTenantManagement />);
    
    expect(screen.getByText('جاري تحميل المؤسسات...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('displays statistics cards correctly', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('إجمالي المؤسسات')).toBeInTheDocument();
      expect(screen.getByText('نشطة')).toBeInTheDocument();
      expect(screen.getByText('تجريبية')).toBeInTheDocument();
      expect(screen.getByText('معلقة')).toBeInTheDocument();
    });
  });

  it('opens add tenant modal when clicking add button', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const addButton = screen.getByText('إضافة مؤسسة');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('إضافة مؤسسة جديدة')).toBeInTheDocument();
      expect(screen.getByLabelText('اسم المؤسسة *')).toBeInTheDocument();
    });
  });

  it('filters tenants by search term', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('شركة النقل المتميز')).toBeInTheDocument();
      expect(screen.getByText('مؤسسة البشائر للتأجير')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('البحث بالاسم، البريد الإلكتروني، أو الرمز...');
    fireEvent.change(searchInput, { target: { value: 'النقل' } });

    await waitFor(() => {
      expect(screen.getByText('شركة النقل المتميز')).toBeInTheDocument();
      expect(screen.queryByText('مؤسسة البشائر للتأجير')).not.toBeInTheDocument();
    });
  });

  it('filters tenants by status', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('شركة النقل المتميز')).toBeInTheDocument();
      expect(screen.getByText('مؤسسة البشائر للتأجير')).toBeInTheDocument();
    });

    // Click on status filter
    const statusFilter = screen.getByDisplayValue('جميع الحالات');
    fireEvent.click(statusFilter);
    
    await waitFor(() => {
      const activeOption = screen.getByText('نشط');
      fireEvent.click(activeOption);
    });

    await waitFor(() => {
      expect(screen.getByText('شركة النقل المتميز')).toBeInTheDocument();
      expect(screen.queryByText('مؤسسة البشائر للتأجير')).not.toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('عرض 1 إلى 2 من 2 النتائج')).toBeInTheDocument();
    });

    // Test page size change
    const pageSizeSelect = screen.getByDisplayValue('10');
    fireEvent.click(pageSizeSelect);
    
    await waitFor(() => {
      const option5 = screen.getByText('5');
      fireEvent.click(option5);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });

  it('handles bulk selection correctly', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /تحديد الكل/i });
      fireEvent.click(selectAllCheckbox);
    });

    await waitFor(() => {
      expect(screen.getByText('تم تحديد 2 مؤسسة')).toBeInTheDocument();
      expect(screen.getByText('تفعيل')).toBeInTheDocument();
      expect(screen.getByText('تعليق')).toBeInTheDocument();
      expect(screen.getByText('ترقية')).toBeInTheDocument();
    });
  });

  it('opens view modal with correct tenant details', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const viewButtons = screen.getAllByTestId('eye-icon');
      fireEvent.click(viewButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('تفاصيل المؤسسة')).toBeInTheDocument();
      expect(screen.getByText('البيانات الأساسية')).toBeInTheDocument();
      expect(screen.getByText('الاشتراك')).toBeInTheDocument();
      expect(screen.getByText('الإحصائيات')).toBeInTheDocument();
    });
  });

  it('opens edit modal with pre-filled data', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByTestId('edit-icon');
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('تحرير بيانات المؤسسة')).toBeInTheDocument();
      expect(screen.getByDisplayValue('شركة النقل المتميز')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin@transport.com')).toBeInTheDocument();
    });
  });

  it('handles export functionality', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const exportButton = screen.getByText('تصدير/استيراد');
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(screen.getByText('تصدير CSV')).toBeInTheDocument();
      expect(screen.getByText('تصدير Excel')).toBeInTheDocument();
      expect(screen.getByText('استيراد ملف')).toBeInTheDocument();
    });
  });

  it('opens subscription management modal', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const moreButtons = screen.getAllByTestId('more-icon');
      fireEvent.click(moreButtons[0]);
    });

    await waitFor(() => {
      const subscriptionOption = screen.getByText('إدارة الاشتراك');
      fireEvent.click(subscriptionOption);
    });

    await waitFor(() => {
      expect(screen.getByText('إدارة الاشتراك')).toBeInTheDocument();
      expect(screen.getByText('ترقية الخطة')).toBeInTheDocument();
      expect(screen.getByText('تخفيض الخطة')).toBeInTheDocument();
    });
  });

  it('opens security settings modal', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const moreButtons = screen.getAllByTestId('more-icon');
      fireEvent.click(moreButtons[0]);
    });

    await waitFor(() => {
      const securityOption = screen.getByText('الأمان');
      fireEvent.click(securityOption);
    });

    await waitFor(() => {
      expect(screen.getByText('إعدادات الأمان')).toBeInTheDocument();
      expect(screen.getByText('التحقق بخطوتين (2FA)')).toBeInTheDocument();
      expect(screen.getByText('قائمة IP المسموحة')).toBeInTheDocument();
    });
  });

  it('opens notifications settings modal', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const moreButtons = screen.getAllByTestId('more-icon');
      fireEvent.click(moreButtons[0]);
    });

    await waitFor(() => {
      const notificationOption = screen.getByText('الإشعارات');
      fireEvent.click(notificationOption);
    });

    await waitFor(() => {
      expect(screen.getByText('إدارة الإشعارات')).toBeInTheDocument();
      expect(screen.getByText('انتهاء فترة التجربة')).toBeInTheDocument();
      expect(screen.getByText('تجاوز حدود الاستخدام')).toBeInTheDocument();
    });
  });

  it('opens backup management modal', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const moreButtons = screen.getAllByTestId('more-icon');
      fireEvent.click(moreButtons[0]);
    });

    await waitFor(() => {
      const backupOption = screen.getByText('النسخ الاحتياطي');
      fireEvent.click(backupOption);
    });

    await waitFor(() => {
      expect(screen.getByText('النسخ الاحتياطي')).toBeInTheDocument();
      expect(screen.getByText('إنشاء نسخة احتياطية')).toBeInTheDocument();
      expect(screen.getByText('استعادة نسخة احتياطية')).toBeInTheDocument();
    });
  });

  it('confirms deletion with proper warning', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const moreButtons = screen.getAllByTestId('more-icon');
      fireEvent.click(moreButtons[0]);
    });

    await waitFor(() => {
      const deleteOption = screen.getByText('حذف');
      fireEvent.click(deleteOption);
    });

    await waitFor(() => {
      expect(screen.getByText('تأكيد الحذف')).toBeInTheDocument();
      expect(screen.getByText(/هذا الإجراء لا يمكن التراجع عنه/)).toBeInTheDocument();
      expect(screen.getByText('حذف نهائياً')).toBeInTheDocument();
    });
  });

  it('handles form validation in add modal', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const addButton = screen.getByText('إضافة مؤسسة');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      const submitButton = screen.getByText('إضافة المؤسسة');
      fireEvent.click(submitButton);
    });

    // Should show validation error for empty required fields
    // This would trigger toast with validation message
  });

  it('handles bulk actions correctly', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /تحديد الكل/i });
      fireEvent.click(selectAllCheckbox);
    });

    await waitFor(() => {
      const activateButton = screen.getByText('تفعيل');
      fireEvent.click(activateButton);
    });

    // Should trigger bulk activation
  });

  it('displays correct status badges', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('نشط')).toBeInTheDocument();
      expect(screen.getByText('تجريبي')).toBeInTheDocument();
    });
  });

  it('displays correct plan labels', async () => {
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('متميز')).toBeInTheDocument();
      expect(screen.getByText('أساسي')).toBeInTheDocument();
    });
  });

  it('handles error state correctly', async () => {
    // Mock error in service
    const mockTenantService = {
      getTenants: vi.fn().mockRejectedValue(new Error('Network error'))
    };
    
    vi.mocked(require('@/services/tenantService').TenantService).mockImplementation(() => mockTenantService);
    
    render(<AdvancedTenantManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
    });
  });
}); 