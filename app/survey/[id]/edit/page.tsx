"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import QuestionBuilder from "@/components/survey/question-builder"
import { apiService } from "@/lib/api"
import type { Question } from "@/types/survey"
import { useToast } from "@/hooks/use-toast"

export default function EditSurvey() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  const loadSurvey = async () => {
    try {
      const survey = await apiService.getSurvey(surveyId)
      setTitle(survey.title)
      setDescription(survey.description)
      setIsPublic(survey.isPublic)
      setIsActive(survey.isActive)
      setQuestions(survey.questions.sort((a, b) => a.order - b.order))
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la encuesta.",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "El título de la encuesta es obligatorio.",
        variant: "destructive",
      })
      return
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos una pregunta.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const surveyData = {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        isActive,
        questions: questions.map((q, index) => ({ ...q, order: index })),
      }

      await apiService.updateSurvey(surveyId, surveyData)

      toast({
        title: "¡Encuesta actualizada!",
        description: "Los cambios han sido guardados exitosamente.",
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando encuesta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Editar Encuesta</h1>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Configura los detalles básicos de tu encuesta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la encuesta *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Encuesta de Satisfacción del Cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el propósito de tu encuesta..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center space-x-2">
                  <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                  <Label htmlFor="isPublic">Encuesta pública</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="isActive">Activar encuesta</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preguntas</CardTitle>
              <CardDescription>Agrega y configura las preguntas de tu encuesta</CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionBuilder questions={questions} onQuestionsChange={setQuestions} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
