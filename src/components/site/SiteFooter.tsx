import Link from "next/link"

import { AmyrisLogo } from "@/components/brand/AmyrisLogo"
import { InhausLogo } from "@/components/brand/InhausLogo"

export function SiteFooter() {
  return (
    <footer className="relative border-t border-amyris/10 bg-white/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <AmyrisLogo className="h-6" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Indicadores da operação logística, em tempo real, no padrão de qualidade que a
            Amyris confia.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-display font-semibold text-foreground">Navegação</p>
          <Link href="/dashboards" className="block text-muted-foreground hover:text-amyris">
            Dashboards
          </Link>
          <Link href="/sobre" className="block text-muted-foreground hover:text-amyris">
            Sobre a In-Haus
          </Link>
          <Link href="/login" className="block text-muted-foreground hover:text-amyris">
            Entrar
          </Link>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-display font-semibold text-foreground">Desenvolvido por</p>
          <InhausLogo />
          <p className="text-muted-foreground">
            Operação logística inteligente para empresas de biotecnologia.
          </p>
        </div>
      </div>

      <div className="border-t border-amyris/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Amyris × In-Haus. Todos os direitos reservados.</p>
          <p>Hub de Indicadores Logísticos</p>
        </div>
      </div>
    </footer>
  )
}
