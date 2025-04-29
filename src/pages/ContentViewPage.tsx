import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, EditIcon } from 'lucide-react';
 
const ContentViewPage: React.FC = () => {
  const { topicId = '', contentId = '' } = useParams<{ topicId: string, contentId: string }>();
  const { getContentById, getTopicById } = useContent();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const content = getContentById(contentId);
  const topic = getTopicById(topicId);
 
  if (!content || !topic) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Conteúdo não encontrado</h2>
        <p className="text-gray-600 mb-4">
          O conteúdo que você está procurando não existe ou foi removido.
        </p>
        <Link to="/" className="text-blue-900 hover:underline">
          Retornar à página inicial
        </Link>
      </div>
    );
  }
 
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to={`/topics/${topicId}`}
          className="inline-flex items-center text-blue-900 hover:underline"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Voltar para {topic.title}
        </Link>
       
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