"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, BarChart3, Users, Share2, Edit, Trash2, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiService } from "@/lib/api"
import type { Survey } from "@/types/survey"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))
    loadSurveys()
  }, [])

  // En tu Dashboard, SOLO cambia esta función:
const loadSurveys = async () => {
  try {
    console.log("🚀 Cargando encuestas...")
    
    const response = await apiService.getMySurveys()
    console.log("📥 Respuesta de encuestas:", response)
    
    if (response.status === 200 && response.data) {
      // ✅ SOLO ESTE CAMBIO - Verificar que sea array
      const surveysData = Array.isArray(response.data) ? response.data : []
      //setSurveys(surveysData)  // ← Usar surveysData en lugar de response.data
      console.log("✅ Encuestas cargadas:", surveysData)
    } else {
      console.log("❌ Error en respuesta:", response.message)
      //setSurveys([])
      toast({
        title: "Error",
        description: response.message || "No se pudieron cargar las encuestas.",
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("❌ Error cargando encuestas:", error)
    //setSurveys([])
    toast({
      title: "Error",
      description: "No se pudieron cargar las encuestas.",
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}

  const handleDeleteSurvey = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta encuesta?")) return

    try {
      await apiService.deleteSurvey(id)
      setSurveys(surveys.filter((s) => s.id !== id))
      toast({
        title: "Encuesta eliminada",
        description: "La encuesta ha sido eliminada correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la encuesta.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const copyShareLink = (surveyId: string) => {
    const link = `${window.location.origin}/survey/${surveyId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copiado",
      description: "El enlace de la encuesta ha sido copiado al portapapeles.",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b survey-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Bienvenido, {user?.name} {user?.company && `- ${user.company}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button className="survey-button-primary" onClick={() => router.push("/survey/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Encuesta
              </Button>
              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {surveys.map((survey) => (
            <Card key={survey.id} className="survey-card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{survey.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{survey.description}</CardDescription>
                  </div>
                  <Badge
                    variant={survey.isActive ? "default" : "secondary"}
                    className={survey.isActive ? "bg-red-600 dark:bg-red-500 text-white" : ""}
                  >
                    {survey.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {survey.responses?.length || 0} respuestas
                  </span>
                  <span>{survey.questions.length} preguntas</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => router.push(`/survey/${survey.id}/results`)}>
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Resultados
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyShareLink(survey.id)}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Compartir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/survey/${survey.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    //onClick={() => handleDeleteSurvey(survey.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {surveys.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No tienes encuestas aún</h3>
              <p className="text-muted-foreground mb-6">
                Comienza creando tu primera encuesta para recopilar información valiosa.
              </p>
              <Button className="survey-button-primary" onClick={() => router.push("/survey/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Encuesta
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
