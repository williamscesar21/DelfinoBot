export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;          // ⟵  ¡incluye timestamp!
  cached?: boolean;
}

export interface Conversation {
  id: string;          // id local (UI)
  chatId: string;      // id backend
  title: string;
  messages: Message[];
}
