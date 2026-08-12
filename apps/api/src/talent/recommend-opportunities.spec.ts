import { describe, expect, it } from 'vitest';
import { recommendOpportunities, type OpportunityCandidate } from './recommend-opportunities';

const base: OpportunityCandidate = {
  id: 'op_base',
  title: 'Voluntariado general',
  description: 'Apoyo a la comunidad',
  organizationName: 'ONG Base',
  organizationIsTrusted: true,
  cause: 'Comunidad',
  modality: 'ONSITE',
  location: 'Arequipa',
  weeklyHours: 20,
  applicationDeadline: new Date('2026-10-01T00:00:00Z'),
  requiredSkills: [],
  startDate: new Date('2026-11-01T00:00:00Z'),
  endDate: null,
};

describe('recommendOpportunities', () => {
  it('prioriza coincidencias y solo devuelve razones explicables', () => {
    const result = recommendOpportunities(
      {
        fieldOfStudy: 'Ingeniería de Software',
        city: 'Lima',
        weeklyAvailabilityHours: 10,
        preferredModalities: ['REMOTE'],
        causeInterests: ['Educación'],
        roleInterests: ['desarrollo'],
      },
      ['React', 'TypeScript'],
      [
        base,
        {
          ...base,
          id: 'op_recomendada',
          title: 'Desarrollo para educación',
          description: 'Construye una plataforma educativa',
          cause: 'Educación',
          modality: 'REMOTE',
          location: 'Remoto',
          weeklyHours: 8,
          requiredSkills: ['React'],
        },
      ],
    );

    expect(result[0].id).toBe('op_recomendada');
    expect(result[0].recommendationReasons).toContain(
      'Conecta con tu interés en Educación',
    );
    expect(result[0]).not.toHaveProperty('rank');
    expect(result[0]).not.toHaveProperty('score');
  });
});
