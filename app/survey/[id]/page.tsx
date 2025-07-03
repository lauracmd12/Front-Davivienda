"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Send, Star } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiService } from "@/lib/api"
import type { Survey, Answer } from "@/types/survey"
import { useToast } from "@/hooks/use-toast"

export default function PublicSurvey() {
  const params = useParams()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [respondentEmail, setRespondentEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  const loadSurvey = async () => {
    try {
      const data = await apiService.getPublicSurvey(surveyId)
      setSurvey(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la encuesta.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!survey) return

    // Validate required questions
    const requiredQuestions = survey.questions.filter((q) => q.required)
    const missingAnswers = requiredQuestions.filter(
      (q) => !answers[q.id] || (Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0),
    )

    if (missingAnswers.length > 0) {
      toast({
        title: "Campos obligatorios",
        description: "Por favor completa todas las preguntas obligatorias.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const responseData = {
        surveyId,
        respondentEmail: respondentEmail || undefined,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })) as Answer[],
      }

      await apiService.submitResponse(surveyId, responseData)
      setIsSubmitted(true)

      toast({
        title: "¡Respuesta enviada!",
        description: "Gracias por participar en nuestra encuesta.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: any) => {
    const value = answers[question.id]

    switch (question.type) {
      case "text":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Tu respuesta..."
          />
        )

      case "textarea":
        return (
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Tu respuesta..."
            rows={4}
          />
        )

      case "radio":
        return (
          <RadioGroup value={(value as string) || ""} onValueChange={(val) => handleAnswerChange(question.id, val)}>
            {question.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={((value as string[]) || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = (value as string[]) || []
                    if (checked) {
                      handleAnswerChange(question.id, [...currentValues, option])
                    } else {
                      handleAnswerChange(
                        question.id,
                        currentValues.filter((v) => v !== option),
                      )
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case "select":
        return (
          <Select value={(value as string) || ""} onValueChange={(val) => handleAnswerChange(question.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "rating":
        return (
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleAnswerChange(question.id, rating.toString())}
                className={`p-1 transition-colors ${
                  Number.parseInt(value as string) >= rating
                    ? "text-red-400 dark:text-red-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">{value ? `${value}/5` : "0/5"}</span>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando encuesta...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2 text-foreground">Encuesta no encontrada</h2>
            <p className="text-muted-foreground">La encuesta que buscas no existe o no está disponible.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">¡Respuesta enviada!</h2>
            <p className="text-muted-foreground">
              Gracias por participar en nuestra encuesta. Tu respuesta ha sido registrada correctamente.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">{survey.title}</CardTitle>
            {survey.description && <CardDescription className="text-base mt-2">{survey.description}</CardDescription>}
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="outline">
                {survey.questions.length} pregunta{survey.questions.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline">
                {survey.questions.filter((q) => q.required).length} obligatoria
                {survey.questions.filter((q) => q.required).length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              {survey.questions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => (
                  <div key={question.id} className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground mt-1">{index + 1}.</span>
                      <div className="flex-1">
                        <Label className="text-base font-medium text-foreground">
                          {question.title}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {question.description && (
                          <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-6">{renderQuestion(question)}</div>
                  </div>
                ))}

              <div className="pt-6 border-t">
                <Button type="submit" className="w-full survey-button-primary" disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Enviando..." : "Enviar Respuesta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
