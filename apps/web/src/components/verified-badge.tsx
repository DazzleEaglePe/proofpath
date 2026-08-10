import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, ShieldAlert, LoaderCircle } from 'lucide-react';

export type EstadoVerificacion = 'verificando' | 'verificado' | 'roto' | 'revocado';

const CONFIG: Record<
  EstadoVerificacion,
  { variante: 'secondary' | 'outline' | 'destructive' | 'default'; icon: React.ComponentType<{ className?: string }>; estilo: string }
> = {
  verificando: {
    variante: 'outline',
    icon: LoaderCircle,
    estilo: 'border-white/10 bg-white/5 text-white/55',
  },
  verificado: {
    variante: 'secondary',
    icon: CheckCircle2,
    estilo: 'border-primary/25 bg-primary/10 text-primary font-semibold',
  },
  roto: {
    variante: 'destructive',
    icon: ShieldAlert,
    estilo: 'border-destructive/30 bg-destructive/12 text-destructive font-bold',
  },
  revocado: {
    variante: 'destructive',
    icon: AlertTriangle,
    estilo: 'border-destructive/25 bg-destructive/10 text-destructive',
  },
};

const ETIQUETAS: Record<EstadoVerificacion, string> = {
  verificando: 'Verificando…',
  verificado: 'Verificado · Arbitrum',
  roto: 'Integridad comprometida',
  revocado: 'Credencial revocada',
};

export function VerifiedBadge({
  estado,
  grande = false,
}: {
  estado: EstadoVerificacion;
  grande?: boolean;
}) {
  const cfg = CONFIG[estado];
  const Icon = cfg.icon;

  return (
    <Badge
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex shrink-0 items-center gap-2 border font-medium transition-colors',
        cfg.estilo,
        grande ? 'h-auto rounded-full px-4 py-2.5 text-sm' : 'h-auto rounded-full px-2.5 py-1.5 text-[10px]',
      )}
    >
      <Icon className={cn(grande ? 'size-5' : 'size-3.5', estado === 'verificando' && 'animate-spin')} />
      <span>{ETIQUETAS[estado]}</span>
    </Badge>
  );
}
