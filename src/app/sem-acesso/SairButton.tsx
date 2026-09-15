"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function SairButton() {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  const handleSair = async () => {
    setSaindo(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      /* logout local não depende do servidor */
    }
    router.push("/login")
  }

  return (
    <button
      type="button"
      onClick={handleSair}
      disabled={saindo}
      className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-amyris-grad px-5 text-sm font-medium text-white shadow-soft transition-opacity disabled:opacity-60"
    >
      {saindo ? "Saindo…" : "Sair"}
    </button>
  )
}
