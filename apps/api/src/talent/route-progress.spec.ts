import { describe, expect, it } from 'vitest';
import {
  computeRouteProgress,
  type RouteMilestoneSpec,
  type TalentEvidence,
} from './route-progress';

const hitos: RouteMilestoneSpec[] = [
  {
    id: 'ms_aprendizaje',
    order: 1,
    title: 'Aprendizaje en datos o IA',
    kind: 'CREDENTIAL_IN_CATEGORY',
    category: 'APRENDIZAJE',
    skillName: null,
    requiredHours: null,
  },
  {
    id: 'ms_ambiental',
    order: 2,
    title: 'Impacto ambiental verificado',
    kind: 'CREDENTIAL_IN_CATEGORY',
    category: 'IMPACTO_AMBIENTAL',
    skillName: null,
    requiredHours: null,
  },
  {
    id: 'ms_horas',
    order: 3,
    title: '60 horas de trabajo en campo',
    kind: 'HOURS_ACCUMULATED',
    category: null,
    skillName: null,
    requiredHours: 60,
  },
];

const vacio: TalentEvidence = { issued: [], pending: [] };

describe('computeRouteProgress', () => {
  it('sin evidencia, nada esta cumplido y el siguiente paso es el primer hito', () => {
    const progreso = computeRouteProgress(hitos, vacio);

    expect(progreso.metCount).toBe(0);
    expect(progreso.totalCount).toBe(3);
    expect(progreso.isComplete).toBe(false);
    expect(progreso.nextStep).toBe('Aprendizaje en datos o IA');
  });

  it('una credencial vigente cumple su hito y nombra al emisor', () => {
    const progreso = computeRouteProgress(hitos, {
      issued: [
        {
          category: 'APRENDIZAJE',
          skills: ['Python'],
          hours: 20,
          organizationName: 'UNALM',
          revoked: false,
        },
      ],
      pending: [],
    });

    expect(progreso.metCount).toBe(1);
    expect(progreso.milestones[0].state).toBe('MET');
    expect(progreso.milestones[0].detail).toBe('UNALM · vigente');
    // El siguiente paso salta el cumplido y apunta al primero accionable.
    expect(progreso.nextStep).toBe('Impacto ambiental verificado');
  });

  it('una credencial revocada deja de sostener el hito: la ruta retrocede', () => {
    const progreso = computeRouteProgress(hitos, {
      issued: [
        {
          category: 'APRENDIZAJE',
          skills: [],
          hours: 90,
          organizationName: 'UNALM',
          revoked: true,
        },
      ],
      pending: [],
    });

    expect(progreso.metCount).toBe(0);
    expect(progreso.milestones[0].state).toBe('PENDING');
    // Y sus horas tampoco cuentan.
    expect(progreso.milestones[2].detail).toBe('llevas 0 de 60');
  });

  it('una experiencia sin emitir marca "en revision", no cumple', () => {
    const progreso = computeRouteProgress(hitos, {
      issued: [],
      pending: [{ category: 'IMPACTO_AMBIENTAL', skills: [] }],
    });

    expect(progreso.metCount).toBe(0);
    expect(progreso.milestones[1].state).toBe('IN_REVIEW');
    expect(progreso.milestones[1].detail).toBe('1 experiencia en revisión');
    // Lo que ya esta en revision no es accionable: la pelota la tiene la ONG.
    expect(progreso.nextStep).toBe('Aprendizaje en datos o IA');
  });

  it('las horas suman solo las de credenciales vigentes', () => {
    const progreso = computeRouteProgress(hitos, {
      issued: [
        {
          category: 'APRENDIZAJE',
          skills: [],
          hours: 38,
          organizationName: 'UNALM',
          revoked: false,
        },
        {
          category: 'IMPACTO_AMBIENTAL',
          skills: [],
          hours: 25,
          organizationName: 'ONG Kausay',
          revoked: false,
        },
      ],
      pending: [],
    });

    expect(progreso.milestones[2].state).toBe('MET');
    expect(progreso.milestones[2].detail).toBe('63 horas verificadas');
    expect(progreso.isComplete).toBe(true);
    expect(progreso.nextStep).toBeNull();
  });

  it('las categorias comparan por enum de forma exacta', () => {
    const progreso = computeRouteProgress(hitos, {
      issued: [
        {
          category: 'IMPACTO_AMBIENTAL',
          skills: [],
          hours: null,
          organizationName: 'ONG Kausay',
          revoked: false,
        },
      ],
      pending: [],
    });

    expect(progreso.milestones[1].state).toBe('MET');
  });

  it('un hito de skill se cumple con la skill confirmada en una credencial', () => {
    const progreso = computeRouteProgress(
      [
        {
          id: 'ms_skill',
          order: 1,
          title: 'Analisis de datos',
          kind: 'SKILL_CONFIRMED',
          category: null,
          skillName: 'Análisis de datos',
          requiredHours: null,
        },
      ],
      {
        issued: [
          {
            category: 'APRENDIZAJE',
            skills: ['analisis de datos'],
            hours: null,
            organizationName: 'UNALM',
            revoked: false,
          },
        ],
        pending: [],
      },
    );

    expect(progreso.milestones[0].state).toBe('MET');
    expect(progreso.milestones[0].detail).toBe('confirmada por UNALM');
  });

  // 00-CONTEXT §2.1 y §2.5: la ruta mide la ruta, nunca a la persona.
  it('el progreso no expone score, nivel ni ranking', () => {
    const progreso = computeRouteProgress(hitos, vacio);
    const serializado = JSON.stringify(progreso);

    expect(progreso).not.toHaveProperty('score');
    expect(progreso).not.toHaveProperty('level');
    expect(progreso).not.toHaveProperty('xp');
    expect(progreso).not.toHaveProperty('rank');
    expect(serializado).not.toMatch(/score|nivel|level|puntaje|xp|ranking|percentil/i);
  });
});
