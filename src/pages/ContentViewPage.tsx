import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { EditIcon } from 'lucide-react';
import { Content } from '../types';

const ContentViewPage: React.FC = () => {
  const { getContentById } = useContent();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { topicId, contentId } = useParams<{ topicId?: string; contentId: string }>();
  const [content, setContent] = useState<Content | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (contentId) {
        try {
          const fetchedContent = await getContentById(contentId);
          setContent(fetchedContent);
        } catch (error) {
          console.error('Error fetching content:', error);
          setContent(null);
        }
      }
    };
    fetchContent();
  }, [contentId, getContentById]);

  if (isLoading || !content) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Conteúdo não encontrado ou não existe.</h2>
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
            onClick={() => navigate(topicId ? `/admin/topics/${topicId}/content/${contentId}/edit` : `/admin/content/${contentId}/edit`)}
            icon={<EditIcon size={16} />}
          >
            Editar Conteúdo
          </Button>
        )}
      </div>
         <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>

        <div className="text-sm text-gray-500 mb-6">
          Última atualização: {new Date(content.updatedAt).toLocaleDateString()}
        </div>

        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content.body }} />
        </div>
      </div>
    </div>
  );
};

export default ContentViewPage;