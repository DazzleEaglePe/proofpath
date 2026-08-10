import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  applicationName: 'ProofPath',
  title: {
    default: 'ProofPath — Tu experiencia sí cuenta',
    template: '%s · ProofPath',
  },
  description:
    'Convierte voluntariados, proyectos y aprendizajes reales en una historia profesional respaldada por organizaciones y comprensible para empresas.',
  openGraph: {
    title: 'ProofPath — Tu experiencia sí cuenta',
    description:
      'Experiencias reales convertidas en oportunidades profesionales para talento, organizaciones y empresas.',
    type: 'website',
    locale: 'es_PE',
  },
};

// Sin `next/font/google`: las fuentes del sistema evitan una descarga en build y
// un punto de falla menos el dia de la demo. El CLI de shadcn vuelve a agregar
// Geist si se corre `init` de nuevo — hay que sacarlo otra vez.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className="dark h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
