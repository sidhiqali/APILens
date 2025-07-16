import { Module } from '@nestjs/common';
import { ApisService } from './apis.service';
import { ApisController } from './apis.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Api, ApiSchema } from 'src/Schemas/api.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Api.name, schema: ApiSchema }])],
  controllers: [ApisController],
  providers: [ApisService],
})
export class ApisModule {}
