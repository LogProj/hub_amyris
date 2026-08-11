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

/**
 * Meta (target) de absenteísmo acordada com a Amyris: 2,4%. É o teto — quanto
 * MENOR o absenteísmo, melhor. Usada como linha de referência no gráfico diário
 * e na comparação do card "Média absenteísmo (mês)".
 */
export const META_ABSENTEISMO_PCT = 2.4
