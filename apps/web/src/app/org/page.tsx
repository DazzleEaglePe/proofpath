'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Aviso, Boton, Card, Etiqueta, SkillChip } from '@/components/ui';
import { api, clearToken, readToken, type IssueResult, type OrgExperience, type OrgProgram } from '@/lib/api';

const ARBISCAN = process.env.NEXT_PUBLIC_ARBISCAN_URL ?? 'https://sepolia.arbiscan.io';

const ETIQUETA_ESTADO: Record<OrgExperience['status'], string> = {
  DRAFT: 'Sin analizar',
  AI_ANALYZED: 'Esperando tu confirmación',
  ORG_CONFIRMED: 'Lista para emitir',
  ISSUED: 'Credencial emitida',
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
    return <main className="p-8 text-muted">Cargando…</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">ProofPath</p>
          <h1 className="text-2xl font-bold">{orgName}</h1>
        </div>
        <button
          onClick={() => {
            clearToken();
            router.push('/org/login');
          }}
          className="text-sm text-muted underline"
        >
          Salir
        </button>
      </header>

      {error && (
        <div className="mb-6">
          <Aviso>{error}</Aviso>
        </div>
      )}

      {resultado && <ResultadoEmision resultado={resultado} />}

      {listasParaEmitir.length > 0 && (
        <Card className="mb-8 border-brand/40 bg-brand-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                {listasParaEmitir.length}{' '}
                {listasParaEmitir.length === 1 ? 'experiencia lista' : 'experiencias listas'} para emitir
              </p>
              <p className="text-sm text-muted">
                Se emiten todas en una sola transacción. Con 200 voluntarios sería la misma.
              </p>
            </div>
            <Boton
              disabled={trabajando !== null}
              onClick={() =>
                accion('emitir', async () => {
                  const res = await api.issueBatch(listasParaEmitir.map((e) => e.id));
                  setResultado(res);
                })
              }
            >
              {trabajando === 'emitir' ? 'Emitiendo…' : 'Emitir batch'}
            </Boton>
          </div>
        </Card>
      )}

      {programas.map((programa) => (
        <section key={programa.id} className="mb-10">
          <h2 className="text-lg font-bold">{programa.title}</h2>
          <p className="mb-4 text-sm text-muted">{programa.description}</p>

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

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{exp.talentName}</p>
          <p className="text-sm text-muted">
            {exp.role}
            {exp.hoursCommitted ? ` · ${exp.hoursCommitted} horas` : ''}
            {exp.tokenId ? ` · TalentPass #${exp.tokenId}` : ''}
          </p>
        </div>
        <Etiqueta>{ETIQUETA_ESTADO[exp.status]}</Etiqueta>
      </div>

      <p className="mt-3 text-sm">{exp.contributions}</p>

      {exp.evidences.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {exp.evidences.map((ev) => (
            <li key={ev.url}>
              <a
                href={ev.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand underline"
              >
                {ev.label}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-border pt-4">
        {exp.skills.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Todavía no hay skills propuestas.</p>
            <Boton variante="secundario" onClick={onAnalizar} disabled={trabajando !== null}>
              {trabajando === `ai-${exp.id}` ? 'Analizando…' : 'Analizar con IA'}
            </Boton>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium">
              La IA propuso {exp.skills.length}. Vos confirmás cuáles son ciertas.
            </p>
            <div className="flex flex-wrap gap-2">
              {exp.skills.map((s) => (
                <SkillChip
                  key={s.id}
                  nombre={s.name}
                  tipo={s.type}
                  confirmada={s.confirmed}
                  onClick={emitida ? undefined : () => onAlternar(s)}
                />
              ))}
            </div>

            {!emitida && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {confirmadas === 0
                    ? 'Confirmá al menos una para poder emitir.'
                    : `${confirmadas} confirmada${confirmadas === 1 ? '' : 's'}.`}
                </p>
                {exp.status !== 'ORG_CONFIRMED' && (
                  <Boton onClick={onConfirmar} disabled={confirmadas === 0 || trabajando !== null}>
                    {trabajando === `ok-${exp.id}` ? 'Guardando…' : 'Dar por lista'}
                  </Boton>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function ResultadoEmision({ resultado }: { resultado: IssueResult }) {
  return (
    <Card className="mb-8 border-ok/40 bg-ok-soft">
      <p className="text-lg font-bold text-ok">
        {resultado.size} credenciales emitidas en una sola transacción
      </p>
      <p className="mt-1 text-sm text-muted">
        Merkle root <code className="text-xs">{resultado.merkleRoot}</code>
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`${ARBISCAN}/tx/${resultado.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-brand underline"
        >
          Ver la transacción en Arbiscan
        </a>
      </div>

      <ul className="mt-4 space-y-1 text-sm">
        {resultado.credentials.map((c) => (
          <li key={c.credentialHash}>
            <Link href={`/verificar/${c.credentialHash}`} className="text-brand underline">
              Verificar credencial de TalentPass #{c.subjectTokenId}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
