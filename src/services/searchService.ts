/**
 * Service pour les fonctionnalités de recherche et de questions/réponses
 * Ce service encapsule toutes les interactions avec l'API de recherche
 */

// Types
export interface DocumentResult {
  id: string;
  document: string;
  distance?: number;
}

export interface SearchResponse {
  documents: string[];
  ids: string[];
  distances?: number[];
}

export interface QAResponse {
  question: string;
  placeholder_answer: string;
  retrieved_context_documents: string[];
  retrieved_context_ids: string[];
  distances?: number[];
}

export interface SearchOptions {
  n_results?: number;
  // Paramètres pour la recherche avancée (à implémenter)
  dateFrom?: string;
  dateTo?: string;
  documentType?: string;
  sourceType?: string;
}

export interface QAOptions {
  n_results_for_context?: number;
}

// Configuration
const API_BASE_URL = ''; // API calls will be relative to the current domain
const DEFAULT_SEARCH_LIMIT = 5;
const DEFAULT_QA_CONTEXT_LIMIT = 3;

/**
 * Utilitaire pour formater les erreurs API
 */
const formatApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Une erreur inconnue est survenue';
};

/**
 * Utilitaire pour formater les résultats de recherche
 */
const formatSearchResults = (data: SearchResponse): DocumentResult[] => {
  return data.ids.map((id, index) => ({
    id,
    document: data.documents[index],
    distance: data.distances ? data.distances[index] : undefined,
  }));
};

/**
 * Fonction générique pour les requêtes API
 */
const apiRequest = async <T,>(url: string, data: Record<string, any>): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur HTTP: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
};

/**
 * Service de recherche exposant les méthodes publiques
 */
const searchService = {
  /**
   * Recherche de documents
   */
  async search(query: string, options: SearchOptions = {}): Promise<DocumentResult[]> {
    try {
      const data = await apiRequest<SearchResponse>('/search', {
        query,
        n_results: options.n_results || DEFAULT_SEARCH_LIMIT,
        // Ajout des paramètres de recherche avancée
        ...(options.dateFrom && { date_from: options.dateFrom }),
        ...(options.dateTo && { date_to: options.dateTo }),
        ...(options.documentType && { document_type: options.documentType }),
        ...(options.sourceType && { source_type: options.sourceType }),
      });
      
      return formatSearchResults(data);
    } catch (error) {
      throw new Error(formatApiError(error));
    }
  },

  /**
   * Poser une question et obtenir une réponse
   */
  async askQuestion(question: string, options: QAOptions = {}): Promise<QAResponse> {
    try {
      return await apiRequest<QAResponse>('/answer-question', {
        question,
        n_results_for_context: options.n_results_for_context || DEFAULT_QA_CONTEXT_LIMIT,
      });
    } catch (error) {
      throw new Error(formatApiError(error));
    }
  }
};

export default searchService;
