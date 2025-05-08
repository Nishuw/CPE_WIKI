import React, { useState, useEffect, useCallback } from 'react';
import { Content } from '../../types';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, FileTextIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

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

interface ContentListProps {
  topicId: string;
  onAddContent?: () => void;
  onEditContent?: (contentId: string) => void;
}

const ContentList: React.FC<ContentListProps> = ({ topicId, onAddContent, onEditContent }) => {
    const { getContentsByTopicId, deleteContent, getTopicById, refreshData, getUserByUid } = useContent();
    const [contents, setContents] = useState<Content[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
    const topic = getTopicById(topicId);

    const fetchContents = useCallback(() => {
        try {
            const newContents = getContentsByTopicId(topicId);
            setContents(newContents);
        } catch (error) {
            console.error('ContentList: Error fetching contents:', error);
        }
    }, [getContentsByTopicId, topicId]);

    useEffect(() => {
        fetchContents();
    }, [topicId, fetchContents]);

    useEffect(() => {
        if (isRefreshing) {
            fetchContents();
            setIsRefreshing(false);
        }
    }, [isRefreshing, fetchContents]);

    const handleDeleteClick = (contentId: string) => {
        setShowConfirmDelete(contentId);
    };

    const confirmDelete = async (contentId: string) => {
        setShowConfirmDelete(null);
        setDeletingContentId(contentId);
        try {
            setContents(prevContents => prevContents.filter(content => content.id !== contentId));
            await deleteContent(contentId);
            if (refreshData) {
                await refreshData();
            }
            setIsRefreshing(true);
            alert('Conteúdo excluído com sucesso!');
        } catch (error) {
            console.error('ContentList: Error in deletion process:', error);
            alert('Erro ao excluir o conteúdo. Por favor, tente novamente.');
            fetchContents();
        } finally {
            setDeletingContentId(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDelete(null);
    };

    if (!topic) {
        return <div className="dark:text-gray-300">Tópico não encontrado</div>;
    }

    const isContentDeleting = (contentId: string) => {
        return deletingContentId === contentId;
    }

    const getFormattedUpdateInfo = (contentItem: Content): string => {
        const updatedAtDate = convertToDate(contentItem.updatedAt);
        const dateString = updatedAtDate 
            ? format(updatedAtDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })
            : 'Data inválida';

        let username = 'Desconhecido';
        if (contentItem.updatedBy) {
            const updater = getUserByUid(contentItem.updatedBy);
            username = updater?.username || 'Desconhecido';
        } else if (contentItem.createdBy) {
            const creator = getUserByUid(contentItem.createdBy);
            username = creator?.username || 'Desconhecido';
        }
        return `${dateString} por ${username}`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Conteúdo para: {topic.title}
                </h3>
                {onAddContent && (
                    <Button
                        variant="primary"
                        onClick={onAddContent}
                        icon={<PlusIcon size={16} />}
                    > Adicionar Conteúdo</Button>
                )}
            </div>

            {contents.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {contents.map((content) => (
                        <li key={content.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FileTextIcon size={20} className="text-blue-900 dark:text-blue-400 mr-3" />
                                    <div className="flex-grow">
                                        <span className="block font-medium text-gray-800 dark:text-gray-100">{content.title}</span>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Última atualização: {getFormattedUpdateInfo(content)}</p>
                                    </div>
                                </div>                
                                <div className="flex space-x-2 items-center flex-shrink-0">
                                    {onEditContent && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEditContent(content.id)}
                                            icon={<EditIcon size={16} />}
                                        > Editar
                                        </Button>
                                    )}
                                    
                                    {showConfirmDelete === content.id ? (
                                        <div className="flex space-x-2">
                                            <Button                            
                                                variant="danger" // Changed from destructive to danger
                                                size="sm"
                                                onClick={() => confirmDelete(content.id)}
                                            >
                                                Confirmar
                                            </Button>
                                            <Button                            
                                                variant="outline"                  
                                                size="sm"
                                                onClick={cancelDelete}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button                            
                                            variant="ghost"                  
                                            size="sm"
                                            onClick={() => handleDeleteClick(content.id)}
                                            icon={<TrashIcon size={16} />}
                                            className={`text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ${isContentDeleting(content.id) ? 'cursor-not-allowed opacity-50' : ''}`}
                                            disabled={isContentDeleting(content.id)}
                                        >
                                            Excluir
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="px-4 py-5 sm:px-6 text-center">                                
                    <p className="text-gray-500 dark:text-gray-400">Nenhum conteúdo disponível para este tópico ainda.</p>
                    {onAddContent && (
                        <Button
                            variant="outline"
                            onClick={onAddContent}
                            className="mt-3"
                        > Crie seu primeiro conteúdo
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContentList;
