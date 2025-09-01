import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiChange } from 'src/Schemas/api-change.schema';
import { Api } from 'src/Schemas/api.schema';

export interface PaginatedChanges {
  changes: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ChangelogsService {
  constructor(
    @InjectModel(ApiChange.name) private apiChangeModel: Model<ApiChange>,
    @InjectModel(Api.name) private apiModel: Model<Api>,
  ) {}

  async getAllChanges(
    userId: string,
    params: {
      page: number;
      limit: number;
      search?: string;
      severity?: string;
      type?: string;
      days?: number;
    },
  ): Promise<PaginatedChanges> {
    const userObjectId = new Types.ObjectId(userId);

    const userApis = await this.apiModel
      .find({ userId: userObjectId }, '_id apiName')
      .lean();
    const apiIds = userApis.map((api: any) => api._id);
    const apiMap = new Map(
      userApis.map((api: any) => [api._id.toString(), api.apiName]),
    );

    const query: any = { apiId: { $in: apiIds } };

    if (params.severity) {
      query.severity = params.severity;
    }

    if (params.type) {
      query.changeType = params.type;
    }

    if (params.days) {
      const startDate = new Date(
        Date.now() - params.days * 24 * 60 * 60 * 1000,
      );
      query.detectedAt = { $gte: startDate };
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      query.$or = [
        { summary: searchRegex },
        { description: searchRegex },
        { 'changes.description': searchRegex },
      ];
    }

    const skip = (params.page - 1) * params.limit;

    const total = await this.apiChangeModel.countDocuments(query);

    const changes = await this.apiChangeModel
      .find(query)
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean();

    const formattedChanges = changes.map((change: any) => ({
      ...change,
      id: change._id.toString(),
      apiName: apiMap.get(change.apiId.toString()),
    }));

    return {
      changes: formattedChanges,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
