"use client"

import { useCallback } from "react"

// Rascunho em localStorage (por usuário). localStorage pode lançar (modo privado,
// armazenamento cheio): toda leitura/escrita é protegida e falha em silêncio.
export function useRascunho<T>(chave: string) {
  const ler = useCallback((): T | null => {
    try {
      const s = window.localStorage.getItem(chave)
      return s ? (JSON.parse(s) as T) : null
    } catch {
      return null
    }
  }, [chave])
  const salvar = useCallback(
    (valor: T) => {
      try {
        window.localStorage.setItem(chave, JSON.stringify(valor))
      } catch {}
    },
    [chave],
  )
  const limpar = useCallback(() => {
    try {
      window.localStorage.removeItem(chave)
    } catch {}
  }, [chave])
  return { ler, salvar, limpar }
}
