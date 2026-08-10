import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-5 ${className}`}>{children}</div>
  );
}

export function Boton({
  children,
  onClick,
  variante = 'primario',
  disabled,
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: 'primario' | 'secundario';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
  const estilo =
    variante === 'primario'
      ? 'bg-brand text-white hover:opacity-90'
      : 'border border-border bg-surface text-foreground hover:bg-background';

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${estilo} ${className}`}>
      {children}
    </button>
  );
}

/**
 * Chip de skill. Muestra si esta confirmada y quien la propuso.
 *
 * PROHIBIDO agregarle nivel, porcentaje, barra o estrellas. Ver 00-CONTEXT §2.1.
 */
export function SkillChip({
  nombre,
  tipo,
  confirmada,
  onClick,
}: {
  nombre: string;
  tipo: 'HARD' | 'HUMAN';
  confirmada: boolean;
  onClick?: () => void;
}) {
  const Elemento = onClick ? 'button' : 'span';

  return (
    <Elemento
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        confirmada
          ? 'border-ok/40 bg-ok-soft text-ok font-medium'
          : 'border-border bg-background text-muted'
      } ${onClick ? 'cursor-pointer hover:border-ok' : ''}`}
      title={tipo === 'HUMAN' ? 'Competencia humana' : 'Competencia técnica'}
    >
      {confirmada ? '✓' : '○'} {nombre}
    </Elemento>
  );
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-background px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </span>
  );
}

export function Aviso({ children, tipo = 'error' }: { children: ReactNode; tipo?: 'error' | 'info' }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        tipo === 'error'
          ? 'border-danger/30 bg-danger-soft text-danger'
          : 'border-brand/30 bg-brand-soft text-brand'
      }`}
    >
      {children}
    </div>
  );
}
