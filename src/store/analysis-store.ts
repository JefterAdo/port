import { create } from 'zustand';
import { AnalysisRequest, AnalysisResult } from '../types';
import { createPerplexity } from '@ai-sdk/perplexity';
import { generateText } from 'ai';
import { nanoid } from 'nanoid';

interface AnalysisState {
  requests: AnalysisRequest[];
  results: AnalysisResult[];
  currentRequest: AnalysisRequest | null;
  currentResult: AnalysisResult | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

interface AnalysisActions {
  submitContent: (content: string, contentType: AnalysisRequest['contentType'], source?: string) => Promise<void>;
  getAnalysisById: (id: string) => Promise<void>;
  clearCurrentAnalysis: () => void;
  deleteAnalysis: (id: string) => Promise<void>;
  getAllAnalyses: () => Promise<void>;
  askChatAI: (userInput: string) => Promise<string | null>;
}

type AnalysisStore = AnalysisState & AnalysisActions;

const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  requests: [],
  results: [],
  currentRequest: null,
  currentResult: null,
  isLoading: false,
  isAnalyzing: false,
  error: null,

  submitContent: async (content, contentType, source) => {
    set({ isAnalyzing: true, error: null });

    try {
      // Generate a unique ID for the request
      const id = nanoid();
      const createdAt = new Date().toISOString();

      const prompt = `Analyser le contenu suivant (type: ${contentType}, source: ${source || 'N/A'}):\n\n${content}\n\nFournir les éléments suivants :\n1. Résumé concis du contenu.\n2. Points clés positifs (avantages, opportunités, soutiens) pour le parti RHDP ou le gouvernement ivoirien, s'ils sont pertinents.\n3. Points clés négatifs (critiques, risques, oppositions) pour le parti RHDP ou le gouvernement ivoirien, s'ils sont pertinents.\n4. Propositions d'éléments de langage ou de réponses possibles face à ce contenu.\n\nFormatez votre réponse de manière claire, en utilisant des titres pour chaque section si possible (par exemple, "Résumé:", "Points Positifs:", "Points Négatifs:", "Propositions de Réponses:").`;

      console.log('Sending prompt to Perplexity (via backend proxy):', prompt);

      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'sonar',
          prompt: prompt,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erreur lors de l\'appel au proxy Perplexity');
      }
      const data = await response.json();
      const analysisText = data.text || data.choices?.[0]?.message?.content || '';

      console.log('Raw Perplexity API analysisText:', analysisText); // Log raw text response

