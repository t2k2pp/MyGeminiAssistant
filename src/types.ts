
export type Role = 'user' | 'model';

export interface Source {
  uri: string;
  title: string;
}

export type ArtifactType = 'react' | 'chart' | 'html' | 'image' | 'text' | 'markdown';

export interface Artifact {
  id: string;
  type: ArtifactType;
  label?: string; // Optional label for the artifact
  data: any;
  isLoading?: boolean;
  error?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  images?: string[]; // Array of base64 data URLs
  sources?: Source[];
  artifact_id?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  artifacts: Artifact[]; // Each conversation can have multiple artifacts
  createdAt: string;
  branchedFrom?: string;
}

export type Language = 'en' | 'ja';
export type InputMode = 'chat' | 'image' | 'research' | 'deep-research';

export type TFunction = (key: string) => string;
