import { inhausPool } from "@/lib/db-inhaus"
import { idDaPessoa } from "./identificadores"
import type { PessoaSra, PessoaSraServidor } from "./regras"

/**
 * Pessoas ATIVAS do CR Amyris (Barra Bonita) no snapshot mais recente da
 * public.vw_sra_amyris_diario — mesma fonte do Turnover/Absenteísmo. Sem filtro de
 * situação (NORMAL/FÉRIAS/AFASTADO entram todos), por decisão do negócio.
 */
export type LinhaSra = { cpf: string | null; nome: string | null; descricao_funcao: string | null }

export function mapearPessoas(rows: LinhaSra[]): PessoaSraServidor[] {
  return rows
    .filter((r) => r.cpf && r.cpf.trim())
    .map((r) => {
      const cpf = (r.cpf as string).trim()
      return {
        id: idDaPessoa(cpf),
        cpf,
        nome: (r.nome ?? "").trim() || "—",
        funcao: r.descricao_funcao?.trim() || null,
      }
    })
    .sort((a, b) => {
      // Coloca "—" (sem nome) no final
      if (a.nome === "—" && b.nome !== "—") return 1
      if (a.nome !== "—" && b.nome === "—") return -1
      return a.nome.localeCompare(b.nome, "pt-BR")
    })
}

/** Remove o CPF antes de mandar a lista para o Client Component / navegador. */
export function paraCliente(pessoas: PessoaSraServidor[]): PessoaSra[] {
  return pessoas.map(({ id, nome, funcao }) => ({ id, nome, funcao }))
}

export async function getPessoasSra(): Promise<PessoaSraServidor[]> {
  const { rows } = await inhausPool.query<LinhaSra>(
    `select distinct on (cpf) cpf, nome, descricao_funcao
       from public.vw_sra_amyris_diario
      where dt_demissao is null
        and data_referencia = (select max(data_referencia) from public.vw_sra_amyris_diario)
      order by cpf, data_referencia desc`,
  )
  return mapearPessoas(rows)
}