      // Helper function to parse sections from the text
      const parseSection = (text: string, title: string): string[] => {
        const sectionStart = text.indexOf(`## ${title}`);
        if (sectionStart === -1) return [];

        const nextSectionStart = text.indexOf('\n## ', sectionStart + title.length + 4); // +4 for '## ' and newline
        const sectionContent = nextSectionStart === -1 
          ? text.substring(sectionStart + title.length + 4) 
          : text.substring(sectionStart + title.length + 4, nextSectionStart);
        
        // Split by newline, filter out empty lines, and trim whitespace
        // For bullet points (starting with '- ') or numbered (e.g., '1. ')
        return sectionContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('- ') || /^[0-9]+\.\s/.test(line))
          .map(line => line.replace(/^(- |[0-9]+\.\s)/, '').trim())
          .filter(line => line.length > 0);
      };

      const parseSummary = (text: string): string => {
        const summaryStart = text.indexOf('## Résumé');
        if (summaryStart === -1) return text; // Fallback to full text if no Résumé header

        const nextSectionStart = text.indexOf('\n## ', summaryStart + '## Résumé'.length);
        const summaryContent = nextSectionStart === -1
          ? text.substring(summaryStart + '## Résumé'.length)
          : text.substring(summaryStart + '## Résumé'.length, nextSectionStart);
        
        return summaryContent.trim();
      };

      const summary = parseSummary(analysisText);
      const positivePoints = parseSection(analysisText, 'Points Positifs');
      const negativePoints = parseSection(analysisText, 'Points Négatifs');
      const suggestedResponses = parseSection(analysisText, 'Propositions de Réponses');

      const request: AnalysisRequest = {
        id,
        userId: 'user-placeholder', // Replace with actual user ID when auth is implemented
        content,
        contentType: contentType as AnalysisRequest['contentType'],
        source,
        createdAt,
      };

      const result: AnalysisResult = {
        id: nanoid(),
        requestId: id,
        summary: summary,
        keyPoints: [], // Placeholder - We are not parsing these specific KeyPoints for now
        arguments: [], // Placeholder - (can be repurposed or removed)
        criticisms: [], // Placeholder - (can be repurposed or removed)
        positivePoints: positivePoints,
        negativePoints: negativePoints,
        suggestedResponses: suggestedResponses,
        generatedAt: new Date().toISOString(),
      };

      set(state => ({
        requests: [...state.requests, request],
        results: [...state.results, result],
        currentRequest: request,
        currentResult: result,
        isAnalyzing: false,
      }));
    } catch (error: unknown) {
      console.error('Error calling Perplexity API:', error);
      let errorMessage = 'Une erreur est survenue lors de l\'analyse avec Perplexity.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        isAnalyzing: false,
        error: errorMessage,
      });
    }
  },

  askChatAI: async (userInput) => {
    set({ isLoading: true, error: null });
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

    if (!apiKey) {
      const errorMsg = 'Clé API Perplexity manquante. Veuillez la configurer dans vos variables d\'environnement.';
      set({ isLoading: false, error: errorMsg });
      console.error('PERPLEXITY_API_KEY is not set in environment variables.');
      return null;
    }

    const perplexity = createPerplexity({
      apiKey: apiKey,
    });

    const systemPrompt = `Vous êtes un assistant IA spécialisé dans l'analyse politique et l'actualité ivoirienne. Votre rôle est de fournir des éclairages, des opinions et de répondre aux questions concernant le RHDP, les partis d'opposition, et les actions du gouvernement ivoirien, en vous basant sur les informations d'actualité. Soyez informatif, neutre lorsque cela est approprié, et capable de discuter différents points de vue.

Question de l'utilisateur: ${userInput}`;

    try {
      console.log('Sending chat prompt to Perplexity:', systemPrompt);
      const { text: aiResponse } = await generateText({
        model: perplexity('sonar'), // Or your preferred model for chat
        prompt: systemPrompt,
      });
      console.log('Raw Perplexity API chat response:', aiResponse);
      set({ isLoading: false });
      return aiResponse;
    } catch (error: unknown) {
      console.error('Error calling Perplexity API for chat:', error);
      let errorMessage = 'Une erreur est survenue lors de la communication avec l\'IA.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  getAnalysisById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // In a production environment, this would retrieve data from your API
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock API delay
      
      const { requests, results } = get();
      const request = requests.find(r => r.id === id);
      const result = results.find(r => r.requestId === id);
      
      if (!request || !result) {
        throw new Error('Analyse non trouvée');
      }
      
      set({
        currentRequest: request,
        currentResult: result,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error('Erreur dans getAnalysisById:', error);
      let errorMessage = 'Analyse non trouvée'; // Default error message
      if (error instanceof Error) {
        errorMessage = error.message; // Use actual error message if available
      }
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  clearCurrentAnalysis: () => {
    set({
      currentRequest: null,
      currentResult: null,
    });
  },

  deleteAnalysis: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // In a production environment, this would delete data via your API
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock API delay
      
      set(state => ({
        requests: state.requests.filter(r => r.id !== id),
        results: state.results.filter(r => r.requestId !== id),
        isLoading: false,
      }));
      
      // Clear current if it was deleted
      const { currentRequest } = get();
      if (currentRequest && currentRequest.id === id) {
        get().clearCurrentAnalysis();
      }
    } catch (error: unknown) {
      console.error('Erreur dans deleteAnalysis:', error);
      let errorMessage = 'Une erreur est survenue lors de la suppression.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  getAllAnalyses: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // In a production environment, this would retrieve data from your API
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock API delay
      
      // For now, just clear loading and error as it does nothing
      set({ isLoading: false, error: null }); 
    } catch (error: unknown) {
      console.error('Erreur dans getAllAnalyses:', error);
      let errorMessage = 'Une erreur est survenue lors de la récupération des analyses.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },
}));

export default useAnalysisStore;