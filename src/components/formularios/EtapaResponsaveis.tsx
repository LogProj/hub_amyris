"use client"

import { MessageSquareWarning, UserCheck } from "lucide-react"
import { EPIS, formatarFuncao, podeSerLider, podeSerSupervisor, resumoEpis, type ChecklistPayload, type PessoaSra } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { Campo, Cartao, MensagemErro, Pilula, classeInput } from "./ui"

export function EtapaResponsaveis({
  pessoas,
  estado,
  erros,
  onMudar,
}: {
  pessoas: PessoaSra[]
  estado: ChecklistPayload
  erros: Erros
  onMudar: (campo: "supervisorCpf" | "liderCpf" | "ocorrencia", valor: string) => void
}) {
  const supervisores = pessoas.filter(podeSerSupervisor)
  const lideres = pessoas.filter(podeSerLider)
  const temNao = EPIS.some((e) => estado.epis[e.codigo] === "nao")
  const lacresPreenchidos = estado.lacres.filter((l) => l.trim()).length

  return (
    <div className="space-y-3.5">
      <Cartao icone={UserCheck} titulo="Responsáveis" subtitulo="Cargos validados na SRA">
        <div className="space-y-3">
          <Campo rotulo="Supervisor responsável" erro={erros.supervisorCpf}>
            <select value={estado.supervisorCpf} onChange={(e) => onMudar("supervisorCpf", e.target.value)} className={classeInput}>
              <option value="">{supervisores.length ? "Selecione…" : "Nenhum Supervisor de Logística ativo hoje"}</option>
              {supervisores.map((p) => (
                <option key={p.cpf} value={p.cpf}>
                  {p.nome} · {formatarFuncao(p.funcao)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Líder responsável" erro={erros.liderCpf}>
            <select value={estado.liderCpf} onChange={(e) => onMudar("liderCpf", e.target.value)} className={classeInput}>
              <option value="">{lideres.length ? "Selecione…" : "Nenhum Operador Logístico Líder ativo hoje"}</option>
              {lideres.map((p) => (
                <option key={p.cpf} value={p.cpf}>
                  {p.nome} · {formatarFuncao(p.funcao)}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </Cartao>

      <Cartao
        icone={MessageSquareWarning}
        titulo="Ocorrência"
        subtitulo={temNao ? "Obrigatória · algum EPI ficou como \"Não\"" : "Opcional · texto livre"}
      >
        <textarea
          rows={4}
          value={estado.ocorrencia}
          onChange={(e) => onMudar("ocorrencia", e.target.value)}
          placeholder="Descreva qualquer desvio, atraso ou intercorrência do carregamento…"
          className={`${classeInput} h-auto py-2.5`}
        />
        <MensagemErro texto={erros.ocorrencia} />
      </Cartao>

      <div
        className="rounded-[22px] p-4"
        style={{ border: "1px solid rgba(124,58,237,.16)", background: "linear-gradient(135deg, rgba(244,240,251,.95), rgba(255,255,255,.65))" }}
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">Resumo</p>
        <div className="flex flex-wrap gap-1.5">
          <Pilula className="border border-[#E7DEED] bg-white">{estado.operadores.length} operadores</Pilula>
          <Pilula className="border border-[#E7DEED] bg-white">{resumoEpis(estado.epis)}</Pilula>
          <Pilula className="border border-[#E7DEED] bg-white">{lacresPreenchidos} lacres</Pilula>
        </div>
      </div>
    </div>
  )
}
