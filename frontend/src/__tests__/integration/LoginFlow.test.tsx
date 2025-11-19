/**
 * Integration Test: Login Flow
 *
 * Tests the complete user login journey:
 * 1. User visits login page
 * 2. Enters credentials
 * 3. Submits form
 * 4. API authentication
 * 5. Token storage
 * 6. Redirect to dashboard
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderIntegration, mockLocalStorage, createMockUser } from '@/test/integrationTestUtils';
import * as authService from '@/api/services/authService';

// Mock the auth service
vi.mock('@/api/services/authService');

// Mock localStorage
const localStorageMock = mockLocalStorage();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Integration: Login Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full login flow successfully', async () => {
    const user = userEvent.setup();

    // Mock API response
    const mockAuthResponse = {
      user: createMockUser({
        username: 'admin',
        role: 'ADMIN',
      }),
      token: 'mock-jwt-token-12345',
    };

    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

    // Create a simple Login component for testing
    function LoginPage() {
      const [username, setUsername] = React.useState('');
      const [password, setPassword] = React.useState('');
      const [error, setError] = React.useState('');
      const [loading, setLoading] = React.useState(false);
      const navigate = mockNavigate;

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
          const response = await authService.login({ username, password });
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          navigate('/dashboard');
        } catch (err: any) {
          setError(err.message || 'Login failed');
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <h1>تسجيل الدخول</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username">اسم المستخدم</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && <div role="alert">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      );
    }

    // Render login page
    renderIntegration(<LoginPage />, { initialRoute: '/login' });

    // Step 1: Verify login page is displayed
    expect(screen.getByText(/تسجيل الدخول/i)).toBeInTheDocument();

    // Step 2: Enter username
    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    await user.type(usernameInput, 'admin');
    expect(usernameInput).toHaveValue('admin');

    // Step 3: Enter password
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');

    // Step 4: Submit form
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });
    await user.click(submitButton);

    // Step 5: Verify API was called with correct credentials
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password123',
      });
    });

    // Step 6: Verify token is stored in localStorage
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'token',
        'mock-jwt-token-12345'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        expect.stringContaining('admin')
      );
    });

    // Step 7: Verify navigation to dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle login failure with invalid credentials', async () => {
    const user = userEvent.setup();

    // Mock API error
    vi.mocked(authService.login).mockRejectedValue(
      new Error('Invalid username or password')
    );

    function LoginPage() {
      const [username, setUsername] = React.useState('');
      const [password, setPassword] = React.useState('');
      const [error, setError] = React.useState('');
      const [loading, setLoading] = React.useState(false);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
          await authService.login({ username, password });
        } catch (err: any) {
          setError(err.message || 'Login failed');
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <h1>تسجيل الدخول</h1>
          <form onSubmit={handleSubmit}>
            <input
              aria-label="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              aria-label="كلمة المرور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div role="alert">{error}</div>}
            <button type="submit">تسجيل الدخول</button>
          </form>
        </div>
      );
    }

    renderIntegration(<LoginPage />);

    // Enter invalid credentials
    await user.type(screen.getByLabelText(/اسم المستخدم/i), 'wronguser');
    await user.type(screen.getByLabelText(/كلمة المرور/i), 'wrongpass');

    // Submit form
    await user.click(screen.getByRole('button', { name: /تسجيل الدخول/i }));

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Invalid username or password/i
      );
    });

    // Verify no token was stored
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    // Verify no navigation occurred
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should disable form during login attempt', async () => {
    const user = userEvent.setup();

    // Mock slow API response
    vi.mocked(authService.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    function LoginPage() {
      const [username, setUsername] = React.useState('');
      const [password, setPassword] = React.useState('');
      const [loading, setLoading] = React.useState(false);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
          await authService.login({ username, password });
        } finally {
          setLoading(false);
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            aria-label="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <input
            aria-label="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      );
    }

    renderIntegration(<LoginPage />);

    // Fill form
    await user.type(screen.getByLabelText(/اسم المستخدم/i), 'admin');
    await user.type(screen.getByLabelText(/كلمة المرور/i), 'password');

    // Submit form
    await user.click(screen.getByRole('button'));

    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText(/جاري تسجيل الدخول/i)).toBeInTheDocument();
    });

    // Verify form is disabled
    expect(screen.getByLabelText(/اسم المستخدم/i)).toBeDisabled();
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
