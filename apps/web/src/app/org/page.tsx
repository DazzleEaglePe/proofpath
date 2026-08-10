'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SkillChip } from '@/components/skill-chip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { api, clearToken, readToken, type IssueResult, type OrgExperience, type OrgProgram } from '@/lib/api';

const ARBISCAN = process.env.NEXT_PUBLIC_ARBISCAN_URL ?? 'https://sepolia.arbiscan.io';

const ESTADO: Record<OrgExperience['status'], { texto: string; variante: 'secondary' | 'outline' | 'default' }> = {
  DRAFT: { texto: 'Sin analizar', variante: 'outline' },
  AI_ANALYZED: { texto: 'Esperando tu confirmación', variante: 'secondary' },
  ORG_CONFIRMED: { texto: 'Lista para emitir', variante: 'default' },
  ISSUED: { texto: 'Credencial emitida', variante: 'secondary' },
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
    void cargar();
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

  const listasParaEmitir = programas
    .flatMap((p) => p.experiences)
    .filter((e) => e.status === 'ORG_CONFIRMED');

  if (cargando) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-10">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">ProofPath</p>
          <h1 className="text-2xl font-bold">{orgName}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearToken();
            router.push('/org/login');
          }}
        >
          Salir
        </Button>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {resultado && <ResultadoEmision resultado={resultado} />}

      {listasParaEmitir.length > 0 && (
        <Card className="mb-8 border-primary/40 bg-brand-soft">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                {listasParaEmitir.length}{' '}
                {listasParaEmitir.length === 1 ? 'experiencia lista' : 'experiencias listas'} para
                emitir
              </p>
              <p className="text-sm text-muted-foreground">
                Se emiten todas en una sola transacción. Con 200 voluntarios sería la misma.
              </p>
            </div>
            <Button
              size="lg"
              disabled={trabajando !== null}
              onClick={() =>
                accion('emitir', async () => {
                  const res = await api.issueBatch(listasParaEmitir.map((e) => e.id));
                  setResultado(res);
                })
              }
            >
              {trabajando === 'emitir' ? 'Emitiendo…' : 'Emitir batch'}
            </Button>
          </CardContent>
        </Card>
      )}

      {programas.map((programa) => (
        <section key={programa.id} className="mb-10">
          <h2 className="text-lg font-bold">{programa.title}</h2>
          <p className="mb-4 text-sm text-pretty text-muted-foreground">{programa.description}</p>

          <div className="space-y-4">
            {programa.experiences.map((exp) => (
              <ExperienciaCard
                key={exp.id}
                exp={exp}
                trabajando={trabajando}
                onAnalizar={() => accion(`ai-${exp.id}`, () => api.extractSkills(exp.id))}
                onAlternar={(skill) =>
                  accion(`skill-${skill.id}`, () =>
                    skill.confirmed
                      ? api.updateSkills(exp.id, { discard: [skill.id] })
                      : api.updateSkills(exp.id, { confirm: [skill.id] }),
                  )
                }
                onConfirmar={() => accion(`ok-${exp.id}`, () => api.confirmExperience(exp.id))}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
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
  const confirmadas = exp.skills.filter((s) => s.confirmed).length;
  const emitida = exp.status === 'ISSUED';
  const estado = ESTADO[exp.status];

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{exp.talentName}</p>
            <p className="text-sm text-muted-foreground">
              {exp.role}
              {exp.hoursCommitted ? ` · ${exp.hoursCommitted} horas` : ''}
              {exp.tokenId ? ` · TalentPass #${exp.tokenId}` : ''}
            </p>
          </div>
          <Badge variant={estado.variante}>{estado.texto}</Badge>
        </div>

        <p className="text-sm text-pretty">{exp.contributions}</p>

        {exp.evidences.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {exp.evidences.map((ev) => (
              <li key={ev.url}>
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline underline-offset-4"
                >
                  {ev.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        {exp.skills.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Todavía no hay skills propuestas.</p>
            <Button variant="outline" onClick={onAnalizar} disabled={trabajando !== null}>
              {trabajando === `ai-${exp.id}` ? 'Analizando…' : 'Analizar con IA'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              La IA propuso {exp.skills.length}. Vos confirmás cuáles son ciertas.
            </p>

            <div className="flex flex-wrap gap-2">
              {exp.skills.map((s) => (
                <SkillChip
                  key={s.id}
                  nombre={s.name}
                  tipo={s.type}
                  confirmada={s.confirmed}
                  disabled={trabajando !== null}
                  onClick={emitida ? undefined : () => onAlternar(s)}
                />
              ))}
            </div>

            {!emitida && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {confirmadas === 0
                    ? 'Confirmá al menos una para poder emitir.'
                    : `${confirmadas} confirmada${confirmadas === 1 ? '' : 's'}.`}
                </p>
                {exp.status !== 'ORG_CONFIRMED' && (
                  <Button onClick={onConfirmar} disabled={confirmadas === 0 || trabajando !== null}>
                    {trabajando === `ok-${exp.id}` ? 'Guardando…' : 'Dar por lista'}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultadoEmision({ resultado }: { resultado: IssueResult }) {
  return (
    <Card className="mb-8 border-ok/40 bg-ok-soft">
      <CardContent className="space-y-4">
        <p className="text-lg font-bold text-ok">
          {resultado.size} credenciales emitidas en una sola transacción
        </p>
        <p className="text-sm break-all text-muted-foreground">
          Merkle root <code className="text-xs">{resultado.merkleRoot}</code>
        </p>

        <a
          href={`${ARBISCAN}/tx/${resultado.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          Ver la transacción en Arbiscan
        </a>

        <ul className="space-y-1 text-sm">
          {resultado.credentials.map((c) => (
            <li key={c.credentialHash}>
              <Link
                href={`/verificar/${c.credentialHash}`}
                className="text-primary underline underline-offset-4"
              >
                Verificar credencial de TalentPass #{c.subjectTokenId}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
