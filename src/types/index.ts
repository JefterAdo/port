// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Content Analysis Types
export interface EDLSItem {
  id: string;
  title: string;
  classification: EDLSClassification;
  content: string; // Texte principal ou résumé
  mediaUrl?: string; // Lien vers le média (fichier, image, etc.)
  mediaFile?: {
    name: string;
    type: string;
    data: string; // base64
  };
  actions: EDLSAction[];
  assignedTo?: string[]; // IDs ou rôles des acteurs
  status: "new" | "analyzed" | "responded" | "archived";
  aiAnalysis?: {
    summary: string;
    keyPoints: string[];
    sentiment?: string;
    suggestedResponses?: string[];
  };
  humanValidated?: boolean; // Validation humaine de la suggestion IA
  validatedBy?: string; // ID de l'utilisateur ayant validé
  validationComment?: string; // Commentaire de validation
  createdAt: string;
  updatedAt: string;
  history?: EDLSHistoryEntry[];
}

export interface EDLSAction {
  type: 'assign' | 'validate' | 'generate_response' | 'mark_done' | 'archive';
  userId: string;
  timestamp: string;
  details?: string;
}

export interface EDLSHistoryEntry {
  action: string;
  userId: string;
  timestamp: string;
  comment?: string;
}

export interface AnalysisRequest {
  id: string;
  userId: string;
  content: string;
  contentType: 'article' | 'social_media' | 'criticism' | 'question' | 'other';
  source?: string;
  createdAt: string;
}

export interface AnalysisPoint {
  id: string;
  analysisId: string;
  content: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  category?: string;
  isKey: boolean;
}

export interface AnalysisResult {
  id: string;
  requestId: string;
  summary: string;
  keyPoints: AnalysisPoint[];
  arguments: AnalysisPoint[];
  criticisms: AnalysisPoint[];
  positivePoints?: string[];
  negativePoints?: string[];
  suggestedResponses?: string[];
  generatedAt: string;
}

// Response Generation Types
export interface ResponseRequest {
  id: string;
  userId: string;
  analysisId: string;
  selectedPoints: string[]; // IDs of selected analysis points
  responseType: 'talking_point' | 'tweet' | 'detailed_response' | 'report';
  tone: 'factual' | 'persuasive' | 'defensive' | 'assertive';
  additionalInstructions?: string;
  createdAt: string;
}

export interface GeneratedResponse {
  id: string;
  requestId: string;
  content: string;
  summary?: string;
  format: 'text' | 'html' | 'markdown';
  createdAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalAnalyses: number;
  totalResponses: number;
  recentAnalyses: AnalysisRequest[];
  recentResponses: GeneratedResponse[];
}

// History Types
export interface HistoryItem {
  id: string;
  type: 'analysis' | 'response';
  title: string;
  summary: string;
  createdAt: string;
  itemId: string; // ID of the related analysis or response
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}