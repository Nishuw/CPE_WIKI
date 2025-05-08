export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  createdAt: any; 
  updatedAt: any; 
  createdBy: string;
  updatedBy: string; 
  position: number;
  createdByUsername?: string; // Novo campo opcional
  updatedByUsername?: string; // Novo campo opcional
}

export interface Content {
  id: string;
  topicId: string;
  title: string;
  body: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  updatedBy: string;
  createdByUsername?: string; // Novo campo opcional
  updatedByUsername?: string; // Novo campo opcional
}