
import React from 'react';
import { Artifact, ArtifactType, TFunction } from '../types.ts';
import Icon from './ui/Icon.tsx';
import ReactRenderer from './ReactRenderer.tsx';
import ChartRenderer from './ChartRenderer.tsx';

declare global {
  interface Window {
    marked: any;
  }
}

interface ArtifactViewProps {
  artifact: Artifact | null;
  onClose: () => void;
  t: TFunction;
}

const ArtifactView: React.FC<ArtifactViewProps> = ({ artifact, onClose, t }) => {
  const handleDownload = async () => {
    if (!artifact) return;

    let blob: Blob;
    const extensions: Record<ArtifactType, string> = {
      react: '.jsx',
      chart: '.json',
      html: '.html',
      markdown: '.md',
      image: '.jpeg',
      text: '.txt',
    };
    const fileName = `${artifact.label || artifact.type}-artifact${extensions[artifact.type]}`;

    if (artifact.type === 'image') {
      try {
        const response = await fetch(artifact.data);
        blob = await response.blob();
      } catch (e) {
        console.error("Failed to fetch image for download:", e);
        return;
      }
    } else {
      const mimeTypes: Record<Exclude<ArtifactType, 'image'>, string> = {
        react: 'text/jsx',
        chart: 'application/json',
        html: 'text/html',
        markdown: 'text/markdown',
        text: 'text/plain',
      };
      const dataToSave = typeof artifact.data === 'string' ? artifact.data : JSON.stringify(artifact.data, null, 2);
      blob = new Blob([dataToSave], { type: mimeTypes[artifact.type as Exclude<ArtifactType, 'image'>] });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (!artifact) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/50 rounded-lg border border-gray-700/50 p-4">
          <Icon name="bot" className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-semibold">{t('artifact.panel.title')}</h3>
          <p className="text-sm text-center">{t('artifact.panel.empty')}</p>
      </div>
    );
  }

  const renderContent = () => {
    if (artifact.isLoading) {
       return <div className="p-4 text-gray-400">{t('artifact.panel.loading')}</div>;
    }
    if (artifact.error) {
       return <div className="p-4 bg-red-900/20 text-red-300 rounded-lg">{t('artifact.panel.error')}: {artifact.error}</div>;
    }

    switch (artifact.type) {
      case 'react':
        return <ReactRenderer code={artifact.data} t={t} />;
      case 'chart':
        return <ChartRenderer data={artifact.data} />;
      case 'html':
        return <div className="p-4 prose prose-invert max-w-none prose-table:w-full prose-th:bg-gray-700" dangerouslySetInnerHTML={{ __html: artifact.data }} />;
      case 'markdown':
        return <div className="p-4 prose prose-invert max-w-none prose-table:w-full prose-th:bg-gray-700" dangerouslySetInnerHTML={{ __html: window.marked.parse(artifact.data) }} />;
      case 'image':
        return <img src={artifact.data} alt="Generated" className="w-full h-full object-contain" />;
       case 'text':
         return <div className="p-4 whitespace-pre-wrap">{artifact.data}</div>;
      default:
        return <div className="p-4 text-gray-400">Unsupported artifact type.</div>;
    }
  };

  const artifactIcons: { [key in ArtifactType]: string } = {
      react: 'code',
      chart: 'chart',
      html: 'html',
      markdown: 'markdown',
      image: 'image',
      text: 'text',
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-2 bg-gray-900/50 border-b border-gray-700">
            <div className="flex items-center gap-2 overflow-hidden">
                 <Icon name={artifactIcons[artifact.type]} className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                 <h3 className="font-semibold capitalize truncate" title={artifact.label || artifact.type}>{artifact.label || t('artifact.header.label')}</h3>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={handleDownload} className="p-1 rounded-full hover:bg-gray-700 transition-colors" title={t('artifact.header.download')}>
                    <Icon name="download" className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors" title={t('artifact.header.close')}>
                    <Icon name="close" className="w-5 h-5" />
                </button>
            </div>
        </div>
        <div className="flex-grow overflow-auto p-2">
            {renderContent()}
        </div>
    </div>
  );
};

export default ArtifactView;
