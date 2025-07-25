import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ApiSnapshot extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Api', required: true })
  apiId: Types.ObjectId;

  @Prop({ required: true })
  version: string;

  @Prop({ type: Object, required: true })
  spec: any;

  @Prop({ required: true })
  detectedAt: Date;

  @Prop({ type: Object })
  metadata: {
    endpointCount?: number;
    schemaCount?: number;
    specSize?: number;
    checksum?: string;
  };
}

export const ApiSnapshotSchema = SchemaFactory.createForClass(ApiSnapshot);
