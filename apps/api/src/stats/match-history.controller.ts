import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { MatchHistoryService } from './match-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stats/match-history')
@UseGuards(JwtAuthGuard)
export class MatchHistoryController {
  constructor(private matchHistoryService: MatchHistoryService) {}

  @Get()
  async getMatchHistory(
    @Request() req: any,
    @Query('count') count?: string
  ) {
    const matchCount = count ? parseInt(count, 10) : 20;
    const matches = await this.matchHistoryService.getMatchHistory(req.user.userId, matchCount);
    
    // Fetch full match details for each match
    const matchDetails = await Promise.all(
      matches.map(async (match: any) => {
        try {
          const fullMatch = await this.matchHistoryService.getMatchDetails(
            req.user.userId,
            match.matchId || match
          );
          return fullMatch;
        } catch (error) {
          console.error('Error fetching match details:', error);
          return null;
        }
      })
    );

    return matchDetails.filter(Boolean);
  }

  @Get(':matchId')
  async getMatchDetails(
    @Request() req: any,
    @Query('matchId') matchId: string
  ) {
    return this.matchHistoryService.getMatchDetails(req.user.userId, matchId);
  }
}
