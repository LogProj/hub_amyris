import { cn } from "@/lib/utils"

/**
 * Logo oficial da In-Haus (agência) — SVG bicolor (teal #027193 + cinza #676969).
 * Em fundos escuros, use `onDark` para renderizar a marca em branco (filtro).
 * O tamanho é controlado pela altura via `className` (ex.: "h-6").
 */
export function InhausLogo({
  className,
  onDark = false,
}: {
  className?: string
  onDark?: boolean
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo_inhaus.svg"
      alt="In-Haus"
      className={cn(
        "inline-block h-6 w-auto select-none align-middle",
        onDark && "brightness-0 invert",
        className,
      )}
    />
  )
}
