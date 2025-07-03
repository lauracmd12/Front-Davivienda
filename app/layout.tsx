import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import AuthGuard from "@/components/auth/AuthGuard"  // ← AGREGAR ESTA LÍNEA

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Plataforma de Encuestas",
  description: "Crea y gestiona encuestas de manera profesional",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthGuard>  {/* ← AGREGAR ESTA LÍNEA */}
            {children}
          </AuthGuard>    {/* ← AGREGAR ESTA LÍNEA */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}