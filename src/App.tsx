
import React, { useState, useEffect, useCallback } from 'react';
import { Conversation, Message, Artifact, Role, Language, InputMode, TFunction } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import Sidebar from './components/Sidebar.tsx';
import ChatWindow from './components/ChatWindow.tsx';
import ArtifactView from './components/ArtifactView.tsx';
import { v4 as uuidv4 } from 'uuid';
import { Part } from '@google/genai';
import { translate } from './localization.ts';


const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<Language>('ja');

  const t: TFunction = useCallback((key: string) => {
      return translate(key, lang);
  }, [lang]);

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('appLanguage');
      if (storedLang && (storedLang === 'en' || storedLang === 'ja')) {
        setLang(storedLang as Language);
      } else {
        setLang('ja');
      }

      const storedConversations = localStorage.getItem('conversations');
      if (storedConversations) {
        setConversations(JSON.parse(storedConversations));
      }
      const storedActiveId = localStorage.getItem('activeConversationId');
      if (storedActiveId) {
        setActiveConversationId(JSON.parse(storedActiveId));
      }
    } catch (error) {
      console.error("Failed to load from local storage:", error);
      setConversations([]);
      setActiveConversationId(null);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('conversations', JSON.stringify(conversations));
        localStorage.setItem('activeConversationId', JSON.stringify(activeConversationId));
        localStorage.setItem('appLanguage', lang);
    } catch (error) {
        console.error("Failed to save to local storage:", error);
    }
  }, [conversations, activeConversationId, lang]);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  useEffect(() => {
      if (!activeConversation) {
          setActiveArtifact(null);
      }
  }, [activeConversationId, activeConversation]);


  const updateConversation = (convoId: string, updateFn: (convo: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => c.id === convoId ? updateFn(c) : c));
  };
  
  const handleNewConversation = () => {
    const newId = uuidv4();
    const newConversation: Conversation = {
      id: newId,
      title: t('sidebar.newConversation'),
      messages: [],
      artifacts: [],
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
    setActiveArtifact(null);
  };

  const processAndSetResponse = (convoId: string, response: { text: string; sources?: any[]; artifact?: Omit<Artifact, 'id'> }) => {
    let newArtifact: Artifact | null = null;
    if (response.artifact) {
        newArtifact = { ...response.artifact, id: uuidv4() };
        setActiveArtifact(newArtifact);
    }

    const modelMessage: Message = {
        id: uuidv4(),
        role: 'model',
        content: response.text,
        sources: response.sources,
        artifact_id: newArtifact?.id,
    };
    
    updateConversation(convoId, c => ({
      ...c,
      messages: [...c.messages, modelMessage],
      artifacts: newArtifact ? [...c.artifacts, newArtifact] : c.artifacts,
    }));
  }

  const handleSendMessage = async (prompt: string, images: string[] = [], mode: InputMode) => {
    if (!prompt && images.length === 0) return;

    let currentConvoId = activeConversationId;
    const convoTitle = prompt.substring(0, 30) || "Image Message";

    if (!currentConvoId) {
      const newId = uuidv4();
      const newConversation: Conversation = {
        id: newId,
        title: convoTitle,
        messages: [],
        artifacts: [],
        createdAt: new Date().toISOString(),
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newId);
      currentConvoId = newId;
    }
    
    const userMessage: Message = { id: uuidv4(), role: 'user', content: prompt, images };
    updateConversation(currentConvoId, c => ({
        ...c,
        title: c.messages.length === 0 ? convoTitle : c.title,
        messages: [...c.messages, userMessage],
    }));

    setIsLoading(true);

    const currentConvo = conversations.find(c => c.id === currentConvoId) ?? { messages: [], artifacts: [] };
    const history = (currentConvo.messages || []).slice(0, -1).map(msg => {
        const parts: Part[] = [{ text: msg.content }];
        return {
            role: msg.role as ('user' | 'model'),
            parts: parts,
        }
    });

    try {
        const response = await geminiService.generateResponse(prompt, history, images, mode, lang);
        processAndSetResponse(currentConvoId, response);
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'model',
        content: `Sorry, something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      updateConversation(currentConvoId, c => ({...c, messages: [...c.messages, errorMessage]}));
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleEditAndBranch = async (messageId: string, newContent: string) => {
    if (!activeConversation) return;

    const messageIndex = activeConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const newBranchId = uuidv4();
    const originalMessages = activeConversation.messages.slice(0, messageIndex);
    
    const newBranch: Conversation = {
      id: newBranchId,
      title: `Branch: ${activeConversation.title.replace(/^Branch: /, '')}`,
      messages: [...originalMessages],
      artifacts: activeConversation.artifacts, // Carry over artifacts up to the branch point
      createdAt: new Date().toISOString(),
      branchedFrom: activeConversation.id,
    };

    setConversations(prev => [newBranch, ...prev]);
    setActiveConversationId(newBranchId);
    await handleSendMessage(newContent, [], 'chat');
  };

  const handleViewArtifact = (artifactId: string) => {
      if (activeConversation) {
          const artifact = activeConversation.artifacts.find(a => a.id === artifactId);
          if (artifact) {
              setActiveArtifact(artifact);
          }
      }
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white font-sans">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={(id) => setActiveConversationId(id)}
        t={t}
        lang={lang}
        onLangChange={handleLangChange}
      />
      <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex p-4 gap-4 overflow-hidden">
            <div className="flex-1 flex flex-col h-full rounded-lg overflow-hidden border border-gray-700">
                <ChatWindow
                    conversation={activeConversation}
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                    onEditMessage={handleEditAndBranch}
                    onViewArtifact={handleViewArtifact}
                    t={t}
                />
            </div>
            <div className="w-full md:w-1/2 lg:w-2/5 h-full">
                <ArtifactView artifact={activeArtifact} onClose={() => setActiveArtifact(null)} t={t} />
            </div>
          </div>
      </main>
    </div>
  );
};

export default App;
