import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosResponse } from 'axios';
import { CreateApiDto } from './dto/create-api.dto';
import { Api } from 'src/Schemas/api.schema';
import { OpenAPISpec } from 'src/types/api.type';

@Injectable()
export class ApisService {
  constructor(@InjectModel(Api.name) private apiModel: Model<Api>) {}

  async registerApi(dto: CreateApiDto): Promise<Api> {
    const response: AxiosResponse<OpenAPISpec> = await axios.get(
      dto.openApiUrl,
    );
    const { info } = response.data;
    if (!info?.version) throw new Error('Invalid OpenAPI spec');

    const api = new this.apiModel({
      apiName: dto.apiName,
      openApiUrl: dto.openApiUrl,
      type: dto.type || 'openapi',
      version: response.data.info.version,
      latestSpec: response.data,
      lastChecked: new Date(),
    });

    return api.save();
  }

  async getAllApis(): Promise<Api[]> {
    return this.apiModel.find().sort({ createdAt: -1 });
  }

  async deleteApi(id: string): Promise<void> {
    const result = await this.apiModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('API not found.');
  }
}
