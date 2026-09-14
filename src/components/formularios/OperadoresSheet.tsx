"use client"

import type { PessoaSra } from "@/lib/formularios/regras"
import { ListaPessoas } from "./ListaPessoas"
import { Sheet } from "./Sheet"

export function OperadoresSheet({
  aberto,
  pessoas,
  selecionados,
  onAlternar,
  onFechar,
}: {
  aberto: boolean
  pessoas: PessoaSra[]
  selecionados: string[]
  onAlternar: (cpf: string) => void
  onFechar: () => void
}) {
  return (
    <Sheet aberto={aberto} titulo="Operadores da SRA" subtitulo="Todos os ativos do CR · toque para adicionar" onFechar={onFechar}>
      <ListaPessoas aberto={aberto} pessoas={pessoas} modo="multipla" selecionados={selecionados} onSelecionar={onAlternar} />
    </Sheet>
  )
}
