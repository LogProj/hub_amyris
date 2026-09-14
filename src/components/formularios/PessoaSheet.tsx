"use client"

import type { PessoaSra } from "@/lib/formularios/regras"
import { ListaPessoas } from "./ListaPessoas"
import { Sheet } from "./Sheet"

export function PessoaSheet({
  aberto,
  titulo,
  subtitulo,
  pessoas,
  selecionado,
  onSelecionar,
  onFechar,
}: {
  aberto: boolean
  titulo: string
  subtitulo?: string
  pessoas: PessoaSra[]
  selecionado: string
  onSelecionar: (cpf: string) => void
  onFechar: () => void
}) {
  return (
    <Sheet aberto={aberto} titulo={titulo} subtitulo={subtitulo} onFechar={onFechar}>
      <ListaPessoas
        aberto={aberto}
        pessoas={pessoas}
        modo="unica"
        selecionado={selecionado}
        onSelecionar={(cpf) => {
          onSelecionar(cpf)
          onFechar()
        }}
        ocultarBuscaSeCurta
      />
    </Sheet>
  )
}
