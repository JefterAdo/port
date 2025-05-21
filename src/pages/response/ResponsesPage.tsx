import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, Filter, Calendar, Clock, ExternalLink, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import useResponseStore from '../../store/response-store';
import { formatDate, formatRelativeTime, truncateText } from '../../utils';
import { RESPONSE_TYPES, RESPONSE_TONES } from '../../utils/constants';

const ResponsesPage: React.FC = () => {
  const { requests, responses, getAllResponses, isLoading } = useResponseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTone, setFilterTone] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    getAllResponses();
  }, [getAllResponses]);
  
  // Create a map of requests by ID for easy lookup
  const requestsById = requests.reduce((acc, request) => {
    acc[request.id] = request;
    return acc;
  }, {} as Record<string, typeof requests[0]>);
  
  // Filter responses based on search term, type, and tone
  const filteredResponses = responses.filter(response => {
    const matchesSearch = searchTerm === '' || 
      response.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const request = responses.find(r => r.id === response.id || r.requestId === response.requestId)
      ? requestsById[response.requestId]
      : null;
    
    const matchesType = filterType === '' || 
      (request && request.responseType === filterType);
    
    const matchesTone = filterTone === '' || 
      (request && request.tone === filterTone);
    
    return matchesSearch && matchesType && matchesTone;
  });
  
  // Sort responses
  const sortedResponses = [...filteredResponses].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });
  
  const responseTypeLabels: Record<string, string> = {
    talking_point: 'Élément de langage',
    tweet: 'Tweet',
    detailed_response: 'Réponse détaillée',
    report: 'Rapport',
  };
  
  const responseToneLabels: Record<string, string> = {
    factual: 'Factuel',
    persuasive: 'Persuasif',
    defensive: 'Défensif',
    assertive: 'Assertif',
  };
  
  const getResponseTypeVariant = (type: string): 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'talking_point':
        return 'primary';
      case 'tweet':
        return 'secondary';
      case 'detailed_response':
        return 'success';
      case 'report':
        return 'warning';
      default:
        return 'outline';
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="h1">Réponses</h1>
        <Button as={Link} to="/analysis/new">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle analyse
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageSquare className="h-4 w-4 text-neutral-400" />
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
              placeholder="Type de réponse"
              options={[
                { value: '', label: 'Tous les types' },
                ...RESPONSE_TYPES
              ]}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              fullWidth
            />
          </div>
          
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-neutral-400 mr-2" />
            <Select
              placeholder="Ton"
              options={[
                { value: '', label: 'Tous les tons' },
                ...RESPONSE_TONES
              ]}
              value={filterTone}
              onChange={(e) => setFilterTone(e.target.value)}
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
      ) : sortedResponses.length > 0 ? (
        <div className="space-y-4 animate-fade-in">
          {sortedResponses.map((response) => {
            const request = requestsById[response.requestId];
            
            return (
              <Card 
                key={response.id} 
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-0">
                      {request && (
                        <Badge variant={getResponseTypeVariant(request.responseType)}>
                          {responseTypeLabels[request.responseType] || 'Autre'}
                        </Badge>
                      )}
                      
                      {request && (
                        <Badge variant="outline">
                          {responseToneLabels[request.tone] || 'Autre'}
                        </Badge>
                      )}
                      
                      <div className="flex items-center ml-0 md:ml-2 text-sm text-neutral-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(response.createdAt, 'dd MMMM yyyy')}
                      </div>
                      
                      <div className="flex items-center ml-0 md:ml-2 text-sm text-neutral-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatRelativeTime(response.createdAt)}
                      </div>
                    </div>
                    
                    <div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        as={Link} 
                        to={`/responses/${response.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Voir la réponse
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-neutral-900 whitespace-pre-line">
                    {truncateText(response.content, 150)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200 animate-fade-in">
          <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Aucune réponse trouvée</h3>
          <p className="text-neutral-500 mb-6">
            {searchTerm || filterType || filterTone ? 
              'Aucun résultat ne correspond à votre recherche. Essayez d\'autres critères.' : 
              'Commencez par analyser un contenu et générer une réponse.'}
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

export default ResponsesPage;