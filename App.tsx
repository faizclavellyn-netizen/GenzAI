import React, { useState, useRef, useEffect } from 'react';
import { Message, ModelOption } from './types';
import { sendMessageToGeminiStream } from './services/geminiService';
import { MenuIcon, PlusCircleIcon, ArrowUpIcon, MicIcon, CloseIcon, ChevronUpIcon, PlusIcon, XMarkIcon } from './components/Icons';
import WelcomeScreen from './components/WelcomeScreen';
import MessageList from './components/MessageList';

// Define available models
const AVAILABLE_MODELS: ModelOption[] = [
  {
    name: 'gemini-3-pro-preview',
    displayName: 'Gemini Pro',
    description: 'Advanced reasoning, coding, and complex tasks.',
  },
  {
    name: 'gemini-flash-latest',
    displayName: 'Gemini Flash',
    description: 'Fastest model for basic text tasks and quick responses.',
    isFastest: true,
  },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AVAILABLE_MODELS[0]); // Default to Gemini Pro
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  
  // File upload state
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple ID generator
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64String.split(',')[1];
        setAttachment({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSend = async () => {
    // Allow sending if there is text OR an attachment
    if ((!input.trim() && !attachment) || isLoading) return;

    const userText = input.trim();
    const currentAttachment = attachment;
    
    setInput('');
    setAttachment(null); // Clear attachment immediately
    
    // Add User Message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
      attachment: currentAttachment ? currentAttachment : undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Prepare history for API
      // We need to properly structure history with attachments if they exist in previous messages
      const history = messages.map(m => {
        const parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [];
        if (m.attachment) {
           parts.push({ inlineData: m.attachment });
        }
        if (m.text) {
           parts.push({ text: m.text });
        }
        return {
          role: m.role,
          parts: parts
        };
      });

      // Create a placeholder for the AI message immediately
      const botMsgId = generateId();
      const botMsg: Message = {
        id: botMsgId,
        role: 'model',
        text: '', // Start empty
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

      // Call streaming API
      // Ensure we use gemini-3-pro-preview if an attachment is present (as per prompt req),
      // though default is already that.
      const result = await sendMessageToGeminiStream(
        userText, 
        history, 
        selectedModel.name, 
        currentAttachment
      );

      // Iterate through the stream
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
              ? { ...msg, text: msg.text + chunkText }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };
      // If error, append a new error message
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setAttachment(null);
  };

  const toggleListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      alert("Voice input is not supported in this browser.");
    }
  };

  return (
    <div className="bg-black text-white h-screen w-full flex flex-col relative overflow-hidden font-sans">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Ambient Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-md sticky top-0 border-b border-white/5">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Menu">
          <MenuIcon />
        </button>
        
        <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          GenzAI
        </h1>
        
        <button 
          onClick={startNewChat}
          className="p-2 hover:bg-white/10 rounded-full transition-colors" 
          aria-label="New Chat"
        >
          <PlusCircleIcon />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={(text) => setInput(text)} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </main>

      {/* Input Area - Docked to Bottom */}
      <footer className="relative z-20 w-full">
        <div className="max-w-2xl mx-auto w-full relative flex flex-col">
          
          {/* Copyright Text */}
          <div className="text-center pb-2 animate-fade-in">
            <p className="text-[10px] font-bold text-neutral-600 tracking-widest uppercase flex items-center justify-center gap-1">
              <span>&copy;</span> 2025 RIZCSTZ | Indonesia Inc.
            </p>
          </div>

          <div className="
            relative flex flex-col gap-2
            bg-neutral-900 
            border-t border-x border-white/10 
            rounded-t-[2.5rem] 
            rounded-b-none
            px-6 pt-5 pb-6
            shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
            hover:shadow-[0_-10px_40px_rgba(168,85,247,0.1)]
            focus-within:border-purple-500/30
            backdrop-blur-xl 
            transition-all duration-300
          ">
            
            {/* Attachment Preview (Cool Design) */}
            {attachment && (
              <div className="flex animate-fade-in mb-2">
                <div className="relative group">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-black/40 w-24 h-24 bg-neutral-800">
                    <img 
                      src={`data:${attachment.mimeType};base64,${attachment.data}`} 
                      alt="Preview" 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    {/* Glass sheen effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                  </div>
                  <button 
                    onClick={removeAttachment}
                    className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full p-1.5 border border-white/20 shadow-md hover:bg-red-500 hover:border-red-500 transition-colors z-10"
                    aria-label="Remove image"
                  >
                    <XMarkIcon />
                  </button>
                </div>
              </div>
            )}

            {/* Top Row: Text Input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachment ? "Ask about this image..." : "Ask GenzAI Anything..."}
              rows={1}
              className="w-full bg-transparent text-white placeholder-neutral-500 text-lg focus:outline-none resize-none min-h-[56px] max-h-40 py-2 leading-relaxed"
            />
            
            {/* Bottom Row: Model Selector & Actions */}
            <div className="flex justify-between items-center">
              {/* Model Selector Button (Left) */}
              <button 
                onClick={() => setIsModelSelectorOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 -ml-2 rounded-full text-sm text-neutral-400 hover:bg-white/10 transition-colors"
                aria-label="Select AI Model"
              >
                <span className="font-medium text-neutral-300">{selectedModel.displayName}</span>
                {selectedModel.isFastest && (
                  <span className="text-[10px] bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Fast</span>
                )}
                <ChevronUpIcon className={`w-4 h-4 transition-transform duration-300 ${isModelSelectorOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Action Buttons (Right) */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-full transition-all duration-300 hover:bg-white/10 ${attachment ? 'text-purple-400' : 'text-neutral-400 hover:text-white'}`}
                  aria-label="Upload Image"
                >
                  <PlusIcon />
                </button>

                <button 
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-white/10 text-neutral-400 hover:text-white'}`}
                  aria-label="Voice Input"
                >
                  <MicIcon active={isListening} />
                </button>

                <button 
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachment) || isLoading}
                  className={`
                    p-2.5 rounded-full flex items-center justify-center transition-all duration-300
                    ${(input.trim() || attachment) && !isLoading 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:scale-105' 
                      : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}
                  `}
                  aria-label="Send"
                >
                  <ArrowUpIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Model Selector Panel */}
      <div 
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isModelSelectorOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsModelSelectorOpen(false)} // Close when clicking overlay
      >
        <div 
          className={`
            absolute bottom-0 left-0 right-0 bg-neutral-950 border-t border-white/10 
            rounded-t-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto
            transform transition-transform duration-300 ease-out
            ${isModelSelectorOpen ? 'translate-y-0' : 'translate-y-full'}
          `}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the panel
          role="dialog"
          aria-modal="true"
          aria-labelledby="model-selector-title"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 id="model-selector-title" className="text-2xl font-semibold text-white">
              Select GenzAI Model
            </h2>
            <button 
              onClick={() => setIsModelSelectorOpen(false)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
              aria-label="Close model selection"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="space-y-4">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.name}
                onClick={() => {
                  setSelectedModel(model);
                  setIsModelSelectorOpen(false);
                }}
                className={`
                  w-full text-left p-4 rounded-xl border transition-all duration-200
                  ${selectedModel.name === model.name
                    ? 'bg-purple-800/30 border-purple-500 text-white shadow-purple-500/20 shadow-md'
                    : 'bg-neutral-900 border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-800 text-neutral-300 hover:text-white'}
                `}
                aria-pressed={selectedModel.name === model.name}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-lg">{model.displayName}</span>
                  {model.isFastest && (
                    <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full">Fastest</span>
                  )}
                  {selectedModel.name === model.name && (
                    <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full ml-auto">Active</span>
                  )}
                </div>
                <p className="text-sm text-neutral-400">{model.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;