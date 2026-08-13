import { proposeFromCertificate } from './certificate-proposal';
import { skillId } from './skill-taxonomy';

const CERTIFICADO = `
CERTIFICADO DE PARTICIPACIÓN

Fundación Impulso Joven certifica que Valeria Quispe Mamani ha completado
el curso «Análisis de datos con Python».

Emitido por: Fundación Impulso Joven
Duración: 40 horas académicas
Fecha: 12 de agosto de 2026
Código de verificación: IJ-2026-8842X
`;

describe('proposeFromCertificate', () => {
  it('devuelve campos, categoria y competencias en una sola propuesta', () => {
    const propuesta = proposeFromCertificate(CERTIFICADO);

    expect(propuesta.fields.holderName).toBe('Valeria Quispe Mamani');
    expect(propuesta.fields.hours).toBe(40);
    expect(propuesta.categories[0].category).toBe('APRENDIZAJE');
    expect(propuesta.skills.map((s) => s.key)).toEqual(
      expect.arrayContaining(['ANALISIS_DATOS', 'PYTHON']),
    );
  });

  // Lo mas importante del modulo: proponer no es verificar.
  it('nunca llega verificada, por completo que sea el certificado', () => {
    expect(proposeFromCertificate(CERTIFICADO).verified).toBe(false);
    expect(proposeFromCertificate(CERTIFICADO).fields.verificationLevel).toBe(
      'SELF_REPORTED',
    );
  });

  it('funde lo que el usuario escribio con lo que dice el texto', () => {
    const propuesta = proposeFromCertificate(CERTIFICADO, ['python', 'React.js']);

    const python = propuesta.skills.find((s) => s.key === 'PYTHON');
    // Una sola competencia, aunque venga de dos fuentes distintas.
    expect(propuesta.skills.filter((s) => s.key === 'PYTHON')).toHaveLength(1);
    expect(python?.matchedFrom.length).toBeGreaterThan(1);

    // Y lo que solo declaro el usuario tambien entra.
    expect(propuesta.skills.map((s) => s.key)).toContain('REACT');
  });

  it('el mismo skillId sin importar como se escribio', () => {
    const a = proposeFromCertificate('', ['React.js']);
    const b = proposeFromCertificate('', ['reactjs']);

    expect(a.skills[0].skillId).toBe(b.skills[0].skillId);
    expect(a.skills[0].skillId).toBe(skillId('REACT'));
  });

  it('lo que no reconoce queda aparte, para que el emisor decida', () => {
    const propuesta = proposeFromCertificate('', ['Quechua', 'Liderazgo']);

    expect(propuesta.skills.map((s) => s.key)).toEqual(['LIDERAZGO']);
    expect(propuesta.unmatchedSkills).toEqual(['Quechua']);
  });

  it('un texto vacio no revienta ni inventa nada', () => {
    const propuesta = proposeFromCertificate('');

    expect(propuesta.skills).toEqual([]);
    expect(propuesta.categories).toEqual([]);
    expect(propuesta.unmatchedSkills).toEqual([]);
  });
});
