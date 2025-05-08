import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import { Topic } from '../../types';

import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TopicListProps {
  onAddTopic?: (parentId: string | null) => void;
  onEditTopic?: (topicId: string) => void;
  onRequestDeleteTopic: (topicId: string) => void;
  onRequestMoveTopic: (topicId: string) => void;
  onRequestReorderTopic: (topicId: string, direction: 'up' | 'down') => Promise<void>;
}

const TopicList: React.FC<TopicListProps> = ({
  onAddTopic,
  onEditTopic,
  onRequestDeleteTopic,
  onRequestMoveTopic,
  onRequestReorderTopic
}) => {
  const { topics, getChildTopics, getUserByUid } = useContent();
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  if (!topics || !getChildTopics || !getUserByUid) {
    return <div className="dark:text-gray-300">Carregando tópicos...</div>;
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

  const handleMoveTopicClick = (topicId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRequestMoveTopic(topicId);
  };

  const renderTopicItem = (topic: Topic, level: number = 0, index?: number, totalSiblings?: number) => {
    const children = getChildTopics(topic.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedTopics.includes(topic.id);
    const canMoveUp = level > 0 && index !== undefined && index > 0;
    const canMoveDown = level > 0 && index !== undefined && totalSiblings !== undefined && index < totalSiblings - 1;

    const handleReorderTopicClick = (topicId: string, direction: 'up' | 'down', event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onRequestReorderTopic(topicId, direction);
    };

    const updatedByUser = topic.updatedBy ? getUserByUid(topic.updatedBy) : undefined;
    const formattedUpdatedAt = topic.updatedAt && topic.updatedAt.toDate ?
      format(topic.updatedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A';

    return (
      <React.Fragment key={topic.id}>
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out">
          <td className="px-6 py-3 whitespace-nowrap text-sm">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 1.5}rem` }}
            >
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(topic.id)}
                  className="mr-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none p-1 -ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  aria-label={isExpanded ? 'Recolher subtópicos' : 'Expandir subtópicos'}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronDownIcon size={16} />
                  ) : (
                    <ChevronRightIcon size={16} />
                  )}
                </button>
              )}
              {!hasChildren && level > 0 && (
                  <span className="inline-block w-[20px] mr-2"></span>
              )}
              <Link to={`/admin/topics/${topic.id}`} className="text-blue-800 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium">
                {topic.title}
              </Link>
            </div>
          </td>

          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
            {topic.updatedAt ? (
              <span className="block">{formattedUpdatedAt}</span>
            ) : (
              <span className="block text-gray-500 dark:text-gray-400">N/A</span>
            )}
            {updatedByUser ? (
              <span className="block text-gray-500 dark:text-gray-400 text-xs">por {updatedByUser.username}</span>
            ) : topic.createdBy ? (
               <span className="block text-gray-500 dark:text-gray-400 text-xs">por {getUserByUid(topic.createdBy)?.username || 'Usuário Desconhecido'} (Criador)</span>
            ) : null}
          </td>

          <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium w-auto sm:w-64">
            <div className="flex justify-end items-center space-x-1">
              {level > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleReorderTopicClick(topic.id, 'up', e)}
                    disabled={!canMoveUp}
                    title="Mover para Cima"
                    className={`p-1 ${!canMoveUp ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'}`}
                  >
                    <ArrowUpIcon size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleReorderTopicClick(topic.id, 'down', e)}
                    disabled={!canMoveDown}
                    title="Mover para Baixo"
                     className={`p-1 ${!canMoveDown ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'}`}
                  >
                    <ArrowDownIcon size={16} />
                  </Button>
                 </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleMoveTopicClick(topic.id, e)}
                title="Mover Tópico (mudar pai)"
                className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ArrowRightLeftIcon size={16} />
              </Button>
              {onEditTopic && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditTopic(topic.id); }}
                  title="Editar Tópico"
                  className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                >
                  <EditIcon size={16} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteTopicClick(topic.id, e)}
                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                title="Excluir Tópico"
              >
                <TrashIcon size={16} />
              </Button>
              {onAddTopic && (
                 <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddTopic(topic.id); }}
                  title="Adicionar Subtópico"
                  className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                >
                  <PlusIcon size={16} />
                </Button>
              )}
            </div>
          </td>
        </tr>
        {isExpanded && hasChildren && (
          children.map((child, idx) => renderTopicItem(child, level + 1, idx, children.length))
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl leading-6 font-semibold text-gray-900 dark:text-gray-100">
          Gerenciar Tópicos
        </h3>
        {onAddTopic && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onAddTopic(null)}
            icon={<PlusIcon size={16} className="mr-1 -ml-0.5" />}
          >
            Novo Tópico Raiz
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nome do Tópico
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Última Atualização
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-auto sm:w-64">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {rootTopics.length > 0 ? (
              rootTopics.map((topic, index) => renderTopicItem(topic, 0, index, rootTopics.length))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nenhum tópico encontrado. Clique em "Novo Tópico Raiz" para começar.
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
