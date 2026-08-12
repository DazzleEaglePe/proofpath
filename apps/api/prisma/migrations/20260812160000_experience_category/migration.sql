-- Taxonomia cerrada de categorias. Ver 00-CONTEXT §2.4.
--
-- Por que un enum y no texto libre: los hitos de una ruta se casan contra la
-- categoria de la experiencia. Con texto libre, "Medio ambiente" nunca casaria
-- con "Impacto ambiental" y el hito quedaria pendiente para siempre, sin error
-- y sin log. Es el mismo modo de falla del credentialHash: silencioso y caro.
CREATE TYPE "ExperienceCategory" AS ENUM (
  'APRENDIZAJE',
  'IMPACTO_AMBIENTAL',
  'IMPACTO_SOCIAL',
  'INNOVACION_TECNOLOGIA',
  'LIDERAZGO_COMUNIDAD',
  'TRAYECTORIA'
);

-- Nullable y sin default: `cause` sigue siendo el copy libre que la ONG
-- muestra, y `category` es lo que computa. Los programas ya sembrados quedan
-- en NULL hasta que alguien los clasifique — preferible a adivinar por ellos.
ALTER TABLE "Program"
  ADD COLUMN "category" "ExperienceCategory";

-- RouteMilestone.category nace como TEXT en la migracion de rutas. Se convierte
-- aqui. El USING mapea los valores que sembramos nosotros; cualquier otro cae a
-- NULL, que el motor trata como "no casa con nada".
ALTER TABLE "RouteMilestone"
  ALTER COLUMN "category" TYPE "ExperienceCategory"
  USING (
    CASE "category"
      WHEN 'Educación'         THEN 'APRENDIZAJE'
      WHEN 'Tecnología cívica' THEN 'INNOVACION_TECNOLOGIA'
      ELSE NULL
    END::"ExperienceCategory"
  );
