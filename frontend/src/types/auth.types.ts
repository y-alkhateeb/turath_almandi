export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'ACCOUNTANT';
  branchId: string | null;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    location?: string;
  } | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}
