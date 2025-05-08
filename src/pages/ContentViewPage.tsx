import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { EditIcon } from 'lucide-react';
import { Content } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

// Helper function to convert Firestore Timestamp or string/number date to Date object
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

const ContentViewPage: React.FC = () => {
  const { getContentsByTopicId, getUserByUid } = useContent();
  const { user, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const { topicId, contentId } = useParams<{ topicId?: string; contentId?: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [contentToShow, setContentToShow] = useState<Content | null | undefined>(undefined);
  const [updatedByUsername, setUpdatedByUsername] = useState<string>('Desconhecido');
  const [formattedUpdatedAt, setFormattedUpdatedAt] = useState<string>('');

  useEffect(() => {
    const fetchContents = () => {
      if (topicId) {
        const topicContents = getContentsByTopicId(topicId);
        setContents(topicContents || []);
      }
    };
    fetchContents();
  }, [topicId, getContentsByTopicId]);

  useEffect(() => {
    if (contentId) {
      const foundContent = contents.find((c) => c.id === contentId);
      setContentToShow(foundContent || null);

      if (foundContent) {
        const updatedAtDate = convertToDate(foundContent.updatedAt);
        if (updatedAtDate) {
          setFormattedUpdatedAt(format(updatedAtDate, 'dd/MM/yyyy HH:mm', { locale: ptBR }));
        } else {
          setFormattedUpdatedAt('Data inválida');
        }

        const username = foundContent.updatedByUsername || foundContent.createdByUsername || 'Desconhecido';
        setUpdatedByUsername(username);

      }
    } else {
      setContentToShow(null);
    }
  }, [contentId, contents]);


  if (authIsLoading || contentToShow === undefined) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="dark:text-gray-300">Carregando conteúdo...</p>
      </div>
    );
  }

  if (!contentToShow && contentId) {
     return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Não foi possível encontrar o conteúdo.</h2>
        <Link to={topicId ? `/topics/${topicId}` : '/'} className="text-blue-900 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
            {topicId ? 'Voltar ao tópico' : 'Voltar para a página inicial'}
        </Link>
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
                contentToShow.topicId 
                  ? `/admin/topics/${contentToShow.topicId}/content/${contentToShow.id}/edit`
                  : `/admin/content/${contentToShow.id}/edit`
              )
            }
            icon={<EditIcon size={16} />}
          >
            Editar Conteúdo
          </Button>
        )}
      </div>
      {!contentId && contents.length === 0 && topicId && (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Não há conteúdos neste tópico</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Que tal adicionar o primeiro?</p>
                {user?.role === 'admin' && topicId && (
                     <Button onClick={() => navigate(`/admin/topics/${topicId}/content/new`)}>
                        Adicionar Conteúdo
                     </Button>
                )}
            </div>
        )}
       {contentToShow && (
        <div className="bg-white rounded-lg shadow-md p-8 dark:bg-gray-800 dark:text-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{contentToShow.title}</h1>
          {formattedUpdatedAt && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Última atualização: {formattedUpdatedAt} por {updatedByUsername}
            </div>
          )}
          <div 
            className="prose max-w-none whitespace-pre-line dark:prose-invert" 
            dangerouslySetInnerHTML={{ __html: contentToShow.body }} 
          />
        </div>
        )}
         {!contentToShow && !contentId && contents.length > 0 && topicId && ( 
                <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800 dark:text-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Conteúdos neste tópico:</h2>
                    <ul className='space-y-3'>
                    {contents.map(c => (
                         <li key={c.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-2 mb-2">
                            <Link to={`/topics/${topicId}/content/${c.id}`} className="text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
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
