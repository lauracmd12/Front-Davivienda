export interface User {
  id: string
  email: string
  name: string
  company?: string
  createdAt: string
}

export interface Survey {
  id: string
  title: string
  description: string
  isActive: boolean
  isPublic: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  questions: Question[]
  responses?: SurveyResponse[]
}

export interface Question {
  id: string
  surveyId: string
  type: "text" | "textarea" | "radio" | "checkbox" | "select" | "rating"
  title: string
  description?: string
  required: boolean
  options?: string[]
  order: number
}

export interface SurveyResponse {
  id: string
  surveyId: string
  respondentEmail?: string
  answers: Answer[]
  submittedAt: string
}

export interface Answer {
  questionId: string
  value: string | string[]
}

export interface SurveyStats {
  totalResponses: number
  completionRate: number
  averageTime: number
  questionStats: QuestionStats[]
}

export interface QuestionStats {
  questionId: string
  questionTitle: string
  type: string
  responses: number
  data: any[]
}
