/**
 * Controle de Ocorrências — indicador do cliente AMYRIS - BARRA BONITA.
 *
 * Espelha a aba "Controle de Ocorrências" do sistema LogFy, mas RESTRITO a
 * ocorrências que NÃO envolvem pessoas — ou seja, sem acidentes/lesões. Só entram
 * as classificações materiais e comportamentais/ambientais:
 *   - Incidente Material
 *   - Ato Inseguro
 *   - Condição Insegura
 * (Acidentes, primeiros socorros, atendimento ambulatorial, incidente pessoal,
 *  parte do corpo e CAT — tudo que envolve pessoa — ficam de fora.)
 *
 * ⚠️ POR ENQUANTO: dados de EXEMPLO (placeholder) só para montar o visual no hub.
 * A forma dos dados é a mesma do painel real; quando a fonte for ligada, basta
 * preencher este formato — a página e os gráficos não mudam.
 */

export type OcorrenciaLinha = {
  id: string
  data: string // YYYY-MM-DD
  hora: string
  colaborador: string // quem reportou
  tipo: string
  turno: string
  gps: string // classificação (não-pessoa)
  negocio: string
  local: string
}

export type OcorrenciasData = {
  mes: string
  mesAtual: string
  meses: string[]
  clienteLabel: string
  kpis: {
    total: number
    totalMes: number
    mesAnterior: number
    variacaoPct: number | null
    condicoesInseguras: number
    atosInseguros: number
  }
  calendario: { dia: number; count: number }[]
  porMes: { mes: string; count: number }[]
  porTurno: { turno: string; count: number }[]
  porClassificacao: { classificacao: string; count: number }[]
  porTipo: { tipo: string; count: number }[]
  porNegocio: { negocio: string; count: number }[]
  recentes: OcorrenciaLinha[]
}

const MESES_EXEMPLO = ["2026-08", "2026-07", "2026-06", "2026-05", "2026-04", "2026-03"]

const LINHAS: OcorrenciaLinha[] = [
  { id: "OC-1042", data: "2026-08-27", hora: "14:20", colaborador: "João P. Silva", tipo: "Condição Insegura", turno: "1º Turno", gps: "Condição Insegura", negocio: "Armazenagem", local: "Doca 3" },
  { id: "OC-1040", data: "2026-08-22", hora: "09:05", colaborador: "Maria A. Souza", tipo: "Ato Inseguro", turno: "2º Turno", gps: "Ato Inseguro", negocio: "Expedição", local: "Corredor B" },
  { id: "OC-1037", data: "2026-08-15", hora: "22:40", colaborador: "Carlos E. Lima", tipo: "Avaria de equipamento", turno: "3º Turno", gps: "Incidente Material", negocio: "Movimentação", local: "Porta-pallet 12" },
  { id: "OC-1035", data: "2026-08-15", hora: "11:15", colaborador: "Ana R. Costa", tipo: "Ato Inseguro", turno: "1º Turno", gps: "Ato Inseguro", negocio: "Recebimento", local: "Doca 1" },
  { id: "OC-1032", data: "2026-08-12", hora: "16:50", colaborador: "Pedro H. Alves", tipo: "Condição Insegura", turno: "2º Turno", gps: "Condição Insegura", negocio: "Armazenagem", local: "Rua 07" },
  { id: "OC-1029", data: "2026-08-09", hora: "08:30", colaborador: "Bruno T. Rocha", tipo: "Derramamento", turno: "1º Turno", gps: "Incidente Material", negocio: "Movimentação", local: "Área externa" },
  { id: "OC-1026", data: "2026-08-05", hora: "13:10", colaborador: "Rafael M. Dias", tipo: "Condição Insegura", turno: "1º Turno", gps: "Condição Insegura", negocio: "Expedição", local: "Doca 5" },
  { id: "OC-1023", data: "2026-08-02", hora: "19:45", colaborador: "Letícia F. Nunes", tipo: "Ato Inseguro", turno: "2º Turno", gps: "Ato Inseguro", negocio: "Armazenagem", local: "Rua 02" },
]

export function getOcorrenciasData(mesEntrada?: string): OcorrenciasData {
  const mes = mesEntrada && /^\d{4}-\d{2}$/.test(mesEntrada) ? mesEntrada : MESES_EXEMPLO[0]

  // Calendário do mês (dias com/sem ocorrência) — 8 ocorrências.
  const diasComOcorrencia: Record<number, number> = { 2: 1, 5: 1, 9: 1, 12: 1, 15: 2, 22: 1, 27: 1 }
  const calendario = Array.from({ length: 31 }, (_, i) => ({ dia: i + 1, count: diasComOcorrencia[i + 1] ?? 0 }))

  return {
    mes,
    mesAtual: mes,
    meses: MESES_EXEMPLO,
    clienteLabel: "AMYRIS - BARRA BONITA",
    kpis: {
      total: 47,
      totalMes: 8,
      mesAnterior: 10,
      variacaoPct: -20,
      condicoesInseguras: 3,
      atosInseguros: 3,
    },
    calendario,
    porMes: [
      { mes: "Jan", count: 4 },
      { mes: "Fev", count: 5 },
      { mes: "Mar", count: 7 },
      { mes: "Abr", count: 5 },
      { mes: "Mai", count: 6 },
      { mes: "Jun", count: 4 },
      { mes: "Jul", count: 10 },
      { mes: "Ago", count: 8 },
      { mes: "Set", count: 0 },
      { mes: "Out", count: 0 },
      { mes: "Nov", count: 0 },
      { mes: "Dez", count: 0 },
    ],
    porTurno: [
      { turno: "1º Turno", count: 4 },
      { turno: "2º Turno", count: 3 },
      { turno: "3º Turno", count: 1 },
    ],
    porClassificacao: [
      { classificacao: "Condição Insegura", count: 3 },
      { classificacao: "Ato Inseguro", count: 3 },
      { classificacao: "Incidente Material", count: 2 },
    ],
    porTipo: [
      { tipo: "Condição Insegura", count: 3 },
      { tipo: "Ato Inseguro", count: 3 },
      { tipo: "Avaria de equipamento", count: 1 },
      { tipo: "Derramamento", count: 1 },
    ],
    porNegocio: [
      { negocio: "Armazenagem", count: 3 },
      { negocio: "Expedição", count: 2 },
      { negocio: "Movimentação", count: 2 },
      { negocio: "Recebimento", count: 1 },
    ],
    recentes: LINHAS,
  }
}
