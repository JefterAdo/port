import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Download, Trash, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import useResponseStore from '../../store/response-store';
import useAnalysisStore from '../../store/analysis-store';
import { formatDate, downloadAsFile } from '../../utils';

const ResponseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { getResponseById, currentRequest, currentResponse, isLoading, deleteResponse } = useResponseStore();
  const { getAnalysisById, currentRequest: analysisRequest } = useAnalysisStore();
  
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (id) {
      getResponseById(id);
    }
  }, [id, getResponseById]);
  
  useEffect(() => {
    // Fetch the original analysis if we have a response and its analysis ID
    if (currentRequest && currentRequest.analysisId) {
      getAnalysisById(currentRequest.analysisId);
    }
  }, [currentRequest, getAnalysisById]);
  
  if (isLoading) {
    return (
      <div className="animate-pulse-slow flex flex-col space-y-4">
        <div className="h-8 w-64 bg-neutral-200 rounded"></div>
        <div className="h-64 bg-neutral-200 rounded"></div>
      </div>
    );
  }
  
  if (!currentResponse) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Réponse non trouvée</h3>
        <p className="text-neutral-500 mb-6">La réponse que vous recherchez n'existe pas ou a été supprimée.</p>
        <Button as={Link} to="/responses">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux réponses
        </Button>
      </div>
    );
  }
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(currentResponse.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réponse ? Cette action est irréversible.')) {
      await deleteResponse(currentResponse.id);
      navigate('/responses');
    }
  };
  
  const handleExport = () => {
    // Determine file extension and content type based on format
    const extension = 'txt';
    const contentType = 'text/plain';
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reponse-rhdp-${timestamp}.${extension}`;
    
    // Download the file
    downloadAsFile(currentResponse.content, filename, contentType);
  };
  
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
  
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/responses')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="h1">Détails de la réponse</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleCopyToClipboard}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-success" />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDelete}
            className="text-error hover:bg-error/10"
          >
            <Trash className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <CardTitle>Réponse générée</CardTitle>
              
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                {currentRequest && (
                  <>
                    <Badge>{responseTypeLabels[currentRequest.responseType] || 'Réponse'}</Badge>
                    <Badge variant="outline">{responseToneLabels[currentRequest.tone] || 'Standard'}</Badge>
                  </>
                )}
                <span className="text-sm text-neutral-500">
                  {formatDate(currentResponse.createdAt, 'dd MMMM yyyy HH:mm')}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Display content differently based on response type */}
            <div className="bg-white border border-neutral-200 rounded-md p-6 whitespace-pre-wrap">
              {currentResponse.content}
            </div>
          </CardContent>
        </Card>
        
        {analysisRequest && (
          <Card>
            <CardHeader>
              <CardTitle>Contenu analysé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-neutral-50 rounded-md p-4 whitespace-pre-wrap">
                {analysisRequest.content}
              </div>
              
              {analysisRequest.source && (
                <p className="text-sm text-neutral-500 mt-4">
                  Source: {analysisRequest.source}
                </p>
              )}
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  as={Link} 
                  to={`/analysis/${analysisRequest.id}`}
                >
                  Voir l'analyse complète
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResponseDetailPage;