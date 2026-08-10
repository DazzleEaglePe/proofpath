export type EstadoVerificacion = 'verificando' | 'verificado' | 'roto' | 'revocado';

const ESTILOS: Record<EstadoVerificacion, { fondo: string; texto: string; punto: string }> = {
  verificando: { fondo: 'bg-border/40', texto: 'text-muted', punto: 'bg-muted animate-pulse' },
  verificado: { fondo: 'bg-ok-soft', texto: 'text-ok', punto: 'bg-ok' },
  roto: { fondo: 'bg-danger-soft', texto: 'text-danger', punto: 'bg-danger' },
  revocado: { fondo: 'bg-danger-soft', texto: 'text-danger', punto: 'bg-danger' },
};

const ETIQUETAS: Record<EstadoVerificacion, string> = {
  verificando: 'Verificando…',
  verificado: 'Verificado en Arbitrum',
  roto: 'La evidencia fue alterada',
  revocado: 'Credencial revocada',
};

/**
 * Un solo componente con estados, no dos badges distintos (05-IOS-ARCHITECTURE §8).
 *
 * Es el elemento mas importante de la demo: tiene que leerse desde el fondo de
 * la sala, asi que el tamaño grande usa texto de 20px y un punto de color de 12px.
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
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${e.fondo} ${e.texto} ${
        grande ? 'px-5 py-2.5 text-xl' : 'px-3 py-1 text-sm'
      }`}
    >
      <span className={`rounded-full ${e.punto} ${grande ? 'h-3 w-3' : 'h-2 w-2'}`} />
      {ETIQUETAS[estado]}
    </span>
  );
}
