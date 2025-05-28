import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePasswordHelper } from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    const isValidPassword = await comparePasswordHelper(pass, user.password)
    if(!user|| !isValidPassword) return null;
    return user;

  }

  async login(user: any) {
    const payload = { username: user.email, sub: user._id };
    return {
      user:{
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        _id: user._id,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  handleRegister = async(registerDto: CreateAuthDto) => {
    return await this.usersService.handleRegister(registerDto);

  }


}
