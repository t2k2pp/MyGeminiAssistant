
import React from 'react';
import { Conversation, Language, TFunction } from '../types.ts';
import Icon from './ui/Icon.tsx';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  t: TFunction;
  lang: Language;
  onLangChange: (lang: Language) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ conversations, activeConversationId, onNewConversation, onSelectConversation, t, lang, onLangChange }) => {
  
  const sortedConversations = [...conversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="w-64 bg-gray-900 flex flex-col h-full border-r border-gray-700/50">
      <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
        <h1 className="text-xl font-bold">{t('sidebar.projects')}</h1>
        <button
          onClick={onNewConversation}
          className="p-2 rounded-md hover:bg-gray-700 transition-colors"
          title={t('sidebar.newConversation')}
        >
          <Icon name="plus" className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-grow overflow-y-auto">
        <ul>
          {sortedConversations.map((convo) => (
            <li key={convo.id} className="px-2 py-1">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectConversation(convo.id);
                }}
                className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
                  activeConversationId === convo.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700/50 text-gray-300'
                }`}
              >
                {convo.branchedFrom && <Icon name="branch" className="w-4 h-4 flex-shrink-0 text-gray-400" />}
                <span className="truncate flex-grow">{convo.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700/50 space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="user" className="w-8 h-8 p-1.5 bg-gray-700 rounded-full" />
              <div>
                <p className="font-semibold text-gray-200">{t('sidebar.user')}</p>
                <p className="text-xs text-gray-400">{t('sidebar.yourAccount')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-700/50 rounded-md">
                <button onClick={() => onLangChange('ja')} className={`px-2 py-0.5 text-xs rounded ${lang === 'ja' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>JA</button>
                <button onClick={() => onLangChange('en')} className={`px-2 py-0.5 text-xs rounded ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>EN</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
