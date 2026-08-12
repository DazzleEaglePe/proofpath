import { classifyCategory } from './classify-category';

describe('classifyCategory', () => {
  it('propone la categoria correcta para un certificado de curso', () => {
    const guesses = classifyCategory(
      'Certificación en análisis de datos. Curso aprobado con 40 horas académicas.',
    );

    expect(guesses[0].category).toBe('APRENDIZAJE');
    expect(guesses[0].matchedTerms).toContain('curso');
  });

  it('distingue voluntariado de accion ambiental', () => {
    expect(classifyCategory('Constancia de voluntariado en comedor popular')[0].category).toBe(
      'IMPACTO_SOCIAL',
    );
    expect(
      classifyCategory('Jornada de reforestación y limpieza de río')[0].category,
    ).toBe('IMPACTO_AMBIENTAL');
  });

  it('reconoce un proyecto tecnico y un rol de coordinacion', () => {
    expect(
      classifyCategory('Participó en el hackathon construyendo un prototipo en GitHub')[0]
        .category,
    ).toBe('INNOVACION_TECNOLOGIA');
    expect(
      classifyCategory('Se desempeñó como coordinador, organizador del meetup')[0].category,
    ).toBe('LIDERAZGO_COMUNIDAD');
  });

  it('reconoce practicas preprofesionales como trayectoria', () => {
    expect(
      classifyCategory('Constancia de prácticas preprofesionales, practicante del área')[0]
        .category,
    ).toBe('TRAYECTORIA');
  });

  it('compara sin acentos ni mayusculas', () => {
    expect(classifyCategory('REFORESTACION Y RECICLAJE')[0].category).toBe(
      'IMPACTO_AMBIENTAL',
    );
  });

  // Un texto genuinamente ambiguo debe VERSE ambiguo. Esconder la duda detras
  // de un 1.0 es lo que hace que nadie revise la propuesta.
  it('reparte la confianza cuando el texto es ambiguo', () => {
    const guesses = classifyCategory(
      'Voluntariado en jornada de reforestación con la comunidad',
    );

    expect(guesses.length).toBeGreaterThan(1);
    expect(guesses[0].confidence).toBeLessThan(1);
  });

  it('devuelve lista vacia cuando nada casa, en vez de inventar una categoria', () => {
    expect(classifyCategory('lorem ipsum dolor sit amet')).toEqual([]);
  });

  it('las propuestas vienen ordenadas de mayor a menor confianza', () => {
    const guesses = classifyCategory(
      'Curso certificado sobre reforestación con 20 horas académicas y un módulo final',
    );

    const confidences = guesses.map((guess) => guess.confidence);
    expect([...confidences].sort((a, b) => b - a)).toEqual(confidences);
  });

  it('toda propuesta trae los terminos que la justifican', () => {
    for (const guess of classifyCategory('hackathon con prototipo y repositorio')) {
      expect(guess.matchedTerms.length).toBeGreaterThan(0);
    }
  });
});
