import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useContent, HomePageAlert } from '../context/ContentContext'; // Importado HomePageAlert se necessário aqui, mas é usado implicitamente pelo useContent
import { FolderIcon, BookOpenIcon, ClockIcon, FileTextIcon, AlertTriangle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Topic, Content } from '../types';

const convertToDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  if (dateValue instanceof Date) {
    return dateValue;
  }
  try {
    const date = new Date(dateValue as string | number);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
};

interface ActivityItem {
  id: string;
  title: string;
  updatedAt: Date;
  type: 'topic' | 'content';
  link: string;
  updatedByUsername: string;
  topicId?: string;
}

const HomePage: React.FC = () => {
  // topics, contents, e loading geral são para as categorias e atividade recente
  const { 
    getChildTopics, 
    topics, 
    contents, 
    loading: contentLoading, 
    homePageAlert, 
    loadingHomePageAlert 
  } = useContent();
  
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const rootTopics = getChildTopics(null);

  useEffect(() => {
    // Este loading é para o conteúdo principal da página (tópicos, atividades)
    if (!contentLoading) {
      const combined: ActivityItem[] = [];

      topics.forEach(topic => {
        const updatedAtDate = convertToDate(topic.updatedAt);
        const usernameToShow = topic.updatedByUsername || topic.createdByUsername || 'Desconhecido';

        if (updatedAtDate && topic.title) {
          combined.push({
            id: topic.id,
            title: topic.title,
            updatedAt: updatedAtDate,
            type: 'topic',
            link: `/topics/${topic.id}`,
            updatedByUsername: usernameToShow
          });
        }
      });

      contents.forEach(content => {
        const updatedAtDate = convertToDate(content.updatedAt);
        const usernameToShow = content.updatedByUsername || content.createdByUsername || 'Desconhecido';
        
        if (updatedAtDate && content.title) {
          combined.push({
            id: content.id,
            title: content.title,
            updatedAt: updatedAtDate,
            type: 'content',
            link: `/topics/${content.topicId}`,
            topicId: content.topicId,
            updatedByUsername: usernameToShow
          });
        }
      });
      
      combined.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setRecentActivity(combined.slice(0, 5));
    }
  }, [topics, contents, contentLoading, getChildTopics]);

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Bem-vindo ao CPE - WIKI</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Seu local central para organizar e acessar conteúdos importantes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Categorias Principais</h2>
          {contentLoading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">Carregando categorias...</p>
          ) : rootTopics.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {rootTopics.map(topic => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <FolderIcon size={20} className="text-blue-900 dark:text-blue-400 mr-3 flex-shrink-0" />
                    <span className="font-medium text-base text-blue-900 dark:text-blue-400 truncate" title={topic.title}>{topic.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6">Nenhuma categoria de conteúdo disponível ainda.</p>
          )}
        </div>

        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <ClockIcon size={20} className="mr-2 text-gray-700 dark:text-gray-300"/>
            Atividade Recente
          </h2>
          {contentLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {recentActivity.map(item => (
                <li key={`${item.type}-${item.id}`}>
                  <Link 
                    to={item.link} 
                    className="flex items-start p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    {item.type === 'topic' ? (
                      <FolderIcon size={18} className="text-blue-900 dark:text-blue-400 mr-2.5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <FileTextIcon size={18} className="text-green-700 dark:text-green-400 mr-2.5 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight truncate" title={item.title}>
                          {item.title}
                       </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Atualizado em: {formatDateTime(item.updatedAt)} por {item.updatedByUsername}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhuma atividade recente encontrada.</p>
          )}
        </div>
      </div>

      {/* Important Message Section */}
      {loadingHomePageAlert && (
        <div className="my-8 p-4 bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-md shadow-md animate-pulse">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div className="ml-3 flex-grow">
              <div className="h-4 bg-yellow-300 dark:bg-yellow-700 rounded w-1/4 mb-2"></div> {/* Placeholder para o título "Mensagem Importante" */}
              <div className="h-3 bg-yellow-200 dark:bg-yellow-600 rounded w-3/4"></div>      {/* Placeholder para o texto da mensagem */}
            </div>
          </div>
        </div>
      )}
      {!loadingHomePageAlert && homePageAlert && homePageAlert.alertaAtivo && homePageAlert.alertaTexto && (
        <div className="my-8 p-4 bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-md shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div className="ml-3 flex-grow">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Mensagem Importante</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-100">
                <p>
                  {homePageAlert.alertaTexto}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* End Important Message Section */}

      <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-6 border border-blue-100 dark:border-gray-700">
        <div className="flex items-start">
          <BookOpenIcon size={24} className="text-blue-900 dark:text-blue-400 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-lg text-blue-900 dark:text-blue-400">Sobre o CPE - WIKI</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
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
