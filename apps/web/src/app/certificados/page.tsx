'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, ArrowLeft, FileUp, Loader2, Sparkles } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, type CertificateProposal, type ExperienceCategory } from '@/lib/api';

const ETIQUETAS: Record<ExperienceCategory, string> = {
  APRENDIZAJE: 'Aprendizaje',
  IMPACTO_AMBIENTAL: 'Impacto ambiental',
  IMPACTO_SOCIAL: 'Impacto social',
  INNOVACION_TECNOLOGIA: 'Innovación y tecnología',
  LIDERAZGO_COMUNIDAD: 'Liderazgo y comunidad',
  TRAYECTORIA: 'Trayectoria',
};

/**
 * Sube un certificado y mira cómo lo clasifica el sistema.
 *
 * No guarda nada y no pide sesión: es un banco de pruebas del lector. Todo lo
 * que sale de aquí es una PROPUESTA — la credencial solo existe cuando un
 * emisor autorizado la firma (00-CONTEXT §2.2). La pantalla lo dice en voz
 * alta, y no por escrúpulo: si alguien cree que esto ya lo certifica, el
 * producto entero pierde sentido.
 */
export default function CertificadosPage() {
  const [texto, setTexto] = useState('');
  const [skillsDeclaradas, setSkillsDeclaradas] = useState('');
  const [propuesta, setPropuesta] = useState<CertificateProposal | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const declaredSkills = skillsDeclaradas
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  async function analizar(input: { text?: string; pdfBase64?: string }) {
    setCargando(true);
    setError(null);
    setPropuesta(null);
    try {
      setPropuesta(await api.proposeCertificate({ ...input, declaredSkills }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo analizar el certificado');
    } finally {
      setCargando(false);
    }
  }

  async function alSubirArchivo(file: File) {
    if (file.type === 'application/pdf') {
      // Se manda en base64 porque el PDF lo lee el servidor: hacerlo en el
      // navegador obligaría a cargar un parser entero en el bundle.
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binario = '';
      for (const byte of bytes) binario += String.fromCharCode(byte);
      await analizar({ pdfBase64: btoa(binario) });
      return;
    }
    const contenido = await file.text();
    setTexto(contenido);
    await analizar({ text: contenido });
  }

  return (
    <main className="app-canvas min-h-dvh pb-20 text-white">
      <header className="border-b border-white/8 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-5 py-4 sm:px-8">
          <Brand />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/38 transition hover:text-white"
        >
          <ArrowLeft className="size-3.5" /> Volver al inicio
        </Link>

        <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em] sm:text-5xl">
          Sube un certificado
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">
          El sistema lee el texto, propone la categoría y normaliza las competencias.
          No guarda nada.
        </p>

        <Alert className="mt-6 rounded-2xl border-primary/25 bg-primary/8">
          <AlertDescription className="text-xs leading-5 text-white/70">
            <strong className="text-primary">Esto propone, no verifica.</strong> Leer un
            PDF no lo vuelve cierto — cualquiera puede editarlo. La credencial existe solo
            cuando una organización autorizada la firma.
          </AlertDescription>
        </Alert>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-white/62" htmlFor="texto">
              Pega el texto del certificado
            </label>
            <textarea
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={12}
              placeholder={
                'CERTIFICADO\n\nSe certifica que Ana Rojas participó en la Olimpiada de Matemática...\n\nDuración: 40 horas\nFecha: 12 de agosto de 2026'
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[.03] p-4 font-mono text-xs leading-5 text-white/85 outline-none transition placeholder:text-white/22 focus:border-primary/45"
            />

            <label className="mt-5 block text-xs font-semibold text-white/62" htmlFor="skills">
              Competencias que crees haber adquirido{' '}
              <span className="font-normal text-white/32">(separadas por coma)</span>
            </label>
            <input
              id="skills"
              value={skillsDeclaradas}
              onChange={(e) => setSkillsDeclaradas(e.target.value)}
              placeholder="React.js, trabajo en equipo, matemática"
              className="mt-2 min-h-11 w-full rounded-full border border-white/10 bg-white/[.03] px-4 text-sm text-white/85 outline-none transition placeholder:text-white/22 focus:border-primary/45"
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={cargando || texto.trim().length === 0}
                onClick={() => void analizar({ text: texto })}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-35"
              >
                {cargando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Analizar
              </button>

              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                <FileUp className="size-4 text-primary" />
                Subir PDF o .txt
                <input
                  type="file"
                  accept=".pdf,.txt,text/plain,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void alSubirArchivo(file);
                  }}
                />
              </label>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="mt-5 rounded-2xl border-destructive/25 bg-danger-soft"
              >
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            {propuesta ? (
              <Resultado propuesta={propuesta} />
            ) : (
              <div className="grid min-h-72 place-items-center rounded-[1.6rem] border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
                La propuesta aparecerá acá.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Resultado({ propuesta }: { propuesta: CertificateProposal }) {
  const { fields, categories, skills, unmatchedSkills } = propuesta;

  return (
    <div className="space-y-4">
      <Bloque titulo="Categoría propuesta">
        {categories.length === 0 ? (
          <p className="text-xs text-white/35">
            Sin clasificar — no reconocimos el tipo de experiencia.
          </p>
        ) : (
          <div className="space-y-2.5">
            {categories.map((guess) => (
              <div key={guess.category} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">{ETIQUETAS[guess.category]}</p>
                  <p className="mt-0.5 truncate text-[10px] text-white/28">
                    por: {guess.matchedTerms.join(', ')}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-primary">
                  {Math.round(guess.confidence * 100)}%
                </span>
              </div>
            ))}
            <p className="pt-1 text-[10px] text-white/28">
              Confianza sobre el documento, no sobre la persona.
            </p>
          </div>
        )}
      </Bloque>

      <Bloque titulo="Competencias reconocidas">
        {skills.length === 0 ? (
          <p className="text-xs text-white/35">Ninguna reconocida en este texto.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.skillId}
                title={`${skill.skillId}\ndetectada por: ${skill.matchedFrom.join(', ')}`}
                className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
              >
                {skill.label}
                <span className="font-mono text-[9px] font-normal opacity-55">
                  {skill.skillId.slice(0, 8)}
                </span>
              </span>
            ))}
          </div>
        )}

        {unmatchedSkills.length > 0 && (
          <div className="mt-4 border-t border-white/7 pt-3">
            <p className="text-[10px] text-white/32">
              Sin normalizar — quedan como texto libre para que el emisor decida:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {unmatchedSkills.map((texto) => (
                <span
                  key={texto}
                  className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-white/45"
                >
                  {texto}
                </span>
              ))}
            </div>
          </div>
        )}
      </Bloque>

      <Bloque titulo="Datos leídos">
        <dl className="space-y-2 text-xs">
          <Campo etiqueta="Titular" valor={fields.holderName} />
          <Campo etiqueta="Emisor" valor={fields.issuerName} />
          <Campo etiqueta="Título" valor={fields.title} />
          <Campo etiqueta="Fecha" valor={fields.issuedOn} />
          <Campo etiqueta="Horas" valor={fields.hours?.toString() ?? null} />
          <Campo etiqueta="Código" valor={fields.verificationCode} />
        </dl>
      </Bloque>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[.06] p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-5 text-white/62">
          Nivel de verificación:{' '}
          <strong className="text-amber-400">declarado por la persona</strong>. Nadie ha
          confirmado este certificado todavía.
        </p>
      </div>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.6rem] border border-white/8 bg-white/[.028] p-5">
      <h2 className="mb-3.5 text-xs font-semibold text-white/62">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-white/32">{etiqueta}</dt>
      <dd className={valor ? 'text-right text-white/85' : 'text-right text-white/22'}>
        {valor ?? 'no encontrado'}
      </dd>
    </div>
  );
}
