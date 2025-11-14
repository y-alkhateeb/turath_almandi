import { Branch } from '@/services/branches.service';

// Re-export Branch interface from service
export type { Branch };

// Input type for creating a new branch
export interface CreateBranchInput {
  name: string;
  location: string;
  managerName: string;
  phone: string;
}

// Input type for updating a branch
export interface UpdateBranchInput {
  name?: string;
  location?: string;
  managerName?: string;
  phone?: string;
  isActive?: boolean;
}

// Form data type for react-hook-form
export type BranchFormData = CreateBranchInput;
