import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import searchService, { DocumentResult, QAResponse, SearchOptions } from '../../services/searchService';

// Configuration
const DEBOUNCE_DELAY = 300; // ms

// Types pour la gestion d'état locale
// Note: Cette interface est utilisée dans le type SearchState via advancedOptions

interface SearchState {
  query: string;
  results: DocumentResult[];
  isLoading: boolean;
  error: string | null;
  advancedOptions: {
    isOpen: boolean;
    dateFrom: string;
    dateTo: string;
    documentType: string;
    sourceType: string;
  };
}

interface QAState {
  question: string;
  result: QAResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Options pour les types de documents
const DOCUMENT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'edls', label: 'EDLS' },
  { value: 'forces', label: 'Forces & Faiblesses' },
  { value: 'standard', label: 'Documents standard' }
];

// Options pour les sources
const SOURCE_TYPES = [
  { value: '', label: 'Toutes les sources' },
  { value: 'internal', label: 'Documents internes' },
  { value: 'external', label: 'Documents externes' }
];

// Composant principal
const SearchPage: React.FC = () => {
  // États pour la recherche de documents
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    advancedOptions: {
      isOpen: false,
      dateFrom: '',
      dateTo: '',
      documentType: '',
      sourceType: ''
    }
  });

  // États pour les questions/réponses
  const [qaState, setQaState] = useState<QAState>({
    question: '',
    result: null,
    isLoading: false,
    error: null,
  });

  // Gestionnaires d'événements
  const updateSearchQuery = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  };

  const updateQuestion = (question: string) => {
    setQaState(prev => ({ ...prev, question }));
  };

  // Gestion des options de recherche avancée
  const toggleAdvancedSearch = () => {
    setSearchState(prev => ({
      ...prev,
      advancedOptions: {
        ...prev.advancedOptions,
        isOpen: !prev.advancedOptions.isOpen
      }
    }));
  };

  const updateAdvancedOption = (option: string, value: string) => {
    setSearchState(prev => ({
      ...prev,
      advancedOptions: {
        ...prev.advancedOptions,
        [option]: value
      }
    }));
  };

  // Fonction de recherche avec gestion d'erreur améliorée
  const performSearch = async () => {
    const { query, advancedOptions } = searchState;
    
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        error: "Veuillez entrer une requête de recherche."
      }));
      return;
    }

    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      results: [],
    }));

    try {
      // Préparation des options de recherche avancée
      const searchOptions: SearchOptions = {
        dateFrom: advancedOptions.dateFrom,
        dateTo: advancedOptions.dateTo,
        documentType: advancedOptions.documentType,
        sourceType: advancedOptions.sourceType
      };
      
      // Appel au service de recherche
      const results = await searchService.search(query, searchOptions);
      
      setSearchState(prev => ({
        ...prev,
        results,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Search error:", error);
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Une erreur est survenue lors de la recherche.",
        isLoading: false,
      }));
    }
  };

  // Debounce de la recherche pour éviter trop d'appels API
  const debouncedSearch = useCallback(
    debounce(() => {
      if (searchState.query.trim()) {
        performSearch();
      }
    }, DEBOUNCE_DELAY),
    [searchState.query, searchState.advancedOptions]
  );

  // Effet pour déclencher la recherche debounced quand la requête change
  useEffect(() => {
    if (searchState.query.trim()) {
      debouncedSearch();
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchState.query, searchState.advancedOptions, debouncedSearch]);

  // Fonction pour poser une question
  const askQuestion = async () => {
    const { question } = qaState;
    
    if (!question.trim()) {
      setQaState(prev => ({
        ...prev,
        error: "Veuillez entrer une question."
      }));
      return;
    }

    setQaState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      result: null,
    }));

    try {
      // Appel au service de questions/réponses
      const result = await searchService.askQuestion(question);
      
      setQaState(prev => ({
        ...prev,
        result,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Q&A error:", error);
      setQaState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Une erreur est survenue lors de la recherche de réponse.",
        isLoading: false,
      }));
    }
  };

  // Gestionnaire pour la touche Entrée dans le champ de recherche
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center text-[rgb(var(--color-primary))]" id="search-page-title">Recherche</h1>

      {/* Section de Recherche de Documents */}
      <section className="p-6 bg-white shadow-lg rounded-lg border-t-4 border-[rgb(var(--color-primary))]" aria-labelledby="search-section-title">
        <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-primary-dark))]" id="search-section-title">Rechercher des Documents</h2>
        
        {/* Champ de recherche principal */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            id="search-input"
            aria-label="Champ de recherche"
            placeholder="Entrez votre requête de recherche..."
            className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
            value={searchState.query}
            onChange={(e) => updateSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
          />
          <button
            onClick={performSearch}
            className="bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] text-white font-bold py-3 px-6 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
            disabled={searchState.isLoading}
            aria-busy={searchState.isLoading}
            aria-label="Lancer la recherche"
          >
            {searchState.isLoading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
        
        {/* Bouton pour afficher/masquer la recherche avancée */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={toggleAdvancedSearch}
            className="text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] text-sm font-medium flex items-center"
            aria-expanded={searchState.advancedOptions.isOpen}
            aria-controls="advanced-search-panel"
          >
            {searchState.advancedOptions.isOpen ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Masquer la recherche avancée
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Afficher la recherche avancée
              </>
            )}
          </button>
        </div>
        
        {/* Panneau de recherche avancée */}
        {searchState.advancedOptions.isOpen && (
          <div id="advanced-search-panel" className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
            <h3 className="text-lg font-medium mb-3 text-gray-700">Options de recherche avancée</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Plage de dates */}
              <div>
                <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="date"
                  id="date-from"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={searchState.advancedOptions.dateFrom}
                  onChange={(e) => updateAdvancedOption('dateFrom', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  id="date-to"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={searchState.advancedOptions.dateTo}
                  onChange={(e) => updateAdvancedOption('dateTo', e.target.value)}
                />
              </div>
              
              {/* Type de document */}
              <div>
                <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
                <select
                  id="document-type"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={searchState.advancedOptions.documentType}
                  onChange={(e) => updateAdvancedOption('documentType', e.target.value)}
                >
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Source */}
              <div>
                <label htmlFor="source-type" className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  id="source-type"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={searchState.advancedOptions.sourceType}
                  onChange={(e) => updateAdvancedOption('sourceType', e.target.value)}
                >
                  {SOURCE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchState(prev => ({
                    ...prev,
                    advancedOptions: {
                      ...prev.advancedOptions,
                      dateFrom: '',
                      dateTo: '',
                      documentType: '',
                      sourceType: ''
                    }
                  }));
                }}
                className="text-gray-600 hover:text-gray-800 text-sm mr-3"
              >
                Réinitialiser
              </button>
              <button
                onClick={performSearch}
                className="bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] text-white text-sm py-2 px-4 rounded-md"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        )}
        
        {searchState.error && (
          <p className="text-red-500 text-sm" role="alert">{searchState.error}</p>
        )}
        
        {searchState.results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Résultats de la recherche :</h3>
            <ul className="space-y-3" aria-label="Résultats de recherche">
              {searchState.results.map((result, index) => {
                // Extraire les métadonnées si disponibles
                const metadata = result.metadata || {};
                const docType = metadata.doc_type || 'standard';
                const createdAt = metadata.created_at || metadata.date || '';
                const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : '';
                const title = metadata.title || '';
                
                // Déterminer la couleur et l'icône en fonction du type de document
                let typeColor = 'bg-neutral-100';
                let typeTextColor = 'text-neutral-700';
                let typeIcon = '📄';
                
                if (docType === 'edls') {
                  typeColor = 'bg-orange-100';
                  typeTextColor = 'text-orange-800';
                  typeIcon = '📝';
                } else if (docType === 'forces') {
                  typeColor = 'bg-green-100';
                  typeTextColor = 'text-green-800';
                  typeIcon = '⚖️';
                }
                
                return (
                  <li key={result.id} className="p-4 border border-gray-200 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                    {/* En-tête du résultat avec métadonnées */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor} ${typeTextColor} mr-2`}>
                          {typeIcon} {docType === 'edls' ? 'EDLS' : docType === 'forces' ? 'Forces & Faiblesses' : 'Document'}
                        </span>
                        {title && <span className="font-medium text-gray-700">{title}</span>}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        {formattedDate && (
                          <span className="mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formattedDate}
                          </span>
                        )}
                        <span title="Score de pertinence">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          {result.distance !== undefined ? result.distance.toFixed(4) : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Contenu du document */}
                    <div className="text-gray-800 whitespace-pre-line">
                      {/* Afficher le contenu avec mise en forme améliorée */}
                      {result.document.split('\n\n').map((paragraph, i) => {
                        // Détecter les titres (lignes qui commencent par "TITRE:", "CONTENU:", etc.)
                        if (paragraph.match(/^[A-ZÀ-Ü]+:/)) {
                          const [label, ...content] = paragraph.split(':');
                          return (
                            <div key={i} className="mb-2">
                              <span className="font-semibold text-gray-600">{label}:</span>
                              <span className="ml-1">{content.join(':')}</span>
                            </div>
                          );
                        }
                        return <p key={i} className="mb-2">{paragraph}</p>;
                      })}
                    </div>
                    
                    {/* Pied du résultat avec ID et métadonnées supplémentaires */}
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <span className="mr-2">ID: {result.id}</span>
                      {metadata.source_type && (
                        <span className="mr-2">Source: {metadata.source_type}</span>
                      )}
                      {docType === 'forces' && metadata.party_name && (
                        <span className="mr-2">Parti: {metadata.party_name}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Section de Questions/Réponses */}
      <section className="p-6 bg-white shadow-lg rounded-lg border-t-4 border-[rgb(var(--color-secondary))]" aria-labelledby="qa-section-title">
        <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-secondary-dark))]" id="qa-section-title">Poser une Question</h2>
        <textarea
          id="question-input"
          aria-label="Champ de question"
          placeholder="Posez votre question ici..."
          className="w-full p-3 border border-gray-300 rounded-md mb-3 focus:ring-2 focus:ring-[rgb(var(--color-secondary))] focus:border-transparent"
          rows={4}
          value={qaState.question}
          onChange={(e) => updateQuestion(e.target.value)}
        />
        <button
          onClick={askQuestion}
          className="bg-[rgb(var(--color-secondary))] hover:bg-[rgb(var(--color-secondary-dark))] text-white font-bold py-3 px-6 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
          disabled={qaState.isLoading}
          aria-busy={qaState.isLoading}
          aria-label="Envoyer la question"
        >
          {qaState.isLoading ? 'Envoi...' : 'Obtenir une Réponse'}
        </button>
        
        {qaState.error && (
          <p className="text-red-500 text-sm mt-3" role="alert">{qaState.error}</p>
        )}
        
        {qaState.result && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2 text-[rgb(var(--color-secondary-dark))]">Réponse :</h3>
            <div className="p-4 border border-[rgb(var(--color-secondary-light))] border-opacity-30 rounded-md bg-[rgb(var(--color-secondary-light))] bg-opacity-5 mb-4 shadow-sm">
              <p className="text-gray-800 font-medium">Question : {qaState.result.question}</p>
              <p className="text-gray-600 italic mt-2 p-3 bg-white rounded border border-gray-100">{qaState.result.placeholder_answer}</p>
            </div>
            {qaState.result.retrieved_context_documents && qaState.result.retrieved_context_documents.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-2 text-[rgb(var(--color-secondary))]">Documents de contexte récupérés :</h4>
                <ul className="space-y-3" aria-label="Documents de contexte">
                  {qaState.result.retrieved_context_documents.map((doc, index) => {
                    // Extraire les métadonnées si disponibles
                    const metadata = qaState.result.metadatas && qaState.result.metadatas[index] ? qaState.result.metadatas[index] : {};
                    const docType = metadata.doc_type || 'standard';
                    const createdAt = metadata.created_at || metadata.date || '';
                    const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : '';
                    const title = metadata.title || '';
                    
                    // Déterminer la couleur et l'icône en fonction du type de document
                    let typeColor = 'bg-neutral-100';
                    let typeTextColor = 'text-neutral-700';
                    let typeIcon = '📄';
                    
                    if (docType === 'edls') {
                      typeColor = 'bg-orange-100';
                      typeTextColor = 'text-orange-800';
                      typeIcon = '📝';
                    } else if (docType === 'forces') {
                      typeColor = 'bg-green-100';
                      typeTextColor = 'text-green-800';
                      typeIcon = '⚖️';
                    }
                    
                    return (
                      <li key={qaState.result.retrieved_context_ids[index]} className="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                        {/* En-tête du document de contexte */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColor} ${typeTextColor} mr-2`}>
                              {typeIcon} {docType === 'edls' ? 'EDLS' : docType === 'forces' ? 'Forces & Faiblesses' : 'Document'}
                            </span>
                            {title && <span className="font-medium text-gray-700">{title}</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formattedDate && (
                              <span className="mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formattedDate}
                              </span>
                            )}
                            <span title="Score de pertinence">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              {qaState.result.distances && qaState.result.distances[index] !== undefined ? 
                               qaState.result.distances[index].toFixed(4) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Contenu du document */}
                        <div className="text-gray-700 whitespace-pre-line text-sm">
                          {/* Afficher le contenu avec mise en forme améliorée */}
                          {doc.split('\n\n').map((paragraph, i) => {
                            // Détecter les titres (lignes qui commencent par "TITRE:", "CONTENU:", etc.)
                            if (paragraph.match(/^[A-ZÀ-Ü]+:/)) {
                              const [label, ...content] = paragraph.split(':');
                              return (
                                <div key={i} className="mb-2">
                                  <span className="font-semibold text-gray-600">{label}:</span>
                                  <span className="ml-1">{content.join(':')}</span>
                                </div>
                              );
                            }
                            return <p key={i} className="mb-2">{paragraph}</p>;
                          })}
                        </div>
                        
                        {/* Pied du document avec ID */}
                        <div className="mt-2 pt-1 border-t border-gray-100 text-xs text-gray-500">
                          <span>ID: {qaState.result.retrieved_context_ids[index]}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchPage;
