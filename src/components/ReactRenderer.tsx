
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TFunction } from '../types.ts';

declare global {
  interface Window {
    Babel: any;
  }
}

interface ReactRendererProps {
  code: string;
  t: TFunction;
}

const ReactRenderer: React.FC<ReactRendererProps> = ({ code, t }) => {
  const [Component, setComponent] = useState<React.FC | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    try {
      if (!window.Babel) {
        throw new Error("Babel is not loaded.");
      }
      const transformedCode = window.Babel.transform(code, {
        presets: ['react'],
      }).code;

      const scope = { React, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer };
      const factory = new Function(...Object.keys(scope), `return ${transformedCode}`);
      const Comp = factory(...Object.values(scope));

      if (isMounted) {
        setComponent(() => Comp);
        setError(null);
      }
    } catch (e) {
      if (isMounted) {
        console.error("React Renderer Error:", e);
        setError(e instanceof Error ? e.message : String(e));
        setComponent(null);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 text-red-300 rounded-lg">
        <h4 className="font-bold mb-2">{t('renderer.error.title')}</h4>
        <pre className="text-sm whitespace-pre-wrap font-mono">{error}</pre>
      </div>
    );
  }

  if (Component) {
    return (
      <div className="w-full h-full">
        <Component />
      </div>
    );
  }

  return (
    <div className="p-4 text-gray-400">
      <p>Rendering component...</p>
    </div>
  );
};

export default ReactRenderer;
