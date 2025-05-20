import { Module } from '@nestjs/common';
import { DateEntriesController } from './date-entries.controller';
import { DateEntriesService } from './date-entries.service';

@Module({
  controllers: [DateEntriesController],
  providers: [DateEntriesService],
  exports: [DateEntriesService],
})
export class DateEntriesModule {}
