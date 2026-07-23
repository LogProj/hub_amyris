// Constantes PURAS do indicador de Headcount (sem dependência de servidor/pg),
// para poder ser importado tanto no servidor quanto em client components
// (ex.: RegrasInfo.tsx).

/**
 * Categorias profissionais EXCLUÍDAS da análise (perfis administrativos, fora do
 * escopo operacional deste indicador). Grafia exata confirmada na view
 * public.vw_ponto_amyris via `SELECT DISTINCT categoria_profissional`.
 */
export const CATEGORIAS_EXCLUIDAS = [
  "ANALISTA DE PROJETOS PL",
  "SUPERVISOR DE LOGISTICA",
] as const

/** Meta de aderência (presenças ÷ escalados no dia). */
export const META_ADERENCIA = 90
