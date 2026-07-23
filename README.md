# Amyris Hub · Indicadores Logísticos

SaaS desenvolvido pela **In-Haus** para a **Amyris** — o ambiente onde a operação
logística é acompanhada por indicadores em tempo real. Esta primeira entrega traz a
**base pronta** (hero, navegação, painel interno e autenticação), sem indicadores ainda.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · shadcn/ui ·
Prisma + PostgreSQL · Recharts · **ogl** (3D WebGL) · lucide-react. Deploy: **Vercel**.

## Estrutura

```
src/
  app/
    page.tsx            Hero/landing (fundo 3D WebGL)
    dashboards/         Painel interno (sidebar + topbar) — estado vazio
    guias/              Central de guias
    sobre/              Sobre a In-Haus (sotaque teal)
    login/              Login (split-screen 3D) com ramo 2FA
    api/auth/           login · 2fa/verify · session · logout (global_auth)
  components/
    HeroCanvas.tsx      Fundo 3D (ogl) com fallback + reduced-motion
    TiltCard.tsx        Hover 3D que segue o cursor
    brand/              AmyrisLogo · InhausLogo
    site/               SiteHeader · SiteFooter
    dashboard/          DashboardShell · DashboardSidebar
    auth/LoginForm.tsx
    ui/                 button · card · input · label (shadcn)
  lib/
    global-auth.ts      Cliente HTTP do global_auth (server-only)
    auth-session.ts     Sessão por cookies httpOnly + refresh rotativo
    prisma.ts · utils.ts
prisma/schema.prisma    Espelho local do usuário (AuthUser)
```

## Design

- **Marca Amyris**: roxo `#4B0085` (primária), fundo lavanda, glassmorphism, sombras suaves.
- **Marca In-Haus**: teal `#027193` (seção "Sobre").
- **Tipografia**: Space Grotesk (display) + Inter (corpo), self-hosted via `next/font`.
- **3D / movimento**: fundo WebGL no hero/login, cards com tilt 3D, hovers de 150–300ms,
  tudo respeitando `prefers-reduced-motion`.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha os valores
npm run dev            # http://localhost:3000
```

## Variáveis de ambiente (Vercel — sem aspas)

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres (espelho de usuário / RBAC local) |
| `AUTH_BASE_URL` | Base do global_auth **sem** `/api/v1` |
| `AUTH_API_KEY` | Chave server-only do projeto no global_auth |
| `AUTH_ACCESS_COOKIE_MAX_AGE_SECONDS` | Opcional (padrão 12h) |
| `AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS` | Opcional (padrão 90d) |

## Autenticação (global_auth)

Integração **somente do método** de autenticação (login, 2FA, sessão por cookies
httpOnly, refresh rotativo), espelhando hub_bridgestone/fleury/qssma. O global_auth é a
fonte de identidade — **este app não modifica o serviço/banco dele**.

A **regra de acesso** (quem vê o quê) é deste projeto e mora em `resolveAuthorization`
(`src/lib/auth-session.ts`), hoje **permissiva** (identidade ativa entra). Será detalhada
junto com os indicadores.

## Próximos passos

1. Configurar `AUTH_BASE_URL` / `AUTH_API_KEY` e `DATABASE_URL` na Vercel.
2. Implementar o RBAC fino em `resolveAuthorization` (papéis/telas/hierarquia).
3. Construir os indicadores (dashboards) e publicar os guias.
