import { cn } from '@/lib/utils';

/**
 * Chip de skill. Muestra si esta confirmada y nada mas.
 *
 * PROHIBIDO agregarle nivel, porcentaje, barra o estrellas. Ver 00-CONTEXT §2.1.
 * Si alguien propone un `<Progress>` aca, la respuesta es no.
 */
export function SkillChip({
  nombre,
  tipo,
  confirmada,
  onClick,
  disabled,
}: {
  nombre: string;
  tipo: 'HARD' | 'HUMAN';
  confirmada: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const clases = cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
    confirmada
      ? 'border-ok/40 bg-ok-soft font-medium text-ok'
      : 'border-border bg-muted text-muted-foreground',
    onClick && !disabled && 'cursor-pointer hover:border-ok focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
    disabled && 'opacity-60',
  );

  const contenido = (
    <>
      <span aria-hidden>{confirmada ? '✓' : '○'}</span>
      {nombre}
    </>
  );

  const titulo = `${tipo === 'HUMAN' ? 'Competencia humana' : 'Competencia técnica'}${
    confirmada ? ', confirmada' : ', propuesta por la IA'
  }`;

  if (!onClick) {
    return (
      <span className={clases} title={titulo}>
        {contenido}
      </span>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={clases} title={titulo}>
      {contenido}
    </button>
  );
}
