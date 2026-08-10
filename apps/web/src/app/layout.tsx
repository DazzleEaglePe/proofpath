import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProofPath',
  description:
    'Experiencias reales previas al primer empleo convertidas en evidencia verificable de competencias.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
