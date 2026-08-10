import { cn } from '@/lib/utils';
import { Brain, Check, Code } from 'lucide-react';

/**
 * Chip de skill. Muestra si está confirmada y su tipo.
 *
 * PROHIBIDO agregarle nivel, porcentaje, barra o estrellas. Ver 00-CONTEXT §2.1.
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
  const IconType = tipo === 'HARD' ? Code : Brain;

  const clases = cn(
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] transition-colors select-none',
    confirmada
      ? 'border-primary/25 bg-primary/10 font-semibold text-primary'
      : 'border-white/9 bg-white/[.035] text-white/42 hover:border-white/16 hover:text-white/65',
    onClick && !disabled && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring outline-none',
    disabled && 'opacity-50 cursor-not-allowed',
  );

  const contenido = (
    <>
      <IconType className="size-3 opacity-65" />
      <span>{nombre}</span>
      {confirmada && <Check className="size-3 text-primary" />}
    </>
  );

  const titulo = `${tipo === 'HUMAN' ? 'Competencia humana' : 'Competencia técnica'}${
    confirmada ? ', confirmada por organización' : ', propuesta por IA'
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
