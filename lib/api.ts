// lib/api.ts
const API_BASE_URL = "http://localhost:8081"

interface ApiResponse<T = any> {
  message: string;
  status: number;
  data: T;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  totalQuestions: number;
}

interface Question {
  id?: string;
  surveyId?: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  order: number;
  createdAt?: string;
}

interface CreateSurveyRequest {
  title: string;
  description?: string;
  isActive?: boolean;
  isPublic?: boolean;
  questions: CreateQuestionRequest[];
}

interface CreateQuestionRequest {
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  options?: string[];
  order: number;
}

interface SurveyStats {
  totalSurveys: number;
  activeSurveys: number;
  inactiveSurveys: number;
}

class ApiService {

  private getAuthHeaders() {
    const user = this.getCurrentUser();
    const userId = user?.id || "";
    
    return {
      "Content-Type": "application/json",
      ...(userId && { "User-Id": userId })
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  async login(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      
      // Log para debugging
      console.log("API Response:", data)
      
      return data
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  }

  async register(userData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      console.log("Register API Response:", data)
      
      return data
    } catch (error) {
      console.error("Register API Error:", error)
      throw error
    }
  }

async createSurvey(surveyData: CreateSurveyRequest): Promise<ApiResponse<Survey>> {
    try {
      console.log("🚀 Creando encuesta:", surveyData);
      
      const response = await fetch(`${API_BASE_URL}/auth/create`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(surveyData)
      });

      return await this.handleResponse<Survey>(response);
    } catch (error) {
      console.error("Create survey error:", error);
      throw error;
    }
  }

  // Obtener mis encuestas
async getMySurveys(): Promise<ApiResponse<Survey[]>> {
  try {
    const userId = this.getCurrentUserId()
    
    if (!userId) {
      console.error("❌ No hay usuario logueado")
      return { status: 401, data: [], message: "Usuario no autenticado" }
    }

    console.log("📥 Usando API Route para obtener encuestas")
    
    // ✅ CAMBIO PRINCIPAL: Usar /api/surveys en lugar de URL directa
    const response = await fetch(`${API_BASE_URL}/auth/my-surveys`, {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(),
        "User-Id": userId,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Response del API Route:", response.status, response.ok)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Error del API Route:", errorData)
      return {
        status: response.status,
        data: [],
        message: errorData.message || `Error ${response.status}`
      }
    }
    
    const data = await response.json()
    console.log("📄 Data recibida del API Route:", data)
    
    return {
      status: data.status || response.status,
      data: data.data || [],
      message: data.message || "Encuestas obtenidas correctamente"
    }
    
  } catch (error: any) {
    console.error("❌ Error en getMySurveys:", error);
    return {
      status: 500,
      data: [],
      message: "Error de conexión: " + error.message
    }
  }
}

private getCurrentUserId(): string | null {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      return null
    }

