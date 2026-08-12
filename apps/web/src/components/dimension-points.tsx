import type { DimensionPoints, ExperienceCategory } from '@/lib/api';

/**
 * Puntos por dimensión. Ver 00-CONTEXT §2.1 y §2.5.
 *
 * PROHIBIDO agregarle un total, un promedio, una barra sobre un máximo o una
 * comparación con otros perfiles. Sumar horas de reforestación con commits no
 * significa nada, y el número que saliera sería el "vales 900" que ProofPath se
 * niega a producir. Cada oportunidad mira las dimensiones que le importan.
 */

const ETIQUETAS: Record<ExperienceCategory, string> = {
  APRENDIZAJE: 'Aprendizaje',
  IMPACTO_AMBIENTAL: 'Impacto ambiental',
  IMPACTO_SOCIAL: 'Impacto social',
  INNOVACION_TECNOLOGIA: 'Innovación y tecnología',
  LIDERAZGO_COMUNIDAD: 'Liderazgo y comunidad',
  TRAYECTORIA: 'Trayectoria',
};

export function DimensionPointsList({ points }: { points: DimensionPoints[] }) {
  // Sin evidencia no se pintan seis dimensiones en cero: una lista de ceros se
  // lee como un boletín de notas, que es justo lo que esto no es.
  if (points.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[.028]">
      <div className="border-b border-white/7 p-5">
        <p className="text-xs font-semibold">Participación validada</p>
        <p className="mt-0.5 text-[10px] text-white/30">
          Por dimensión. Sin total, sin ranking.
        </p>
      </div>
      <ul className="divide-y divide-white/7">
        {points.map((dimension) => (
          <li
            key={dimension.category}
            className="flex items-center justify-between gap-3 px-5 py-3.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{ETIQUETAS[dimension.category]}</p>
              <p className="mt-0.5 text-[10px] text-white/28">
                {dimension.credentialCount}{' '}
                {dimension.credentialCount === 1 ? 'credencial' : 'credenciales'}
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold text-primary">
              {dimension.points}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
