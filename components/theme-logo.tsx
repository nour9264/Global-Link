"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface ThemeLogoProps {
  width?: number
  height?: number
  className?: string
}

export function ThemeLogo({ width = 160, height = 80, className = "w-full h-auto" }: ThemeLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={className} style={{ maxWidth: width, height: 'auto' }}>
        <img
          src="/images/globallink-logo.png"
          alt="GlobalLink"
          width={width}
          height={height}
          className="w-full h-auto object-contain"
        />
      </div>
    )
  }

  const isDark = resolvedTheme === "dark"
  const logoSrc = isDark ? "/images/globallink-logo-dark.png" : "/images/globallink-logo.png"

  return (
    <div className={className} style={{ maxWidth: width, height: 'auto' }}>
      <img
        src={logoSrc}
        alt="GlobalLink"
        width={width}
        height={height}
        className="w-full h-auto object-contain"
      />
    </div>
  )
}
