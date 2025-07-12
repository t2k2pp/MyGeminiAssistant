
import React, { useState, useRef, useEffect } from 'react';
import { Conversation, TFunction, InputMode } from '../types.ts';
import ChatMessage from './ChatMessage.tsx';
import Icon from './ui/Icon.tsx';

interface ChatWindowProps {
  conversation: Conversation | null;
  isLoading: boolean;
  onSendMessage: (prompt: string, images: string[], mode: InputMode) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onViewArtifact: (artifactId: string) => void;
  t: TFunction;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, isLoading, onSendMessage, onEditMessage, onViewArtifact, t }) => {
  const [prompt, setPrompt] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

   useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((prompt.trim() || imagePreviews.length > 0) && !isLoading) {
      onSendMessage(prompt.trim(), imagePreviews, inputMode);
      setPrompt('');
      setImagePreviews([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setImagePreviews(prev => [...prev, loadEvent.target?.result as string]);
        };
        reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }
  
  const placeholders: Record<InputMode, string> = {
      chat: t('chat.input.placeholder.chat'),
      image: t('chat.input.placeholder.image'),
      research: t('chat.input.placeholder.research'),
      'deep-research': t('chat.input.placeholder.deepResearch'),
  };

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4">
      <Icon name="bot" className="w-24 h-24 mb-4 text-gray-600" />
      <h1 className="text-4xl font-bold text-gray-200">{t('chat.welcome.title')}</h1>
      <p className="mt-2 text-lg">{t('chat.welcome.subtitle')}</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
        <div className="bg-gray-800/50 p-4 rounded-lg text-left">
          <h3 className="font-semibold text-gray-200 mb-2">{t('chat.welcome.card1.title')}</h3>
          <p className="text-sm">{t('chat.welcome.card1.content')}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg text-left">
          <h3 className="font-semibold text-gray-200 mb-2">{t('chat.welcome.card2.title')}</h3>
          <p className="text-sm">{t('chat.welcome.card2.content')}</p>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg text-left">
          <h3 className="font-semibold text-gray-200 mb-2">{t('chat.welcome.card3.title')}</h3>
          <p className="text-sm">{t('chat.welcome.card3.content')}</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg text-left">
          <h3 className="font-semibold text-gray-200 mb-2">{t('chat.welcome.card4.title')}</h3>
          <p className="text-sm">{t('chat.welcome.card4.content')}</p>
        </div>
      </div>
    </div>
  );

  const ModeToggleButton: React.FC<{mode: InputMode, icon: string, children: React.ReactNode}> = ({ mode, icon, children }) => (
    <button
        onClick={() => setInputMode(mode)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${inputMode === mode ? 'bg-indigo-600 text-white' : 'bg-gray-600/50 hover:bg-gray-600 text-gray-300'}`}
    >
        <Icon name={icon} className="w-4 h-4"/>
        <span>{children}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-800/70">
      <div className="flex-grow overflow-y-auto p-4">
        {conversation ? (
          <>
            {conversation.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} conversation={conversation} onEdit={onEditMessage} onViewArtifact={onViewArtifact} t={t} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-4 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center animate-pulse">
                  <Icon name="bot" className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 pt-2">
                  <div className="w-1/4 h-3 bg-gray-700 rounded animate-pulse"></div>
                  <div className="mt-3 space-y-2">
                      <div className="w-full h-3 bg-gray-700 rounded animate-pulse"></div>
                      <div className="w-5/6 h-3 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <WelcomeScreen />
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="bg-gray-700 rounded-lg p-2">
            <div className="px-2 pb-2 flex items-center gap-2 flex-wrap">
              <ModeToggleButton mode="chat" icon="bot">{t('chat.input.mode.chat')}</ModeToggleButton>
              <ModeToggleButton mode="image" icon="image">{t('chat.input.mode.image')}</ModeToggleButton>
              <ModeToggleButton mode="research" icon="search">{t('chat.input.mode.research')}</ModeToggleButton>
              <ModeToggleButton mode="deep-research" icon="book-open">{t('chat.input.mode.deepResearch')}</ModeToggleButton>
            </div>
            {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border-t border-gray-600">
                    {imagePreviews.map((src, index) => (
                        <div key={index} className="relative group">
                            <img src={src} alt={`preview ${index}`} className="h-20 w-20 object-cover rounded-md" />
                            <button onClick={() => removeImage(index)} className="absolute top-0 right-0 -mt-1 -mr-1 bg-gray-900 rounded-full p-0.5 text-white opacity-50 group-hover:opacity-100 transition-opacity">
                                <Icon name="close" className="w-3 h-3"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={handleSubmit} className="relative flex items-end">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
                accept="image/*"
                multiple
                disabled={inputMode !== 'chat'}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || inputMode !== 'chat'}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
                title={t('chat.input.attachImages')}
              >
                <Icon name="paperclip" className="w-6 h-6" />
              </button>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? t('chat.input.placeholder.loading') : placeholders[inputMode]}
                className="w-full bg-transparent text-gray-200 p-2 pr-12 resize-none focus:outline-none max-h-48"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || (!prompt.trim() && imagePreviews.length === 0)}
                className="absolute right-2 bottom-2 p-2 rounded-full bg-indigo-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
              >
                <Icon name="send" className="w-5 h-5" />
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
