import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type EstadoVerificacion = 'verificando' | 'verificado' | 'roto' | 'revocado';

const ESTILOS: Record<EstadoVerificacion, { caja: string; punto: string }> = {
  verificando: { caja: 'bg-muted text-muted-foreground', punto: 'bg-muted-foreground animate-pulse' },
  verificado: { caja: 'bg-ok-soft text-ok', punto: 'bg-ok' },
  roto: { caja: 'bg-danger-soft text-destructive', punto: 'bg-destructive' },
  revocado: { caja: 'bg-danger-soft text-destructive', punto: 'bg-destructive' },
};

const ETIQUETAS: Record<EstadoVerificacion, string> = {
  verificando: 'Verificando…',
  verificado: 'Verificado en Arbitrum',
  roto: 'La evidencia fue alterada',
  revocado: 'Credencial revocada',
};

/**
 * Un solo componente con estados, no dos badges distintos.
 *
 * Es el elemento mas importante de la demo: el tamaño `grande` existe para que
 * el cambio de verde a rojo se lea desde el fondo de la sala, con proyector.
 */
export function VerifiedBadge({
  estado,
  grande = false,
}: {
  estado: EstadoVerificacion;
  grande?: boolean;
}) {
  const e = ESTILOS[estado];

  return (
    <Badge
      role="status"
      aria-live="polite"
      className={cn(
        'gap-2 font-semibold',
        e.caja,
        grande ? 'h-auto px-5 py-2.5 text-xl' : 'h-auto px-3 py-1 text-sm',
      )}
    >
      <span className={cn('rounded-full', e.punto, grande ? 'size-3' : 'size-2')} />
      {ETIQUETAS[estado]}
    </Badge>
  );
}
