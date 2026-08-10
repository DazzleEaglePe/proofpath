import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ExperienceRepository } from '../repositories/experience.repository';
import type { SkillRepository } from '../repositories/skill.repository';
import { MockSkillExtractor } from './mock-skill-extractor';
import { parseSuggestions } from './openai-skill-extractor';
import { SkillsService } from './skills.service';

/**
 * El pipeline de 00-CONTEXT.md §2.2 tiene que ser imposible de saltear.
 * Estos tests fijan que la IA no pueda dejar nada confirmado por su cuenta.
 */
describe('SkillsService', () => {
  type Fila = {
    id: string;
    name: string;
    type: string;
    source: string;
    confirmed: boolean;
  };

  function build(opts: { status?: string; filas?: Fila[] } = {}) {
    const filas: Fila[] = opts.filas ?? [];
    let statusActual = opts.status ?? 'DRAFT';

    const experiences = {
      findOneForExtraction: jest.fn(async (id: string) =>
        id === 'exp_1'
          ? {
              id: 'exp_1',
              status: statusActual,
              role: 'Full Stack Developer',
              contributions:
                'Construí el dashboard y el sistema de autenticación en React. Coordiné con dos voluntarias de diseño.',
              program: { title: 'Plataforma de mentorías juveniles' },
              evidences: [{ type: 'REPOSITORY', url: 'https://github.com/x', label: 'Repo' }],
            }
          : null,
      ),
      updateStatus: jest.fn(async (id: string, status: string) => {
        statusActual = status;
        return { id, status };
      }),
    } as unknown as ExperienceRepository;

    const skills = {
      findByExperience: jest.fn(async () => filas),
      upsertSuggestions: jest.fn(async (_id: string, propuestas: Array<{ name: string; type: string }>) => {
        for (const p of propuestas) {
          // Idempotente: si ya existe, no se toca.
          if (filas.some((f) => f.name === p.name)) continue;
          filas.push({
            id: `sk_${filas.length + 1}`,
            name: p.name,
            type: p.type,
            source: 'AI_SUGGESTED',
            confirmed: false,
          });
        }
        return filas;
      }),
      confirmMany: jest.fn(async (_id: string, ids: string[]) => {
        for (const f of filas) if (ids.includes(f.id)) f.confirmed = true;
        return { count: ids.length };
      }),
      discardMany: jest.fn(async (_id: string, ids: string[]) => {
        for (const id of ids) {
          const i = filas.findIndex((f) => f.id === id);
          if (i >= 0) filas.splice(i, 1);
        }
        return { count: ids.length };
      }),
      addManual: jest.fn(async (_id: string, nuevas: Array<{ name: string; type: string }>) => {
        for (const n of nuevas) {
          filas.push({
            id: `sk_manual_${filas.length + 1}`,
            name: n.name,
            type: n.type,
            source: 'ORG_ADDED',
            confirmed: true,
          });
        }
        return [];
      }),
      countConfirmed: jest.fn(async () => filas.filter((f) => f.confirmed).length),
    } as unknown as SkillRepository;

    return {
      service: new SkillsService(experiences, skills, new MockSkillExtractor()),
      filas,
      experiences,
      statusDe: () => statusActual,
    };
  }

  it('la IA propone y NADA queda confirmado', async () => {
    const { service } = build();

    const { suggested } = await service.extract('exp_1');

    expect(suggested.length).toBeGreaterThan(0);
    expect(suggested.every((s) => s.confirmed === false)).toBe(true);
    expect(suggested.every((s) => s.source === 'AI_SUGGESTED')).toBe(true);
  });

  it('extraer pasa la experiencia de DRAFT a AI_ANALYZED', async () => {
    const { service, statusDe } = build({ status: 'DRAFT' });

    await service.extract('exp_1');

    expect(statusDe()).toBe('AI_ANALYZED');
  });

  it('volver a extraer no pisa lo que la ONG ya confirmo', async () => {
    const { service, filas } = build({
      filas: [{ id: 'sk_1', name: 'React', type: 'HARD', source: 'AI_SUGGESTED', confirmed: true }],
    });

    await service.extract('exp_1');

    const react = filas.find((f) => f.name === 'React');
    expect(react?.confirmed).toBe(true);
    expect(filas.filter((f) => f.name === 'React')).toHaveLength(1);
  });

  it('no deja dar por lista una experiencia sin ninguna skill confirmada', async () => {
    const { service } = build({
      filas: [{ id: 'sk_1', name: 'React', type: 'HARD', source: 'AI_SUGGESTED', confirmed: false }],
    });

    await expect(service.confirmExperience('exp_1')).rejects.toThrow(BadRequestException);
  });

  it('con al menos una skill confirmada, pasa a ORG_CONFIRMED', async () => {
    const { service } = build({
      filas: [{ id: 'sk_1', name: 'React', type: 'HARD', source: 'AI_SUGGESTED', confirmed: true }],
    });

    await expect(service.confirmExperience('exp_1')).resolves.toEqual({
      id: 'exp_1',
      status: 'ORG_CONFIRMED',
    });
  });

  it('la organizacion confirma, descarta y agrega en una sola llamada', async () => {
    const { service } = build({
      filas: [
        { id: 'sk_1', name: 'React', type: 'HARD', source: 'AI_SUGGESTED', confirmed: false },
        { id: 'sk_2', name: 'Blockchain', type: 'HARD', source: 'AI_SUGGESTED', confirmed: false },
      ],
    });

    const res = await service.update('exp_1', {
      confirm: ['sk_1'],
      discard: ['sk_2'],
      add: [{ name: 'Mentoría de pares', type: 'HUMAN' }],
    });

    expect(res.find((s) => s.name === 'React')?.confirmed).toBe(true);
    expect(res.find((s) => s.name === 'Blockchain')).toBeUndefined();

    const manual = res.find((s) => s.name === 'Mentoría de pares');
    expect(manual?.source).toBe('ORG_ADDED');
    // Lo que escribe un humano nace confirmado.
    expect(manual?.confirmed).toBe(true);
  });

  it('una experiencia ya emitida no se puede reanalizar ni editar', async () => {
    const { service } = build({ status: 'ISSUED' });

    await expect(service.extract('exp_1')).rejects.toThrow(BadRequestException);
    await expect(service.update('exp_1', { confirm: ['sk_1'] })).rejects.toThrow(BadRequestException);
  });

  it('falla claro si la experiencia no existe', async () => {
    const { service } = build();

    await expect(service.extract('exp_fantasma')).rejects.toThrow(NotFoundException);
  });

  it('ninguna skill propuesta trae nivel, puntaje ni porcentaje', async () => {
    const { service } = build();

    const { suggested } = await service.extract('exp_1');

    for (const s of suggested) {
      expect(Object.keys(s).sort()).toEqual(['confirmed', 'id', 'name', 'source', 'type']);
    }
  });
});

