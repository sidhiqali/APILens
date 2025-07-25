import { Module } from '@nestjs/common';
import { ApisService } from './apis.service';
import { ApisController } from './apis.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Api, ApiSchema } from 'src/Schemas/api.schema';
import { Changelog, ChangelogSchema } from 'src/Schemas/changelog-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Api.name, schema: ApiSchema },
      { name: Changelog.name, schema: ChangelogSchema },
    ]),
  ],
  controllers: [ApisController],
  providers: [ApisService],
})
export class ApisModule {}
