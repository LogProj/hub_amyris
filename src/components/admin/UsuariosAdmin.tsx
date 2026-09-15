"use client"

import { useCallback, useEffect, useState } from "react"
import {
  UserPlus,
  ShieldCheck,
  ShieldOff,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Search,
  Monitor,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UsuarioAdminRow, UsuariosResponse } from "@/lib/admin-types"
import { HUB_SCREENS, HUB_SCREEN_KEYS } from "@/lib/screens"

/** Telas deste hub dentro de uma lista que pode conter chaves de outros hubs
 * (compartilham a mesma tabela) — usada só para exibição/edição no admin; o
 * que é enviado ao salvar já é saneado e mesclado no servidor. */
function telasDesteHub(visibleScreens: string[] | null | undefined): string[] {
  const conhecidas = new Set(HUB_SCREEN_KEYS)
  return (visibleScreens ?? []).filter((k) => conhecidas.has(k))
}

const EMPTY_FORM = { nome: "", email: "", cpf: "", senha: "", isAdmin: false }

export function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // chave da linha em ação
  const [q, setQ] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErro, setFormErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  // editor de telas (visibilidade por usuário)
  const [telasUser, setTelasUser] = useState<UsuarioAdminRow | null>(null)
  const [telasSel, setTelasSel] = useState<string[]>([])

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch("/api/admin/usuarios", { cache: "no-store" })
      const data = (await res.json().catch(() => ({}))) as UsuariosResponse & { error?: string }
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível carregar os usuários.")
        return
      }
      setUsuarios(data.usuarios ?? [])
      setAviso(data.globalAuthError ?? null)
    } catch {
      setErro("Falha de conexão ao carregar os usuários.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function patch(u: UsuarioAdminRow, body: Record<string, unknown>, key: string) {
    if (u.localId == null) return
    setBusy(key)
    try {
      const res = await fetch(`/api/admin/usuarios/${u.localId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível atualizar.")
        return
      }
      await carregar()
    } finally {
      setBusy(null)
    }
  }

  async function conceder(u: UsuarioAdminRow) {
    const key = `grant:${u.email}`
    setBusy(key)
    try {
      const res = await fetch("/api/admin/usuarios/conceder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.email, authUserId: u.authUserId, nome: u.nome }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível conceder o acesso.")
        return
      }
      await carregar()
    } finally {
      setBusy(null)
    }
  }

  async function revogar(u: UsuarioAdminRow) {
    if (u.localId == null) return
    if (!confirm(`Revogar o acesso de ${u.email} ao sistema?`)) return
    const key = `revoke:${u.localId}`
    setBusy(key)
    try {
      const res = await fetch(`/api/admin/usuarios/${u.localId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível revogar o acesso.")
        return
      }
      await carregar()
    } finally {
      setBusy(null)
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setFormErro(null)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFormErro(data?.error ?? "Não foi possível cadastrar.")
        return
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  function abrirTelas(u: UsuarioAdminRow) {
    setTelasUser(u)
    setTelasSel(telasDesteHub(u.visibleScreens))
  }

  function toggleTela(key: string) {
    setTelasSel((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  async function salvarTelas() {
    if (!telasUser) return
    await patch(telasUser, { visibleScreens: telasSel }, `telas:${telasUser.localId}`)
    setTelasUser(null)
  }

  const filtrados = usuarios.filter((u) => {
    const t = `${u.nome ?? ""} ${u.email}`.toLowerCase()
    return t.includes(q.toLowerCase())
  })
  const comAcesso = usuarios.filter((u) => u.comAcesso).length

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* cabeçalho */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Usuários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {comAcesso} com acesso · {usuarios.length} no global_auth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => carregar()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setShowForm(true)}>
            <UserPlus className="h-4 w-4" />
            Novo usuário
          </Button>
        </div>
      </div>

      {aviso && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {aviso}
        </div>
      )}
      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      {/* busca */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          className="pl-9"
        />
      </div>

      {/* tabela */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Usuário</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Acesso</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Telas</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => {
                  const k = u.localId != null ? `id:${u.localId}` : `em:${u.email}`
                  return (
                    <tr key={k} className="transition-colors hover:bg-amyris-mist/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{u.nome ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.type ?? "—"}</td>
                      <td className="px-4 py-3">
                        {u.comAcesso ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amyris-mist px-2.5 py-1 text-xs font-medium text-amyris">
                            <Check className="h-3 w-3" /> Autorizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            <X className="h-3 w-3" /> Sem acesso
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.comAcesso ? (
                          <button
                            onClick={() => patch(u, { isAdmin: !u.isAdmin }, `admin:${u.localId}`)}
                            disabled={busy === `admin:${u.localId}`}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                              u.isAdmin
                                ? "bg-amyris text-white hover:bg-amyris-violet"
                                : "bg-muted text-muted-foreground hover:bg-amyris-mist hover:text-amyris",
                            )}
                          >
                            {busy === `admin:${u.localId}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3 w-3" />
                            )}
                            {u.isAdmin ? "Admin" : "Tornar admin"}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.comAcesso ? (
                          u.isAdmin ? (
                            <span className="text-xs text-muted-foreground">Todas</span>
                          ) : (
                            <button
                              onClick={() => abrirTelas(u)}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-amyris-mist hover:text-amyris"
                            >
                              <Monitor className="h-3 w-3" />
                              {telasDesteHub(u.visibleScreens).length} de {HUB_SCREENS.length}
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {u.comAcesso ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revogar(u)}
                              disabled={busy === `revoke:${u.localId}`}
                              className="border-destructive/30 text-destructive hover:bg-destructive/5"
                            >
                              {busy === `revoke:${u.localId}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ShieldOff className="h-4 w-4" />
                              )}
                              Revogar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="gradient"
                              onClick={() => conceder(u)}
                              disabled={busy === `grant:${u.email}`}
                            >
                              {busy === `grant:${u.email}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Conceder acesso
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* modal de telas (visibilidade por usuário) */}
      {telasUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-amyris-ink/40 backdrop-blur-sm" onClick={() => setTelasUser(null)} />
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold text-foreground">Telas visíveis</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha os painéis que <span className="font-medium text-foreground">{telasUser.nome ?? telasUser.email}</span> poderá acessar.
            </p>
            <div className="mt-5 space-y-1">
              {HUB_SCREENS.map((s) => (
                <label
                  key={s.key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-amyris-mist/40"
                >
                  <input
                    type="checkbox"
                    checked={telasSel.includes(s.key)}
                    onChange={() => toggleTela(s.key)}
                    className="h-4 w-4 rounded border-input accent-amyris"
                  />
                  <span className="text-sm text-foreground">{s.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTelasSel(telasSel.length === HUB_SCREENS.length ? [] : HUB_SCREENS.map((s) => s.key))}
                className="text-xs font-medium text-amyris hover:underline"
              >
                {telasSel.length === HUB_SCREENS.length ? "Desmarcar todas" : "Marcar todas"}
              </button>
              <span className="text-xs text-muted-foreground">{telasSel.length} selecionada(s)</span>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setTelasUser(null)} disabled={busy === `telas:${telasUser.localId}`}>
                Cancelar
              </Button>
              <Button type="button" variant="gradient" onClick={salvarTelas} disabled={busy === `telas:${telasUser.localId}`}>
                {busy === `telas:${telasUser.localId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* modal de criação */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-amyris-ink/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold text-foreground">Novo usuário</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cria a identidade no global_auth e concede acesso a este sistema.
            </p>
            <form onSubmit={criar} className="mt-5 space-y-4">
              {formErro && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {formErro}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="f-nome">Nome</Label>
                <Input id="f-nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-email">E-mail</Label>
                <Input id="f-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="f-cpf">CPF</Label>
                  <Input
                    id="f-cpf"
                    inputMode="numeric"
                    required
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                    placeholder="11 dígitos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-senha">Senha inicial</Label>
                  <Input id="f-senha" type="password" required value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={form.isAdmin}
                  onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
                  className="h-4 w-4 rounded border-input accent-amyris"
                />
                Conceder também perfil de administrador
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={salvando}>
                  Cancelar
                </Button>
                <Button type="submit" variant="gradient" disabled={salvando}>
                  {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Criar usuário
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
