// Tipos compartilhados entre as rotas /api/admin/usuarios e a tela de admin.

// Linha do painel de usuários: identidade do global_auth + estado de acesso local.
export type UsuarioAdminRow = {
  localId: number | null
  authUserId: string | null
  email: string
  nome: string | null
  type: string | null
  isActiveGlobal: boolean
  lastLoginAt: string | null
  comAcesso: boolean // tem acesso a ESTE sistema (hasAccess local)
  isAdmin: boolean
  vinculado: boolean // já fez login (authUserId espelhado)
  cpf: string | null
  visibleScreens: string[] // telas locais liberadas (autorização deste projeto)
}

export type UsuariosResponse = {
  usuarios: UsuarioAdminRow[]
  globalAuthError?: string
}
