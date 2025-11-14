export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface UserWithBranch {
  id: string;
  username: string;
  role: 'ADMIN' | 'ACCOUNTANT';
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch: Branch | null;
}

export interface CreateUserDto {
  username: string;
  password: string;
  role: 'ADMIN' | 'ACCOUNTANT';
  branchId?: string | null;
}

export interface UpdateUserDto {
  role?: 'ADMIN' | 'ACCOUNTANT';
  branchId?: string | null;
  isActive?: boolean;
}
