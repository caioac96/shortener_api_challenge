import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UrlModule } from 'modules/url/url.module';
import { UsersModule } from 'modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from 'config/env';
import { AuthModule } from 'modules/auth/auth.module';

@Module({
  imports: [
    UrlModule,
    UsersModule,
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: env.DB_HOST,
      port: env.DB_PORT,
      username: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      autoLoadEntities: true, // Pelo o que li, só funciona em runtime, não em migrations
      synchronize: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
