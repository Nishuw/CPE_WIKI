import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, FileTextIcon } from 'lucide-react';

interface ContentListProps {
  topicId: string;
  onAddContent?: () => void;
  onEditContent?: (contentId: string) => void;
}

const ContentList: React.FC<ContentListProps> = ({
  topicId,
  onAddContent,
  onEditContent
}) => {
  const { getContentsByTopicId, deleteContent, getTopicById } = useContent();
  const contents = getContentsByTopicId(topicId);
  const topic = getTopicById(topicId);
  
  const handleDeleteContent = (contentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este conteúdo? Essa ação não poderá ser desfeita.')) {
      deleteContent(contentId);
    }
  };
  
  if (!topic) {
    return <div>Tópico não encontrado</div>;
  }
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Content for: {topic.title}
        </h3>        <h3>Conteúdo para: {topic.title}</h3>
        {onAddContent &&
          (
            <Button
              variant="primary"
              onClick={onAddContent}
              icon={<PlusIcon size={16} />}
          >
            Adicionar Conteúdo
          </Button>
        )}
      </div>
      
      {contents.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {contents.map((content) => (
            <li key={content.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50"> <div className="flex items-center justify-between">
                <div className="flex items-center"> <FileTextIcon size={20} className="text-blue-900 mr-3" />
                  <div> <Link
                    to={`/topics/${topicId}/content/${content.id}`}
                    className="text-blue-900 font-medium hover:underline"
                  >
                    {content.title}
                  </Link>
                    <p className="text-sm text-gray-500">
                      Última atualização: {new Date(content.updatedAt).toLocaleDateString()} </p>




                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {onEditContent && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => onEditContent(content.id)}
                      icon={<EditIcon size={16} />}
                    >
                      Editar
                    </Button>
                  )}
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContent(content.id)}
                    icon={<TrashIcon size={16} />}
                    className="text-red-600 hover:text-red-800"
                  >                    Excluir
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-5 sm:px-6 text-center">
          <p className="text-gray-500">Nenhum conteúdo disponível para este tópico ainda.</p>
          {onAddContent && (
            <Button 
              variant="outline"
              onClick={onAddContent}
              className="mt-3"
            >
              Crie seu primeiro conteúdo
            </Button>
          )}
        </div>
      )}
    </div>

  );
};

export default ContentList;