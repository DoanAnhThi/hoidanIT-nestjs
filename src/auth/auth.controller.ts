import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { Public } from '@/decorator/customize';
import { register } from 'module';
import { registerDecorator } from 'class-validator';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly mailerService: MailerService,
    private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)

  handleLogin(@Request() req) {
    return this.authService.login(req.user);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('register')
  @Public()
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Get('mail')
  @Public()
  testMail() {
    this.mailerService
    .sendMail({
      to: 'bincalam28499@gmail.com', // list of receivers
      subject: 'Tao lao bi dao ✔', // Subject line
      text: 'welcome', // plaintext body
      html: '<b>Hello World with Thi</b>', // HTML body content
    })
    return "ok";
  }
}