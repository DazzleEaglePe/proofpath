'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Layers3,
  LogOut,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react';
import { Brand, NetworkPill } from '@/components/brand';
import { SkillChip } from '@/components/skill-chip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { api, clearToken, readToken, type IssueResult, type OrgExperience, type OrgProgram } from '@/lib/api';

const ARBISCAN = process.env.NEXT_PUBLIC_ARBISCAN_URL ?? 'https://sepolia.arbiscan.io';

const ESTADO: Record<OrgExperience['status'], { texto: string; estilo: string }> = {
  DRAFT: { texto: 'Pendiente de análisis', estilo: 'border-white/10 bg-white/5 text-white/45' },
  AI_ANALYZED: { texto: 'Requiere confirmación', estilo: 'border-amber-300/20 bg-amber-300/8 text-amber-200' },
  ORG_CONFIRMED: { texto: 'Lista para emitir', estilo: 'border-primary/25 bg-primary/10 text-primary' },
  ISSUED: { texto: 'Emitida', estilo: 'border-primary/25 bg-primary/10 text-primary' },
};

export default function OrgDashboard() {
  const router = useRouter();
  const [programas, setProgramas] = useState<OrgProgram[]>([]);
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<IssueResult | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [org, progs] = await Promise.all([api.orgMe(), api.programs()]);
      setOrgName(org.name);
      setProgramas(progs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los programas');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!readToken()) {
      router.replace('/org/login');
      return;
    }
    const request = window.setTimeout(() => void cargar(), 0);
    return () => window.clearTimeout(request);
  }, [cargar, router]);

  async function accion(clave: string, fn: () => Promise<unknown>) {
    setTrabajando(clave);
    setError(null);
    try {
      await fn();
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setTrabajando(null);
    }
  }

  const experiencias = programas.flatMap((programa) => programa.experiences);
  const listasParaEmitir = experiencias.filter((experience) => experience.status === 'ORG_CONFIRMED');
  const requierenRevision = experiencias.filter((experience) => experience.status === 'AI_ANALYZED').length;
  const emitidas = experiencias.filter((experience) => experience.status === 'ISSUED').length;

  if (cargando) return <DashboardSkeleton />;

  return (
    <main className="min-h-dvh bg-background text-white">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-5">
            <Brand />
            <span className="hidden h-5 w-px bg-white/10 sm:block" />
            <span className="hidden text-xs text-white/45 sm:block">Portal de organizaciones</span>
          </div>
          <div className="flex items-center gap-2">
            <NetworkPill className="hidden md:inline-flex" />
            <button
              type="button"
              onClick={() => {
                clearToken();
                router.push('/org/login');
              }}
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white sm:w-auto sm:gap-2 sm:px-3"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-3.5" />
              <span className="hidden text-xs font-medium sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Centro de emisión</p>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">{orgName}</h1>
            <p className="mt-2 text-sm text-white/42">Revisa evidencia, confirma competencias y publica credenciales.</p>
          </div>
          <p className="text-xs text-white/30">Última sincronización · ahora</p>
        </section>

        {error && (
          <Alert variant="destructive" className="mt-7 rounded-2xl border-destructive/25 bg-danger-soft text-destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resultado && <ResultadoEmision resultado={resultado} />}

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <MetricCard icon={Users} label="Experiencias" value={experiencias.length} helper={`${programas.length} programas activos`} />
          <MetricCard icon={WandSparkles} label="Por confirmar" value={requierenRevision} helper="Revisión humana pendiente" />
          <MetricCard icon={FileCheck2} label="Credenciales" value={emitidas} helper="Emitidas y verificables" accent />
        </section>

        {listasParaEmitir.length > 0 && (
          <section className="relative mt-6 overflow-hidden rounded-[1.6rem] bg-primary p-6 text-primary-foreground sm:p-7">
            <div className="absolute -right-12 -top-20 size-56 rounded-full border-[28px] border-black/5" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-black/10">
                  <Layers3 className="size-5" />
                </span>
                <div>
                  <p className="text-lg font-bold tracking-[-0.025em]">
                    {listasParaEmitir.length} {listasParaEmitir.length === 1 ? 'experiencia lista' : 'experiencias listas'}
                  </p>
                  <p className="mt-1 text-xs font-medium opacity-60">Una sola transacción · raíz Merkle · Arbitrum Sepolia</p>
                </div>
              </div>
              <button
                type="button"
                disabled={trabajando !== null}
                onClick={() =>
                  accion('emitir', async () => {
                    const response = await api.issueBatch(listasParaEmitir.map((experience) => experience.id));
                    setResultado(response);
                  })
                }
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-black px-5 text-xs font-bold text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                {trabajando === 'emitir' ? 'Emitiendo lote…' : 'Emitir credenciales'}
                {trabajando !== 'emitir' && <ArrowRight className="size-3.5" />}
              </button>
            </div>
          </section>
        )}

        <section className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Programas</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Experiencias recibidas</h2>
            </div>
            <span className="rounded-full border border-white/8 bg-white/[.035] px-3 py-1.5 text-[11px] text-white/45">
              {experiencias.length} en total
            </span>
          </div>

          <div className="mt-6 space-y-10">
            {programas.map((programa) => (
              <section key={programa.id}>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{programa.title}</h3>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-white/38">{programa.description}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-white/28">{programa.experiences.length} registros</span>
                </div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {programa.experiences.map((experience) => (
                    <ExperienciaCard
                      key={experience.id}
                      exp={experience}
                      trabajando={trabajando}
                      onAnalizar={() => accion(`ai-${experience.id}`, () => api.extractSkills(experience.id))}
                      onAlternar={(skill) =>
                        accion(`skill-${skill.id}`, () =>
                          skill.confirmed
                            ? api.updateSkills(experience.id, { discard: [skill.id] })
                            : api.updateSkills(experience.id, { confirm: [skill.id] }),
                        )
                      }
                      onConfirmar={() => accion(`ok-${experience.id}`, () => api.confirmExperience(experience.id))}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  helper: string;
  accent?: boolean;
}) {
  return (
    <article className={`rounded-2xl border p-5 ${accent ? 'border-primary/20 bg-primary/[.055]' : 'border-white/8 bg-white/[.025]'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/42">{label}</p>
        <Icon className={`size-4 ${accent ? 'text-primary' : 'text-white/28'}`} />
      </div>
      <p className="mt-6 text-3xl font-semibold tracking-[-0.05em]">{String(value).padStart(2, '0')}</p>
      <p className="mt-1 text-[11px] text-white/28">{helper}</p>
    </article>
  );
}

function ExperienciaCard({
  exp,
  trabajando,
  onAnalizar,
  onAlternar,
  onConfirmar,
}: {
  exp: OrgExperience;
  trabajando: string | null;
  onAnalizar: () => void;
  onAlternar: (skill: OrgExperience['skills'][number]) => void;
  onConfirmar: () => void;
}) {
  const confirmadas = exp.skills.filter((skill) => skill.confirmed).length;
  const emitida = exp.status === 'ISSUED';
  const estado = ESTADO[exp.status];

  return (
    <article className="rounded-[1.4rem] border border-white/8 bg-white/[.025] p-5 transition hover:border-white/14 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/7 text-xs font-bold text-primary">
            {exp.talentName
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0])
              .join('')}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{exp.talentName}</p>
            <p className="mt-1 truncate text-[11px] text-white/38">
              {exp.role}
              {exp.hoursCommitted ? ` · ${exp.hoursCommitted} h` : ''}
              {exp.tokenId ? ` · TalentPass #${exp.tokenId}` : ''}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${estado.estilo}`}>
          {estado.texto}
        </span>
      </div>

      <p className="mt-5 line-clamp-3 text-sm leading-6 text-white/58">{exp.contributions}</p>

      {exp.evidences.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {exp.evidences.map((evidence) => (
            <li key={evidence.url}>
              <a
                href={evidence.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[.035] px-2.5 py-1.5 text-[10px] text-white/55 transition hover:border-primary/30 hover:text-primary"
              >
                {evidence.label} <ExternalLink className="size-3" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="my-5 h-px bg-white/7" />

      {exp.skills.length === 0 ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-white/35">Aún no hay competencias propuestas.</p>
          <button
            type="button"
            onClick={onAnalizar}
            disabled={trabajando !== null}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-[11px] font-semibold transition hover:border-primary/25 hover:text-primary disabled:opacity-45"
          >
            <Sparkles className="size-3.5" />
            {trabajando === `ai-${exp.id}` ? 'Analizando…' : 'Analizar con IA'}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] text-white/38">Competencias sugeridas</p>
            <p className="text-[10px] text-white/25">Toca para confirmar</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {exp.skills.map((skill) => (
              <SkillChip
                key={skill.id}
                nombre={skill.name}
                tipo={skill.type}
                confirmada={skill.confirmed}
                disabled={trabajando !== null}
                onClick={emitida ? undefined : () => onAlternar(skill)}
              />
            ))}
          </div>

          {!emitida && (
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/7 pt-4">
              <p className="text-[11px] text-white/35">
                {confirmadas === 0 ? 'Confirma al menos una competencia.' : `${confirmadas} confirmada${confirmadas === 1 ? '' : 's'}`}
              </p>
              {exp.status !== 'ORG_CONFIRMED' && (
                <button
                  type="button"
                  onClick={onConfirmar}
                  disabled={confirmadas === 0 || trabajando !== null}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[11px] font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-35"
                >
                  {trabajando === `ok-${exp.id}` ? 'Guardando…' : 'Confirmar experiencia'}
                  {trabajando !== `ok-${exp.id}` && <ChevronRight className="size-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ResultadoEmision({ resultado }: { resultado: IssueResult }) {
  return (
    <section className="mt-7 rounded-[1.6rem] border border-primary/20 bg-primary/[.055] p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary">{resultado.size} credenciales emitidas correctamente</p>
          <p className="mt-1 break-all font-mono text-[10px] leading-4 text-white/35">Merkle root · {resultado.merkleRoot}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`${ARBISCAN}/tx/${resultado.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Ver transacción <ExternalLink className="size-3" />
            </a>
            {resultado.credentials.map((credential) => (
              <Link
                key={credential.credentialHash}
                href={`/verificar/${credential.credentialHash}`}
                className="inline-flex items-center gap-1.5 text-xs text-white/55 transition hover:text-white"
              >
                Verificar TalentPass #{credential.subjectTokenId} <ArrowRight className="size-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <main className="min-h-dvh bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36 bg-white/8" />
          <Skeleton className="h-8 w-24 bg-white/8" />
        </div>
        <Skeleton className="mt-14 h-12 w-72 bg-white/8" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-32 bg-white/8" />
          <Skeleton className="h-32 bg-white/8" />
          <Skeleton className="h-32 bg-white/8" />
        </div>
        <Skeleton className="h-64 bg-white/8" />
      </div>
    </main>
  );
}
