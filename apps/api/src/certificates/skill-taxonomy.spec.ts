import {
  CANONICAL_SKILLS,
  extractSkillsFromText,
  resolveSkills,
  skillId,
} from './skill-taxonomy';

describe('skillId', () => {
  it('es estable y determinista', () => {
    expect(skillId('MATEMATICAS')).toBe(skillId('MATEMATICAS'));
    expect(skillId('MATEMATICAS')).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('cada competencia tiene un id distinto', () => {
    const ids = CANONICAL_SKILLS.map((skill) => skillId(skill.key));
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * El id sale de la CLAVE, no de la etiqueta. Por eso corregir una tilde en el
   * texto mostrado no invalida ni una credencial ya emitida. Si algun dia
   * alguien lo deriva de `label`, este test se cae.
   */
  it('no depende de la etiqueta que se muestra', () => {
    const matematicas = CANONICAL_SKILLS.find((s) => s.key === 'MATEMATICAS');
    expect(matematicas?.label).toBe('Matemáticas');
    // El id se mantiene aunque la etiqueta lleve tilde y la clave no.
    expect(skillId('MATEMATICAS')).not.toBe(skillId('Matemáticas'));
  });
});

describe('resolveSkills', () => {
  it('colapsa variantes de escritura en una sola competencia', () => {
    const { resolved } = resolveSkills(['React.js', 'reactjs', 'REACT']);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].key).toBe('REACT');
    // Y conserva los tres origenes, para que la propuesta sea revisable.
    expect(resolved[0].matchedFrom).toEqual(['React.js', 'reactjs', 'REACT']);
  });

  it('el caso del concurso de matematica', () => {
    const { resolved } = resolveSkills(['Concurso de matemática']);

    expect(resolved[0].label).toBe('Matemáticas');
    expect(resolved[0].category).toBe('APRENDIZAJE');
    expect(resolved[0].skillId).toBe(skillId('MATEMATICAS'));
  });

  it('compara sin acentos, mayusculas ni puntuacion', () => {
    expect(resolveSkills(['TRABAJO EN EQUIPO']).resolved[0].key).toBe('COLABORACION');
    expect(resolveSkills(['comunicación']).resolved[0].key).toBe('COMUNICACION');
  });

  // Una taxonomia que clasifica todo a la fuerza es una taxonomia que miente.
  it('lo que no reconoce queda como texto libre, no se inventa', () => {
    const { resolved, unmatched } = resolveSkills(['Quechua', 'React']);

    expect(resolved).toHaveLength(1);
    expect(unmatched).toEqual(['Quechua']);
  });

  it('ignora entradas vacias y no duplica lo no reconocido', () => {
    const { resolved, unmatched } = resolveSkills(['', '  ', 'Quechua', 'Quechua']);

    expect(resolved).toEqual([]);
    expect(unmatched).toEqual(['Quechua']);
  });

  it('cada competencia trae tipo y categoria, para alimentar hitos y puntos', () => {
    const { resolved } = resolveSkills(['liderazgo']);

    expect(resolved[0].type).toBe('HUMAN');
    expect(resolved[0].category).toBe('LIDERAZGO_COMUNIDAD');
  });
});

describe('extractSkillsFromText', () => {
  it('encuentra competencias en el texto corrido de un certificado', () => {
    const skills = extractSkillsFromText(
      'Certifica que participó en la Olimpiada de Matemática y obtuvo el segundo puesto.',
    );

    expect(skills.map((s) => s.key)).toContain('MATEMATICAS');
  });

  it('reconoce varias competencias a la vez', () => {
    const claves = extractSkillsFromText(
      'Desarrolló una aplicación con React y Python, trabajando en equipo con dos voluntarios.',
    ).map((s) => s.key);

    expect(claves).toEqual(expect.arrayContaining(['REACT', 'PYTHON', 'COLABORACION']));
  });

  /**
   * Sin limite de palabra, "ia" casaba dentro de "familia" y "ts" dentro de
   * "resultados". Aparecian competencias que nadie menciono, y ese falso
   * positivo es lo que hace que una organizacion deje de confiar en la
   * propuesta y termine escribiendo todo a mano.
   */
  it('no casa alias dentro de otra palabra', () => {
    const claves = extractSkillsFromText(
      'Acompañó a la familia durante los resultados de la campaña.',
    ).map((s) => s.key);

    expect(claves).not.toContain('INTELIGENCIA_ARTIFICIAL');
    expect(claves).not.toContain('TYPESCRIPT');
  });

  it('un texto sin competencias reconocibles devuelve lista vacia', () => {
    expect(extractSkillsFromText('Constancia de asistencia.')).toEqual([]);
  });

  /**
   * LIMITE CONOCIDO, no un bug. El lexico casa frases exactas, no morfologia:
   * una conjugacion que no este en la lista de alias simplemente no aparece.
   *
   * Se deja documentado a proposito. La alternativa —stemming o lematizacion—
   * mete falsos positivos y deja de ser determinista, y el coste de no
   * detectar una competencia es bajo: el emisor la agrega a mano. El coste de
   * proponer una que nadie menciono es alto: se pierde la confianza en toda la
   * propuesta.
   */
  it('una conjugacion no listada no se detecta, y esta bien', () => {
    expect(extractSkillsFromText('Colaboró activamente con el equipo.')).toEqual([]);
  });
});
