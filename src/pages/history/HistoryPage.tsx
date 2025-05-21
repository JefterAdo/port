import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Search, Calendar, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import useAnalysisStore from '../../store/analysis-store';
import useResponseStore from '../../store/response-store';
import { formatRelativeTime, truncateText } from '../../utils';
import { HistoryItem } from '../../types';

const HistoryPage: React.FC = () => {
  const { requests: analyses, getAllAnalyses } = useAnalysisStore();
  const { responses, getAllResponses } = useResponseStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([getAllAnalyses(), getAllResponses()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [getAllAnalyses, getAllResponses]);
  
  // Create history items from analyses and responses
  const historyItems: HistoryItem[] = [
    ...analyses.map(analysis => ({
      id: `analysis-${analysis.id}`,
      type: 'analysis' as const,
      title: truncateText(analysis.content, 100),
      summary: analysis.contentType,
      createdAt: analysis.createdAt,
      itemId: analysis.id,
    })),
    ...responses.map(response => ({
      id: `response-${response.id}`,
      type: 'response' as const,
      title: truncateText(response.content, 100),
      summary: 'Réponse générée',
      createdAt: response.createdAt,
      itemId: response.id,
    })),
  ];
  
  // Filter history items based on search term and type
  const filteredItems = historyItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === '' || 
      item.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Sort history items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="h1">Historique</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 mb-4">{null}</div>
      
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <Input
              type="text"
              placeholder="Rechercher..."
              className="pl-10"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <History className="h-4 w-4 text-neutral-400 mr-2" />
            <Select
              label="Type d'activité"
              options={[
                { value: '', label: 'Toutes les activités', disabled: true },
                { value: 'analysis', label: 'Analyses' },
                { value: 'response', label: 'Réponses' },
              ]}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              fullWidth
            />
          </div>
          
          <div className="flex items-center">
            <ArrowUpDown className="h-4 w-4 text-neutral-400 mr-2" />
            <Select
              placeholder="Trier par"
              options={[
                { value: 'newest', label: 'Plus récent' },
                { value: 'oldest', label: 'Plus ancien' },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              fullWidth
            />
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="animate-pulse-slow">
              <CardContent className="p-6 h-24"></CardContent>
            </Card>
          ))}
        </div>
      ) : sortedItems.length > 0 ? (
        <div className="animate-fade-in">
          {/* Group by date */}
          {Object.entries(
            sortedItems.reduce((groups, item) => {
              const date = new Date(item.createdAt).toLocaleDateString('fr-FR');
              if (!groups[date]) {
                groups[date] = [];
              }
              groups[date].push(item);
              return groups;
            }, {} as Record<string, HistoryItem[]>)
          ).map(([date, items]) => (
            <div key={date} className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">{date}</h2>
              
              <div className="space-y-3">
                {items.map(item => (
                  <Card 
                    key={item.id} 
                    className="hover:shadow-sm transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <Badge
                            variant={item.type === 'analysis' ? 'primary' : 'secondary'}
                            className="mt-1"
                          >
                            {item.type === 'analysis' ? 'Analyse' : 'Réponse'}
                          </Badge>
                          
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-900">
                              {item.title}
                            </p>
                            
                            <div className="flex items-center mt-1 text-xs text-neutral-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatRelativeTime(item.createdAt)}
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          as={Link} 
                          to={`/${item.type === 'analysis' ? 'analysis' : 'responses'}/${item.itemId}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200 animate-fade-in">
          <History className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Aucune activité trouvée</h3>
          <p className="text-neutral-500 mb-6">
            {searchTerm || filterType ? 
              'Aucun résultat ne correspond à votre recherche. Essayez d\'autres critères.' : 
              'L\'historique de vos activités apparaîtra ici.'}
          </p>
          <Button as={Link} to="/analysis/new">
            Créer une analyse
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;