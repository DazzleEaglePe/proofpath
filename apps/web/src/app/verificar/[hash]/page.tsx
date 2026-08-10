'use client';

import { credentialHash, leafOf, verifyProof } from '@proofpath/shared';
import Link from 'next/link';
import { Suspense, use, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleSlash2,
  Code2,
  FileCheck2,
  Fingerprint,
  ShieldAlert,
} from 'lucide-react';
import { Brand, NetworkPill } from '@/components/brand';
import { HashDiffViewer } from '@/components/hash-diff-viewer';
import { VerifiedBadge, type EstadoVerificacion } from '@/components/verified-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type Verification } from '@/lib/api';

const ARBISCAN = process.env.NEXT_PUBLIC_ARBISCAN_URL ?? 'https://sepolia.arbiscan.io';

interface Chequeo {
  hashRecomputado: string;
  hashCoincide: boolean;
  proofValida: boolean;
}

type PageParams = Promise<{ hash: string }> | { hash: string };

export default function VerificarCredencial({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<SkeletonVerificacion />}>
      <VerificarContent params={params} />
    </Suspense>
  );
}

function VerificarContent({ params }: { params: PageParams }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const hash = resolvedParams.hash;
  const [datos, setDatos] = useState<Verification | null>(null);
  const [chequeo, setChequeo] = useState<Chequeo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) return;
    let vigente = true;

    api
      .verification(hash)
      .then((response) => {
        if (!vigente) return;
        const recomputado = credentialHash(response.vc);
        const hashCoincide = recomputado.toLowerCase() === response.credentialHash.toLowerCase();
        const proofValida =
          response.onChain.merkleRoot !== null &&
          verifyProof(
            response.merkleProof as `0x${string}`[],
            response.onChain.merkleRoot as `0x${string}`,
            leafOf(recomputado, BigInt(response.subjectTokenId)),
          );

        setDatos(response);
        setChequeo({ hashRecomputado: recomputado, hashCoincide, proofValida });
      })
      .catch((err) => vigente && setError(err instanceof Error ? err.message : 'No se pudo verificar la credencial'));

    return () => {
      vigente = false;
    };
  }, [hash]);

  const estado: EstadoVerificacion =
    !datos || !chequeo
      ? 'verificando'
      : datos.onChain.revoked
        ? 'revocado'
        : chequeo.hashCoincide && chequeo.proofValida
          ? 'verificado'
          : 'roto';

  if (error) {
    return (
      <main className="app-canvas px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Brand />
          <Alert variant="destructive" className="mt-16 rounded-2xl border-destructive/25 bg-danger-soft text-destructive">
            <AlertTitle>Error de verificación</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  const vc = datos?.vc as
    | {
        credentialSubject?: {
          experience?: { program?: string; role?: string; contributions?: string };
          skills?: { hard?: string[]; human?: string[] };
        };
      }
    | undefined;
  const experiencia = vc?.credentialSubject?.experience;
  const valido = estado === 'verificado';

  return (
    <main className="min-h-dvh bg-background pb-16 text-white">
      <header className="border-b border-white/8 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Brand />
          <NetworkPill />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-white/38 transition hover:text-white">
          <ArrowLeft className="size-3.5" /> Volver al inicio
        </Link>

        <section
          className={`relative mt-7 overflow-hidden rounded-[2rem] border p-6 sm:p-9 ${
            estado === 'roto' || estado === 'revocado'
              ? 'border-destructive/25 bg-danger-soft'
              : 'border-primary/18 bg-[#101710]'
          }`}
        >
          <div
            className={`absolute -right-24 -top-36 size-96 rounded-full blur-3xl ${
              estado === 'roto' || estado === 'revocado' ? 'bg-destructive/10' : 'bg-primary/12'
            }`}
          />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38">Resultado de verificación</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-[-0.055em] sm:text-5xl">
                {estado === 'verificando' && 'Comprobando la credencial…'}
                {estado === 'verificado' && (
                  <>La evidencia está <span className="font-editorial text-primary">intacta.</span></>
                )}
                {estado === 'roto' && <>La integridad está comprometida.</>}
                {estado === 'revocado' && <>Esta credencial fue revocada.</>}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/46">
                El contenido se recalculó localmente y se contrastó con la prueba registrada en Arbitrum.
              </p>
            </div>
            <VerifiedBadge estado={estado} grande />
          </div>
        </section>

        {estado === 'roto' && (
          <Alert variant="destructive" className="mt-5 rounded-2xl border-destructive/25 bg-danger-soft text-destructive">
            <ShieldAlert className="size-5" />
            <AlertTitle>Se detectó una modificación</AlertTitle>
            <AlertDescription>
              El JSON recibido ya no produce la misma huella criptográfica que la credencial anclada. No confíes en este contenido.
            </AlertDescription>
          </Alert>
        )}

        {!datos || !chequeo ? (
          <div className="mt-6"><SkeletonVerificacion /></div>
        ) : (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[.82fr_1.18fr]">
            <div className="space-y-6">
              {experiencia && (
                <section className="rounded-[1.6rem] border border-white/8 bg-white/[.028] p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Contenido firmado</p>
                    <span className="font-mono text-[10px] text-white/28">TalentPass #{datos.subjectTokenId}</span>
                  </div>
                  <h2 className="mt-7 text-2xl font-semibold tracking-[-0.04em]">{experiencia.program}</h2>
                  <p className="mt-1 text-sm font-medium text-primary">{experiencia.role}</p>
                  <p className="mt-5 text-sm leading-6 text-white/48">{experiencia.contributions}</p>

                  {vc?.credentialSubject?.skills && (
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-white/7 pt-5">
                      {[...(vc.credentialSubject.skills.hard ?? []), ...(vc.credentialSubject.skills.human ?? [])].map((skill) => (
                        <span key={skill} className="rounded-full border border-white/9 bg-white/[.035] px-2.5 py-1.5 text-[11px] text-white/55">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 border-t border-white/7 pt-5">
                    <p className="text-[10px] text-white/30">Emitida por</p>
                    <p className="mt-1 text-xs font-semibold">{datos.issuer.name}</p>
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[.028]">
                <div className="border-b border-white/7 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Tres comprobaciones</p>
                </div>
                <CheckRow icon={Code2} label="Contenido sin alteraciones" detail="Hash local = hash emitido" ok={chequeo.hashCoincide} />
                <CheckRow icon={Fingerprint} label="Inclusión en el lote" detail="Prueba Merkle válida" ok={chequeo.proofValida} />
                <CheckRow icon={FileCheck2} label="Estado de credencial" detail={datos.onChain.revoked ? 'Revocada por el emisor' : 'Activa en el registro'} ok={!datos.onChain.revoked} />
              </section>
            </div>

            <section className="rounded-[1.6rem] border border-white/8 bg-white/[.028] p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Prueba matemática</p>
                  <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">Comparación de huellas</h2>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${valido ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                  {valido ? 'Coinciden' : 'Revisar'}
                </span>
              </div>

              <HashDiffViewer computedHash={chequeo.hashRecomputado} anchoredHash={datos.credentialHash} />

              <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-white/40">Raíz Merkle del lote</span>
                  <span className={`text-[10px] font-semibold ${chequeo.proofValida ? 'text-primary' : 'text-destructive'}`}>
                    {chequeo.proofValida ? 'Prueba válida' : 'Prueba inválida'}
                  </span>
                </div>
                <p className="mt-3 break-all font-mono text-[10px] leading-4 text-white/28">{datos.onChain.merkleRoot ?? 'No disponible'}</p>
              </div>

              {datos.onChain.txHash && (
                <a
                  href={`${ARBISCAN}/tx/${datos.onChain.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group mt-5 flex min-h-12 items-center justify-between rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground transition hover:brightness-110"
                >
                  Ver registro en Arbiscan
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function CheckRow({
  icon: Icon,
  label,
  detail,
  ok,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/7 p-5 last:border-b-0">
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${ok ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">{label}</p>
        <p className="mt-1 text-[10px] text-white/30">{detail}</p>
      </div>
      {ok ? <CheckCircle2 className="size-4 text-primary" /> : <CircleSlash2 className="size-4 text-destructive" />}
    </div>
  );
}

function SkeletonVerificacion() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Skeleton className="h-72 rounded-[1.6rem] bg-white/8" />
      <Skeleton className="h-96 rounded-[1.6rem] bg-white/8" />
    </div>
  );
}
