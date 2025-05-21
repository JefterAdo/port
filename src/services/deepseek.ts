// src/services/deepseek.ts

export interface DeepseekAnalysisResult {
  summary: string;
  keyPoints: string[];
  negativePoints: string[];
  sentiment: string;
  suggestedResponses: string[];
}

export async function analyzeWithDeepseek(content: string): Promise<DeepseekAnalysisResult> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('Clé API Deepseek manquante.');

  const prompt = `Tu es un assistant politique expert. Analyse le texte suivant et fournis :\n- Un résumé concis\n- Les points clés positifs\n- Les points clés négatifs\n- Le sentiment général\n- Des suggestions de réponses ou éléments de langage pertinents\n\nTexte à analyser :\n${content}`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Tu es un assistant politique expert.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 512
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Erreur Deepseek: ' + errorText);
  }
  const data = await response.json();
  const aiText: string = data.choices?.[0]?.message?.content || '';

  // Extraction naïve des sections (à améliorer selon le format réel Deepseek)
  const extractSection = (text: string, label: string): string[] => {
    const regex = new RegExp(`${label}:(.*?)(?:\\n[A-Z]|$)`, 'si');
    const match = regex.exec(text);
    if (!match) return [];
    return match[1].split('\n').map(l => l.trim()).filter(Boolean);
  };

  return {
    summary: (aiText.match(/résumé[ :]*([\s\S]*?)(?:\n[A-Z]|$)/i)?.[1] || '').trim(),
    keyPoints: extractSection(aiText, 'points clés positifs'),
    negativePoints: extractSection(aiText, 'points clés négatifs'),
    sentiment: (aiText.match(/sentiment[ :]*([\s\S]*?)(?:\n[A-Z]|$)/i)?.[1] || '').trim(),
    suggestedResponses: extractSection(aiText, 'suggestions de réponses'),
  };
}
