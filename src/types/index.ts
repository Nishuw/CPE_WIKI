export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
}

export interface Topic {
  id: string;
  title: string;
  slug: string; // Mantive o slug que não estava no meu exemplo anterior
  parent: string | null; // Corrigi para 'parent' como no seu código anterior
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  position: number; // <-- Linha adicionada
}

export interface Content {
  id: string;
  topicId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}