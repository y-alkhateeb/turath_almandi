export class LoginResponseDto {
  user: {
    id: string;
    username: string;
    role: string;
    branchId: string | null;
    isActive: boolean;
  };

  access_token: string;
  refresh_token: string;
}
