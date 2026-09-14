"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react"
import {
  etapaDoCampo,
  validarChecklist,
  type CampoChecklist,
  type ChecklistPayload,
  type ErroValidacao,
  type PessoaSra,
} from "@/lib/formularios/regras"
import { ConfirmacaoEnvio } from "./ConfirmacaoEnvio"
import { EtapaEpis } from "./EtapaEpis"
import { EtapaEquipe } from "./EtapaEquipe"
import { EtapaResponsaveis } from "./EtapaResponsaveis"
import { EtapaVeiculo } from "./EtapaVeiculo"
import { NAV_HEIGHT } from "./navMetrics"
import { OperadoresSheet } from "./OperadoresSheet"
import { GRAD } from "./ui"
import { useRascunho } from "./useRascunho"

type Etapa = 1 | 2 | 3 | 4
export type EstadoChecklist = ChecklistPayload & { etapa: Etapa }
export type Erros = Partial<Record<CampoChecklist, string>>

const TITULOS = ["Equipe e período", "EPIs da equipe", "Veículo e lacres", "Responsáveis"]
const ABAS = ["Equipe", "EPIs", "Veículo", "Fecho"]

const VAZIO: EstadoChecklist = {
  etapa: 1,
  operadores: [],
  inicioEm: "",
  fimEm: "",
  veiculoNumero: "",
  veiculoCapacidade: "",
  lacres: [],
  epis: {},
  supervisorId: "",
  liderId: "",
  ocorrencia: "",
}

function paraPayload(e: EstadoChecklist): ChecklistPayload {
  const { etapa: _etapa, ...resto } = e
  return { ...resto, lacres: resto.lacres.map((l) => l.trim()).filter(Boolean), ocorrencia: resto.ocorrencia.trim() }
}

function temConteudo(e: EstadoChecklist) {
  return (
    e.operadores.length > 0 || !!e.inicioEm || !!e.veiculoNumero || Object.values(e.epis).some(Boolean) || !!e.ocorrencia
  )
}

const mapaErros = (lista: ErroValidacao[]): Erros => Object.fromEntries(lista.map((e) => [e.campo, e.mensagem]))

