import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashPasswordHelper } from '@/helpers/util';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) 
    private userModel: Model<User>
  ) {}

  isEmailExist = async(email: string) => {
    const user = await this.userModel.exists({email});
    if (user) return true;
    return false;
  }
  async create(createUserDto: CreateUserDto) {
    const {name, email, password, phone, address, image} = createUserDto;
    
    // check if email exists
    const isEmailExist = await this.isEmailExist(email); // promise nên phải có await để chờ kết quả trả về trước khi tiếp tục
    if (isEmailExist) {
      throw new  BadRequestException(`Email ${email} đã tồn tại. Vui lòng sử dụng email khác`); 
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

  async findAll(query: string , current: number, pageSize: number) {
    const {filter, sort} = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;

    if(!current) current = 1;
    if(!pageSize) pageSize = 10;
    
    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (+current - 1) * +pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select('-password -__v') // dấu trừ để loại bỏ trường password và __v
      .sort(sort as any)
    return {results, totalPages};
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      {_id: updateUserDto._id}, {...updateUserDto}); // ... là toán tử spread để lấy tất cả các trường trong updateUserDto
  }

  async remove(_id: string) {
    // check id
    if (mongoose.isValidObjectId(_id)) {
      // delete user
      return this.userModel.deleteOne({_id})
    }else {
      throw new BadRequestException(`Id ${_id} không hợp lệ`);
    }
  }
}
