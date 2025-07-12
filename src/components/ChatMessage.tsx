
import React, { useState } from 'react';
import { Message, Source, Conversation, TFunction, Artifact } from '../types.ts';
import Icon from './ui/Icon.tsx';

interface ChatMessageProps {
  message: Message;
  conversation: Conversation;
  onEdit: (messageId: string, newContent: string) => void;
  onViewArtifact: (artifactId: string) => void;
  t: TFunction;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, conversation, onEdit, onViewArtifact, t }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const isUser = message.role === 'user';
  
  const associatedArtifact = message.artifact_id ? conversation.artifacts.find(a => a.id === message.artifact_id) : null;

  const handleSave = () => {
    if (editedContent.trim() !== message.content.trim() && editedContent.trim() !== '') {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
    }
    if (e.key === 'Escape') {
        setIsEditing(false);
        setEditedContent(message.content);
    }
  }

  const SourceLink: React.FC<{ source: Source, index: number }> = ({ source, index }) => (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center bg-gray-700/50 hover:bg-gray-600/50 text-xs text-cyan-300 rounded-full px-2 py-1 transition-colors"
      title={source.title}
    >
      <span className="font-bold mr-1.5">{index + 1}</span>
      <span className="truncate max-w-xs">{source.title || new URL(source.uri).hostname}</span>
    </a>
  );
  
  return (
    <div className={`flex items-start gap-4 p-4 my-1 rounded-lg group ${isUser ? '' : 'bg-white/5'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-500' : 'bg-teal-500'}`}>
        <Icon name={isUser ? 'user' : 'bot'} className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="font-bold text-gray-300 mb-1">{isUser ? t('chat.message.you') : t('chat.message.gemini')}</div>
        
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                rows={Math.max(3, editedContent.split('\n').length)}
                autoFocus
            />
            <div className="flex gap-2">
                <button onClick={handleSave} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm">{t('chat.message.saveAndSubmit')}</button>
                <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">{t('chat.message.cancel')}</button>
            </div>
          </div>
        ) : (
          <>
            {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {message.images.map((imgSrc, index) => (
                        <img key={index} src={imgSrc} alt={`attachment ${index+1}`} className="max-h-48 max-w-xs object-contain rounded-lg border border-gray-600" />
                    ))}
                </div>
            )}
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap break-words">
                {message.content}
            </div>
          </>
        )}
        
        {associatedArtifact && !isEditing && (
            <div className="mt-4">
                <button 
                    onClick={() => onViewArtifact(associatedArtifact.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700/60 hover:bg-gray-700 text-sm text-cyan-300 rounded-md transition-colors"
                >
                    <Icon name="eye" className="w-4 h-4"/>
                    <span>{associatedArtifact.label || t('chat.message.viewArtifact')}</span>
                </button>
            </div>
        )}

        {!isEditing && message.sources && message.sources.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">{t('chat.message.sources')}</h4>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <SourceLink key={index} source={source} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && !isEditing && (
        <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-gray-700">
          <Icon name="edit" className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
};

export default ChatMessage;
