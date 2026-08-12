-- Rutas: el camino publico hacia UNA oportunidad concreta. Ver 00-CONTEXT §2.5.
--
-- Migracion puramente aditiva: no toca ninguna tabla existente, asi que no
-- puede alterar el vcJson ni el credentialHash. La verificacion on-chain queda
-- intacta.
--
-- No hay tabla de progreso a proposito. El avance se recomputa en cada request
-- desde las credenciales vigentes (route-progress.ts). Sin estado acumulado no
-- existe un numero por persona que alguien pueda ordenar o comparar.
CREATE TYPE "MilestoneKind" AS ENUM (
  'CREDENTIAL_IN_CATEGORY',
  'SKILL_CONFIRMED',
  'HOURS_ACCUMULATED'
);

CREATE TABLE "Route" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "description"    TEXT NOT NULL,
  "closesAt"       TIMESTAMP(3),
  "isOpen"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RouteMilestone" (
  "id"            TEXT NOT NULL,
  "routeId"       TEXT NOT NULL,
  "order"         INTEGER NOT NULL,
  "title"         TEXT NOT NULL,
  "kind"          "MilestoneKind" NOT NULL,
  "category"      TEXT,
  "skillName"     TEXT,
  "requiredHours" INTEGER,

  CONSTRAINT "RouteMilestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Route_organizationId_idx" ON "Route" ("organizationId");
CREATE INDEX "RouteMilestone_routeId_idx" ON "RouteMilestone" ("routeId");

-- Dos hitos no pueden pelearse el mismo lugar en la lista.
CREATE UNIQUE INDEX "RouteMilestone_routeId_order_key"
  ON "RouteMilestone" ("routeId", "order");

ALTER TABLE "Route"
  ADD CONSTRAINT "Route_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Borrar una ruta se lleva sus hitos: no significan nada sueltos.
ALTER TABLE "RouteMilestone"
  ADD CONSTRAINT "RouteMilestone_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "Route" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
