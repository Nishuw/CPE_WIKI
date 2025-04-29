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
  createdAt: string;
  updatedAt: string;
  createdBy: string;
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