import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashPasswordHelper } from '@/helpers/util';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { changePasswordAuthDto, CodeAuthDto, CreateAuthDto } from '@/auth/dto/create-auth.dto';
import * as dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';



@Injectable()
export class UsersService {
  findbyEmail(username: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private readonly mailerService: MailerService,
  ) { }

  isEmailExist = async (email: string) => {
    const user = await this.userModel.exists({ email });
    if (user) return true;
    return false;
  }
  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, address, image } = createUserDto;

    // check if email exists
    const isEmailExist = await this.isEmailExist(email); // promise nên phải có await để chờ kết quả trả về trước khi tiếp tục
    if (isEmailExist) {
      throw new BadRequestException(`Email ${email} đã tồn tại. Vui lòng sử dụng email khác`);
    }


    // hash password
    const hashPassword = await hashPasswordHelper(password);
    const user = await this.userModel.create({
      name, email, password: hashPassword, phone, address, image
    })
    return {
      _id: user._id,
    }

    return 'This action adds a new user';
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;

    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (+current - 1) * +pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select('-password -__v') // dấu trừ để loại bỏ trường password và __v
      .sort(sort as any)
    return { results, totalPages };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email })
  }


  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id }, { ...updateUserDto }); // ... là toán tử spread để lấy tất cả các trường trong updateUserDto
  }

  async remove(_id: string) {
    // check id
    if (mongoose.isValidObjectId(_id)) {
      // delete user
      return this.userModel.deleteOne({ _id })
    } else {
      throw new BadRequestException(`Id ${_id} không hợp lệ`);
    }
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { name, email, password } = registerDto;

    const isEmailExist = await this.isEmailExist(email);
    if (isEmailExist) {
      throw new BadRequestException(`Email ${email} đã tồn tại. Vui lòng sử dụng email khác`);
    }

    const hashPassword = await hashPasswordHelper(password);
    const activationCode = uuidv4();

    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      is_active: false,
      code_id: activationCode,
      codeExpired: dayjs().add(5, 'minutes'),
    });

    // send mail
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Kích hoạt tài khoản ✔',
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode,
      },
    });

    return {
      _id: user._id,
    };
  }

  async handleActive(data: CodeAuthDto) {
    const user = await this.userModel.findOne({
      _id: data._id,
      code_id: data.code,
    })
    if (!user) {
      throw new BadRequestException(`Mã kích hoạt không hợp lệ hoặc đã hết hạn`);
    }

    // check code expired
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);

    if (isBeforeCheck) {
      //valid => update user
      await this.userModel.updateOne({ _id: data._id }, {
        is_active: true
      })
      return { isBeforeCheck };
    } else {
      throw new BadRequestException(`Mã kích hoạt đã hết hạn`);
    }

  }

  async retryActive(email: string) {
    // check email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException(`Tài khoản ${email} không tồn tại`);
    }
    // check is_active
    if (user.is_active) {
      throw new BadRequestException(`Tài khoản ${email} đã được kích hoạt`);
    }
    // generate new code
    const activationCode = uuidv4();
    const codeExpired = dayjs().add(5, 'minutes');
    // update user
    await this.userModel.updateOne(
      { _id: user._id },
      {
        code_id: activationCode,
        codeExpired: codeExpired,
      }
    );
    // send mail
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Kích hoạt tài khoản ✔',
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: activationCode
      },
    });
    return { _id: user._id }
  }

  async retryPassword(email: string) {
    // check email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException(`Tài khoản ${email} không tồn tại`);
    }

    // generate new code
    const activationCode = uuidv4();
    const codeExpired = dayjs().add(5, 'minutes');
    // update user
    await this.userModel.updateOne(
      { _id: user._id },
      {
        code_id: activationCode,
        codeExpired: codeExpired,
      }
    );
    // send mail
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Thay đổi mật khẩu ✔',
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: activationCode
      },
    });
    return { _id: user._id, email: user.email }
  }

  async changePassword(data: changePasswordAuthDto) {
    if (data.confirmPassword !== data.password) {
      throw new BadRequestException(`Mật khẩu xác nhận không khớp`);
    }

    // check email
    const user = await this.userModel.findOne({ email: data.email });
    if (!user) {
      throw new BadRequestException(`Tài khoản không tồn tại`);
    }

    // check code expired
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);

    if (isBeforeCheck) {
      //valid => update password
      const newPassword = await hashPasswordHelper(data.password);
      await user.updateOne ({ password : newPassword })

      return { isBeforeCheck };
    } else {
      throw new BadRequestException(`Mã kích hoạt đã hết hạn`);
    }

  }
}