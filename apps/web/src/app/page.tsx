import Link from 'next/link';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-4">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase">ProofPath</p>
        <h1 className="text-4xl leading-tight font-bold text-balance sm:text-5xl">
          No todos los jóvenes sin experiencia carecen de experiencia.
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          Muchas veces, su experiencia simplemente no está reconocida como experiencia
          profesional. ProofPath la convierte en evidencia verificable de competencias.
        </p>
      </header>

      <nav className="grid gap-4 sm:grid-cols-2">
        <Link href="/org/login" className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardContent>
              <CardTitle>Soy una organización</CardTitle>
              <CardDescription className="mt-1">
                Revisá las experiencias de tus voluntarios y emití sus credenciales.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/talento/1" className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardContent>
              <CardTitle>Ver un TalentPass</CardTitle>
              <CardDescription className="mt-1">
                El perfil público de un joven, con sus experiencias verificadas.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </nav>

      <p className="text-sm text-muted-foreground">
        No calificamos personas. Verificamos experiencias.
      </p>
    </main>
  );
}
