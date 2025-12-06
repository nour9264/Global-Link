"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getAllCountries, type CountryData } from "@/lib/country-utils"

interface CountrySelectorProps {
  value?: string
  onValueChange: (country: string) => void
  disabled?: boolean
  className?: string
}

export function CountrySelector({
  value,
  onValueChange,
  disabled = false,
  className,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [countries, setCountries] = React.useState<CountryData[]>([])

  // Load all countries from libphonenumber-js
  React.useEffect(() => {
    try {
      const allCountries = getAllCountries()
      setCountries(allCountries)
    } catch (error) {
      console.error("Error loading countries:", error)
      setCountries([])
    }
  }, [])

  const selectedCountry = React.useMemo(() => {
    if (!value) return undefined
    return countries.find((country) => country.name === value || country.code === value)
  }, [value, countries])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10",
            !selectedCountry && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {selectedCountry ? (
              <span className="truncate">{selectedCountry.name}</span>
            ) : (
              <span>Select country...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code} ${country.phoneCode}`}
                  onSelect={() => {
                    onValueChange(country.name)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="flex-1 font-medium">{country.name}</span>
                  <span className="text-sm text-muted-foreground">{country.phoneCode}</span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4 flex-shrink-0",
                      selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

