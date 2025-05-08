import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { FileTextIcon, FolderIcon } from 'lucide-react';
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

const TopicPage: React.FC = () => {
  const { topicId = '' } = useParams<{ topicId: string }>();
  const { 
    getTopicById, 
    getChildTopics, 
    getContentsByTopicId,
    getUserByUid // Added getUserByUid
  } = useContent();
  
  const topic = getTopicById(topicId);
  const childTopics = getChildTopics(topicId);
  const contents = getContentsByTopicId(topicId);

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tópico não encontrado</h2>
        <p className="text-gray-600 mb-4">O tópico que você está procurando não existe ou foi removido.</p>
        <Link to="/" className="text-blue-900 hover:underline">
          Voltar para a página inicial
       </Link>
      </div>
    );
  }

  const updatedAtDate = convertToDate(topic.updatedAt);
  const formattedUpdatedAt = updatedAtDate 
    ? format(updatedAtDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })
    : 'Data inválida';

  let updatedByUsername = 'Desconhecido';
  if (topic.updatedBy) {
    const updater = getUserByUid(topic.updatedBy);
    updatedByUsername = updater?.username || 'Desconhecido';
  } else if (topic.createdBy) {
    const creator = getUserByUid(topic.createdBy);
    updatedByUsername = creator?.username || 'Desconhecido';
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic.title}</h1>
          <p className="text-sm text-gray-500">
            Última atualização: {formattedUpdatedAt} por {updatedByUsername}
          </p>
        </div>

        {/* Child topics section */}
        {childTopics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Subtópicos</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {childTopics.map(childTopic => (
                <Link 
                  key={childTopic.id} 
                  to={`/topics/${childTopic.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <FolderIcon size={20} className="text-blue-900 mr-3" />
                    <span className="font-medium text-blue-900">{childTopic.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contents section */}
        {contents.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Conteúdo</h2>
            <ul className="space-y-4">
              {contents.map(content => (
                <li key={content.id}>
                  <Link 
                    to={`/topics/${topicId}/content/${content.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center">
                      <FileTextIcon size={20} className="text-blue-900 mr-3" />
                      <span className="font-medium text-blue-900">{content.title}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500 py-4">
              Nenhum conteúdo disponível para este tópico ainda.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default TopicPage;
