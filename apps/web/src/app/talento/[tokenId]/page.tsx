'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { Aviso, Card, Etiqueta } from '@/components/ui';
import { VerifiedBadge } from '@/components/verified-badge';
import { api, type PublicProfile } from '@/lib/api';

const ARBISCAN = process.env.NEXT_PUBLIC_ARBISCAN_URL ?? 'https://sepolia.arbiscan.io';

/** El TalentPass público — bloque 1:30–2:00 de la demo. */
export default function TalentPassPublico({ params }: PageProps<'/talento/[tokenId]'>) {
  const { tokenId } = use(params);

  const [perfil, setPerfil] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .publicProfile(tokenId)
      .then(setPerfil)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil'));
  }, [tokenId]);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Aviso>{error}</Aviso>
      </main>
    );
  }

  if (!perfil) {
    return <main className="p-8 text-muted">Cargando…</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">ProofPath</p>
        <h1 className="mt-2 text-3xl font-bold">{perfil.fullName}</h1>
        <p className="text-muted">
          TalentPass #{perfil.tokenId}
          {perfil.headline ? ` · ${perfil.headline}` : ''}
        </p>
        <div className="mt-4">
          <VerifiedBadge estado={perfil.isVerified ? 'verificado' : 'verificando'} />
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold">Experiencias verificadas</h2>

        {perfil.experiences.length === 0 && (
          <p className="text-sm text-muted">Todavía no tiene credenciales emitidas.</p>
        )}

        <div className="space-y-4">
          {perfil.experiences.map((exp) => (
            <Card key={exp.credentialHash}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{exp.programTitle}</h3>
                  <p className="text-sm text-muted">
                    {exp.role} · {exp.organizationName}
                  </p>
                </div>
                <VerifiedBadge estado={exp.revoked ? 'revocado' : 'verificado'} />
              </div>

              {exp.evidences.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-3">
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

              <div className="mt-4 flex flex-wrap gap-2">
                {[...exp.skills.hard, ...exp.skills.human].map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-background px-3 py-1 text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
                <Link href={`/verificar/${exp.credentialHash}`} className="font-semibold text-brand underline">
                  Verificar esta credencial
                </Link>
                {exp.txHash && (
                  <a
                    href={`${ARBISCAN}/tx/${exp.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted underline"
                  >
                    Ver en Arbiscan
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="text-lg font-bold">Competencias con evidencia</h2>
          <Etiqueta>{perfil.experienceCount} experiencias</Etiqueta>
        </div>

        {/*
          Conteo de evidencias, nunca un puntaje (00-CONTEXT §2.1).
          Prohibido agregar barras, porcentajes, estrellas o niveles aquí.
        */}
        <Card>
          <ul className="space-y-4">
            {perfil.skills.map((skill) => (
              <li key={skill.name}>
                <p className="font-semibold">{skill.name}</p>
                <p className="text-sm text-muted">
                  Demostrada en {skill.experienceCount}{' '}
                  {skill.experienceCount === 1 ? 'experiencia' : 'experiencias'}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {skill.experienceTitles.map((titulo, i) => (
                    <li key={`${skill.name}-${i}`} className="text-sm text-muted">
                      └── {titulo}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>

        <p className="mt-6 text-sm text-muted">
          No calificamos personas. Verificamos experiencias.
        </p>
      </section>
    </main>
  );
}
