/**
 * Construccion del Verifiable Credential — 02-DATA-MODEL.md §4.
 *
 * Funcion pura a proposito: recibe datos planos, no entidades de Prisma. Asi se
 * puede fijar su salida con un test sin levantar base de datos, y el `vcJson`
 * queda desacoplado de como esten modeladas las tablas hoy.
 *
 * Lo que entra aqui es exactamente lo que va a quedar cubierto por el hash. Si
 * algo no esta en el VC, no esta protegido criptograficamente.
 */

export type SkillTypeInput = 'HARD' | 'HUMAN';

export interface VcBuildInput {
  /** 421614 en Arbitrum Sepolia. Forma parte del DID, asi que forma parte del hash. */
  chainId: number;
  schemaId: string;
  issuedAt: Date;

  organization: { walletAddress: string; name: string };
  talent: { walletAddress: string; tokenId: bigint };
  program: { title: string };

  experience: {
    role: string;
    contributions: string;
    startDate: Date;
    endDate: Date | null;
    hoursCommitted: number | null;
  };

  evidences: Array<{ type: string; url: string }>;

  /** SOLO las skills confirmadas por la organizacion. Ver 00-CONTEXT.md §2.2. */
  skills: Array<{ name: string; type: SkillTypeInput }>;
}

export interface ExperienceCredential {
  '@context': string[];
  type: string[];
  issuer: { id: string; name: string };
  credentialSubject: {
    id: string;
    tokenId: string;
    experience: {
      program: string;
      role: string;
      startDate: string;
      endDate?: string;
      hoursCommitted?: number;
      contributions: string;
    };
    evidence: Array<{ type: string; url: string }>;
    skills: { hard: string[]; human: string[] };
  };
  issuanceDate: string;
  schemaId: string;
}

/** did:pkh sobre EIP-155, que es como se identifica una wallet en un VC. */
function didPkh(chainId: number, address: string): string {
  return `did:pkh:eip155:${chainId}:${address.toLowerCase()}`;
}

/** Fecha civil YYYY-MM-DD. La hora no aporta y añade una fuente de divergencia. */
function toCivilDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildVc(input: VcBuildInput): ExperienceCredential {
  const { experience } = input;

  const hard = input.skills.filter((s) => s.type === 'HARD').map((s) => s.name);
  const human = input.skills.filter((s) => s.type === 'HUMAN').map((s) => s.name);

  return {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'ExperienceCredential'],
    issuer: {
      id: didPkh(input.chainId, input.organization.walletAddress),
      name: input.organization.name,
    },
    credentialSubject: {
      id: didPkh(input.chainId, input.talent.walletAddress),
      tokenId: input.talent.tokenId.toString(),
      experience: {
        program: input.program.title,
        role: experience.role,
        startDate: toCivilDate(experience.startDate),
        // Los opcionales se omiten cuando no hay dato, nunca se ponen en null.
        // `canonicalize` descarta las claves undefined, asi que una experiencia
        // sin fecha de fin hashea igual que si el campo no existiera.
        ...(experience.endDate ? { endDate: toCivilDate(experience.endDate) } : {}),
        ...(experience.hoursCommitted !== null
          ? { hoursCommitted: experience.hoursCommitted }
          : {}),
        contributions: experience.contributions,
      },
      evidence: input.evidences.map((e) => ({ type: e.type, url: e.url })),
      skills: { hard, human },
    },
    issuanceDate: input.issuedAt.toISOString(),
    schemaId: input.schemaId,
  };
}
