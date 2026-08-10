import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProofPath',
  description:
    'Experiencias reales previas al primer empleo convertidas en evidencia verificable de competencias.',
};

// Sin `next/font/google`: las fuentes del sistema evitan una descarga en build y
// un punto de falla menos el dia de la demo. El CLI de shadcn vuelve a agregar
// Geist si se corre `init` de nuevo — hay que sacarlo otra vez.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
