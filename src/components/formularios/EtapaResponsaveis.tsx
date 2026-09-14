"use client"

import { useState } from "react"
import { MessageSquareWarning, UserCheck } from "lucide-react"
import { EPIS, formatarFuncao, podeSerLider, podeSerSupervisor, resumoEpis, type ChecklistPayload, type PessoaSra } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { CampoSeletor } from "./CampoSeletor"
import { PessoaSheet } from "./PessoaSheet"
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
  const [painel, setPainel] = useState<"supervisor" | "lider" | null>(null)
  const supervisores = pessoas.filter(podeSerSupervisor)
  const lideres = pessoas.filter(podeSerLider)
  const temNao = EPIS.some((e) => estado.epis[e.codigo] === "nao")
  const lacresPreenchidos = estado.lacres.filter((l) => l.trim()).length

  const nomeDe = (cpf: string) => {
    const p = pessoas.find((x) => x.cpf === cpf)
    return p ? `${p.nome} · ${formatarFuncao(p.funcao)}` : null
  }

  return (
    <div className="space-y-3.5">
      <Cartao icone={UserCheck} titulo="Responsáveis" subtitulo="Cargos validados na SRA">
        <div className="space-y-3">
          <Campo rotulo="Supervisor responsável" erro={erros.supervisorCpf}>
            <CampoSeletor
              valor={nomeDe(estado.supervisorCpf)}
              placeholder={supervisores.length ? "Escolher supervisor" : "Nenhum Supervisor de Logística ativo hoje"}
              onAbrir={() => supervisores.length > 0 && setPainel("supervisor")}
              invalido={!!erros.supervisorCpf}
              desabilitado={supervisores.length === 0}
            />
          </Campo>
          <Campo rotulo="Líder responsável" erro={erros.liderCpf}>
            <CampoSeletor
              valor={nomeDe(estado.liderCpf)}
              placeholder={lideres.length ? "Escolher líder" : "Nenhum Operador Logístico Líder ativo hoje"}
              onAbrir={() => lideres.length > 0 && setPainel("lider")}
              invalido={!!erros.liderCpf}
              desabilitado={lideres.length === 0}
            />
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

      <PessoaSheet
        aberto={painel === "supervisor"}
        titulo="Supervisor responsável"
        subtitulo="Somente Supervisor de Logística"
        pessoas={supervisores}
        selecionado={estado.supervisorCpf}
        onSelecionar={(cpf) => onMudar("supervisorCpf", cpf)}
        onFechar={() => setPainel(null)}
      />
      <PessoaSheet
        aberto={painel === "lider"}
        titulo="Líder responsável"
        subtitulo="Somente Operador Logístico Líder"
        pessoas={lideres}
        selecionado={estado.liderCpf}
        onSelecionar={(cpf) => onMudar("liderCpf", cpf)}
        onFechar={() => setPainel(null)}
      />
    </div>
  )
}
