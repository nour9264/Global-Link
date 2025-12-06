// Country data with flags and phone codes
export interface Country {
  name: string
  code: string // ISO 3166-1 alpha-2 code
  phoneCode: string
  flag: string // Unicode flag emoji
}

export const countries: Country[] = [
  { name: "United States", code: "US", phoneCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", phoneCode: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "CA", phoneCode: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", phoneCode: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", phoneCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", phoneCode: "+33", flag: "🇫🇷" },
  { name: "Italy", code: "IT", phoneCode: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "ES", phoneCode: "+34", flag: "🇪🇸" },
  { name: "Netherlands", code: "NL", phoneCode: "+31", flag: "🇳🇱" },
  { name: "Belgium", code: "BE", phoneCode: "+32", flag: "🇧🇪" },
  { name: "Switzerland", code: "CH", phoneCode: "+41", flag: "🇨🇭" },
  { name: "Austria", code: "AT", phoneCode: "+43", flag: "🇦🇹" },
  { name: "Sweden", code: "SE", phoneCode: "+46", flag: "🇸🇪" },
  { name: "Norway", code: "NO", phoneCode: "+47", flag: "🇳🇴" },
  { name: "Denmark", code: "DK", phoneCode: "+45", flag: "🇩🇰" },
  { name: "Finland", code: "FI", phoneCode: "+358", flag: "🇫🇮" },
  { name: "Poland", code: "PL", phoneCode: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", phoneCode: "+351", flag: "🇵🇹" },
  { name: "Greece", code: "GR", phoneCode: "+30", flag: "🇬🇷" },
  { name: "Ireland", code: "IE", phoneCode: "+353", flag: "🇮🇪" },
  { name: "Czech Republic", code: "CZ", phoneCode: "+420", flag: "🇨🇿" },
  { name: "Romania", code: "RO", phoneCode: "+40", flag: "🇷🇴" },
  { name: "Hungary", code: "HU", phoneCode: "+36", flag: "🇭🇺" },
  { name: "Bulgaria", code: "BG", phoneCode: "+359", flag: "🇧🇬" },
  { name: "Croatia", code: "HR", phoneCode: "+385", flag: "🇭🇷" },
  { name: "Slovakia", code: "SK", phoneCode: "+421", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", phoneCode: "+386", flag: "🇸🇮" },
  { name: "Estonia", code: "EE", phoneCode: "+372", flag: "🇪🇪" },
  { name: "Latvia", code: "LV", phoneCode: "+371", flag: "🇱🇻" },
  { name: "Lithuania", code: "LT", phoneCode: "+370", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", phoneCode: "+352", flag: "🇱🇺" },
  { name: "Malta", code: "MT", phoneCode: "+356", flag: "🇲🇹" },
  { name: "Cyprus", code: "CY", phoneCode: "+357", flag: "🇨🇾" },
  { name: "Egypt", code: "EG", phoneCode: "+20", flag: "🇪🇬" },
  { name: "Saudi Arabia", code: "SA", phoneCode: "+966", flag: "🇸🇦" },
  { name: "United Arab Emirates", code: "AE", phoneCode: "+971", flag: "🇦🇪" },
  { name: "Qatar", code: "QA", phoneCode: "+974", flag: "🇶🇦" },
  { name: "Kuwait", code: "KW", phoneCode: "+965", flag: "🇰🇼" },
  { name: "Bahrain", code: "BH", phoneCode: "+973", flag: "🇧🇭" },
  { name: "Oman", code: "OM", phoneCode: "+968", flag: "🇴🇲" },
  { name: "Jordan", code: "JO", phoneCode: "+962", flag: "🇯🇴" },
  { name: "Lebanon", code: "LB", phoneCode: "+961", flag: "🇱🇧" },
  { name: "Iraq", code: "IQ", phoneCode: "+964", flag: "🇮🇶" },
  { name: "Syria", code: "SY", phoneCode: "+963", flag: "🇸🇾" },
  { name: "Yemen", code: "YE", phoneCode: "+967", flag: "🇾🇪" },
  { name: "Israel", code: "IL", phoneCode: "+972", flag: "🇮🇱" },
  { name: "Turkey", code: "TR", phoneCode: "+90", flag: "🇹🇷" },
  { name: "Iran", code: "IR", phoneCode: "+98", flag: "🇮🇷" },
  { name: "Pakistan", code: "PK", phoneCode: "+92", flag: "🇵🇰" },
  { name: "India", code: "IN", phoneCode: "+91", flag: "🇮🇳" },
  { name: "Bangladesh", code: "BD", phoneCode: "+880", flag: "🇧🇩" },
  { name: "China", code: "CN", phoneCode: "+86", flag: "🇨🇳" },
  { name: "Japan", code: "JP", phoneCode: "+81", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", phoneCode: "+82", flag: "🇰🇷" },
  { name: "Singapore", code: "SG", phoneCode: "+65", flag: "🇸🇬" },
  { name: "Malaysia", code: "MY", phoneCode: "+60", flag: "🇲🇾" },
  { name: "Thailand", code: "TH", phoneCode: "+66", flag: "🇹🇭" },
  { name: "Indonesia", code: "ID", phoneCode: "+62", flag: "🇮🇩" },
  { name: "Philippines", code: "PH", phoneCode: "+63", flag: "🇵🇭" },
  { name: "Vietnam", code: "VN", phoneCode: "+84", flag: "🇻🇳" },
  { name: "New Zealand", code: "NZ", phoneCode: "+64", flag: "🇳🇿" },
  { name: "South Africa", code: "ZA", phoneCode: "+27", flag: "🇿🇦" },
  { name: "Nigeria", code: "NG", phoneCode: "+234", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", phoneCode: "+254", flag: "🇰🇪" },
  { name: "Ghana", code: "GH", phoneCode: "+233", flag: "🇬🇭" },
  { name: "Morocco", code: "MA", phoneCode: "+212", flag: "🇲🇦" },
  { name: "Algeria", code: "DZ", phoneCode: "+213", flag: "🇩🇿" },
  { name: "Tunisia", code: "TN", phoneCode: "+216", flag: "🇹🇳" },
  { name: "Libya", code: "LY", phoneCode: "+218", flag: "🇱🇾" },
  { name: "Sudan", code: "SD", phoneCode: "+249", flag: "🇸🇩" },
  { name: "Ethiopia", code: "ET", phoneCode: "+251", flag: "🇪🇹" },
  { name: "Tanzania", code: "TZ", phoneCode: "+255", flag: "🇹🇿" },
  { name: "Uganda", code: "UG", phoneCode: "+256", flag: "🇺🇬" },
  { name: "Brazil", code: "BR", phoneCode: "+55", flag: "🇧🇷" },
  { name: "Argentina", code: "AR", phoneCode: "+54", flag: "🇦🇷" },
  { name: "Mexico", code: "MX", phoneCode: "+52", flag: "🇲🇽" },
  { name: "Chile", code: "CL", phoneCode: "+56", flag: "🇨🇱" },
  { name: "Colombia", code: "CO", phoneCode: "+57", flag: "🇨🇴" },
  { name: "Peru", code: "PE", phoneCode: "+51", flag: "🇵🇪" },
  { name: "Venezuela", code: "VE", phoneCode: "+58", flag: "🇻🇪" },
  { name: "Ecuador", code: "EC", phoneCode: "+593", flag: "🇪🇨" },
  { name: "Bolivia", code: "BO", phoneCode: "+591", flag: "🇧🇴" },
  { name: "Paraguay", code: "PY", phoneCode: "+595", flag: "🇵🇾" },
  { name: "Uruguay", code: "UY", phoneCode: "+598", flag: "🇺🇾" },
  { name: "Russia", code: "RU", phoneCode: "+7", flag: "🇷🇺" },
  { name: "Ukraine", code: "UA", phoneCode: "+380", flag: "🇺🇦" },
  { name: "Belarus", code: "BY", phoneCode: "+375", flag: "🇧🇾" },
  { name: "Kazakhstan", code: "KZ", phoneCode: "+7", flag: "🇰🇿" },
  { name: "Uzbekistan", code: "UZ", phoneCode: "+998", flag: "🇺🇿" },
]

// Helper function to get country by code
export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code)
}

// Helper function to get country by name
export function getCountryByName(name: string): Country | undefined {
  return countries.find((c) => c.name.toLowerCase() === name.toLowerCase())
}

// Helper function to get phone code by country name
export function getPhoneCodeByCountry(countryName: string): string {
  const country = getCountryByName(countryName)
  return country?.phoneCode || ""
}

