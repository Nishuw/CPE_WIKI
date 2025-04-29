import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import Layout from '../components/layout/Layout';
import { FileTextIcon, FolderIcon } from 'lucide-react';
const TopicPage: React.FC = () => {
  const { topicId = '' } = useParams<{ topicId: string }>();
  const { 
    getTopicById, 
    getChildTopics, 
    getContentsByTopicId 
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
  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic.title}</h1>
          <p className="text-gray-600">
            Última atualização: {new Date(topic.updatedAt).toLocaleDateString()}
          </p>
        </div>
        {/* Child topics section */}
        {childTopics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Subtopics</h2>
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