import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">ProofPath</p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          No todos los jóvenes sin experiencia carecen de experiencia.
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          Muchas veces, su experiencia simplemente no está reconocida como experiencia
          profesional. ProofPath la convierte en evidencia verificable de competencias.
        </p>
      </header>

      <nav className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/org/login"
          className="rounded-xl border border-border bg-surface p-5 transition hover:border-brand"
        >
          <p className="font-semibold">Soy una organización</p>
          <p className="mt-1 text-sm text-muted">
            Revisá las experiencias de tus voluntarios y emití sus credenciales.
          </p>
        </Link>

        <Link
          href="/talento/1"
          className="rounded-xl border border-border bg-surface p-5 transition hover:border-brand"
        >
          <p className="font-semibold">Ver un TalentPass</p>
          <p className="mt-1 text-sm text-muted">
            El perfil público de un joven, con sus experiencias verificadas.
          </p>
        </Link>
      </nav>

      <p className="text-sm text-muted">
        No calificamos personas. Verificamos experiencias.
      </p>
    </main>
  );
}
