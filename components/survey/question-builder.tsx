"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { Question } from "@/types/survey"

interface QuestionBuilderProps {
  questions: Question[]
  onQuestionsChange: (questions: Question[]) => void
}

export default function QuestionBuilder({ questions, onQuestionsChange }: QuestionBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      surveyId: "",
      type: "text",
      title: "",
      description: "",
      required: false,
      options: [],
      order: questions.length,
    }
    onQuestionsChange([...questions, newQuestion])
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    onQuestionsChange(updatedQuestions)
  }

  const deleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
    onQuestionsChange(updatedQuestions)
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    const newOptions = [...(question.options || []), ""]
    updateQuestion(questionIndex, { options: newOptions })
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex]
    const newOptions = [...(question.options || [])]
    newOptions[optionIndex] = value
    updateQuestion(questionIndex, { options: newOptions })
  }

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    const newOptions = (question.options || []).filter((_, i) => i !== optionIndex)
    updateQuestion(questionIndex, { options: newOptions })
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newQuestions = [...questions]
    const draggedQuestion = newQuestions[draggedIndex]
    newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(dropIndex, 0, draggedQuestion)

    // Update order
    const updatedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }))
    onQuestionsChange(updatedQuestions)
    setDraggedIndex(null)
  }

  const questionTypes = [
    { value: "text", label: "Texto corto" },
    { value: "textarea", label: "Texto largo" },
    { value: "radio", label: "Opción múltiple (una respuesta)" },
    { value: "checkbox", label: "Casillas de verificación" },
    { value: "select", label: "Lista desplegable" },
    { value: "rating", label: "Calificación (1-5)" },
  ]

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <Card
          key={question.id}
          className="relative"
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                <CardTitle className="text-lg">Pregunta {index + 1}</CardTitle>
                {question.required && <Badge variant="secondary">Obligatoria</Badge>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteQuestion(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de pregunta</Label>
                <Select value={question.type} onValueChange={(value: any) => updateQuestion(index, { type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`required-${index}`}
                  checked={question.required}
                  onCheckedChange={(checked) => updateQuestion(index, { required: checked })}
                />
                <Label htmlFor={`required-${index}`}>Pregunta obligatoria</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título de la pregunta</Label>
              <Input
                value={question.title}
                onChange={(e) => updateQuestion(index, { title: e.target.value })}
                placeholder="Escribe tu pregunta aquí..."
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={question.description || ""}
                onChange={(e) => updateQuestion(index, { description: e.target.value })}
                placeholder="Descripción adicional para la pregunta..."
                rows={2}
              />
            </div>

            {["radio", "checkbox", "select"].includes(question.type) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Opciones</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addOption(index)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar opción
                  </Button>
                </div>
                <div className="space-y-2">
                  {(question.options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                        placeholder={`Opción ${optionIndex + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteOption(index, optionIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="text-center">
        <Button onClick={addQuestion} variant="outline" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Agregar Pregunta
        </Button>
      </div>
    </div>
  )
}
