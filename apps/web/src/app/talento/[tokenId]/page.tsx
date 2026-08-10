'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { VerifiedBadge } from '@/components/verified-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!perfil) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-12">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase">ProofPath</p>
        <h1 className="mt-2 text-3xl font-bold">{perfil.fullName}</h1>
        <p className="text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">Todavía no tiene credenciales emitidas.</p>
        )}

        <div className="space-y-4">
          {perfil.experiences.map((exp) => (
            <Card key={exp.credentialHash}>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{exp.programTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {exp.role} · {exp.organizationName}
                    </p>
                  </div>
                  <VerifiedBadge estado={exp.revoked ? 'revocado' : 'verificado'} />
                </div>

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

                <div className="flex flex-wrap gap-2">
                  {[...exp.skills.hard, ...exp.skills.human].map((s) => (
                    <Badge key={s} variant="outline" className="h-auto px-3 py-1 text-sm">
                      {s}
                    </Badge>
                  ))}
                </div>

                <Separator />

                <div className="flex flex-wrap gap-4 text-sm">
                  <Link
                    href={`/verificar/${exp.credentialHash}`}
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    Verificar esta credencial
                  </Link>
                  {exp.txHash && (
                    <a
                      href={`${ARBISCAN}/tx/${exp.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground underline underline-offset-4"
                    >
                      Ver en Arbiscan
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="text-lg font-bold">Competencias con evidencia</h2>
          <Badge variant="secondary">{perfil.experienceCount} experiencias</Badge>
        </div>

        {/*
          Conteo de evidencias, nunca un puntaje (00-CONTEXT §2.1).
          Prohibido agregar barras, porcentajes, estrellas o niveles aquí.
        */}
        <Card>
          <CardContent>
            <ul className="space-y-4">
              {perfil.skills.map((skill) => (
                <li key={skill.name}>
                  <p className="font-semibold">{skill.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Demostrada en {skill.experienceCount}{' '}
                    {skill.experienceCount === 1 ? 'experiencia' : 'experiencias'}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {skill.experienceTitles.map((titulo, i) => (
                      <li key={`${skill.name}-${i}`} className="text-sm text-muted-foreground/80">
                        └── {titulo}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="mt-6 text-sm text-muted-foreground">
          No calificamos personas. Verificamos experiencias.
        </p>
      </section>
    </main>
  );
}
