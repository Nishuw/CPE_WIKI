import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button'; 
import { ArrowLeftIcon, EditIcon } from 'lucide-react';

const ContentViewPage: React.FC = () => {
  const { selectedTopic, currentContent, changeSelectedTopic } = useContent();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedTopic) {
      changeSelectedTopic(selectedTopic.id);
    }
  }, [selectedTopic]);

  if (isLoading || !currentContent || !selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Conteúdo não encontrado</h2>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">       
        {user?.role === 'admin' && (
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/topics/${topicId}/content/${contentId}/edit`)}
            icon={<EditIcon size={16} />}
          >
            Editar Conteúdo
          </Button>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>

        <div className="text-sm text-gray-500 mb-6">
          Última atualização: {new Date(currentContent.updatedAt).toLocaleDateString()}
        </div>

        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: currentContent.body }} />
        </div>
      </div>
    </div>
  );
};

export default ContentViewPage;