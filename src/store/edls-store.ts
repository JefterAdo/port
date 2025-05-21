import { create } from 'zustand';
import { EDLSItem } from '../types';
import { nanoid } from 'nanoid';

import { analyzeWithDeepseek, DeepseekAnalysisResult } from '../services/deepseek';

interface EDLSState {
  edlsList: EDLSItem[];
  addEDLS: (item: Omit<EDLSItem, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => Promise<void>;
  updateEDLS: (id: string, update: Partial<EDLSItem>) => void;
  deleteEDLS: (id: string) => void;
  getEDLS: () => EDLSItem[];
}

export const useEDLSStore = create<EDLSState>((set, get) => ({
  edlsList: [],
  addEDLS: async (item) => {
    const now = new Date().toISOString();
    const newItem: EDLSItem = {
      ...item,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      history: [],
    };
    set((state) => ({ edlsList: [...state.edlsList, newItem] }));
    // Analyse IA automatique
    try {
      const aiAnalysis: DeepseekAnalysisResult = await analyzeWithDeepseek(item.content);
      // Mise à jour de l’EDLS avec le résultat IA
      set((state) => ({
        edlsList: state.edlsList.map(edls =>
          edls.id === newItem.id ? { ...edls, aiAnalysis, status: 'analyzed', updatedAt: new Date().toISOString() } : edls
        )
      }));
    } catch {
      // On peut gérer les erreurs ici si besoin
    }
  },
  updateEDLS: (id, update) => {
    set((state) => ({
      edlsList: state.edlsList.map(edls =>
        edls.id === id ? { ...edls, ...update, updatedAt: new Date().toISOString() } : edls
      )
    }));
  },
  deleteEDLS: (id) => {
    set((state) => ({ edlsList: state.edlsList.filter(edls => edls.id !== id) }));
  },
  getEDLS: () => get().edlsList,
}));
