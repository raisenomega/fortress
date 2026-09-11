/**
 * Los AVISTAMIENTOS de una observacion de auto-mejora (ADR-085, Fase 4).
 *
 * Aparte de `schema-system` por el tope de 75 lineas, y con su docblock aqui
 * porque lo que hay que entender no es la tabla sino por que existe.
 */
export const SIGHTINGS_SCHEMA = `
-- Cada vez que un agente se topa con la observacion, en que proyecto y con que
-- palabras (ADR-085, Fase 4). Es lo que convierte el backlog en una senal: la
-- pregunta que decide la prioridad no es «cuantas veces se dijo» sino «cuantos
-- PROYECTOS distintos se toparon con lo mismo», y un contador no la responde
-- porque no guarda CUALES.
--
-- El UNIQUE lleva la note ademas del proyecto: sin ella, el mismo proyecto
-- que se topa dos veces con el mismo limite por caminos distintos perderia la
-- segunda descripcion, y esas descripciones son el material con el que alguien
-- entiende el limite. Repetir la MISMA nota en el mismo proyecto si se ignora,
-- que es repeticion y no material. vistaEn sigue siendo COUNT(DISTINCT
-- source_project), asi que contar proyectos no depende de este UNIQUE.
CREATE TABLE IF NOT EXISTS observation_sightings (
  observation_id TEXT NOT NULL REFERENCES self_observations(id) ON DELETE CASCADE,
  source_project TEXT NOT NULL,
  note           TEXT NOT NULL,
  at             TEXT NOT NULL,
  UNIQUE(observation_id, source_project, note)
);
CREATE INDEX IF NOT EXISTS idx_sightings_obs ON observation_sightings (observation_id);
`
