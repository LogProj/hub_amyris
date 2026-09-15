// Funções puras de data/hora do formulário. O valor canônico é sempre
// "YYYY-MM-DDTHH:mm" em hora de Brasília (mesmo formato que o input nativo usava).

const VALOR = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/

export function separar(valor: string): { data: string; hora: string } {
  const m = VALOR.exec(valor ?? "")
  return m ? { data: m[1], hora: m[2] } : { data: "", hora: "" }
}

export function juntar(data: string, hora: string): string {
  return data && hora ? `${data}T${hora}` : ""
}

export function formatarDataHora(valor: string): string {
  const { data, hora } = separar(valor)
  if (!data) return ""
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano} · ${hora}`
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function rotuloMesAno(ano: number, mes: number): string {
  return `${MESES[mes - 1]} de ${ano}`
}

const dois = (n: number) => String(n).padStart(2, "0")

/** 42 posições (6 semanas de domingo a sábado); fora do mês é null. */
export function gradeDoMes(ano: number, mes: number): (string | null)[] {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1))
  const deslocamento = primeiro.getUTCDay() // 0 = domingo
  const totalDias = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return Array.from({ length: 42 }, (_, i) => {
    const dia = i - deslocamento + 1
    return dia >= 1 && dia <= totalDias ? `${ano}-${dois(mes)}-${dois(dia)}` : null
  })
}

/** Hoje em São Paulo, como "YYYY-MM-DD" (o servidor pode estar em outro fuso). */
export function hojeBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/

export function horaValida(hora: string): boolean {
  return HORA.test(hora ?? "")
}

/** Itens das roletas de horário (hora e minuto, sem segundos). */
export const HORAS_DO_DIA: string[] = Array.from({ length: 24 }, (_, i) => dois(i))
export const MINUTOS: string[] = Array.from({ length: 60 }, (_, i) => dois(i))
