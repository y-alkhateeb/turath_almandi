import { IsString, IsNotEmpty, IsPhoneNumber, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  managerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;
}
