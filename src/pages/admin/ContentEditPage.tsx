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
  
  if (!topic) {
    return <Navigate to="/admin/topics" replace />;
  }
  
  if (!content) {
    return <Navigate to={`/admin/topics/${topicId}`} replace />;
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link 
          to={`/admin/topics/${topicId}`}
          className="inline-flex items-center text-blue-900 hover:underline"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Voltar para {topic.title}
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Editar Conteúdo</h1>
        <p className="text-gray-600 mt-2">
          Editando conteúdo para {topic.title}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <ContentEditor 
          contentId={contentId}
          topicId={topicId}
        />
      </div>
    </div>
  );
};

export default ContentEditPage;