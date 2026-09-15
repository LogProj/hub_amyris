export function SemAcesso({ tela }: { tela: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-amyris/10 bg-amyris-mist/50 p-6 text-sm text-muted-foreground">
      Você não tem acesso a esta tela. Peça a um administrador para liberar <strong>{tela}</strong>.
    </div>
  )
}
