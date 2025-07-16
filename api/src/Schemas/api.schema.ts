import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Api extends Document {
  @Prop({ required: true })
  apiName: string;

  @Prop({ required: true })
  openApiUrl: string;

  @Prop({ required: true })
  type: string;

  @Prop() version: string;
  @Prop({ type: Object }) latestSpec: any;
  @Prop() lastChecked: Date;
}

export const ApiSchema = SchemaFactory.createForClass(Api);
