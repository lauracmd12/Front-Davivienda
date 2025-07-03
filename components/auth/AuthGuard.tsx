"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log("🚀 AuthGuard iniciado - Ruta:", pathname)
    
    // SOLO limpiar si estamos en la página de login Y no hay datos válidos
    const isLoginPage = pathname === '/'
    
    // Verificar estado actual ANTES de limpiar
    const currentToken = localStorage.getItem('token')
    const currentUser = localStorage.getItem('user')
    
    console.log("📋 Estado inicial:")
    console.log("  - Ruta:", pathname)
    console.log("  - Es login page:", isLoginPage)
    console.log("  - Token existe:", !!currentToken)
    console.log("  - User existe:", !!currentUser)
    
    // LÓGICA INTELIGENTE DE LIMPIEZA
    if (isLoginPage && !currentToken) {
      console.log("🧹 Limpiando solo porque estamos en login SIN token")
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.clear()
    } else if (isLoginPage && currentToken) {
      console.log("⚠️ En login page PERO hay token - posible login exitoso, NO limpiar")
    } else {
      console.log("✅ En ruta protegida, NO limpiar storage")
    }
    
    // Verificar estado DESPUÉS de posible limpieza
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    console.log("📋 Estado después de verificación:")
    console.log("  - Token final:", !!token)
    console.log("  - User final:", !!user)
    
    // Validar que los datos sean correctos
    let isValidAuth = false
    if (token && user) {
      try {
        const userData = JSON.parse(user)
        if (userData && token.length > 5) {
          isValidAuth = true
          console.log("✅ Autenticación válida detectada")
        } else {
          console.log("❌ Datos de auth inválidos")
        }
      } catch (e) {
        console.log("❌ Error parseando user data:", e)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    // Definir rutas
    const protectedRoutes = ['/dashboard', '/survey/create', '/survey/edit', '/survey/results']
    const needsAuth = protectedRoutes.some(route => pathname.startsWith(route))
    
    console.log("🛣️ Análisis de navegación:")
    console.log("  - Necesita auth:", needsAuth)
    console.log("  - Está autenticado:", isValidAuth)
    console.log("  - Es página login:", isLoginPage)
    
    // LÓGICA DE REDIRECCIÓN
    if (needsAuth && !isValidAuth) {
      console.log("❌ ACCIÓN: Necesita auth pero no está autenticado → Login")
      setTimeout(() => router.replace('/'), 100)
    } else if (isLoginPage && isValidAuth) {
      console.log("✅ ACCIÓN: Autenticado en login → Dashboard")
      setTimeout(() => router.replace('/dashboard'), 100)
    } else {
      console.log("✅ ACCIÓN: Estado correcto, mantener ruta")
    }
    
    setIsLoading(false)
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}