import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
// Import ArrowRightLeftIcon
import { PlusIcon, EditIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, ArrowRightLeftIcon } from 'lucide-react';

interface TopicListProps {
  onAddTopic?: (parentId: string | null) => void;
  onEditTopic?: (topicId: string) => void;
  onRequestDeleteTopic: (topicId: string) => void;
  onRequestMoveTopic: (topicId: string) => void; // Add new prop for move action
}

const TopicList: React.FC<TopicListProps> = ({ onAddTopic, onEditTopic, onRequestDeleteTopic, onRequestMoveTopic }) => {
  const { topics, getChildTopics } = useContent();
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  // Ensure topics are available and getChildTopics is ready
  if (!topics || !getChildTopics) {
    return <div>Carregando tópicos...</div>; // Or some other loading indicator
  }

  const rootTopics = getChildTopics(null);

  const toggleExpand = (topicId: string) => {
    setExpandedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleDeleteTopicClick = (topicId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRequestDeleteTopic(topicId);
  };

  // New handler for Move button click
  const handleMoveTopicClick = (topicId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRequestMoveTopic(topicId); // Call the new prop function
  };

  const renderTopicItem = (topic: any, level: number = 0) => {
    const children = getChildTopics(topic.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedTopics.includes(topic.id);

    return (
      <React.Fragment key={topic.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 1.5}rem` }}
            >
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(topic.id)}
                  className="mr-2 text-gray-500 hover:text-gray-800 focus:outline-none"
                  aria-label={isExpanded ? 'Recolher subtópicos' : 'Expandir subtópicos'}
                >
                  {isExpanded ? (
                    <ChevronDownIcon size={18} />
                  ) : (
                    <ChevronRightIcon size={18} />
                  )}
                </button>
              )}
              {!hasChildren && level > 0 && (
                  <span className="inline-block w-[18px] mr-2"></span> // Placeholder for alignment
              )}
              <Link to={`/admin/topics/${topic.id}`} className="text-blue-900 hover:underline">
                {topic.title}
              </Link>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex justify-end items-center space-x-1 sm:space-x-2">
              {/* Add the Move Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleMoveTopicClick(topic.id, e)} // Attach handler
                title="Mover Tópico" // Add tooltip
              >
                <ArrowRightLeftIcon size={16} />
              </Button>
              {onEditTopic && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEditTopic(topic.id);
                  }}
                  title="Editar Tópico"
                >
                  <EditIcon size={16} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteTopicClick(topic.id, e)}
                className="text-red-600 hover:text-red-800"
                title="Excluir Tópico"
              >
                <TrashIcon size={16} />
              </Button>
              {onAddTopic && (
                 <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddTopic(topic.id);
                  }}
                  title="Adicionar Subtópico"
                >
                  <PlusIcon size={16} />
                </Button>
              )}
            </div>
          </td>
        </tr>

        {isExpanded && hasChildren && (
          children.map(child => renderTopicItem(child, level + 1))
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Tópicos
        </h3>
        {onAddTopic && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onAddTopic(null)}
            icon={<PlusIcon size={16} />}
          >
            Adicionar Tópico Raiz
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome do Tópico
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rootTopics.length > 0 ? (
              rootTopics.map(topic => renderTopicItem(topic))
            ) : (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum tópico disponível. Crie o primeiro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopicList;