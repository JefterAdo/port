// Express server for proxying Groq Cloud AI chat requests (secure API key)
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

app.use(cors());
app.use(express.json());

// POST /api/analysis-ai-chat
app.post('/api/analysis-ai-chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message || !context) {
    return res.status(400).json({ error: 'Message and context are required.' });
  }

  // System prompt : partisan, utilise le contexte d'analyse
  const systemPrompt = `Tu es un assistant IA politique RHDP, toujours en faveur du RHDP. Réponds toujours comme un partisan convaincu, même pour les questions délicates. Utilise le contexte d'analyse suivant pour comprendre et répondre :\n${context}`;

  try {
    const groqRes = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 512,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const aiMessage = groqRes.data.choices?.[0]?.message?.content || 'Réponse IA indisponible.';
    res.json({ aiMessage });
  } catch (err) {
    console.error('Groq API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de la communication avec l’IA.' });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy server running on http://localhost:${PORT}`);
});
