
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Cat>;

@Schema()
export class Cat {
    @Prop()
    id: string;
    
    @Prop()
    name: string;
    
    @Prop()
    email: string;
    
    @Prop()
    password: string;
    
    @Prop()
    phone: string;
    
    @Prop()
    address: string;
    
    @Prop()
    image: string;
    
    @Prop({default: 'user'})
    role: string;

    @Prop({default: 'LOCAL'})
    account_type: string;
    
    @Prop({default: false })
    is_active: boolean;
    
    @Prop()
    code_id: string;

    @Prop()
    codeExpired: Date;
    
}

export const CatSchema = SchemaFactory.createForClass(Cat);
