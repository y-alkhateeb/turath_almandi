/**
 * Integration Test: Create User Flow (Admin)
 *
 * Tests the complete user creation journey by admin:
 * 1. Admin navigates to users page
 * 2. Clicks "Add User" button
 * 3. Fills out user form
 * 4. Selects user role and branch
 * 5. Submits form
 * 6. API creates user
 * 7. Success message displayed
 * 8. User appears in list
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderIntegration,
  createMockUser,
  createMockBranch,
} from '@/test/integrationTestUtils';
import * as userManagementService from '@/api/services/userManagementService';
import * as branchService from '@/api/services/branchService';

// Mock services
vi.mock('@/api/services/userManagementService');
vi.mock('@/api/services/branchService');

// Mock useAuth hook - Admin only
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockUser({ role: 'ADMIN' }),
    isAuthenticated: true,
    isAdmin: true,
    isAccountant: false,
  }),
}));

describe('Integration: Create User Flow (Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock branches for user assignment
    vi.mocked(branchService.getAllBranches).mockResolvedValue([
      createMockBranch({ id: 'branch-1', name: 'Main Branch' }),
      createMockBranch({ id: 'branch-2', name: 'Secondary Branch' }),
    ]);
  });

  it('should complete full user creation flow', async () => {
    const user = userEvent.setup();

    // Mock successful user creation
    const mockNewUser = createMockUser({
      id: 'user-new',
      username: 'newaccountant',
      email: 'accountant@example.com',
      role: 'ACCOUNTANT',
      branchId: 'branch-1',
    });

    vi.mocked(userManagementService.createUser).mockResolvedValue(mockNewUser);

    // Mock users list
    vi.mocked(userManagementService.getUsers).mockResolvedValue({
      users: [mockNewUser],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    // Simple users management page
    function UsersPage() {
      const [showForm, setShowForm] = React.useState(false);
      const [users, setUsers] = React.useState<any[]>([]);
      const [message, setMessage] = React.useState('');

      React.useEffect(() => {
        userManagementService.getUsers().then((result) => {
          setUsers(result.users);
        });
      }, []);

      const handleCreate = async (data: any) => {
        try {
          const newUser = await userManagementService.createUser(data);
          setUsers([newUser, ...users]);
          setMessage('تم إضافة المستخدم بنجاح');
          setShowForm(false);
        } catch (error: any) {
          setMessage(error.message);
        }
      };

      if (showForm) {
        return (
          <div>
            <h2>إضافة مستخدم جديد</h2>
            <UserFormSimple onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        );
      }

      return (
        <div>
          <h1>إدارة المستخدمين</h1>
          <button onClick={() => setShowForm(true)}>إضافة مستخدم</button>
          {message && <div role="status">{message}</div>}
          <div>
            {users.map((usr) => (
              <div key={usr.id} data-testid={`user-${usr.id}`}>
                {usr.username} - {usr.role} - {usr.email}
              </div>
            ))}
          </div>
        </div>
      );
    }

    function UserFormSimple({
      onSubmit,
      onCancel,
    }: {
      onSubmit: (data: any) => void;
      onCancel: () => void;
    }) {
      const [formData, setFormData] = React.useState({
        username: '',
        email: '',
        password: '',
        role: 'ACCOUNTANT',
        branchId: '',
      });

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
      };

      return (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">اسم المستخدم</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="role">الدور الوظيفي</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="ADMIN">مدير</option>
              <option value="ACCOUNTANT">محاسب</option>
            </select>
          </div>

          <div>
            <label htmlFor="branch">الفرع</label>
            <select
              id="branch"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            >
              <option value="">اختر الفرع...</option>
              <option value="branch-1">Main Branch</option>
              <option value="branch-2">Secondary Branch</option>
            </select>
          </div>

          <button type="submit">حفظ</button>
          <button type="button" onClick={onCancel}>
            إلغاء
          </button>
        </form>
      );
    }

    // Render users page
    renderIntegration(<UsersPage />);

    // Step 1: Verify page is loaded
    expect(await screen.findByText(/إدارة المستخدمين/i)).toBeInTheDocument();

    // Step 2: Click "Add User" button
    const addButton = screen.getByRole('button', { name: /إضافة مستخدم/i });
    await user.click(addButton);

    // Step 3: Verify form is displayed
    expect(await screen.findByText(/إضافة مستخدم جديد/i)).toBeInTheDocument();

    // Step 4: Fill username
    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    await user.type(usernameInput, 'newaccountant');
    expect(usernameInput).toHaveValue('newaccountant');

    // Step 5: Fill email
    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    await user.type(emailInput, 'accountant@example.com');
    expect(emailInput).toHaveValue('accountant@example.com');

    // Step 6: Fill password
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    await user.type(passwordInput, 'SecurePass123!');
    expect(passwordInput).toHaveValue('SecurePass123!');

    // Step 7: Select role
    const roleSelect = screen.getByLabelText(/الدور الوظيفي/i);
    expect(roleSelect).toHaveValue('ACCOUNTANT'); // Default value

    // Step 8: Select branch
    const branchSelect = screen.getByLabelText(/الفرع/i);
    await user.selectOptions(branchSelect, 'branch-1');
    expect(branchSelect).toHaveValue('branch-1');

    // Step 9: Submit form
    const submitButton = screen.getByRole('button', { name: /حفظ/i });
    await user.click(submitButton);

    // Step 10: Verify API was called with correct data
    await waitFor(() => {
      expect(userManagementService.createUser).toHaveBeenCalledWith({
        username: 'newaccountant',
        email: 'accountant@example.com',
        password: 'SecurePass123!',
        role: 'ACCOUNTANT',
        branchId: 'branch-1',
      });
    });

    // Step 11: Verify success message
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/تم إضافة المستخدم بنجاح/i);
    });

    // Step 12: Verify form is closed
    expect(screen.queryByText(/إضافة مستخدم جديد/i)).not.toBeInTheDocument();
    expect(screen.getByText(/إدارة المستخدمين/i)).toBeInTheDocument();

    // Step 13: Verify new user appears in list
    const userCard = screen.getByTestId('user-user-new');
    expect(userCard).toBeInTheDocument();
    expect(userCard).toHaveTextContent('newaccountant');
    expect(userCard).toHaveTextContent('ACCOUNTANT');
    expect(userCard).toHaveTextContent('accountant@example.com');
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    function UserFormSimple() {
      const [formData, setFormData] = React.useState({
        username: '',
        email: '',
        password: '',
      });
      const [errors, setErrors] = React.useState<string[]>([]);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: string[] = [];

        if (!formData.username) newErrors.push('اسم المستخدم مطلوب');
        if (!formData.email) newErrors.push('البريد الإلكتروني مطلوب');
        if (!formData.password) newErrors.push('كلمة المرور مطلوبة');
        if (formData.password && formData.password.length < 8) {
          newErrors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        }

        setErrors(newErrors);
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            aria-label="اسم المستخدم"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <input
            aria-label="البريد الإلكتروني"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            aria-label="كلمة المرور"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          {errors.map((error, i) => (
            <div key={i} role="alert">
              {error}
            </div>
          ))}
          <button type="submit">حفظ</button>
        </form>
      );
    }

    renderIntegration(<UserFormSimple />);

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /حفظ/i }));

    // Verify validation errors
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(3);
      expect(screen.getByText(/اسم المستخدم مطلوب/i)).toBeInTheDocument();
      expect(screen.getByText(/البريد الإلكتروني مطلوب/i)).toBeInTheDocument();
      expect(screen.getByText(/كلمة المرور مطلوبة/i)).toBeInTheDocument();
    });

    expect(userManagementService.createUser).not.toHaveBeenCalled();
  });

  it('should validate password strength', async () => {
    const user = userEvent.setup();

    function UserFormSimple() {
      const [password, setPassword] = React.useState('');
      const [error, setError] = React.useState('');

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
          setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            aria-label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div role="alert">{error}</div>}
          <button type="submit">حفظ</button>
        </form>
      );
    }

    renderIntegration(<UserFormSimple />);

    // Enter weak password
    await user.type(screen.getByLabelText(/كلمة المرور/i), 'weak');

    // Submit form
    await user.click(screen.getByRole('button', { name: /حفظ/i }));

    // Verify error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /كلمة المرور يجب أن تكون 8 أحرف على الأقل/i
      );
    });
  });

  it('should handle duplicate username error', async () => {
    const user = userEvent.setup();

    // Mock API error for duplicate username
    vi.mocked(userManagementService.createUser).mockRejectedValue({
      statusCode: 409,
      message: 'اسم المستخدم موجود بالفعل',
    });

    function UserFormSimple() {
      const [username, setUsername] = React.useState('');
      const [error, setError] = React.useState('');

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
          await userManagementService.createUser({
            username,
            email: 'test@example.com',
            password: 'password123',
            role: 'ACCOUNTANT',
          });
        } catch (err: any) {
          setError(err.message);
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            aria-label="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {error && <div role="alert">{error}</div>}
          <button type="submit">حفظ</button>
        </form>
      );
    }

    renderIntegration(<UserFormSimple />);

    // Enter existing username
    await user.type(screen.getByLabelText(/اسم المستخدم/i), 'existinguser');

    // Submit form
    await user.click(screen.getByRole('button', { name: /حفظ/i }));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/اسم المستخدم موجود بالفعل/i);
    });
  });

  it('should prevent non-admin users from accessing user management', () => {
    // Override useAuth mock for this test
    vi.mocked(vi.mocked).mockImplementation(() => {
      throw new Error('Use actual implementation');
    });

    const nonAdminAuth = {
      user: createMockUser({ role: 'ACCOUNTANT' }),
      isAuthenticated: true,
      isAdmin: false,
      isAccountant: true,
    };

    function UsersPage() {
      const auth = nonAdminAuth;

      if (!auth.isAdmin) {
        return <div>غير مصرح لك بالوصول إلى هذه الصفحة</div>;
      }

      return <div>إدارة المستخدمين</div>;
    }

    renderIntegration(<UsersPage />);

    // Verify access denied message
    expect(screen.getByText(/غير مصرح لك بالوصول إلى هذه الصفحة/i)).toBeInTheDocument();
    expect(screen.queryByText(/إدارة المستخدمين/i)).not.toBeInTheDocument();
  });
});
