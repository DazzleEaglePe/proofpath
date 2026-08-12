import { Check, Clock, Target } from 'lucide-react';
import type { RouteProgress } from '@/lib/api';

/**
 * Una ruta: el camino hacia UNA oportunidad concreta, con sus requisitos
 * publicados de antemano. Ver 00-CONTEXT §2.5.
 *
 * Lo que NO se pinta aquí es tan importante como lo que sí: no hay porcentaje,
 * no hay nivel, no hay comparación con nadie. El "2 de 4" mide la ruta, no a la
 * persona, y cambia si la convocatoria cambia sus requisitos.
 */
export function RouteCard({ ruta }: { ruta: RouteProgress }) {
  const { progress } = ruta;
  const faltan = progress.totalCount - progress.metCount;

  return (
    <article className="rounded-[1.6rem] border border-white/8 bg-white/[.028] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-[-0.025em]">{ruta.title}</h3>
          <p className="mt-1 text-xs text-white/42">{ruta.organizationName}</p>
        </div>
        {ruta.closesAt && <CierreConvocatoria closesAt={ruta.closesAt} />}
      </div>

      <ol className="mt-6 space-y-3">
        {progress.milestones.map((hito) => (
          <li key={hito.id} className="flex items-start gap-3">
            <EstadoHito state={hito.state} />
            <div className="min-w-0 flex-1">
              <p
                className={
                  hito.state === 'MET'
                    ? 'text-sm text-white/88'
                    : 'text-sm text-white/45'
                }
              >
                {hito.title}
              </p>
              <p className="mt-0.5 text-[11px] text-white/30">{hito.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/7 pt-4">
        <p className="text-xs font-semibold text-white/62">
          {progress.metCount} de {progress.totalCount} requisitos
        </p>
        {progress.isComplete ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Check className="size-3.5" /> Cumple todos los requisitos
          </p>
        ) : (
          <p className="text-[11px] text-white/32">
            {faltan === 1 ? 'Falta 1 evidencia' : `Faltan ${faltan} evidencias`}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Tres estados y ninguno dice "fallado". Una ruta sin terminar no es un
 * suspenso: es un camino en curso.
 */
function EstadoHito({ state }: { state: 'MET' | 'IN_REVIEW' | 'PENDING' }) {
  if (state === 'MET') {
    return (
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-3" />
      </span>
    );
  }
  if (state === 'IN_REVIEW') {
    return (
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-primary/40 text-primary">
        <Clock className="size-3" />
      </span>
    );
  }
  return <span className="mt-0.5 size-5 shrink-0 rounded-full border border-white/15" />;
}

/**
 * Los días restantes se calculan en el cliente a propósito: si se renderizaran
 * en el servidor, la página cacheada mostraría un plazo vencido como vigente.
 */
function CierreConvocatoria({ closesAt }: { closesAt: string }) {
  const dias = Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86_400_000);

  if (dias < 0) {
    return (
      <span className="shrink-0 rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-semibold text-white/38">
        Convocatoria cerrada
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
      <Target className="size-3" />
      {dias === 0 ? 'Cierra hoy' : dias === 1 ? 'Cierra mañana' : `Cierra en ${dias} días`}
    </span>
  );
}
