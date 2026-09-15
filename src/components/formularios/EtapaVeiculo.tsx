"use client"

import { Lock, Plus, Trash2, Truck } from "lucide-react"
import { MAX_LACRES } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { Campo, Cartao, MensagemErro, classeInput } from "./ui"

export function EtapaVeiculo({
  veiculoNumero,
  veiculoCapacidade,
  lacres,
  erros,
  onMudar,
  onLacres,
}: {
  veiculoNumero: string
  veiculoCapacidade: string
  lacres: string[]
  erros: Erros
  onMudar: (campo: "veiculoNumero" | "veiculoCapacidade", valor: string) => void
  onLacres: (lacres: string[]) => void
}) {
  return (
    <div className="space-y-3.5">
      <Cartao icone={Truck} titulo="Veículo">
        <div className="grid grid-cols-2 gap-2.5">
          <Campo rotulo="N° do veículo" erro={erros.veiculoNumero}>
            <input value={veiculoNumero} onChange={(e) => onMudar("veiculoNumero", e.target.value)} placeholder="Ex. 1042" className={classeInput} />
          </Campo>
          <Campo rotulo="Capacidade" erro={erros.veiculoCapacidade}>
            <input value={veiculoCapacidade} onChange={(e) => onMudar("veiculoCapacidade", e.target.value)} placeholder="Ex. 28 t" className={classeInput} />
          </Campo>
        </div>
      </Cartao>

      <Cartao icone={Lock} titulo="Lacres" subtitulo={`Até ${MAX_LACRES} · adicione conforme o uso`}>
        <div className="space-y-2.5">
          {lacres.map((valor, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <Campo rotulo={`Lacre ${i + 1}`}>
                  <input
                    value={valor}
                    onChange={(e) => onLacres(lacres.map((l, j) => (j === i ? e.target.value : l)))}
                    placeholder="Número do lacre"
                    className={classeInput}
                  />
                </Campo>
              </div>
              <button
                type="button"
                onClick={() => onLacres(lacres.filter((_, j) => j !== i))}
                aria-label={`Remover lacre ${i + 1}`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#E7DEED] text-[#A79BB0] hover:border-[rgba(196,43,43,.3)] hover:bg-[rgba(217,45,45,.06)] hover:text-[#C42B2B]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {lacres.length < MAX_LACRES && (
            <button
              type="button"
              onClick={() => onLacres([...lacres, ""])}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[rgba(124,58,237,.42)] bg-[rgba(244,240,251,.7)] text-[13px] font-semibold text-[#4B0085] hover:border-[#7C3AED] hover:bg-[#F4F0FB]"
            >
              <Plus className="h-4 w-4" /> Adicionar lacre
            </button>
          )}
          <MensagemErro texto={erros.lacres} />
        </div>
      </Cartao>
    </div>
  )
}
