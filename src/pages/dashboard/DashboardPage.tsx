import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, TrendingUp, MessageSquare, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useAnalysisStore from '../../store/analysis-store';
import useResponseStore from '../../store/response-store';
import { formatRelativeTime, truncateText } from '../../utils';
import { useEDLSStore } from '../../store/edls-store';

interface StrengthWeaknessItem {
  id: string;
  party_id: string; 
  type: 'force' | 'faiblesse';
  contenu: string;
  date: string; 
  party_nom?: string; 
}

interface DashboardSummaryData {
  total_parties: number;
  recent_sw: StrengthWeaknessItem[];
}

const DashboardPage: React.FC = () => {
  const { requests: analyses, getAllAnalyses } = useAnalysisStore();
  const { responses, getAllResponses } = useResponseStore();
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true); 
  const [summaryError, setSummaryError] = useState<string | null>(null); 

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([getAllAnalyses(), getAllResponses()]);
      setIsLoading(false);
    };

    const fetchSummaryData = async () => {
      try {
        // Ajouter un timeout pour éviter les requêtes qui durent trop longtemps
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes max
        
        const response = await fetch('/dashboard-summary', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }); 
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText || 'Erreur serveur'}`);
        }
        
        const data: DashboardSummaryData = await response.json();
        setSummaryData({
          total_parties: data.total_parties || 0,
          recent_sw: Array.isArray(data.recent_sw) ? data.recent_sw : []
        });
      } catch (err) {
        if (err instanceof Error) {
          setSummaryError(err.message);
        } else {
          setSummaryError("Une erreur inconnue est survenue lors de la récupération du résumé.");
        }
        console.error("Erreur lors de la récupération du résumé du tableau de bord:", err);
        
        // Fournir des données par défaut en cas d'erreur pour éviter les erreurs d'affichage
        setSummaryData({
          total_parties: 0,
          recent_sw: []
        });
      } finally {
        setLoadingSummary(false);
      }
    };

    loadData();
    fetchSummaryData();
  }, [getAllAnalyses, getAllResponses]);

  // Take only the 5 most recent items
  const recentAnalyses = [...analyses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentResponses = [...responses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  
  const edlsList = useEDLSStore(state => state.edlsList);
  const recentEDLS = [...edlsList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="h1">Tableau de bord</h1>
        <div className="flex gap-3">
          <Button as={Link} to="/edls/nouveau">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel EDLS
          </Button>
          <Button as={Link} to="/analysis/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle analyse
          </Button>
          <Button as={Link} to="/rhdpchat" variant="outline"> 
            <MessageSquare className="h-4 w-4 mr-2" />
            Ouvrir RHDPchat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-primary-light/20">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">Analyses</p>
                <h3 className="text-2xl font-bold text-neutral-900">{analyses.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-secondary-light/20">
                <MessageSquare className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">Réponses</p>
                <h3 className="text-2xl font-bold text-neutral-900">{responses.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-accent-light/20">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">Taux de réponse</p>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {analyses.length > 0 ? `${Math.round((responses.length / analyses.length) * 100)}%` : '0%'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-100">
                <FileText className="h-6 w-6 text-green-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">EDLS</p>
                <h3 className="text-2xl font-bold text-neutral-900">{edlsList.length}</h3>
                <Link to="/edls" className="text-blue-600 underline text-xs">Voir la liste</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aperçu des derniers EDLS */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Derniers EDLS saisis</h2>
        {recentEDLS.length === 0 ? (
          <div className="text-neutral-500">Aucun EDLS pour le moment.</div>
        ) : (
          <div className="space-y-2">
            {recentEDLS.map(edls => (
              <div key={edls.id} className="border rounded p-3 bg-white flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">{edls.title}</div>
                  <div className="text-xs text-neutral-500">{new Date(edls.createdAt).toLocaleString()} | Statut : {edls.status}</div>
                  {edls.aiAnalysis && (
                    <div className="text-xs text-green-800 mt-1">Résumé IA : {edls.aiAnalysis.summary.slice(0, 80)}...</div>
                  )}
                </div>
                {edls.mediaFile && (
                  <a
                    href={edls.mediaFile.data}
                    download={edls.mediaFile.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline mt-2 md:mt-0"
                  >
                    Télécharger le fichier
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
        <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Analyses récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-12 bg-neutral-100 animate-pulse-slow rounded"></div>
                ))}
              </div>
            ) : recentAnalyses.length > 0 ? (
              <div className="space-y-4">
                {recentAnalyses.map((analysis) => (
                  <Link 
                    key={analysis.id} 
                    to={`/analysis/${analysis.id}`}
                    className="block"
                  >
                    <div className="flex items-center border-b border-neutral-100 pb-4">
                      <div className="rounded-full p-2 mr-3 bg-primary-light/20">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {truncateText(analysis.content, 50)}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 text-neutral-400 mr-1" />
                          <p className="text-xs text-neutral-500">
                            {formatRelativeTime(analysis.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">Aucune analyse récente.</p>
            )}
            
            {recentAnalyses.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" as={Link} to="/analysis">
                  Voir toutes les analyses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Réponses récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-12 bg-neutral-100 animate-pulse-slow rounded"></div>
                ))}
              </div>
            ) : recentResponses.length > 0 ? (
              <div className="space-y-4">
                {recentResponses.map((response) => (
                  <Link 
                    key={response.id} 
                    to={`/responses/${response.id}`}
                    className="block"
                  >
                    <div className="flex items-center border-b border-neutral-100 pb-4">
                      <div className="rounded-full p-2 mr-3 bg-secondary-light/20">
                        <MessageSquare className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {truncateText(response.content, 50)}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 text-neutral-400 mr-1" />
                          <p className="text-xs text-neutral-500">
                            {formatRelativeTime(response.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">Aucune réponse récente.</p>
            )}
            
            {recentResponses.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" as={Link} to="/responses">
                  Voir toutes les réponses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {loadingSummary && <p className="text-blue-500">Chargement du résumé...</p>}
      {summaryError && <p className="text-red-500">Erreur de chargement du résumé: {summaryError}</p>}
      {summaryData && !loadingSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Carte pour le nombre total de partis */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-neutral-700 mb-2">Partis Politiques Suivis</h2>
            <p className="text-4xl font-bold text-primary">{summaryData.total_parties}</p>
            <Link to="/parties" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
              Gérer les partis
            </Link>
          </div>

          {/* Section pour les forces et faiblesses récentes */}
          <div className="md:col-span-2 lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-neutral-700 mb-4">Activité Récente (Forces & Faiblesses)</h2>
            {summaryData.recent_sw.length > 0 ? (
              <ul className="space-y-4">
                {summaryData.recent_sw.map(item => (
                  <li key={item.id} className="p-4 border rounded-md hover:bg-neutral-50">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${item.type === 'force' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.type === 'force' ? 'Force' : 'Faiblesse'}
                      </span>
                      <span className="text-xs text-neutral-500">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-2 text-neutral-800 text-sm">
                      {/* Idéalement, on aurait le nom du parti ici. Pour l'instant, on affiche le contenu. */}
                      {/* Pour lier à la page du parti: <Link to={`/parties/${item.party_id}`}>...</Link> */}
                      {item.contenu}
                    </p>
                    {item.party_nom && (
                        <p className='text-xs text-neutral-600 mt-1'>Parti: {item.party_nom}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500">Aucune activité récente à afficher.</p>
            )}
          </div>

          {/* Espace pour d'autres cartes de résumé si nécessaire */}
          {/* Exemple: 
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-neutral-700 mb-2">Autre Statistique</h2>
            <p className="text-4xl font-bold text-primary">123</p>
          </div> 
          */}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;