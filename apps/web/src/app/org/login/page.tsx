'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Aviso, Boton, Card } from '@/components/ui';
import { api, saveToken } from '@/lib/api';

export default function OrgLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('contacto@impulsojoven.org');
  const [password, setPassword] = useState('impulsojoven2026');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Card>
        <h1 className="text-2xl font-bold">Ingreso de organizaciones</h1>
        <p className="mt-1 text-sm text-muted">
          Revisá las experiencias de tus voluntarios y emití sus credenciales.
        </p>

        <form onSubmit={entrar} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>

          {error && <Aviso>{error}</Aviso>}

          <Boton type="submit" disabled={cargando} className="w-full">
            {cargando ? 'Entrando…' : 'Entrar'}
          </Boton>
        </form>
      </Card>
    </main>
  );
}