describe('parseSuggestions', () => {
  it('descarta cualquier campo extra que invente el modelo', () => {
    // El prompt prohibe los puntajes, pero la prohibicion no puede depender de
    // que el modelo obedezca: aqui se descarta todo lo que no sea name y type.
    const raw = JSON.stringify({
      skills: [{ name: 'React', type: 'HARD', level: 9, score: 87, percentage: '90%' }],
    });

    expect(parseSuggestions(raw)).toEqual([{ name: 'React', type: 'HARD' }]);
  });

  it('descarta entradas con tipo invalido, incluido SOFT', () => {
    const raw = JSON.stringify({
      skills: [
        { name: 'Colaboración', type: 'SOFT' },
        { name: 'React', type: 'HARD' },
        { name: '', type: 'HUMAN' },
        { name: 'x'.repeat(80), type: 'HUMAN' },
      ],
    });

    expect(parseSuggestions(raw)).toEqual([{ name: 'React', type: 'HARD' }]);
  });

  it('deduplica sin distinguir mayusculas', () => {
    const raw = JSON.stringify({
      skills: [
        { name: 'React', type: 'HARD' },
        { name: 'react', type: 'HARD' },
      ],
    });

    expect(parseSuggestions(raw)).toHaveLength(1);
  });

  it('falla claro si el modelo no devuelve JSON', () => {
    expect(() => parseSuggestions('lo siento, no puedo')).toThrow(/JSON valido/);
  });
});
