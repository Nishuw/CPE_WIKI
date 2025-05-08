import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import ContentList from '../../components/admin/ContentList';
import ContentEditor from '../../components/admin/ContentEditor';
import Button from '../../components/ui/Button';
import { ArrowLeftIcon } from 'lucide-react';

const TopicDetailPage: React.FC = () => {
  const { topicId = '' } = useParams<{ topicId: string }>();
  const { getTopicById, getChildTopics } = useContent();
  const [showEditor, setShowEditor] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | undefined>(undefined);
  
  const topic = getTopicById(topicId);
  const childTopics = getChildTopics(topicId);
  
  if (!topic) {
    return <Navigate to="/admin/topics" replace />;
  }
  
  const handleAddContent = () => {
    setEditingContentId(undefined); // Explicitly undefined for new content
    setShowEditor(true);
  };
  
  const handleEditContent = (contentId: string) => {
    setEditingContentId(contentId);
    setShowEditor(true);
  };
  
  const handleEditorSuccess = () => {
    setShowEditor(false);
    setEditingContentId(undefined);
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link 
          to="/admin/topics"
          className="inline-flex items-center text-blue-900 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Voltar aos Tópicos
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{topic.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerenciar conteúdo e subtópicos para este tópico.
        </p>
      </div>
      
      {showEditor ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <ContentEditor 
            contentId={editingContentId}
            topicId={topicId}
            onSuccess={handleEditorSuccess}
          />
          <div className="mt-4">
            <button
              onClick={() => setShowEditor(false)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Cancelar e voltar para a lista de conteúdo
            </button>
          </div>
        </div>
      ) : (
        <ContentList 
          topicId={topicId}
          onAddContent={handleAddContent}
          onEditContent={handleEditContent}
        />
      )}
      
      {childTopics.length > 0 && !showEditor && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Subtópicos</h2>
          <div className="space-y-2">
            {childTopics.map(childTopic => (
              <div key={childTopic.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                <Link 
                  to={`/admin/topics/${childTopic.id}`}
                  className="font-medium text-blue-900 dark:text-blue-400 hover:underline"
                >
                  {childTopic.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicDetailPage;
