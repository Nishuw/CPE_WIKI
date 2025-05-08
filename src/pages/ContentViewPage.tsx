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
  const { getContentsByTopicId, getUserByUid } = useContent(); // Added getUserByUid
  const { user, isLoading: authIsLoading } = useAuth(); // Renamed isLoading to authIsLoading for clarity
  const navigate = useNavigate();
  const { topicId, contentId } = useParams<{ topicId?: string; contentId?: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [contentToShow, setContentToShow] = useState<Content | null | undefined>(undefined); // Initialize with undefined to differentiate initial state
  const [updatedByUsername, setUpdatedByUsername] = useState<string>('Desconhecido');
  const [formattedUpdatedAt, setFormattedUpdatedAt] = useState<string>('');

  useEffect(() => {
    const fetchContents = () => { // Removed async as getContentsByTopicId is synchronous
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

        let username = 'Desconhecido';
        if (foundContent.updatedBy) {
          const updater = getUserByUid(foundContent.updatedBy);
          username = updater?.username || 'Desconhecido';
        } else if (foundContent.createdBy) {
          const creator = getUserByUid(foundContent.createdBy);
          username = creator?.username || 'Desconhecido';
        }
        setUpdatedByUsername(username);
      }
    } else {
      setContentToShow(null); // Explicitly set to null if no contentId
    }
  }, [contentId, contents, getUserByUid]);


  // Use a combined loading state or check for initial undefined state of contentToShow
  if (authIsLoading || contentToShow === undefined) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p>Carregando conteúdo...</p>
      </div>
    );
  }

  if (!contentToShow && contentId) { // If contentId is present but contentToShow is null after loading
     return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Não foi possível encontrar o conteúdo.</h2>
        <Link to={topicId ? `/topics/${topicId}` : '/'} className="text-blue-900 hover:underline">
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
                // Ensure topicId is used if available for a more specific edit route.
                // Fallback to general content edit if topicId is not in the URL (e.g. direct link to content not within a topic context)
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
      {!contentId && contents.length === 0 && topicId && ( // Shows when on a topic page with no content
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Não há conteúdos neste tópico</h2>
                <p className="text-gray-600 mb-4">Que tal adicionar o primeiro?</p>
                {user?.role === 'admin' && topicId && (
                     <Button onClick={() => navigate(`/admin/topics/${topicId}/content/new`)}>
                        Adicionar Conteúdo
                     </Button>
                )}
            </div>
        )}
       {contentToShow && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{contentToShow.title}</h1>
          {formattedUpdatedAt && (
            <div className="text-sm text-gray-500 mb-6">
              Última atualização: {formattedUpdatedAt} por {updatedByUsername}
            </div>
          )}
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: contentToShow.body }} />
        </div>
        )}
         {!contentToShow && !contentId && contents.length > 0 && topicId && ( // List contents if no specific contentId in URL
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Conteúdos neste tópico:</h2>
                    <ul className='space-y-3'>
                    {contents.map(c => (
                         <li key={c.id} className="border-b border-gray-100 last:border-b-0 pb-2 mb-2">
                            <Link to={`/topics/${topicId}/content/${c.id}`} className="text-blue-700 hover:text-blue-900 hover:underline">
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
