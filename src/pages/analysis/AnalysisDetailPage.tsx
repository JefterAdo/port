import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Trash,
  Send,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

import useAnalysisStore from "../../store/analysis-store";
import { formatDate, downloadAsFile } from "../../utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const AnalysisDetailPage: React.FC = () => {
  // Chat IA state
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Envoi du message utilisateur et réponse IA simulée (remplacer par appel API si besoin)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: currentMessage.trim() };
    setChatHistory(prev => [...prev, userMsg]);
    setCurrentMessage("");
    setLoading(true);
    try {
      // Préparer le contexte d'analyse pour l'IA (résumé, points, critiques)
      let context = '';
      if (currentResult) {
        context += `Résumé : ${currentResult.summary || 'Aucun résumé.'}\n`;
        if (currentResult.positivePoints?.length) {
          context += `Points positifs : ${currentResult.positivePoints.join(' ; ')}\n`;
        }
        if (currentResult.negativePoints?.length) {
          context += `Points négatifs : ${currentResult.negativePoints.join(' ; ')}\n`;
        }
        if (currentResult.criticisms?.length) {
          context += `Critiques : ${currentResult.criticisms.map(c => c.content).join(' ; ')}\n`;
        }
      }
      const resp = await fetch('http://localhost:3001/api/analysis-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, context })
      });
      const data = await resp.json();
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: data.aiMessage || 'Réponse IA indisponible.' }
      ]);
    } catch {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Erreur lors de la communication avec l’IA.' }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    getAnalysisById,
    currentRequest,
    currentResult,
    isLoading,
    deleteAnalysis,
  } = useAnalysisStore();


  useEffect(() => {
    if (id) {
      getAnalysisById(id);
    }
  }, [id, getAnalysisById]);

  if (isLoading) {
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
        <Search className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">
          Analyse non trouvée
        </h3>
        <p className="text-neutral-500 mb-6">
          L'analyse que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <Button as={Link} to="/analysis">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux analyses
        </Button>
      </div>
    );
  }

  // 

  // 

  const handleDelete = async () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette analyse ? Cette action est irréversible."
      )
    ) {
      await deleteAnalysis(currentRequest.id);
      navigate("/analysis");
    }
  };

  const handleExport = () => {
    const exportData = {
      id: currentRequest.id,
      content: currentRequest.content,
      contentType: currentRequest.contentType,
      source: currentRequest.source,
      createdAt: currentRequest.createdAt,
      analysis: {
        summary: currentResult.summary,
        keyPoints: currentResult.keyPoints,
        arguments: currentResult.arguments,
        criticisms: currentResult.criticisms,
      },
    };

    downloadAsFile(
      JSON.stringify(exportData, null, 2),
      `analyse-${currentRequest.id}.json`,
      "application/json"
    );
  };

  // 

  const contentTypeLabels: Record<string, string> = {
    article: "Article",
    social_media: "Réseaux sociaux",
    criticism: "Critique",
    question: "Question",
    other: "Autre",
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/analysis")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="h1">Détails de l'analyse</h1>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Contenu analysé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge>
                  {contentTypeLabels[currentRequest.contentType] || "Autre"}
                </Badge>
                <span className="text-sm text-neutral-500">
                  {formatDate(currentRequest.createdAt, "dd MMMM yyyy HH:mm")}
                </span>
              </div>

              <div className="bg-neutral-50 rounded-md p-4 whitespace-pre-wrap">
                {currentRequest.content}
              </div>

              {currentRequest.source && (
                <p className="text-sm text-neutral-500 mt-4">
                  Source: {currentRequest.source}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <div className="space-y-6">
            {/* Résumé de l'analyse */}
            <div className="mb-6">
              <h2 className="h2 mb-2">Résumé de l'analyse</h2>
              <p className="text-neutral-700 whitespace-pre-wrap">
                {currentResult.summary || "Aucun résumé disponible."}
              </p>
            </div>

            {/* Points Positifs */}
            {currentResult.positivePoints &&
              currentResult.positivePoints.length > 0 && (
                <div className="mb-6">
                  <h2 className="h2 mb-2">Points Positifs Clés</h2>
                  <ul className="list-disc list-inside space-y-1 text-neutral-700">
                    {currentResult.positivePoints.map((point, index) => (
                      <li key={`positive-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Points Négatifs */}
            {currentResult.negativePoints &&
              currentResult.negativePoints.length > 0 && (
                <div className="mb-6">
                  <h2 className="h2 mb-2">Points Négatifs Clés</h2>
                  <ul className="list-disc list-inside space-y-1 text-neutral-700">
                    {currentResult.negativePoints.map((point, index) => (
                      <li key={`negative-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Propositions de Réponses */}
            {currentResult.suggestedResponses &&
              currentResult.suggestedResponses.length > 0 && (
                <div className="mb-6">
                  <h2 className="h2 mb-2">Propositions de Réponses</h2>
                  <ul className="list-decimal list-inside space-y-1 text-neutral-700">
                    {currentResult.suggestedResponses.map((response, index) => (
                      <li key={`response-${index}`}>{response}</li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Critiques identifiées */}
            {currentResult.criticisms &&
              currentResult.criticisms.length > 0 && (
                <div className="mb-6">
                  <h2 className="h2 mb-2">Critiques identifiées</h2>
                  <ul className="list-disc list-inside space-y-1 text-neutral-700">
                    {currentResult.criticisms.map((criticism) => (
                      <li key={criticism.id}>{criticism.content}</li>
                    ))}
                  </ul>
                </div>
              )}

            <CardFooter className="flex justify-end px-0">

            </CardFooter>

            {/* Conversation avec l'IA */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle>
                  Discuter avec l'IA à propos de cette analyse
                </CardTitle>
                <p className="text-sm text-neutral-500">
                  Posez des questions ou demandez des précisions sur l'analyse
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4 p-2" ref={chatContainerRef}>
                  {chatHistory.length === 0 ? (
                    <div className="bg-neutral-100 p-3 rounded-lg">
                      <p className="text-sm font-medium">
                        Comment puis-je vous aider à mieux comprendre cette analyse ?
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${msg.role === "user" ? "bg-primary/10 text-right ml-auto" : "bg-neutral-100 text-left mr-auto"}`}
                        style={{ maxWidth: "80%" }}
                      >
                        <span className="text-sm font-medium">{msg.content}</span>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="bg-neutral-100 p-3 rounded-lg text-left mr-auto animate-pulse">
                      <span className="text-sm font-medium text-neutral-400">L'IA rédige une réponse…</span>
                    </div>
                  )}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={handleSendMessage}
                >
                  <textarea
                    placeholder="Posez une question sur l'analyse..."
                    className="flex-1 min-h-[48px] max-h-40 resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    value={currentMessage}
                    onChange={e => setCurrentMessage(e.target.value)}
                    disabled={loading}
                    rows={2}
                  />
                  <Button type="submit" disabled={!currentMessage.trim() || loading}>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetailPage;
