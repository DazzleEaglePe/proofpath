import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TalentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.talentProfile.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string) {
    return this.prisma.talentProfile.findUnique({ where: { id } });
  }

  create(data: {
    fullName: string;
    email: string;
    walletAddress: string;
    encryptedPrivateKey: string;
  }) {
    return this.prisma.talentProfile.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        walletAddress: data.walletAddress.toLowerCase(),
        encryptedPrivateKey: data.encryptedPrivateKey,
      },
    });
  }

  setTokenId(id: string, tokenId: bigint) {
    return this.prisma.talentProfile.update({ where: { id }, data: { tokenId } });
  }
}
