'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, KeyRound, Mail } from 'lucide-react';
import { Brand, NetworkPill } from '@/components/brand';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, saveToken } from '@/lib/api';

export default function OrgLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('contacto@impulsojoven.org');
  const [password, setPassword] = useState('impulsojoven2026');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { token } = await api.orgLogin(email, password);
      saveToken(token);
      router.push('/org');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      setCargando(false);
    }
  }

  function cargarDemo() {
    setEmail('contacto@impulsojoven.org');
    setPassword('impulsojoven2026');
  }

  return (
    <main className="app-canvas grid min-h-dvh lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-dvh flex-col justify-between overflow-hidden border-r border-white/8 p-10 lg:flex xl:p-14">
        <Brand />

        <div className="relative z-10 max-w-xl">
          {/* <div className="mb-7 grid size-12 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div> */}
          <h1 className="text-5xl font-medium leading-[.98] tracking-[-0.06em] text-white xl:text-6xl">
            Confirma lo que el talento
            <span className="font-editorial block text-primary">ya demostró.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/50">
            Revisa las competencias sugeridas, conéctalas con evidencia y emite credenciales verificables en
            una sola operación.
          </p>
          <ul className="mt-9 grid gap-3 text-sm text-white/70">
            {['IA como asistente, decisión humana', 'Emisión masiva y trazable', 'Sin datos personales en cadena'].map(
              (item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid size-5 place-items-center rounded-full bg-primary/12 text-primary">
                    <Check className="size-3" />
                  </span>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="flex items-center justify-between text-xs text-white/30">
          <span>Portal para organizaciones</span>
          <NetworkPill />
        </div>
      </section>

      <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <Brand className="lg:hidden" />
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-white/45 transition hover:text-white">
            <ArrowLeft className="size-3.5" /> Volver al inicio
          </Link>
        </div>

        <div className="my-auto w-full max-w-md self-center py-16">
          {/* <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Bienvenido de nuevo</p> */}
          <h2 className="mt-4 text-4xl font-medium tracking-[-0.05em] text-white">Bienvenid@ de vuelta</h2>
          <p className="mt-3 text-sm leading-6 text-white/45">Ingresa para revisar las experiencias de tu organización.</p>

          <form onSubmit={entrar} className="mt-9 space-y-5">
            <label className="block space-y-2" htmlFor="email">
              <span className="text-xs font-medium text-white/65">Correo institucional</span>
              <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 transition focus-within:border-primary/45 focus-within:bg-primary/[.035]">
                <Mail className="size-4 text-white/30" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="min-h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </span>
            </label>

            <label className="block space-y-2" htmlFor="password">
              <span className="text-xs font-medium text-white/65">Contraseña</span>
              <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 transition focus-within:border-primary/45 focus-within:bg-primary/[.035]">
                <KeyRound className="size-4 text-white/30" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="min-h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </span>
            </label>

            {error && (
              <Alert variant="destructive" className="rounded-2xl border-destructive/25 bg-danger-soft text-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-55"
            >
              {cargando ? 'Validando acceso…' : 'Entrar al portal'}
              {/* {!cargando && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />} */}
            </button>
          </form>

          {/* <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[.02] p-4 text-center">
            <p className="text-[11px] text-white/35">¿Estás evaluando la plataforma?</p>
            <button onClick={cargarDemo} type="button" className="mt-1 text-xs font-semibold text-primary hover:underline">
              Cargar acceso de demostración
            </button>
          </div> */}
        </div>
      </section>
    </main>
  );
}
