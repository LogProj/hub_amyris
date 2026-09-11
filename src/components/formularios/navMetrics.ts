// Métricas da BottomNav (fixa, na base da tela) compartilhadas com quem precisa
// posicionar algo logo acima dela sem correr o risco de ficar coberto — hoje, a barra
// de CTA do ChecklistWizard. Se a nav mudar de altura, ajuste só aqui: BottomNav.tsx
// e ChecklistWizard.tsx (e MobileShell.tsx, para o respiro do <main>) leem daqui, então
// não têm como voltar a divergir.

// Altura útil dos botões da nav (ícone + rótulo + centralização) — a nav agora usa essa
// altura fixa em vez de depender do tamanho intrínseco do conteúdo, para o total ser
// previsível.
export const NAV_CONTENT_H = 64 // px

// Borda superior da nav (border-t).
export const NAV_BORDER_H = 1 // px

// Respiro inferior da nav: nunca menor que 8px, e cresce com a área segura do aparelho
// (home indicator em iPhones sem botão físico, por ex. ~34px).
export const NAV_SAFE_PAD = "max(env(safe-area-inset-bottom), 8px)"

// Altura total renderizada da BottomNav (conteúdo + borda + respiro/área segura).
export const NAV_HEIGHT = `calc(${NAV_CONTENT_H + NAV_BORDER_H}px + ${NAV_SAFE_PAD})`
