import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import ContentEditor from '../../components/admin/ContentEditor';
import { ArrowLeftIcon } from 'lucide-react';

const ContentEditPage: React.FC = () => {
  const { 
    topicId = '', 
    contentId = '' 
  } = useParams<{ topicId: string, contentId: string }>();
  const { getTopicById, getContentById } = useContent();
  
  const topic = getTopicById(topicId);
  const content = getContentById(contentId);
  
  // If the topic doesn't exist, redirect to the main topic management page
  if (!topic) {
    // console.warn(`Topic with ID '${topicId}' not found. Redirecting to admin topics.`);
    return <Navigate to="/admin/topics" replace />;
  }
  
  // If the content doesn't exist (e.g., for a new content or invalid ID), 
  // and we are not explicitly in a 'new' content route, redirect to the topic page.
  // Note: The ContentEditor component handles the case for creating new content.
  if (!contentId.endsWith('new') && !content) {
    // console.warn(`Content with ID '${contentId}' not found for topic '${topicId}'. Redirecting to topic page.`);
    return <Navigate to={`/admin/topics/${topicId}`} replace />;
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link 
          to={`/admin/topics/${topicId}`}
          className="inline-flex items-center text-blue-900 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Voltar para {topic.title}
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{contentId.endsWith('new') ? 'Criar Novo Conteúdo' : 'Editar Conteúdo'}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {contentId.endsWith('new') ? 'Criando novo conteúdo para' : 'Editando conteúdo para'} {topic.title}
        </p>
      </div>
      
      {/* The ContentEditor will be wrapped in this styled card */}
      <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
        <ContentEditor 
          contentId={contentId.endsWith('new') ? undefined : contentId} // Pass undefined if new
          topicId={topicId}
        />
      </div>
    </div>
  );
};

export default ContentEditPage;
