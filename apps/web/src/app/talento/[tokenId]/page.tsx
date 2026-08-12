'use client';

import Link from 'next/link';
import { Suspense, use, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileBadge2,
  Fingerprint,
  FolderCheck,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { DimensionPointsList } from '@/components/dimension-points';
import { RouteCard } from '@/components/route-card';
import { VerifiedBadge } from '@/components/verified-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type PublicProfile } from '@/lib/api';

const ARBISCAN = process.env.NEXT_PUBLIC_ARBISCAN_URL ?? 'https://sepolia.arbiscan.io';

type PageParams = Promise<{ tokenId: string }> | { tokenId: string };

export default function TalentPassPublico({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<SkeletonTalentPass />}>
      <TalentPassContent params={params} />
    </Suspense>
  );
}

function TalentPassContent({ params }: { params: PageParams }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const tokenId = resolvedParams.tokenId;

  const [perfil, setPerfil] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!tokenId) return;
    api
      .publicProfile(tokenId)
      .then(setPerfil)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil público'));
  }, [tokenId]);

  // async function compartir() {
  //   if (typeof window === 'undefined') return;
  //   if (navigator.share) {
  //     await navigator.share({ title: perfil?.fullName ?? 'TalentPass', url: window.location.href });
  //     return;
  //   }
  //   await navigator.clipboard.writeText(window.location.href);
  //   setCopiado(true);
  //   setTimeout(() => setCopiado(false), 2000);
  // }

  if (error) {
    return (
      <main className="app-canvas px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Brand />
          <Alert variant="destructive" className="mt-16 rounded-2xl border-destructive/25 bg-danger-soft text-destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  if (!perfil) return <SkeletonTalentPass />;

  const initials = perfil.fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return (
    <main className="app-canvas min-h-dvh pb-16 text-white">
      <header className="relative z-20 border-b border-white/8 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Brand />
          {/* <div className="flex items-center gap-2">
            <NetworkPill className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={() => void compartir()}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              {copiado ? <CheckCircle2 className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
              {copiado ? 'Copiado' : 'Compartir'}
            </button>
          </div> */}
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-white/38 transition hover:text-white">
          <ArrowLeft className="size-3.5" /> Volver al inicio
        </Link>

        <section className="mt-7 overflow-hidden rounded-[2rem] border border-white/10 bg-[#101510]">
          <div className="relative min-h-72 overflow-hidden p-6 sm:p-9">
            <div className="absolute -right-16 -top-40 size-[420px] rounded-full bg-primary/18 blur-3xl" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgb(255_255_255/.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/.04)_1px,transparent_1px)] [background-size:48px_48px]" />

            <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative grid size-24 shrink-0 place-items-center rounded-full border border-primary/35 bg-primary text-2xl font-bold text-primary-foreground shadow-[0_0_0_8px_rgb(184_255_61/6%)]">
                  {initials}
                  <span className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full border-4 border-[#101510] bg-primary text-primary-foreground">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">TalentPass #{perfil.tokenId}</p>
                  <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] sm:text-5xl">{perfil.fullName}</h1>
                  {perfil.headline && <p className="mt-2 text-sm text-white/48">{perfil.headline}</p>}
                  <div className="mt-4">
                    <VerifiedBadge estado={perfil.isVerified ? 'verificado' : 'verificando'} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 sm:min-w-64">
                <ProfileStat value={perfil.experiences.length} label="Credenciales" />
                <ProfileStat value={perfil.skills.length} label="Competencias" />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.28fr_.72fr] lg:gap-8">
          <section>
            <SectionHeading
              eyebrow="Trayectoria"
              title="Experiencias verificadas"
              count={`${perfil.experiences.length} ${perfil.experiences.length === 1 ? 'credencial' : 'credenciales'}`}
            />

            {perfil.experiences.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">
                Todavía no hay credenciales emitidas.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {perfil.experiences.map((experience, index) => (
                  <article key={experience.credentialHash} className="rounded-[1.6rem] border border-white/8 bg-white/[.028] p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 font-mono text-[10px] text-primary">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold tracking-[-0.025em]">{experience.programTitle}</h3>
                            <p className="mt-1 text-xs text-white/42">{experience.role} · {experience.organizationName}</p>
                          </div>
                          <VerifiedBadge estado={experience.revoked ? 'revocado' : 'verificado'} />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {[...experience.skills.hard, ...experience.skills.human].map((skill) => (
                            <span key={skill} className="rounded-full border border-white/9 bg-white/[.035] px-2.5 py-1.5 text-[11px] text-white/58">
                              {skill}
                            </span>
                          ))}
                        </div>

                        {experience.evidences.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/7 pt-4">
                            {experience.evidences.map((evidence) => (
                              <a
                                key={evidence.url}
                                href={evidence.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] text-white/42 transition hover:text-primary"
                              >
                                <FolderCheck className="size-3.5" /> {evidence.label} <ExternalLink className="size-3" />
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/7 pt-4">
                          <Link
                            href={`/verificar/${experience.credentialHash}`}
                            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                          >
                            <ShieldCheck className="size-3.5" /> Verificar credencial
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                          </Link>
                          {experience.txHash && (
                            <a
                              href={`${ARBISCAN}/tx/${experience.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-white/30 transition hover:text-white"
                            >
                              Transacción <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside>
            {perfil.routes.length > 0 && (
              <section className="mb-10">
                <SectionHeading
                  eyebrow="Oportunidades"
                  title="Rutas abiertas"
                  count={`${perfil.routes.length} ${perfil.routes.length === 1 ? 'convocatoria' : 'convocatorias'}`}
                />
                <div className="mt-5 space-y-4">
                  {perfil.routes.map((ruta) => (
                    <RouteCard key={ruta.id} ruta={ruta} />
                  ))}
                </div>
              </section>
            )}

            {perfil.points.length > 0 && (
              <section className="mb-10">
                <SectionHeading
                  eyebrow="Actividad"
                  title="Participación"
                  count="por dimensión"
                />
                <div className="mt-5">
                  <DimensionPointsList points={perfil.points} />
                </div>
              </section>
            )}

            <SectionHeading eyebrow="Evidencia" title="Competencias" count={`${perfil.experienceCount} experiencias`} />
            <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[.028]">
              <div className="flex items-center gap-3 border-b border-white/7 p-5">
                <span className="grid size-9 place-items-center rounded-full bg-primary/12 text-primary">
                  <Fingerprint className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">Mapa de evidencia</p>
                  <p className="mt-0.5 text-[10px] text-white/30">Sin niveles ni puntajes</p>
                </div>
              </div>
              <ul className="divide-y divide-white/7">
                {perfil.skills.map((skill) => (
                  <li key={skill.name} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{skill.name}</p>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-primary">
                        {skill.experienceCount} {skill.experienceCount === 1 ? 'prueba' : 'pruebas'}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2 border-l border-primary/25 pl-3">
                      {skill.experienceTitles.map((title) => (
                        <li key={title} className="text-[11px] leading-4 text-white/38">{title}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-[1.6rem] bg-primary p-5 text-primary-foreground">
              <FileBadge2 className="size-5" />
              <p className="mt-8 text-lg font-bold tracking-[-0.03em]">Evidencia, no reputación.</p>
              <p className="mt-2 text-xs font-medium leading-5 opacity-60">
                ProofPath muestra dónde se demostró cada competencia. No asigna notas a las personas.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-black/20 p-4">
      <p className="text-2xl font-semibold tracking-[-0.05em]">{String(value).padStart(2, '0')}</p>
      <p className="mt-1 text-[10px] text-white/35">{label}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, count }: { eyebrow: string; title: string; count: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">{title}</h2>
      </div>
      <span className="shrink-0 text-[10px] text-white/28">{count}</span>
    </div>
  );
}

function SkeletonTalentPass() {
  return (
    <main className="min-h-dvh bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <Skeleton className="h-8 w-36 bg-white/8" />
        <Skeleton className="mt-12 h-72 rounded-[2rem] bg-white/8" />
        <div className="grid gap-5 lg:grid-cols-[1.28fr_.72fr]">
          <Skeleton className="h-72 rounded-[1.6rem] bg-white/8" />
          <Skeleton className="h-72 rounded-[1.6rem] bg-white/8" />
        </div>
      </div>
    </main>
  );
}
