import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { CHAIN_ADAPTER, type ChainAdapter } from '../chain/chain-adapter';
import { TalentRepository } from '../repositories/talent.repository';
import { WalletCrypto } from '../wallet/wallet-crypto';

export interface OnboardingResponse {
  token: string;
  profile: {
    id: string;
    fullName: string;
    givenNames: string | null;
    familyNames: string | null;
    tokenId: string | null;
    walletAddress: string | null;
    profileCid: string | null;
  };
}

/**
 * Activación del talento — 06-API-SPEC.md §2.
 *
 * `TalentAuthService` crea primero un perfil pendiente y verifica el correo.
 * Recién entonces este servicio genera la wallet, la cifra y acuña el
 * TalentPass. **El usuario no se entera de nada de eso**.
 *
 * Es la respuesta a la pregunta del jurado sobre wallets (03-DEMO-SCRIPT §4):
 * el joven no instala nada, no compra cripto y no ve la palabra wallet.
 */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly talents: TalentRepository,
    private readonly crypto: WalletCrypto,
    private readonly jwt: JwtService,
    @Inject(CHAIN_ADAPTER) private readonly chain: ChainAdapter,
  ) {}

  /** Completa wallet + mint despues de verificar el correo y abre la sesion. */
  async activateVerifiedProfile(
    profileId: string,
  ): Promise<OnboardingResponse> {
    const profile = await this.talents.findById(profileId);
    if (!profile) {
      throw new NotFoundException({
        error: 'TalentNotFound',
        message: 'No encontramos el perfil',
      });
    }

    if (profile.walletAddress) {
      return {
        token: await this.jwt.signAsync({ sub: profile.id, aud: 'talent' }),
        profile: {
          id: profile.id,
          fullName: profile.fullName,
          givenNames: profile.givenNames,
          familyNames: profile.familyNames,
          tokenId: profile.tokenId?.toString() ?? null,
          walletAddress: profile.walletAddress,
          profileCid: profile.profileCid,
        },
      };
    }

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    await this.talents.setWallet(
      profile.id,
      account.address,
      this.crypto.encrypt(privateKey),
    );

    let tokenId: bigint | null = null;
    try {
      const res = await this.chain.mintTalentPass(account.address, '');
      await this.talents.setTokenId(profile.id, res.tokenId);
      tokenId = res.tokenId;
      this.logger.log(`TalentPass #${res.tokenId} acuñado para ${profile.id}`);
    } catch (e) {
      this.logger.warn(
        `Perfil ${profile.id} activado pero el mint fallo: ${(e as Error).message}. Se puede reintentar.`,
      );
    }

    return {
      token: await this.jwt.signAsync({ sub: profile.id, aud: 'talent' }),
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        givenNames: profile.givenNames,
        familyNames: profile.familyNames,
        tokenId: tokenId?.toString() ?? null,
        walletAddress: account.address.toLowerCase(),
        profileCid: profile.profileCid,
      },
    };
  }

  /**
   * Export de la llave privada — el respaldo del argumento de portabilidad.
   *
   * La custodia es nuestra en el MVP para que el onboarding sean dos campos,
   * pero el joven se la puede llevar cuando quiera. Ver la postura sobre
   * custodia en 00-CONTEXT.md §6.
   */
  async exportPrivateKey(
    profileId: string,
  ): Promise<{ walletAddress: string; privateKey: string }> {
    const profile = await this.talents.findById(profileId);
    if (!profile?.encryptedPrivateKey || !profile.walletAddress) {
      throw new NotFoundException({
        error: 'WalletNotFound',
        message: 'Este perfil no tiene una wallet gestionada por ProofPath',
      });
    }

    this.logger.warn(`Export de llave privada solicitado para ${profileId}`);

    return {
      walletAddress: profile.walletAddress,
      privateKey: this.crypto.decrypt(profile.encryptedPrivateKey),
    };
  }
}
