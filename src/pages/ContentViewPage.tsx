import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { EditIcon } from 'lucide-react';
import { Content } from '../types';


const ContentViewPage: React.FC = () => {
  const { getContentsByTopicId, getContentById } = useContent();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { topicId, contentId } = useParams<{ topicId?: string; contentId?: string }>();
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    const fetchContents = async () => {
      if (topicId) {
        const topicContents = getContentsByTopicId(topicId);
        setContents(topicContents || []);
      }
    };
    fetchContents();
  }, [topicId, getContentsByTopicId]);

  const contentToShow = contentId
    ? contents.find((c) => c.id === contentId)
    : null;

  if (isLoading || (contentId && !contentToShow)) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Não foi possível encontrar o conteúdo.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        {contentToShow && user?.role === 'admin' && (
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                topicId
                  ? `/admin/topics/${topicId}/content/${contentId}/edit`
                  : `/admin/content/${contentId}/edit`
              )
            }
            icon={<EditIcon size={16} />}
          >
            Editar Conteúdo
          </Button>
        )}
      </div>
        {!contentToShow && contents.length === 0 && (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Não há conteúdos neste tópico</h2>
            </div>
        )}
       {contentToShow && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{contentToShow.title}</h1>
          <div className="text-sm text-gray-500 mb-6">
            Última atualização: {new Date(contentToShow.updatedAt).toLocaleDateString()}
          </div>
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: contentToShow.body }} />
          </div>
        </div>)}
         {!contentToShow && contents.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Conteúdos neste tópico</h2>
                    <ul className='list-disc list-inside'>
                    {contents.map(c => (
                         <li key={c.id}>
                            <Link to={`/topics/${topicId}/content/${c.id}`}>
                                {c.title}
                            </Link>
                         </li>
                    ))}
                </ul>
                </div>
            )}
    </div>
  );
};

export default ContentViewPage;