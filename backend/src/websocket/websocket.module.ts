import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebSocketGatewayService } from './websocket.gateway';

@Module({
  imports: [ConfigModule],
  providers: [WebSocketGatewayService],
  exports: [WebSocketGatewayService],
})
export class WebSocketModule {}
