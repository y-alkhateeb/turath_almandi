import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Turath Almandi Restaurant Accounting System API';
  }
}
