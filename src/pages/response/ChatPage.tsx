import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import useAnalysisStore from '../../store/analysis-store';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

const ChatPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  // const [isTyping, setIsTyping] = useState(false); // Will use isLoading from store

  // Get functions and state from the store
  const { askChatAI, isLoading: isAiTyping, error: aiError } = useAnalysisStore(
    (state) => ({
      askChatAI: state.askChatAI, // We will add this to the store
      isLoading: state.isLoading, 
      error: state.error,
    })
  );

  useEffect(() => {
    // If there's an AI error, display it as an AI message
    if (aiError) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-ai-error',
        text: `Erreur de l'IA: ${aiError}`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setConversation(prev => [...prev, errorMessage]);
      // Optionally, clear the error in the store after displaying
      // useAnalysisStore.setState({ error: null }); 
    }
  }, [aiError]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setConversation(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    // setIsTyping(true); // isLoading from store will handle this

    try {
      const aiResponseText = await askChatAI(currentInput);
      if (aiResponseText) {
        const aiMessage: Message = {
          id: Date.now().toString() + '-ai',
          text: aiResponseText,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };
        setConversation(prev => [...prev, aiMessage]);
      }
    } catch {
      // Error handling is now done through the useEffect hook watching aiError from the store
      // console.error("Error sending message to AI:");
      // The useEffect hook will display the error message from the store.
    }
    // setIsTyping(false); // isLoading from store will handle this
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-150px)] max-w-3xl mx-auto">
      <h1 className="h1 mb-6 text-center">Discussion avec l'IA</h1>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-neutral-50 rounded-lg border mb-4">
        {conversation.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white text-neutral-900'}`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/80' : 'text-neutral-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-lg bg-neutral-200 text-neutral-900 shadow-sm">
              <p className="text-sm italic">L'IA est en train d'écrire...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 border-t bg-white rounded-b-lg sticky bottom-0">
        <Textarea
          placeholder="Posez votre question ici..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={1}
          className="flex-grow resize-none border-neutral-300 focus:border-primary focus:ring-primary"
        />
        <Button onClick={handleSendMessage} disabled={isAiTyping || !input.trim()} className="self-end px-4 py-2">
          <Send className="h-5 w-5" />
          <span className="sr-only">Envoyer</span>
        </Button>
      </div>
    </div>
  );
};

export default ChatPage;
