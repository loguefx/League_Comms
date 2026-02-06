import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GameDetectionService } from './game-detection.service';

@Processor('game-detection')
export class GameQueueProcessor extends WorkerHost {
  constructor(private gameDetectionService: GameDetectionService) {
    super();
  }

  async process(job: Job<{ userId: string }>): Promise<void> {
    if (job.name === 'poll-active-game') {
      await this.gameDetectionService.pollActiveGame(job.data.userId);
    }
  }
}
