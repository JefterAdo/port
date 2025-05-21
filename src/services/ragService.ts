/**
 * Service pour interagir avec le backend RAG (Retrieval Augmented Generation)
 * Permet d'ajouter des documents et d'effectuer des recherches vectorielles
 */

// Types pour les requêtes et réponses
interface AddDocumentRequest {
  doc_id: string;
  text: string;
}

interface SearchRequest {
  query: string;
  n_results?: number;
}

interface SearchResult {
  documents: string[];
  ids: string[];
  distances: number[];
}

/**
 * Service RAG pour recherche contextuelle
 */
const ragService = {
  /**
   * Ajoute un document au moteur RAG pour indexation
   * @param docId Identifiant unique du document
   * @param text Contenu textuel du document
   */
  async addDocument(docId: string, text: string): Promise<void> {
    const payload: AddDocumentRequest = {
      doc_id: docId,
      text,
    };

    const response = await fetch('http://127.0.0.1:8000/add-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'ajout du document: ${response.status}`);
    }
  },

  /**
   * Recherche des documents par similarité sémantique
   * @param query Texte de la recherche
   * @param nResults Nombre de résultats souhaités (défaut: 3)
   */
  async search(query: string, nResults = 3): Promise<SearchResult> {
    const payload: SearchRequest = {
      query,
      n_results: nResults,
    };

    const response = await fetch('http://127.0.0.1:8000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la recherche: ${response.status}`);
    }

    return await response.json();
  },
};

export default ragService;
