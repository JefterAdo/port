import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, Calendar, Clock, ExternalLink, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import useAnalysisStore from '../../store/analysis-store';
import { formatDate, formatRelativeTime, truncateText } from '../../utils';
import { CONTENT_TYPES } from '../../utils/constants';

const AnalysisPage: React.FC = () => {
  const { requests: analyses, getAllAnalyses, isLoading } = useAnalysisStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    getAllAnalyses();
  }, [getAllAnalyses]);
  
  // Filter analyses based on search term and type
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchTerm === '' || 
      analysis.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === '' || 
      analysis.contentType === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Sort analyses
  const sortedAnalyses = [...filteredAnalyses].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });
  
  const contentTypeLabels: Record<string, string> = {
    article: 'Article',
    social_media: 'Réseaux sociaux',
    criticism: 'Critique',
    question: 'Question',
    other: 'Autre',
  };
  
  const getContentTypeVariant = (type: string): 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'article':
        return 'primary';
      case 'social_media':
        return 'secondary';
      case 'criticism':
        return 'error';
      case 'question':
        return 'warning';
      default:
        return 'outline';
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="h1">Analyses</h1>
        <Button as={Link} to="/analysis/new">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle analyse
        </Button>
      </div>
      
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
            <Filter className="h-4 w-4 text-neutral-400 mr-2" />
            <Select
              placeholder="Type de contenu"
              options={[
                { value: '', label: 'Tous les types' },
                ...CONTENT_TYPES
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
              <CardContent className="p-6 h-32"></CardContent>
            </Card>
          ))}
        </div>
      ) : sortedAnalyses.length > 0 ? (
        <div className="space-y-4 animate-fade-in">
          {sortedAnalyses.map((analysis) => (
            <Card 
              key={analysis.id} 
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="flex items-center mb-2 md:mb-0">
                    <Badge variant={getContentTypeVariant(analysis.contentType)}>
                      {contentTypeLabels[analysis.contentType] || 'Autre'}
                    </Badge>
                    <div className="flex items-center ml-4 text-sm text-neutral-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(analysis.createdAt, 'dd MMMM yyyy')}
                    </div>
                    <div className="flex items-center ml-4 text-sm text-neutral-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatRelativeTime(analysis.createdAt)}
                    </div>
                  </div>
                  
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      as={Link} 
                      to={`/analysis/${analysis.id}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Voir l'analyse
                    </Button>
                  </div>
                </div>
                
                <p className="text-neutral-900">
                  {truncateText(analysis.content, 150)}
                </p>
                
                {analysis.source && (
                  <p className="text-sm text-neutral-500 mt-2">
                    Source: {analysis.source}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200 animate-fade-in">
          <Search className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Aucune analyse trouvée</h3>
          <p className="text-neutral-500 mb-6">
            {searchTerm || filterType ? 
              'Aucun résultat ne correspond à votre recherche. Essayez d\'autres critères.' : 
              'Commencez par créer une nouvelle analyse.'}
          </p>
          <Button as={Link} to="/analysis/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle analyse
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;