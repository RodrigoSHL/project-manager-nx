"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      disabled={!mounted}
      aria-label={
        mounted && resolvedTheme === "dark"
          ? "Activar modo claro"
          : "Activar modo oscuro"
      }
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun
        aria-hidden="true"
        className="size-4 -rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <Moon
        aria-hidden="true"
        className="absolute size-4 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0"
      />
    </Button>
  )
}