    const userData = JSON.parse(userStr)
    const userId = userData.id || userData.userId || userData._id || userData.uuid
    console.log("✅ User ID obtenido:", userId)
    return userId.toString()
    
  } catch (error) {
    console.error("❌ Error parseando datos del usuario:", error)
    return null
  }
}

   async getSurvey(id: string): Promise<ApiResponse<Survey>> {
    return this.getSurveyById(id);
  }

  // Obtener encuesta por ID
  async getSurveyById(surveyId: string): Promise<ApiResponse<Survey>> {
    try {
      console.log("🚀 Obteniendo encuesta por ID:", surveyId);
      
      const response = await fetch(`${API_BASE_URL}/auth/getSurveyById/${surveyId}`, {
        method: "GET",
        headers: {
        ...this.getAuthHeaders(),
        "User-Id": surveyId,
        "Content-Type": "application/json"
      }
      });

      return await this.handleResponse<Survey>(response);
    } catch (error) {
      console.error("❌ Get survey by ID error:", error);
      throw error;
    }
  }

  // Obtener mis encuestas activas
  async getMyActiveSurveys(): Promise<ApiResponse<Survey[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/my-surveys/active`, {
        method: "GET",
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse<Survey[]>(response);
    } catch (error) {
      console.error("Get my active surveys error:", error);
      throw error;
    }
  }

  // Obtener encuestas públicas
  async getPublicSurveys(): Promise<ApiResponse<Survey[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/public`, {
        method: "GET",
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse<Survey[]>(response);
    } catch (error) {
      console.error("Get public surveys error:", error);
      throw error;
    }
  }

  async getSurveyStats(surveyId: string): Promise<any> {
    try {
      console.log("🚀 Obteniendo estadísticas para encuesta:", surveyId);
      
      const response = await fetch(`${API_BASE_URL}/auth/getSurveyStatsById/${surveyId}`, {
        method: "GET",
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<any>(response);
      return result.data || {
        totalResponses: 0,
        completionRate: 0,
        averageTime: 0,
        questionStats: []
      };
    } catch (error) {
      console.error("❌ Get survey stats error:", error);
      // Retornar objeto vacío si falla
      return {
        totalResponses: 0,
        completionRate: 0,
        averageTime: 0,
        questionStats: []
      };
    }
  }

  // Actualizar encuesta
  async updateSurvey(surveyId: string, surveyData: CreateSurveyRequest): Promise<ApiResponse<Survey>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${surveyId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(surveyData)
      });

      return await this.handleResponse<Survey>(response);
    } catch (error) {
      console.error("Update survey error:", error);
      throw error;
    }
  }

  // Eliminar encuesta
  async deleteSurvey(surveyId: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${surveyId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse<null>(response);
    } catch (error) {
      console.error("Delete survey error:", error);
      throw error;
    }
  }

  // Obtener estadísticas de mis encuestas
  async getMySurveyStats(): Promise<ApiResponse<SurveyStats>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/my-surveys/stats`, {
        method: "GET",
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse<SurveyStats>(response);
    } catch (error) {
      console.error("Get survey stats error:", error);
      throw error;
    }
  }

  async getSurveyResponses(surveyId: string): Promise<any[]> {
    try {
      console.log("🚀 Obteniendo respuestas para encuesta:", surveyId);
      
      const response = await fetch(`${API_BASE_URL}/auth/getSurveyResponses/${surveyId}`, {
        method: "GET",
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<any[]>(response);
      return result.data || [];
    } catch (error) {
      console.error("❌ Get survey responses error:", error);
      // Retornar array vacío si falla
      return [];
    }
  }
  // Test de conectividad
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/test`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Test connection error:", error);
      return false;
    }
  }

  // ==================== UTILITY METHODS ====================
  
  // Verificar si está autenticado
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') {
    return false
  }
  
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  const result = !!(token && user)
  return result
  }

  // Obtener usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // Validar datos de encuesta
  validateSurveyData(surveyData: CreateSurveyRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!surveyData.title || surveyData.title.trim().length === 0) {
      errors.push("El título es obligatorio");
    }

    if (surveyData.title && surveyData.title.length > 500) {
      errors.push("El título no puede exceder 500 caracteres");
    }

    if (surveyData.description && surveyData.description.length > 2000) {
      errors.push("La descripción no puede exceder 2000 caracteres");
    }

    if (!surveyData.questions || surveyData.questions.length === 0) {
      errors.push("Debe incluir al menos una pregunta");
    }

    if (surveyData.questions) {
      surveyData.questions.forEach((question, index) => {
        if (!question.title || question.title.trim().length === 0) {
          errors.push(`La pregunta ${index + 1} debe tener un título`);
        }

        if (question.title && question.title.length > 1000) {
          errors.push(`El título de la pregunta ${index + 1} no puede exceder 1000 caracteres`);
        }

        if (!question.type) {
          errors.push(`La pregunta ${index + 1} debe tener un tipo`);
        }

        if (typeof question.order !== 'number') {
          errors.push(`La pregunta ${index + 1} debe tener un orden válido`);
        }

        // Validar que preguntas de opción múltiple tengan opciones
        if (['radio', 'checkbox', 'select'].includes(question.type)) {
          if (!question.options || question.options.length === 0) {
            errors.push(`La pregunta ${index + 1} de tipo ${question.type} debe tener opciones`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Debug helper
  logCurrentUser() {
    const user = this.getCurrentUser();
    console.log("👤 Usuario actual:", user);
    console.log("🔑 Está autenticado:", this.isAuthenticated());
    return user;
  }
}

// Exportar instancia única
export const apiService = new ApiService();

// Exportar tipos para uso en componentes
export type {
  Survey,
  Question,
  CreateSurveyRequest,
  CreateQuestionRequest,
  SurveyStats,
  ApiResponse
};
  