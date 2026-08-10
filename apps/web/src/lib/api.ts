const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const TOKEN_KEY = 'proofpath.org.token';

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  if (auth) {
    const token = readToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // El backend usa `error` como codigo estable y `message` como texto humano.
    // class-validator devuelve message como array; se aplana para la UI.
    const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message;
    throw new ApiError(
      body?.error ?? 'UnknownError',
      message ?? `La API respondio ${res.status}`,
      res.status,
    );
  }

  return body as T;
}

// ─── Tipos que devuelve la API ──────────────────────────────

export interface Skill {
  id: string;
  name: string;
  type: 'HARD' | 'HUMAN';
  source: 'AI_SUGGESTED' | 'ORG_ADDED';
  confirmed: boolean;
}

export interface OrgExperience {
  id: string;
  talentName: string;
  tokenId: string | null;
  role: string;
  contributions: string;
  hoursCommitted: number | null;
  status: 'DRAFT' | 'AI_ANALYZED' | 'ORG_CONFIRMED' | 'ISSUED';
  evidences: Array<{ type: string; url: string; label: string }>;
  skills: Skill[];
}

export interface OrgProgram {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  experiences: OrgExperience[];
}

export interface IssueResult {
  batchId: string;
  onChainBatchId: string;
  merkleRoot: string;
  size: number;
  txHash: string;
  credentials: Array<{ experienceId: string; credentialHash: string; subjectTokenId: string }>;
}

export interface SkillSummary {
  name: string;
  type: 'HARD' | 'HUMAN';
  experienceCount: number;
  experienceTitles: string[];
}

export interface PublicProfile {
  tokenId: string;
  fullName: string;
  headline: string | null;
  isVerified: boolean;
  experienceCount: number;
  experiences: Array<{
    credentialHash: string;
    programTitle: string;
    organizationName: string;
    role: string;
    startDate: string;
    endDate: string | null;
    txHash: string | null;
    revoked: boolean;
    evidences: Array<{ type: string; url: string; label: string }>;
    skills: { hard: string[]; human: string[] };
  }>;
  skills: SkillSummary[];
}

export interface Verification {
  vc: unknown;
  credentialHash: string;
  subjectTokenId: string;
  batchId: string | null;
  merkleProof: string[];
  issuer: { name: string; walletAddress: string };
  onChain: {
    merkleRoot: string | null;
    issuedAt: string | null;
    revoked: boolean;
    txHash: string | null;
    verified: boolean;
  };
}

// ─── Llamadas ───────────────────────────────────────────────

export const api = {
  orgLogin: (email: string, password: string) =>
    request<{ token: string; organization: { id: string; name: string; isTrusted: boolean } }>(
      '/auth/org/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false,
    ),

  orgMe: () => request<{ id: string; name: string; isTrusted: boolean }>('/org/me'),

  programs: () => request<OrgProgram[]>('/org/programs'),

  extractSkills: (experienceId: string) =>
    request<{ experienceId: string; suggested: Skill[] }>(`/experiences/${experienceId}/ai-extract`, {
      method: 'POST',
    }),

  updateSkills: (
    experienceId: string,
    body: { confirm?: string[]; discard?: string[]; add?: Array<{ name: string; type: string }> },
  ) =>
    request<Skill[]>(`/experiences/${experienceId}/skills`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  confirmExperience: (experienceId: string) =>
    request<{ id: string; status: string }>(`/experiences/${experienceId}/confirm`, {
      method: 'POST',
    }),

  issueBatch: (experienceIds: string[]) =>
    request<IssueResult>('/org/batches/issue', {
      method: 'POST',
      body: JSON.stringify({ experienceIds }),
    }),

  publicProfile: (tokenId: string) =>
    request<PublicProfile>(`/public/talent/${tokenId}`, {}, false),

  verification: (credentialHash: string) =>
    request<Verification>(`/public/credentials/${credentialHash}/verification`, {}, false),

  health: () =>
    request<{ status: string; database: string; chainAdapter: string }>('/health', {}, false),
};
