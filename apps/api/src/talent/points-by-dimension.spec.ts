import { pointsByDimension, type ScorableCredential } from './points-by-dimension';

const credencial = (over: Partial<ScorableCredential> = {}): ScorableCredential => ({
  category: 'APRENDIZAJE',
  hours: 0,
  skillCount: 0,
  revoked: false,
  ...over,
});

describe('pointsByDimension', () => {
  it('suma base, horas y competencias confirmadas', () => {
    const [aprendizaje] = pointsByDimension([
      credencial({ hours: 40, skillCount: 3 }),
    ]);

    // 50 de base + 40 horas + 3 skills x 10
    expect(aprendizaje.points).toBe(120);
    expect(aprendizaje.credentialCount).toBe(1);
  });

  it('acumula varias credenciales en su dimension', () => {
    const [aprendizaje] = pointsByDimension([
      credencial({ hours: 10 }),
      credencial({ hours: 20 }),
    ]);

    expect(aprendizaje.points).toBe(130);
    expect(aprendizaje.credentialCount).toBe(2);
  });

  it('separa las dimensiones y las ordena de mayor a menor', () => {
    const puntos = pointsByDimension([
      credencial({ category: 'IMPACTO_AMBIENTAL', hours: 300 }),
      credencial({ category: 'APRENDIZAJE', hours: 10 }),
    ]);

    expect(puntos.map((p) => p.category)).toEqual(['IMPACTO_AMBIENTAL', 'APRENDIZAJE']);
  });

  // La antitrampa: no se puede farmear lo que no se puede auto-emitir.
  it('una credencial revocada deja de sumar', () => {
    expect(pointsByDimension([credencial({ hours: 500, revoked: true })])).toEqual([]);
  });

  it('una credencial sin categoria no acumula en ningun lado', () => {
    expect(pointsByDimension([credencial({ category: null, hours: 500 })])).toEqual([]);
  });

  it('sin evidencia no devuelve dimensiones en cero', () => {
    // Una lista de ceros se lee como un boletin de notas. Mejor vacia.
    expect(pointsByDimension([])).toEqual([]);
  });

  // 00-CONTEXT §2.1: hay puntos POR DIMENSION; no hay un total dominante.
  it('no expone un total ni nada que resuma a la persona en un numero', () => {
    const puntos = pointsByDimension([
      credencial({ category: 'APRENDIZAJE', hours: 40 }),
      credencial({ category: 'LIDERAZGO_COMUNIDAD', hours: 20 }),
    ]);

    expect(Array.isArray(puntos)).toBe(true);
    expect(puntos).not.toHaveProperty('total');
    expect(puntos).not.toHaveProperty('score');

    for (const dimension of puntos) {
      expect(Object.keys(dimension).sort()).toEqual([
        'category',
        'credentialCount',
        'points',
      ]);
      expect(dimension).not.toHaveProperty('rank');
      expect(dimension).not.toHaveProperty('percentile');
      expect(dimension).not.toHaveProperty('level');
    }
  });
});
