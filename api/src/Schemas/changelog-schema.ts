// src/apis/schemas/changelog.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Changelog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Api' })
  apiId: Types.ObjectId;

  @Prop()
  previousVersion: string;

  @Prop()
  newVersion: string;

  @Prop()
  diffSummary: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const ChangelogSchema = SchemaFactory.createForClass(Changelog);
