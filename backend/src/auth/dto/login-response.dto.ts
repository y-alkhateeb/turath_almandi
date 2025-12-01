export class LoginResponseDto {
  user: {
    id: string;
    username: string;
    role: string;
    branchId: string | null;
  };

  access_token: string;
  refresh_token: string;
}
