'use client';

import { credentialHash, leafOf, verifyProof } from '@proofpath/shared';
import { use, useEffect, useState } from 'react';
import { VerifiedBadge, type EstadoVerificacion } from '@/components/verified-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type Verification } from '@/lib/api';

const ARBISCAN = process.env.NEXT_PUBLIC_ARBISCAN_URL ?? 'https://sepolia.arbiscan.io';

interface Chequeo {
  hashRecomputado: string;
  hashCoincide: boolean;
  proofValida: boolean;
}

/**
 * LA PANTALLA DEL BLOQUE 2:00–2:30 (03-DEMO-SCRIPT.md §1).
 *
 * Todo lo que decide el color del badge se calcula AQUI, en el navegador, a
 * partir del JSON que llego por la red:
 *
 *   1. Se recomputa keccak256(canonicalJSON(vc)) con las mismas funciones que usa
 *      el backend y que reproducen la hoja del contrato.
 *   2. Se compara contra el hash anclado en la cadena.
 *   3. Se verifica el Merkle proof contra el root del batch.
 *
 * Por eso editar un caracter de la respuesta en devtools pone el badge en rojo:
 * no hay ningun booleano del servidor decidiendo esto. Si esta pagina confiara en
 * `onChain.verified`, manipular la respuesta no cambiaria nada y el momento mas
 * importante del pitch no ocurriria.
 */
export default function VerificarCredencial({ params }: PageProps<'/verificar/[hash]'>) {
  const { hash } = use(params);

  const [datos, setDatos] = useState<Verification | null>(null);
  const [chequeo, setChequeo] = useState<Chequeo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;

    api
      .verification(hash)
      .then((res) => {
        if (!vigente) return;

        // ── El calculo local. Esto es lo que hace honesta a la pantalla. ──
        const recomputado = credentialHash(res.vc);
        const hashCoincide = recomputado.toLowerCase() === res.credentialHash.toLowerCase();

        const proofValida =
          res.onChain.merkleRoot !== null &&
          verifyProof(
            res.merkleProof as `0x${string}`[],
            res.onChain.merkleRoot as `0x${string}`,
            leafOf(recomputado, BigInt(res.subjectTokenId)),
          );

        setDatos(res);
        setChequeo({ hashRecomputado: recomputado, hashCoincide, proofValida });
      })
      .catch((e) => vigente && setError(e instanceof Error ? e.message : 'No se pudo verificar'));

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
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm font-semibold tracking-widest text-primary uppercase">ProofPath</p>
      <h1 className="mt-2 text-3xl font-bold">Verificación de credencial</h1>

      <div className="my-8">
        <VerifiedBadge estado={estado} grande />
      </div>

      {estado === 'roto' && (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>El contenido no coincide con la cadena</AlertTitle>
          <AlertDescription>
            Alguien alteró esta credencial después de emitirla.
          </AlertDescription>
        </Alert>
      )}

      {!datos && <Skeleton className="mb-6 h-48 w-full" />}

      {datos && experiencia && (
        <Card className="mb-6">
          <CardContent className="space-y-3">
            <Badge variant="secondary">Experiencia</Badge>
            <div>
              <h2 className="text-xl font-bold">{experiencia.program}</h2>
              <p className="text-muted-foreground">{experiencia.role}</p>
            </div>
            <p className="text-sm text-pretty">{experiencia.contributions}</p>

            <p className="text-sm text-muted-foreground">
              Emitida por <strong className="text-foreground">{datos.issuer.name}</strong>
            </p>

            {vc?.credentialSubject?.skills && (
              <div className="flex flex-wrap gap-2">
                {[
                  ...(vc.credentialSubject.skills.hard ?? []),
                  ...(vc.credentialSubject.skills.human ?? []),
                ].map((s) => (
                  <Badge key={s} variant="outline" className="h-auto px-3 py-1 text-sm">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {chequeo && datos && (
        <Card>
          <CardContent className="space-y-4">
            <Badge variant="secondary">Comprobación hecha en este navegador</Badge>

            <dl className="space-y-4 text-sm">
              <Fila
                titulo="Hash recomputado aquí"
                valor={chequeo.hashRecomputado}
                ok={chequeo.hashCoincide}
              />
              <Fila titulo="Hash anclado en la cadena" valor={datos.credentialHash} ok />
              <Fila
                titulo="Merkle proof contra el root del batch"
                valor={datos.onChain.merkleRoot ?? '—'}
                ok={chequeo.proofValida}
              />
            </dl>

            <Separator />

            <p className="text-sm text-pretty text-muted-foreground">
              {chequeo.hashCoincide
                ? 'Los dos hashes coinciden: el contenido es exactamente el que la organización firmó.'
                : 'Los hashes no coinciden. Cambió al menos un carácter del contenido.'}
            </p>

            {datos.onChain.txHash && (
              <a
                href={`${ARBISCAN}/tx/${datos.onChain.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
              >
                Ver en Arbiscan
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function Fila({ titulo, valor, ok }: { titulo: string; valor: string; ok: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-2 font-medium">
        <span className={ok ? 'text-ok' : 'text-destructive'} aria-hidden>
          {ok ? '✓' : '✕'}
        </span>
        {titulo}
      </dt>
      <dd className="mt-1 font-mono text-xs break-all text-muted-foreground">{valor}</dd>
    </div>
  );
}
