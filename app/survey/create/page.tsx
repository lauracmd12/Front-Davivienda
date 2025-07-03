"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import QuestionBuilder from "@/components/survey/question-builder"
import { apiService } from "@/lib/api"
import type { Question, Survey } from "@/types/survey"
import { useToast } from "@/hooks/use-toast"

export default function CreateSurvey() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

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

    setIsLoading(true)

    try {
      const surveyData: Omit<Survey, "id" | "createdAt" | "updatedAt"> = {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        isActive,
        createdBy: "", // Will be set by the backend
        questions: questions.map((q, index) => ({ ...q, order: index })),
      }

      const newSurvey = await apiService.createSurvey(surveyData)

      toast({
        title: "¡Encuesta creada!",
        description: "Tu encuesta ha sido creada exitosamente.",
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la encuesta. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
                <h1 className="text-xl font-semibold text-gray-900">Crear Nueva Encuesta</h1>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Guardando..." : "Guardar Encuesta"}
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
