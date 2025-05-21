import axios from 'axios';

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';

const perplexityApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const analyzeContent = async (content: string) => {
  try {
    const response = await perplexityApi.post('', {
      model: 'mixtral-8x7b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant specialized in analyzing political content and generating strategic communication responses for RHDP (Rassemblement des Houphouëtistes pour la Démocratie et la Paix).'
        },
        {
          role: 'user',
          content: `Analyze the following content and identify key points, arguments, and criticisms: ${content}`
        }
      ],
      max_tokens: 1000,
    });

    return response.data;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
};

export const generateResponse = async (
  analysisPoints: string[],
  responseType: string,
  tone: string,
  additionalInstructions?: string
) => {
  try {
    const response = await perplexityApi.post('', {
      model: 'mixtral-8x7b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant specialized in generating strategic political communication for RHDP.'
        },
        {
          role: 'user',
          content: `Generate a ${responseType} response in a ${tone} tone addressing these points: ${analysisPoints.join(', ')}. ${additionalInstructions || ''}`
        }
      ],
      max_tokens: 1000,
    });

    return response.data;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
};