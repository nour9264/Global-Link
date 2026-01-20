import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 })
    }

    try {
        // Decode the URL if it was encoded
        const targetUrl = decodeURIComponent(url)

        // Validate that we are only proxying to allowed domains (security)
        // In this case, we primarily want to proxy the ngrok backend
        if (!targetUrl.startsWith("http")) {
            return new NextResponse("Invalid URL", { status: 400 })
        }

        const response = await fetch(targetUrl, {
            headers: {
                // Critical header to bypass ngrok browser warning
                "ngrok-skip-browser-warning": "true",
                "User-Agent": "GlobalLink-Frontend-Proxy",
            },
        })

        if (!response.ok) {
            console.error(`[ImageProxy] Failed to fetch ${targetUrl}: ${response.status} ${response.statusText}`)
            return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status })
        }

        const contentType = response.headers.get("Content-Type") || "application/octet-stream"
        const blob = await response.blob()

        return new NextResponse(blob, {
            headers: {
                "Content-Type": contentType,
                // Cache control to improve performance
                "Cache-Control": "public, max-age=3600",
            },
        })
    } catch (error) {
        console.error("[ImageProxy] Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
