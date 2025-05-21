import { create } from 'zustand';
import { ResponseRequest, GeneratedResponse } from '../types';

interface ResponseState {
  requests: ResponseRequest[];
  responses: GeneratedResponse[];
  currentRequest: ResponseRequest | null;
  currentResponse: GeneratedResponse | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

interface ResponseActions {
  generateResponse: (
    analysisId: string,
    selectedPoints: string[],
    responseType: string,
    tone: string,
    additionalInstructions?: string
  ) => Promise<void>;
  getResponseById: (id: string) => Promise<void>;
  clearCurrentResponse: () => void;
  deleteResponse: (id: string) => Promise<void>;
  getAllResponses: () => Promise<void>;
}

// Mock data generator
const generateMockResponse = (
  analysisId: string,
  selectedPoints: string[],
  responseType: string,
  tone: string,
  additionalInstructions?: string
): [ResponseRequest, GeneratedResponse] => {
  const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const responseId = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const request: ResponseRequest = {
    id: requestId,
    userId: '1', // Mock user ID
    analysisId,
    selectedPoints,
    responseType: responseType as 'talking_point' | 'tweet' | 'detailed_response' | 'report',
    tone: tone as 'factual' | 'persuasive' | 'defensive' | 'assertive',
    additionalInstructions,
    createdAt: new Date().toISOString(),
  };
  
  // Generate content based on response type
  let content = '';
  
  switch (responseType) {
    case 'talking_point':
      content = `
• Le RHDP a réalisé plus de 80% de son programme de gouvernement initial.
• Notre économie a enregistré une croissance stable de plus de 7% par an depuis 2012.
• Plus de 65% de la population a désormais accès à l'eau potable contre seulement 35% en 2010.
• Le revenu par habitant a augmenté de 40% en 10 ans grâce à nos politiques économiques.
• Notre programme de réconciliation nationale a permis le retour pacifique de plus de 90% des exilés politiques.`;
      break;
    case 'tweet':
      content = `Le #RHDP poursuit sa mission de transformation de la Côte d'Ivoire: 7% de croissance économique soutenue, 65% d'accès à l'eau potable, et un revenu par habitant en hausse de 40% en 10 ans. Nous continuons d'avancer ensemble pour une #CôtedIvoire prospère et solidaire. 🇨🇮`;
      break;
    case 'detailed_response':
      content = `
# Réponse aux critiques concernant la politique économique du gouvernement

Le gouvernement RHDP a mis en œuvre une stratégie économique robuste et cohérente qui a permis à la Côte d'Ivoire de maintenir une croissance exceptionnelle depuis 2012. Contrairement aux allégations avancées par l'opposition, nos politiques ont eu un impact significatif et mesurable sur le bien-être des Ivoiriens.

## Résultats économiques concrets

Notre économie a maintenu une croissance moyenne de 7,8% entre 2012 et 2019, puis a démontré une remarquable résilience pendant la crise de la COVID-19, ne reculant que de 1,2% quand la plupart des économies mondiales subissaient des contractions bien plus importantes. Dès 2021, nous avons rebondi avec une croissance de 7%, prouvant la solidité de nos fondamentaux économiques.

Le revenu par habitant a augmenté de plus de 40% sur la décennie, et le taux de pauvreté a reculé de 15 points de pourcentage. Ce sont des indicateurs concrets qui démontrent que notre politique de développement profite directement aux citoyens.

## Diversification économique

Le gouvernement a lancé avec succès plusieurs initiatives de diversification économique, notamment:

- Le Plan National de Développement (PND) 2021-2025 qui mobilise plus de 59 000 milliards de FCFA
- Le Programme National d'Investissement Agricole qui modernise notre agriculture
- La stratégie d'accélération industrielle qui a permis la création de 5 zones industrielles équipées

Ces projets structurants créent des emplois durables et réduisent notre dépendance aux matières premières traditionnelles.

## Conclusion

Les performances économiques de la Côte d'Ivoire sous le leadership du RHDP ne sont pas le fruit du hasard mais résultent d'une vision claire, d'une planification rigoureuse et d'une mise en œuvre méthodique des politiques publiques. Nous restons déterminés à poursuivre cette trajectoire vertueuse pour une prospérité partagée.`;
      break;
    case 'report':
      content = `
# Rapport d'analyse et de recommandations stratégiques
## Contexte politique actuel

L'environnement politique ivoirien reste caractérisé par des tensions résiduelles malgré les avancées significatives en matière de réconciliation nationale. L'opposition continue de soulever des questions sur la gouvernance économique et l'inclusivité des politiques gouvernementales.

## Analyse des critiques principales

Les critiques formulées à l'encontre du gouvernement et du RHDP peuvent être regroupées en trois catégories principales:

### 1. Gouvernance économique

**Critiques reçues:**
- Concentration des bénéfices de la croissance
- Augmentation des inégalités territoriales
- Faible impact sur l'emploi des jeunes

**Réalité factuelle:**
- La Côte d'Ivoire a maintenu une croissance moyenne de 7,8% entre 2012 et 2023
- Le taux de pauvreté est passé de 51% en 2011 à 36% en 2023
- Plus de 2,8 millions d'emplois ont été créés en 10 ans
- Les investissements publics dans les régions ont été multipliés par 5

### 2. Inclusion politique

**Critiques reçues:**
- Manque d'ouverture politique
- Instrumentalisation de la justice
- Restrictions des libertés publiques

**Réalité factuelle:**
- Dialogue politique permanent institutionnalisé depuis 2019
- Participation de tous les partis aux dernières élections législatives
- Plus de 800 prisonniers politiques graciés entre 2018 et 2023
- Réforme consensuelle de la Commission Électorale Indépendante

### 3. Accomplissements du programme gouvernemental

**Critiques reçues:**
- Retards dans l'exécution des projets d'infrastructure
- Qualité insuffisante des services publics
- Promesses non tenues en matière de logements sociaux

**Réalité factuelle:**
- Taux d'exécution du PND 2021-2025 de 68% à mi-parcours
- Construction de plus de 30.000 logements sociaux (objectif: 50.000)
- 87% de la population a désormais accès à l'électricité contre 56% en 2011
- Plus de 6.000 km de routes construites ou réhabilitées

## Recommandations stratégiques

1. **Communication proactive:**
   - Intensifier la communication sur les résultats concrets par région
   - Produire des supports visuels simplifiés sur les avancées socio-économiques
   - Mettre en avant les témoignages des bénéficiaires directs des programmes gouvernementaux

2. **Renforcement du dialogue:**
   - Maintenir le dialogue avec l'opposition sur les questions d'intérêt national
   - Organiser des consultations citoyennes régulières sur l'exécution des projets
   - Impliquer davantage la société civile dans le suivi-évaluation des politiques publiques

3. **Accélération des projets à fort impact social:**
   - Prioriser les projets d'accès à l'eau potable dans les zones rurales
   - Renforcer les programmes d'employabilité des jeunes
   - Accélérer la mise en œuvre du programme de couverture santé universelle

## Conclusion

La solidité du bilan gouvernemental constitue notre meilleur atout de communication. En mettant l'accent sur les résultats tangibles et en reconnaissant les défis qui persistent, le RHDP peut renforcer sa crédibilité et consolider son leadership politique.

Annexes:
- Tableaux comparatifs des indicateurs socio-économiques 2010-2023
- Cartographie des projets majeurs par région
- Calendrier des réformes structurelles en cours`;
      break;
    default:
      content = 'Contenu généré par l\'IA pour le RHDP';
  }
  
  const response: GeneratedResponse = {
    id: responseId,
    requestId,
    content,
    format: 'text',
    createdAt: new Date().toISOString(),
  };
  
  return [request, response];
};

type ResponseStore = ResponseState & ResponseActions;

const useResponseStore = create<ResponseStore>((set, get) => ({
  requests: [],
  responses: [],
  currentRequest: null,
  currentResponse: null,
  isLoading: false,
  isGenerating: false,
  error: null,

  generateResponse: async (analysisId, selectedPoints, responseType, tone, additionalInstructions) => {
    set({ isGenerating: true });
    
    try {
      // In a production environment, this would make an API call to the LLM service
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock API delay
      
      const [request, response] = generateMockResponse(
        analysisId,
        selectedPoints,
        responseType,
        tone,
        additionalInstructions
      );
      
      set(state => ({
        requests: [...state.requests, request],
        responses: [...state.responses, response],
        currentRequest: request,
        currentResponse: response,
        isGenerating: false,
      }));
    } catch {
      set({
        isGenerating: false,
      });
    }
  },

  getResponseById: async (id) => {
    set({ isLoading: true });
    
    try {
      // In a production environment, this would retrieve data from your API
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock API delay
      
      const { requests, responses } = get();
      const request = requests.find(r => r.id === id);
      const response = responses.find(r => r.id === id || r.requestId === id);
      
      if (!request || !response) {
        throw new Error('Réponse non trouvée');
      }
      
      set({
        currentRequest: request,
        currentResponse: response,
        isLoading: false,
      });
    } catch {
      set({
        isLoading: false,
      });
    }
  },

  clearCurrentResponse: () => {
    set({
      currentRequest: null,
      currentResponse: null,
    });
  },

  deleteResponse: async (id) => {
    set({ isLoading: true });
    
    try {
      // In a production environment, this would delete data via your API
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock API delay
      
      set(state => ({
        requests: state.requests.filter(r => r.id !== id),
        responses: state.responses.filter(r => r.id !== id && r.requestId !== id),
        isLoading: false,
      }));
      
      // Clear current if it was deleted
      const { currentResponse } = get();
      if (currentResponse && (currentResponse.id === id || currentResponse.requestId === id)) {
        get().clearCurrentResponse();
      }
    } catch {
      set({
        isLoading: false,
      });
    }
  },

  getAllResponses: async () => {
    set({ isLoading: true });
    
    try {
      // In a production environment, this would fetch data from your API
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock API delay
      
      // For demo, we already have the responses in state
      set({ isLoading: false });
      
      // In a real implementation, you would fetch from API and update state
      // set({ requests: fetchedRequests, responses: fetchedResponses, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Une erreur est survenue lors du chargement des réponses',
      });
    }
  },
}));

export default useResponseStore;