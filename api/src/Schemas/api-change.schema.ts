import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface ChangeDetail {
  path: string;
  changeType: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
  description: string;
}

@Schema({ timestamps: true })
export class ApiChange extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Api', required: true, index: true })
  apiId: Types.ObjectId;

  @Prop({ required: true })
  fromVersion: string;

  @Prop({ required: true })
  toVersion: string;

  @Prop({
    required: true,
    enum: ['breaking', 'non-breaking', 'deprecation', 'addition'],
  })
  changeType: string;

  @Prop({
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
  })
  severity: string;

  @Prop({ type: Array, required: true })
  changes: ChangeDetail[];

  @Prop({ required: true, index: true })
  detectedAt: Date;

  @Prop({ default: false })
  acknowledged: boolean;

  @Prop()
  acknowledgedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acknowledgedBy: Types.ObjectId;

  @Prop()
  summary: string;

  @Prop({ default: 0 })
  impactScore: number; // 0-100 based on severity and change type
}

export const ApiChangeSchema = SchemaFactory.createForClass(ApiChange);

// Most important - Recent changes by API
ApiChangeSchema.index({ apiId: 1, detectedAt: -1 });

//  Dashboard - Unacknowledged changes by API
ApiChangeSchema.index({ apiId: 1, acknowledged: 1 });

//  Alerts - Critical unacknowledged changes
ApiChangeSchema.index({ severity: 1, acknowledged: 1 });

//  Analytics - Breaking changes timeline
ApiChangeSchema.index({ changeType: 1, detectedAt: -1 });

// Prioritization - High impact changes
ApiChangeSchema.index({ impactScore: -1, detectedAt: -1 });

//  User workflow - Changes acknowledged by specific user
ApiChangeSchema.index({ acknowledgedBy: 1, acknowledgedAt: -1 });
