export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  attachment?: {
    data: string;
    mimeType: string;
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface ModelOption {
  name: string; // The actual model name for the API
  displayName: string; // User-friendly name
  description: string; // Short description
  isFastest?: boolean; // Indicates if it's the fastest model
}