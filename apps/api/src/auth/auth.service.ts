import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Placeholder for non-Riot auth (email/password)
    // This will be implemented later if needed
    return null;
  }

  async createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const token = this.jwtService.sign({ userId });

    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  async validateSession(token: string): Promise<string | null> {
    try {
      const payload = this.jwtService.verify(token);
      const session = await this.prisma.session.findUnique({
        where: { token },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return payload.userId;
    } catch {
      return null;
    }
  }
}
