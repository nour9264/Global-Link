"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Light</span>
                <div className="relative inline-flex h-8 w-16 items-center rounded-full bg-muted">
                    <div className="h-6 w-6 rounded-full bg-background shadow-sm transition-transform duration-200" />
                </div>
            </div>
        )
    }

    const isDark = theme === "dark"

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                {isDark ? "Dark" : "Light"}
            </span>
            <button
                onClick={toggleTheme}
                className="relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                style={{
                    backgroundColor: isDark ? "#1e293b" : "#fbbf24",
                }}
                aria-label="Toggle theme"
            >
                {/* Sun Icon (visible in light mode) */}
                <Sun
                    className={`absolute left-1 h-6 w-6 text-white transition-all duration-300 ${isDark ? "opacity-0 scale-0" : "opacity-100 scale-100"
                        }`}
                />

                {/* Moon Icon (visible in dark mode) */}
                <Moon
                    className={`absolute right-1 h-6 w-6 text-white transition-all duration-300 ${isDark ? "opacity-100 scale-100" : "opacity-0 scale-0"
                        }`}
                />

                {/* Toggle Circle */}
                <span
                    className={`inline-block h-6 w-6 rounded-full bg-white shadow-lg transition-all duration-500 ease-in-out ${isDark ? "translate-x-8" : "translate-x-1"
                        }`}
                />
            </button>
        </div>
    )
}