export function ChecklistWizard({
  pessoas,
  usuarioChave,
  erroSra,
}: {
  pessoas: PessoaSra[]
  usuarioChave: string
  erroSra: boolean
}) {
  // Desestruturado: os callbacks são estáveis (useCallback); o objeto retornado não é,
  // e usá-lo como dependência de useEffect causaria loop de renderização.
  const rascunho = useRascunho<EstadoChecklist>(`amyris:rascunho:checklist-carregamento:${usuarioChave}`)
  const { ler, salvar, limpar } = rascunho // não usar `rascunho.*` direto
  const [estado, setEstado] = useState<EstadoChecklist>(VAZIO)
  const [oferta, setOferta] = useState<EstadoChecklist | null>(null)
  const [pronto, setPronto] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [errosServidor, setErrosServidor] = useState<Erros>({})
  const [falhaEnvio, setFalhaEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviadoId, setEnviadoId] = useState<number | null>(null)

  const porId = useMemo(() => new Map(pessoas.map((p) => [p.id, p])), [pessoas])

  // Oferece retomar o rascunho salvo (descarta pessoas que saíram da escala).
  useEffect(() => {
    const salvo = ler()
    if (salvo && temConteudo(salvo)) {
      setOferta({ ...VAZIO, ...salvo, operadores: salvo.operadores.filter((id) => porId.has(id)) })
    }
    setPronto(true)
  }, [ler, porId])

  // Auto-save a cada mudança (não sobrescreve o rascunho enquanto a oferta está aberta).
  useEffect(() => {
    if (pronto && !oferta && enviadoId === null && temConteudo(estado)) salvar(estado)
  }, [estado, pronto, oferta, enviadoId, salvar])

  const payload = paraPayload(estado)
  const erros: Erros = tentouEnviar ? { ...mapaErros(validarChecklist(payload, pessoas)), ...errosServidor } : {}

  function mudar<K extends keyof EstadoChecklist>(campo: K, valor: EstadoChecklist[K]) {
    setErrosServidor({})
    setEstado((s) => ({ ...s, [campo]: valor }))
  }
  const irPara = (etapa: Etapa) => setEstado((s) => ({ ...s, etapa }))

  async function enviar() {
    setTentouEnviar(true)
    setFalhaEnvio(null)
    const locais = validarChecklist(payload, pessoas)
    if (locais.length > 0) {
      irPara(etapaDoCampo(locais[0].campo))
      return
    }
    setEnviando(true)
    try {
      const r = await fetch("/api/formularios/checklist-carregamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const corpo = await r.json().catch(() => ({}))
      if (r.status === 201) {
        limpar()
        setEnviadoId(corpo.id as number)
        return
      }
      if (r.status === 422 && Array.isArray(corpo.erros) && corpo.erros.length > 0) {
        setErrosServidor(mapaErros(corpo.erros as ErroValidacao[]))
        irPara(etapaDoCampo((corpo.erros as ErroValidacao[])[0].campo))
        return
      }
      if (r.status === 401) {
        setFalhaEnvio("Sua sessão expirou. Entre de novo — o preenchimento continua salvo no aparelho.")
        return
      }
      setFalhaEnvio(typeof corpo.error === "string" ? corpo.error : "Não foi possível enviar. Tente de novo.")
    } catch {
      setFalhaEnvio("Sem conexão. Seus dados estão salvos no aparelho — tente enviar de novo quando o sinal voltar.")
    } finally {
      setEnviando(false)
    }
  }

  function novo() {
    setEstado(VAZIO)
    setTentouEnviar(false)
    setErrosServidor({})
    setEnviadoId(null)
  }

  if (enviadoId !== null) return <ConfirmacaoEnvio id={enviadoId} onNovo={novo} />

  const etapa = estado.etapa
  const operadores = estado.operadores.map((id) => porId.get(id)).filter((p): p is PessoaSra => !!p)

  return (
    <div className="pt-1">
      {erroSra && (
        <p className="mb-3 rounded-xl bg-[rgba(217,45,45,.08)] p-3 text-sm font-medium text-[#C42B2B]">
          Não foi possível carregar a escala agora. Recarregue a página em instantes.
        </p>
      )}

      {oferta && (
        <div className="mb-4 rounded-2xl border border-[rgba(124,58,237,.35)] bg-[#F7F3FD] p-4">
          <p className="text-sm font-semibold text-[#201429]">Retomar preenchimento?</p>
          <p className="text-xs text-[#6B5E7B]">Há um checklist não enviado salvo neste aparelho.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => { setEstado(oferta); setOferta(null) }} className="h-9 flex-1 rounded-xl text-sm font-semibold text-white" style={{ background: GRAD }}>
              Retomar
            </button>
            <button type="button" onClick={() => { limpar(); setOferta(null) }} className="h-9 flex-1 rounded-xl border border-[#E7DEED] bg-white text-sm font-semibold text-[#5B4E6B]">
              Descartar
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => irPara(Math.max(1, etapa - 1) as Etapa)}
          aria-label="Etapa anterior"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-[rgba(75,0,133,.1)] bg-white/80 text-[#4B0085] hover:bg-[#F4F0FB]"
        >
          <ChevronLeft className="h-[19px] w-[19px]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7C3AED]">Ronda · Carregamento</p>
          <h2 className="font-display text-[19px] font-semibold tracking-[-0.01em] text-[#201429]">{TITULOS[etapa - 1]}</h2>
        </div>
        <span className="flex items-baseline gap-px text-[12px] font-semibold text-[#6D5E78]">
          <span className="text-[17px] text-[#4B0085]">{etapa}</span>/4
        </span>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-[7px]">
        {ABAS.map((rotulo, i) => {
          const n = (i + 1) as Etapa
          const atual = etapa === n
          return (
            <button
              key={rotulo}
              type="button"
              onClick={() => irPara(n)}
              className="h-[34px] rounded-xl text-[11px] font-semibold transition"
              style={{
                background: atual ? GRAD : etapa > n ? "#EDE4F8" : "#F6F2FB",
                color: atual ? "#fff" : etapa > n ? "#4B0085" : "#8F82A0",
                boxShadow: atual ? "0 10px 22px -12px rgba(75,0,133,.85)" : "none",
              }}
            >
              {rotulo}
            </button>
          )
        })}
      </div>
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-[#EDE6F6]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${etapa * 25}%`, background: GRAD, boxShadow: "0 0 14px rgba(124,58,237,.65)" }}
        />
      </div>

      {etapa === 1 && (
        <EtapaEquipe
          operadores={operadores}
          inicioEm={estado.inicioEm}
          fimEm={estado.fimEm}
          erros={erros}
          onRemover={(id) => mudar("operadores", estado.operadores.filter((c) => c !== id))}
          onAbrirBusca={() => setBuscaAberta(true)}
          onMudar={(campo, valor) => mudar(campo, valor)}
        />
      )}
      {etapa === 2 && (
        <EtapaEpis
          epis={estado.epis}
          qtdOperadores={estado.operadores.length}
          erros={erros}
          onMarcar={(codigo, valor) => mudar("epis", { ...estado.epis, [codigo]: valor })}
        />
      )}
      {etapa === 3 && (
        <EtapaVeiculo
          veiculoNumero={estado.veiculoNumero}
          veiculoCapacidade={estado.veiculoCapacidade}
          lacres={estado.lacres}
          erros={erros}
          onMudar={(campo, valor) => mudar(campo, valor)}
          onLacres={(lacres) => mudar("lacres", lacres)}
        />
      )}
      {etapa === 4 && (
        <EtapaResponsaveis pessoas={pessoas} estado={payload} erros={erros} onMudar={(campo, valor) => mudar(campo, valor)} />
      )}

      {falhaEnvio && <p className="mt-4 rounded-xl bg-[rgba(217,45,45,.08)] p-3 text-sm font-medium text-[#C42B2B]">{falhaEnvio}</p>}

      {/* bottom = NAV_HEIGHT (navMetrics.ts): mesma altura total, dinâmica, que a
          BottomNav renderiza (conteúdo + borda + área segura), então a CTA nunca fica
          coberta pela nav nem some para dentro do home indicator. */}
      <div
        className="fixed inset-x-0 z-20 mx-auto w-full max-w-[430px] bg-gradient-to-t from-[#FBF9FE] via-[#FBF9FE] to-transparent px-5 pb-3 pt-6"
        style={{ bottom: NAV_HEIGHT }}
      >
        <button
          type="button"
          disabled={enviando}
          onClick={() => (etapa === 4 ? enviar() : irPara((etapa + 1) as Etapa))}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] font-display text-[15px] font-semibold text-white transition active:scale-[.985] disabled:opacity-70"
          style={{ background: GRAD, boxShadow: "0 0 0 1px rgba(124,58,237,.2), 0 16px 34px -14px rgba(75,0,133,.8)" }}
        >
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {etapa === 4 ? (enviando ? "Enviando…" : "Enviar checklist") : "Continuar"}
          {!enviando && <ArrowRight className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <OperadoresSheet
        aberto={buscaAberta}
        pessoas={pessoas}
        selecionados={estado.operadores}
        onAlternar={(id) =>
          mudar(
            "operadores",
            estado.operadores.includes(id) ? estado.operadores.filter((c) => c !== id) : [...estado.operadores, id],
          )
        }
        onFechar={() => setBuscaAberta(false)}
      />
    </div>
  )
}
