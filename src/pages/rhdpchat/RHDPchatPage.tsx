import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,

} from '@mui/material';
import { Send as SendIcon, ArrowLeft as ArrowBackIcon, Plus as AddIcon, Menu as MenuIcon, X as CloseIcon } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// Fonction pour assainir les entrées utilisateur et prévenir les attaques XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

function cleanAIResponse(text: string): string {
  // Supprime la mention (Réponse générée par: groq-llama3-70b-8192) si présente
  const cleaned = text.replace(/\n?\(Réponse générée par: groq-llama3-70b-8192\)/g, '').trim();
  // Ne pas assainir la réponse de l'IA car elle est affichée comme du texte, pas comme du HTML
  return cleaned;
}

const RHDPchatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  const [history, setHistory] = useState<Message[][]>([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const drawerWidth = 280;

  // Load chat history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('rhdpchat_history');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Save chat history to localStorage when history changes
  useEffect(() => {
    localStorage.setItem('rhdpchat_history', JSON.stringify(history));
  }, [history]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    // Validation des entrées
    const trimmedInput = inputValue.trim();
    if (trimmedInput === '') return;
    
    // Limite de taille pour éviter les attaques par déni de service
    if (trimmedInput.length > 1000) {
      setError('Votre message est trop long. Veuillez le limiter à 1000 caractères.');
      setShowError(true);
      return;
    }
    
    setError('');
    setShowError(false);
    
    // Assainir l'entrée utilisateur pour prévenir les attaques XSS
    const sanitizedInput = sanitizeInput(trimmedInput);
    
    const newMessages: Message[] = [...messages, { sender: 'user', text: sanitizedInput }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Ajout d'un timeout pour éviter les requêtes qui durent trop longtemps
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes max
      
      const response = await fetch('/api/rhdpchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ajouter un en-tête anti-CSRF si nécessaire
          // 'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ query: sanitizedInput }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const aiResponse = cleanAIResponse(data.response);
      setMessages(prevMessages => {
        const updated = [...prevMessages, { sender: 'ai' as const, text: aiResponse }];
        return updated;
      });
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la communication avec le serveur.';
      setError(errorMessage);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Save current conversation to history and clear messages
  const handleNewConversation = () => {
    if (messages.length > 0) {
      setHistory(prev => [[...messages], ...prev]);
    }
    setMessages([]);
    setDrawerOpen(false);
  };

  // Restore a conversation from history
  const handleRestoreConversation = (conversation: Message[]) => {
    setMessages(conversation);
    setDrawerOpen(false);
  };

  // Go back to dashboard
  const handleBack = () => {
    navigate('/dashboard');
  };

  // Typing indicator for AI response
  const renderTypingIndicator = () => {
    if (!isLoading) return null;
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
        <Box sx={{
          bgcolor: '#FFF3E0',
          color: '#222',
          px: 2, py: 1.2, 
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottomLeftRadius: 8,
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
        }}>
          <Typography>RHDP est en train d'écrire</Typography>
          <CircularProgress size={16} sx={{ color: '#FF7900' }} />
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar / Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0,0,0,0.08)',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600} color="#FF7900">Conversations</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Button 
          startIcon={<AddIcon />} 
          onClick={handleNewConversation}
          sx={{ 
            m: 2, 
            bgcolor: '#FF7900', 
            color: 'white', 
            '&:hover': { bgcolor: '#e96c00' },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Nouvelle conversation
        </Button>
        <List sx={{ overflow: 'auto', flex: 1 }}>
          {history.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="Aucune conversation" 
                secondary="Commencez à discuter pour créer un historique" 
                primaryTypographyProps={{ color: 'text.secondary' }}
                secondaryTypographyProps={{ color: 'text.disabled' }}
              />
            </ListItem>
          ) : (
            history.map((conv, idx) => (
              <ListItemButton 
                key={idx} 
                onClick={() => handleRestoreConversation(conv)}
                sx={{ 
                  borderRadius: 1, 
                  mx: 1,
                  '&:hover': { bgcolor: '#FFF3E0' }
                }}
              >
                <ListItemText 
                  primary={`Conversation ${history.length - idx}`}
                  secondary={conv.map(m => m.text).join(' ').slice(0, 60) + '...'}
                  primaryTypographyProps={{ fontWeight: 600, color: '#FF7900' }}
                  secondaryTypographyProps={{ 
                    noWrap: true,
                    sx: { 
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Drawer>

      {/* Main content */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#f9f9f9'
      }}>
        {/* Header harmonisé et corrigé */}
        <div className="flex items-center justify-between mb-6 px-6 pt-6 pb-2 bg-white border-b border-neutral-200">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleBack}
              className="mr-4 rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary flex items-center"
            >
              <ArrowBackIcon className="h-4 w-4 mr-2" />
              Retour
            </button>
            <h1 className="h1">RHDP Chat</h1>
          </div>
          <IconButton edge="end" color="inherit" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        </div>

        {/* Messages area */}
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 3,
          display: 'flex', 
          flexDirection: 'column',
          maxWidth: 800,
          mx: 'auto',
          width: '100%'
        }}>
          {messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              opacity: 0.8
            }}>
              <Avatar 
                src="/rhdp-logo.png" 
                alt="RHDP" 
                sx={{ width: 80, height: 80, mb: 3, bgcolor: '#FF7900' }} 
              />
              <Typography variant="h5" fontWeight={700} color="#FF7900" gutterBottom>
                RHDPchat
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 450 }}>
                Posez votre question à l'IA RHDP. Je peux vous aider à vérifier des faits politiques, analyser des événements historiques et comprendre les enjeux politiques actuels.
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <Box 
                  key={idx} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Box sx={{
                    bgcolor: msg.sender === 'user' ? '#FF7900' : '#FFF3E0',
                    color: msg.sender === 'user' ? '#fff' : '#222',
                    px: 3, 
                    py: 2, 
                    borderRadius: 2,
                    maxWidth: { xs: '85%', md: '75%' },
                    boxShadow: msg.sender === 'user' 
                      ? '0 2px 8px 0 rgba(255,121,0,0.08)' 
                      : '0 1px 4px 0 rgba(0,0,0,0.04)',
                    fontSize: 16,
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    borderBottomRightRadius: msg.sender === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.sender === 'user' ? 16 : 4,
                  }}>
                    {msg.text}
                  </Box>
                </Box>
              ))}
              {renderTypingIndicator()}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Input area */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(0,0,0,0.08)',
          bgcolor: 'white',
          position: 'sticky',
          bottom: 0,
          width: '100%',
          zIndex: 10
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            maxWidth: 800,
            mx: 'auto'
          }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Posez une question sur la politique ou vérifiez un fait..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              multiline
              maxRows={4}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  bgcolor: '#f9f9f9',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    bgcolor: '#fff',
                  }
                }
              }}
              disabled={isLoading}
            />
            <IconButton 
              color="primary" 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputValue.trim()} 
              sx={{ 
                bgcolor: '#FF7900', 
                color: '#fff', 
                p: 1.5,
                '&:hover': { bgcolor: '#e96c00' },
                '&.Mui-disabled': { bgcolor: '#FFE0C2', color: '#fff' }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>
          {showError && (
            <Box sx={{ mt: 1, maxWidth: 800, mx: 'auto' }}>
              <Typography color="error" align="center" variant="body2">{error}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default RHDPchatPage;
