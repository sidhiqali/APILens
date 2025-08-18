import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChangelogsService } from './changelogs.service';
import { ChangelogsController } from './changelogs.controller';
import { ApiChange, ApiChangeSchema } from 'src/Schemas/api-change.schema';
import { Api, ApiSchema } from 'src/Schemas/api.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiChange.name, schema: ApiChangeSchema },
      { name: Api.name, schema: ApiSchema },
    ]),
  ],
  controllers: [ChangelogsController],
  providers: [ChangelogsService],
})
export class ChangelogsModule {}
