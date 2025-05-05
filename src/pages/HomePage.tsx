import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { FolderIcon, BookOpenIcon, ClockIcon, FileTextIcon } from 'lucide-react';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
import { Topic, Content, User } from '../types'; // Import types

// Helper function to convert Firestore Timestamp or string/number date to Date object
// Consider moving this to a shared utils file later
const convertToDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  if (dateValue instanceof Date) {
    return dateValue; // Already a Date object
  }
  try {
    const date = new Date(dateValue as string | number);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) { 
    // Ignore parsing errors
  }
  return null; // Return null if conversion fails
};

// Interface for combined activity items
interface ActivityItem {
  id: string;
  title: string;
  updatedAt: Date;
  type: 'topic' | 'content';
  link: string;
  createdByUid: string; // Keep UID
  createdByUsername: string | null; // Add username
}

const HomePage: React.FC = () => {
  // Get users and getUserByUid from useContent
  const { getChildTopics, topics, contents, users, loading, getUserByUid } = useContent();
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const rootTopics = getChildTopics(null);

  useEffect(() => {
    // Only process if content is not loading and users are available (or not loading - adjust as needed)
    if (!loading && users.length > 0 || (!loading && !loading)) { // Simplified condition

      const combined: ActivityItem[] = [];

      // Process topics
      topics.forEach(topic => {
        const updatedAtDate = convertToDate(topic.updatedAt);
        // Find the user by createdBy UID
        const creator = getUserByUid(topic.createdBy); 
        const createdByUsername = creator?.username || 'Desconhecido'; // Use username or default

        if (updatedAtDate && topic.title) {
          combined.push({
            id: topic.id,
            title: topic.title,
            updatedAt: updatedAtDate,
            type: 'topic',
            link: `/topics/${topic.id}`,
            createdByUid: topic.createdBy, // Store UID
            createdByUsername // Store username
          });
        }
      });

      // Process contents
      contents.forEach(content => {
        const updatedAtDate = convertToDate(content.updatedAt);
         // Find the user by createdBy UID
        const creator = getUserByUid(content.createdBy);
        const createdByUsername = creator?.username || 'Desconhecido';

        if (updatedAtDate && content.title) {
          combined.push({
            id: content.id,
            title: content.title,
            updatedAt: updatedAtDate,
            type: 'content',
            link: `/topics/${content.topicId}`, // Link to parent topic
            topicId: content.topicId,
            createdByUid: content.createdBy,
            createdByUsername
          });
        }
      });

      combined.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setRecentActivity(combined.slice(0, 5));
    } else if (!loading && users.length === 0) {
         // Handle case where content is loaded but no users are found
        setRecentActivity([]); // Clear activity if no users to link
    }

  }, [topics, contents, users, loading, getUserByUid]); // Add users, loading, and getUserByUid as dependencies

  const formatDateTime = useCallback((date: Date): string => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bem-vindo ao CPE - WIKI</h1>
        <p className="text-lg text-gray-600">
          Seu local central para organizar e acessar conteúdos importantes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Main Categories Section */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Categorias Principais</h2>
          {loading ? (
              <p className="text-gray-500 text-center py-6">Carregando categorias...</p>
          ) : rootTopics.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {rootTopics.map(topic => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <FolderIcon size={20} className="text-blue-900 mr-3 flex-shrink-0" />
                    <span className="font-medium text-base text-blue-900 truncate" title={topic.title}>{topic.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">Nenhuma categoria de conteúdo disponível ainda.</p>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <ClockIcon size={20} className="mr-2 text-gray-700"/>
            Atividade Recente
          </h2>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {recentActivity.map(item => (
                <li key={`${item.type}-${item.id}`}>
                  <Link 
                    to={item.link} 
                    className="flex items-start p-2 rounded-md hover:bg-gray-100 transition-colors duration-150"
                  >
                    {item.type === 'topic' ? (
                      <FolderIcon size={18} className="text-blue-900 mr-2.5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <FileTextIcon size={18} className="text-green-700 mr-2.5 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-800 leading-tight truncate" title={item.title}>
                          {item.title}
                       </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Atualizado em: {formatDateTime(item.updatedAt)} por {item.createdByUsername}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Nenhuma atividade recente encontrada.</p>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-start">
          <BookOpenIcon size={24} className="text-blue-900 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-lg text-blue-900">Sobre o CPE - WIKI</h3>
            <p className="text-gray-600 mt-1">
              O CPE - WIKI é uma plataforma para organizar e acessar conteúdos importantes.
              Navegue pelas categorias, veja informações detalhadas e encontre exatamente o que você precisa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;