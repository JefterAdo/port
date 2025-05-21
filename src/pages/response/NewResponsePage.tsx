import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import useAnalysisStore from '../../store/analysis-store';
import useResponseStore from '../../store/response-store';
import { RESPONSE_TYPES, RESPONSE_TONES } from '../../utils/constants';

const NewResponsePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  
  const analysisId = query.get('analysisId');
  const pointsParam = query.get('points');
  const selectedPointIds = pointsParam ? pointsParam.split(',') : [];
  
  const { getAnalysisById, currentRequest, currentResult, isLoading: isAnalysisLoading } = useAnalysisStore();
  const { generateResponse, isGenerating } = useResponseStore();
  
  const [responseType, setResponseType] = useState('');
  const [tone, setTone] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (analysisId) {
      getAnalysisById(analysisId);
    }
  }, [analysisId, getAnalysisById]);
  
  // Get the selected points from the analysis result
  const selectedPoints = currentResult
    ? [
        ...currentResult.keyPoints,
        ...currentResult.arguments,
        ...currentResult.criticisms,
      ].filter(point => selectedPointIds.includes(point.id))
    : [];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!analysisId) {
      setError('ID d\'analyse manquant');
      return;
    }
    
    if (!responseType) {
      setError('Veuillez sélectionner le type de réponse');
      return;
    }
    
    if (!tone) {
      setError('Veuillez sélectionner le ton de la réponse');
      return;
    }
    
    if (selectedPointIds.length === 0) {
      setError('Veuillez sélectionner au moins un point d\'analyse');
      return;
    }
    
    setError(null);
    
    try {
      await generateResponse(
        analysisId,
        selectedPointIds,
        responseType,
        tone,
        additionalInstructions || undefined
      );
      
      // Get the latest response ID and navigate to its detail page
      const currentResponse = useResponseStore.getState().currentResponse;
      if (currentResponse) {
        navigate(`/responses/${currentResponse.id}`);
      } else {
        navigate('/responses');
      }
    } catch {

      setError('Une erreur est survenue lors de la génération de la réponse. Veuillez réessayer.');
    }
  };
  
  if (isAnalysisLoading) {
    return (
      <div className="animate-pulse-slow flex flex-col space-y-4">
        <div className="h-8 w-64 bg-neutral-200 rounded"></div>
        <div className="h-64 bg-neutral-200 rounded"></div>
      </div>
    );
  }
  
  if (!currentRequest || !currentResult) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Analyse non trouvée</h3>
        <p className="text-neutral-500 mb-6">L'analyse associée à cette réponse n'existe pas ou a été supprimée.</p>
        <Button onClick={() => navigate('/analysis')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux analyses
        </Button>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="h1">Générer une réponse</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Paramètres de la réponse
          </CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Points sélectionnés ({selectedPoints.length})</h3>
              <div className="bg-neutral-50 rounded-md p-4 max-h-48 overflow-y-auto">
                {selectedPoints.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {selectedPoints.map(point => (
                      <li key={point.id} className="text-sm text-neutral-700">
                        {point.content}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Aucun point sélectionné. Veuillez retourner à l'analyse pour sélectionner des points.
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Type de réponse"
                options={[{ value: '', label: 'Sélectionnez le type de réponse' }, ...RESPONSE_TYPES]}
                value={responseType}
                onChange={(e) => setResponseType(e.target.value)}
                fullWidth
                required
              />
              
              <Select
                label="Ton de la réponse"
                options={[{ value: '', label: 'Sélectionnez le ton de la réponse' }, ...RESPONSE_TONES]}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                fullWidth
                required
              />
            </div>
            
            <Textarea
              label="Instructions additionnelles (optionnel)"
              placeholder="Précisez des détails supplémentaires pour personnaliser la réponse..."
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={4}
              fullWidth
            />
            
            {error && (
              <div className="text-error text-sm">{error}</div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              isLoading={isGenerating}
              disabled={!responseType || !tone || selectedPoints.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Générer la réponse
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewResponsePage;