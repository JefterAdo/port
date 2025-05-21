import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Send, Trash } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import useAnalysisStore from '../../store/analysis-store';
import { CONTENT_TYPES } from '../../utils/constants';

const NewAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { submitContent, isAnalyzing } = useAnalysisStore();
  
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<CONTENT_TYPES>('' as CONTENT_TYPES);
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Veuillez saisir le contenu à analyser');
      return;
    }
    
    if (!contentType) {
      setError('Veuillez sélectionner le type de contenu');
      return;
    }
    
    setError(null);
    
    try {
      await submitContent(content, contentType, source || undefined);
      
      // Get the latest request ID and navigate to its detail page
      const latestRequest = useAnalysisStore.getState().currentRequest;
      if (latestRequest) {
        navigate(`/analysis/${latestRequest.id}`);
      } else {
        navigate('/analysis');
      }
    } finally {
      // setLoading(false); // This line was not present in the original code, so I left it commented
    }
  };
  
  const handleClear = () => {
    setContent('');
    setContentType('' as CONTENT_TYPES);
    setSource('');
    setError(null);
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/analysis')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="h1">Nouvelle analyse</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Soumettre un contenu à analyser
          </CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <Textarea
              label="Contenu à analyser"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              rows={10}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Type de contenu"
                options={CONTENT_TYPES}
                value={contentType}
                onChange={(e) => setContentType(e.target.value as CONTENT_TYPES)}
                fullWidth
                required
              />
              
              <Input
                label="Source (optionnel)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                fullWidth
              />
            </div>
            
            {error && (
              <div className="text-error text-sm">{error}</div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleClear}
              disabled={isAnalyzing || (!content && !contentType && !source)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Effacer
            </Button>
            
            <Button 
              type="submit" 
              isLoading={isAnalyzing}
              disabled={!content.trim() || !contentType}
            >
              <Send className="h-4 w-4 mr-2" />
              Analyser le contenu
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewAnalysisPage;