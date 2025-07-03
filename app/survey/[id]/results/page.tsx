"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Users, Clock, TrendingUp, Share2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiService } from "@/lib/api"
import type { Survey } from "@/types/survey"
import { useToast } from "@/hooks/use-toast"

// Interfaces para los results
interface SurveyResponse {
  id: string;
  respondentEmail?: string;
  submittedAt: string;
  answers: SurveyAnswer[];
}

interface SurveyAnswer {
  questionId: string;
  value: string | string[];
}

interface SurveyStats {
  totalResponses: number;
  completionRate: number;
  averageTime: number;
  questionStats: QuestionStats[];
}

interface QuestionStats {
  questionId: string;
  responses: number;
  data: any[];
}

interface SurveyResponse {
  id: string;
  respondentEmail?: string;
  submittedAt: string;
  answers: SurveyAnswer[];
}

interface SurveyAnswer {
  questionId: string;
  value: string | string[];
}

interface SurveyStats {
  totalResponses: number;
  completionRate: number;
  averageTime: number;
  questionStats: QuestionStats[];
}

interface QuestionStats {
  questionId: string;
  responses: number;
  data: any[];
}

export default function SurveyResults() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    if (surveyId) {
      loadData()
    }
  }, [surveyId])

  const loadData = async () => {
    try {
      console.log("🚀 Cargando datos para encuesta:", surveyId)
      setIsLoading(true)
      setError(null)

      // Cargar encuesta
      console.log("📥 Cargando encuesta...")
      const surveyResponse = await apiService.getSurvey(surveyId)
      
      if (surveyResponse.status === 200 && surveyResponse.data) {
        //setSurvey(surveyResponse.data)
        console.log("✅ Encuesta cargada:", surveyResponse.data)
      } else {
        throw new Error(surveyResponse.message || "No se pudo cargar la encuesta")
      }

      // Cargar respuestas (opcional - puede fallar si no existe el endpoint)
      console.log("📥 Cargando respuestas...")
      try {
        const responsesData = await apiService.getSurveyResponses(surveyId)
        setResponses(responsesData || [])
        console.log("✅ Respuestas cargadas:", responsesData?.length || 0)
      } catch (error) {
        console.log("⚠️ No se pudieron cargar respuestas (endpoint no implementado):", error)
        setResponses([])
      }

      // Cargar estadísticas (opcional - puede fallar si no existe el endpoint)
      console.log("📥 Cargando estadísticas...")
      try {
        const statsData = await apiService.getSurveyStats(surveyId)
        setStats(statsData || generateMockStats())
        console.log("✅ Estadísticas cargadas:", statsData)
      } catch (error) {
        console.log("⚠️ No se pudieron cargar estadísticas (endpoint no implementado):", error)
        setStats(generateMockStats())
      }

    } catch (error: any) {
      console.error("❌ Error cargando datos:", error)
      setError(error.message || "Error al cargar los datos")
      
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generar estadísticas mock mientras el backend no esté listo
  const generateMockStats = (): SurveyStats => {
    const mockResponses = Math.floor(Math.random() * 50) + 10
    
    return {
      totalResponses: mockResponses,
      completionRate: Math.floor(Math.random() * 30) + 70,
      averageTime: Math.floor(Math.random() * 5) + 3,
      questionStats: survey?.questions.map(q => ({
        questionId: q.id || `question-${Math.random()}`,
        responses: mockResponses,
        data: generateMockQuestionData(q.type, mockResponses)
      })) || []
    }
  }

  const generateMockQuestionData = (type: string, totalResponses: number) => {
    switch (type) {
      case "radio":
      case "select":
        return [
          { option: "Opción 1", count: Math.floor(totalResponses * 0.4) },
          { option: "Opción 2", count: Math.floor(totalResponses * 0.3) },
          { option: "Opción 3", count: Math.floor(totalResponses * 0.2) },
          { option: "Opción 4", count: Math.floor(totalResponses * 0.1) },
        ]
      case "checkbox":
        return [
          { option: "Opción A", count: Math.floor(totalResponses * 0.6) },
          { option: "Opción B", count: Math.floor(totalResponses * 0.4) },
          { option: "Opción C", count: Math.floor(totalResponses * 0.3) },
        ]
      case "rating":
        return [
          { rating: 5, count: Math.floor(totalResponses * 0.3) },
          { rating: 4, count: Math.floor(totalResponses * 0.3) },
          { rating: 3, count: Math.floor(totalResponses * 0.2) },
          { rating: 2, count: Math.floor(totalResponses * 0.1) },
          { rating: 1, count: Math.floor(totalResponses * 0.1) },
        ]
      default:
        return []
    }
  }

  const copyShareLink = () => {
    const link = `${window.location.origin}/survey/${surveyId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copiado",
      description: "El enlace de la encuesta ha sido copiado al portapapeles.",
    })
  }

  const exportResults = () => {
    if (!survey || !responses) {
      toast({
        title: "No hay datos",
        description: "No hay respuestas para exportar.",
        variant: "destructive",
      })
      return
    }

    const csvContent = generateCSV(survey, responses)
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${survey.title}-resultados.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Archivo descargado",
      description: "Los resultados se han exportado correctamente.",
    })
  }

  const generateCSV = (survey: Survey, responses: SurveyResponse[]) => {
    const headers = ["Fecha de respuesta", "Email", ...survey.questions.map((q) => q.title)]
    
    if (responses.length === 0) {
      // Generar CSV con solo headers si no hay respuestas
      return headers.map(h => `"${h}"`).join(",")
    }
    
    const rows = responses.map((response) => [
      new Date(response.submittedAt).toLocaleString(),
      response.respondentEmail || "Anónimo",
      ...survey.questions.map((question) => {
        const answer = response.answers.find((a) => a.questionId === question.id)
        return Array.isArray(answer?.value) ? answer.value.join(", ") : answer?.value || ""
      }),
    ])

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
  }

  const getQuestionStats = (questionId: string) => {
    return stats?.questionStats.find((qs) => qs.questionId === questionId)
  }

  const renderQuestionChart = (question: any) => {
    const questionStats = getQuestionStats(question.id)
    if (!questionStats) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <p>No hay estadísticas disponibles</p>
        </div>
      )
    }

    switch (question.type) {
      case "radio":
      case "select":
        return (
          <div className="space-y-2">
            {questionStats.data.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.option}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2 survey-progress-bg">
                    <div
                      className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / questionStats.responses) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right text-foreground">
                    {item.count} ({Math.round((item.count / questionStats.responses) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            {questionStats.data.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.option}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2 survey-progress-bg">
                    <div
                      className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / questionStats.responses) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right text-foreground">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        )

      case "rating":
        const avgRating =
          questionStats.data.reduce((sum: number, item: any) => sum + item.rating * item.count, 0) /
          questionStats.responses

        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{avgRating.toFixed(1)}/5</div>
              <p className="text-sm text-muted-foreground">Calificación promedio</p>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const item = questionStats.data.find((d: any) => d.rating === rating)
                const count = item?.count || 0
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8 text-foreground">{rating}★</span>
                    <div className="flex-1 bg-muted rounded-full h-2 survey-progress-bg">
                      <div
                        className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${(count / questionStats.responses) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm w-8 text-right text-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            <p>Respuestas de texto no se pueden graficar</p>
            <p className="text-sm">
              {questionStats.responses} respuesta{questionStats.responses !== 1 ? "s" : ""}
            </p>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              {error ? "Error al cargar" : "Encuesta no encontrada"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {error || "No se pudo cargar la información de la encuesta."}
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b survey-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Resultados</h1>
                <p className="text-sm text-muted-foreground">{survey.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={copyShareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
              <Button variant="outline" onClick={exportResults}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info */}
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm">
            <strong>Debug:</strong> Encuesta ID: {surveyId} | 
            Respuestas: {responses.length} | 
            Stats cargadas: {stats ? "Sí" : "No"}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="survey-card-hover survey-stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-red-600 dark:text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Respuestas</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalResponses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="survey-card-hover survey-stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-red-500 dark:text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Finalización</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.completionRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="survey-card-hover survey-stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-600 dark:text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.averageTime || 0}min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="survey-card-hover survey-stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Badge
                  variant={survey.isActive ? "default" : "secondary"}
                  className={`text-lg px-3 py-1 ${survey.isActive ? "bg-red-600 dark:bg-red-500 text-white" : ""}`}
                >
                  {survey.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
            <TabsTrigger value="responses">Respuestas Individuales</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {survey.questions
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((question, index) => (
                <Card key={question.id || index}>
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">
                      {index + 1}. {question.title}
                    </CardTitle>
                    {question.description && <CardDescription>{question.description}</CardDescription>}
                    <div className="flex gap-2">
                      <Badge variant="outline">{question.type}</Badge>
                      {question.required && <Badge variant="secondary">Obligatoria</Badge>}
                      <Badge variant="outline">{getQuestionStats(question.id || "")?.responses || 0} respuestas</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>{renderQuestionChart(question)}</CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="responses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Respuestas Individuales</CardTitle>
                <CardDescription>Todas las respuestas recibidas para esta encuesta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {responses.map((response, index) => (
                    <div key={response.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-foreground">Respuesta #{index + 1}</h4>
                        <div className="text-sm text-muted-foreground">
                          {response.respondentEmail || "Anónimo"} • {new Date(response.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {survey.questions
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((question) => {
                            const answer = response.answers.find((a) => a.questionId === question.id)
                            return (
                              <div key={question.id} className="border-l-2 border-red-200 dark:border-red-800 pl-4">
                                <p className="text-sm font-medium text-muted-foreground mb-1">{question.title}</p>
                                <p className="text-sm text-foreground">
                                  {Array.isArray(answer?.value)
                                    ? (answer.value as string[]).join(", ")
                                    : answer?.value || "Sin respuesta"}
                                </p>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  ))}

                  {responses.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>Aún no hay respuestas para esta encuesta</p>
                      <p className="text-sm">Comparte el enlace para comenzar a recibir respuestas</p>
                      <p className="text-xs mt-2 text-yellow-600 dark:text-yellow-400">
                        (Mostrando datos de ejemplo mientras se implementa el backend)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}