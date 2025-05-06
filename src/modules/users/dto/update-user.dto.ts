import { IsMongoId, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateUserDto {
    @IsMongoId({message : 'Id không hợp lệ'})
    @IsNotEmpty({message : 'Id không được để trống'})
    _id: string;
    
    @IsOptional()
    name: string;

    @IsOptional()
    phone: string;
    
    address: string;
    image: string;
}
