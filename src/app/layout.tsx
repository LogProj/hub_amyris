import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Amyris Hub · Indicadores Logísticos",
    template: "%s · Amyris Hub",
  },
  description:
    "Hub de indicadores da operação logística da Amyris, desenvolvido pela In-Haus. Clareza, controle e confiança em tempo real.",
  icons: { icon: "/logo_amyris.svg" },
}

export const viewport: Viewport = {
  themeColor: "#4B0085",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
