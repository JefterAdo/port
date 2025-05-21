// Authentication constants
import { LayoutDashboard, Search, History, Users } from 'lucide-react';

export const AUTH_TOKEN_KEY = 'rhdp_auth_token';

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  USERS: '/users',
  ANALYSIS: '/analysis',
  RHDPCHAT: '/rhdpchat', // Anciennement RESPONSES
  HISTORY: '/history',
  DASHBOARD: '/dashboard',
};

// Content types
export const CONTENT_TYPES = [
  { value: 'article', label: 'Article de presse' },
  { value: 'social_media', label: 'Publication sur les réseaux sociaux' },
  { value: 'criticism', label: 'Critique ou doléance' },
  { value: 'question', label: 'Question du public' },
  { value: 'other', label: 'Autre' },
];

// Response types
export const RESPONSE_TYPES = [
  { value: 'talking_point', label: 'Éléments de langage' },
  { value: 'tweet', label: 'Tweet / Publication courte' },
  { value: 'detailed_response', label: 'Réponse détaillée' },
  { value: 'report', label: 'Rapport complet' },
];

// Response tones
export const RESPONSE_TONES = [
  { value: 'factual', label: 'Factuel' },
  { value: 'persuasive', label: 'Persuasif' },
  { value: 'defensive', label: 'Défensif' },
  { value: 'assertive', label: 'Assertif' },
];

// User roles
export const USER_ROLES = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'user', label: 'Utilisateur' },
];

// Navigation items
export const NAV_ITEMS = [
  { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Analyse de Contenu', path: '/analysis', icon: Search },
  { 
    label: 'EDLS', 
    path: '/edls', 
    icon: Search,
    subMenu: [
      { label: 'EDLS OFFICIELS', path: '/edls/officiels' },
      { label: 'EDLS PERSONNALISÉS', path: '/edls/personnalises' },
      { label: 'EDLS DE PROPAGANDE', path: '/edls/propagande' },
      { label: 'EDLS V.O', path: '/edls/vo' },
      { label: 'EDLS DE PROXIMITÉ', path: '/edls/proximite' },
      { label: 'PROJETS D\'EDLS', path: '/edls/projets' },
    ],
    menuDirection: 'horizontal'
  },
  { label: 'Forces & Faiblesses', path: '/parties', icon: Search },
  { label: 'REMONTÉES D\'INFORMATIONS', path: '/remontees', icon: Search },
  { 
    label: 'LANCER RECHERCHE', 
    path: '/search', 
    icon: Search,
    subMenu: [
      { label: 'Retrouver une information sur le site', path: '/search/basic' },
      { label: 'Recherches avancées', path: '/search/advanced' },
      { label: 'RHDP Chat', path: '/rhdpchat' },
    ],
    menuDirection: 'vertical'
  },
  { label: 'Historique', path: '/history', icon: History },
  { label: 'Utilisateurs', path: '/users', adminOnly: true, icon: Users },
];

// Pagination
export const ITEMS_PER_PAGE = 10;

// Demo mode
export const IS_DEMO_MODE = true; // Set to false in production