import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/role-selection"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  // Protected routes
  const buyerRoutes = ["/buyer"]
  const travelerRoutes = ["/traveler"]

  const isBuyerRoute = buyerRoutes.some((route) => pathname.startsWith(route))
  const isTravelerRoute = travelerRoutes.some((route) => pathname.startsWith(route))

  // If it's a public route, allow access
  if (isPublicRoute) {
    // If user is already authenticated and tries to access login/signup, redirect to dashboard
    const token = request.cookies.get("authToken")?.value || 
                  request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (token && (pathname === "/login" || pathname === "/signup")) {
      // Try to get user from cookie or redirect to role selection
      const userStr = request.cookies.get("authUser")?.value
      if (userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr))
          if (user.activeMode === "Buyer") {
            return NextResponse.redirect(new URL("/buyer", request.url))
          } else if (user.activeMode === "Traveler") {
            return NextResponse.redirect(new URL("/traveler", request.url))
          }
        } catch {
          // Invalid user data, allow access
        }
      }
    }
    return NextResponse.next()
  }

  // For protected routes, check authentication
  if (isBuyerRoute || isTravelerRoute) {
    // Get token from cookie or header
    const token = request.cookies.get("authToken")?.value || 
                  request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      // No token, redirect to login
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Try to get user info from cookie
    const userStr = request.cookies.get("authUser")?.value
    if (userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))

        // Check if user has access to the requested route
        if (isBuyerRoute && user.activeMode !== "Buyer" && !user.isBuyerEnabled) {
          // User doesn't have buyer access
          return NextResponse.redirect(new URL("/role-selection", request.url))
        }

        if (isTravelerRoute && user.activeMode !== "Traveler" && !user.isTravelerEnabled) {
          // User doesn't have traveler access
          return NextResponse.redirect(new URL("/role-selection", request.url))
        }

        // Check token expiration
        const expiresAt = request.cookies.get("authExpiresAt")?.value
        if (expiresAt) {
          const expirationDate = new Date(expiresAt)
          if (expirationDate <= new Date()) {
            // Token expired, redirect to login
            const loginUrl = new URL("/login", request.url)
            loginUrl.searchParams.set("redirect", pathname)
            loginUrl.searchParams.set("expired", "true")
            return NextResponse.redirect(loginUrl)
          }
        }
      } catch {
        // Invalid user data, redirect to login
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

