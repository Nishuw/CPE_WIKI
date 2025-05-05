import React, { useState, useEffect, useCallback } from 'react';
import { Content } from '../../types';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, FileTextIcon } from 'lucide-react'; 

interface ContentListProps {
  topicId: string;
  onAddContent?: () => void;
  onEditContent?: (contentId: string) => void;
}

const ContentList: React.FC<ContentListProps> = ({ topicId, onAddContent, onEditContent }) => {
    const { getContentsByTopicId, deleteContent, getTopicById, refreshData } = useContent();
    const [contents, setContents] = useState<Content[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
    const topic = getTopicById(topicId);
    
    // console.log('ContentList: Rendering with topicId:', topicId);
    // console.log('ContentList: Current state of contents:', contents.length);

    const fetchContents = useCallback(() => {
        // console.log('ContentList: fetchContents called');
        try {
            const newContents = getContentsByTopicId(topicId);
            // console.log('ContentList: New contents fetched:', newContents.length);
            setContents(newContents);
        } catch (error) {
            // console.error('ContentList: Error fetching contents:', error);
        }
    }, [getContentsByTopicId, topicId]);

    useEffect(() => {
        // console.log('ContentList: useEffect triggered for topicId:', topicId);
        fetchContents();
    }, [topicId, fetchContents]);

    useEffect(() => {
        if (isRefreshing) {
            // console.log('ContentList: Refreshing due to isRefreshing flag');
            fetchContents();
            setIsRefreshing(false);
        }
    }, [isRefreshing, fetchContents]);

    // Iniciar processo de exclusão
    const handleDeleteClick = (contentId: string) => {
        // console.log(`ContentList: handleDeleteClick called for contentId: ${contentId}`);
        setShowConfirmDelete(contentId);
    };

    // Confirmação de exclusão
    const confirmDelete = async (contentId: string) => {
        // console.log(`ContentList: confirmDelete called for contentId: ${contentId}`);
        setShowConfirmDelete(null);
        setDeletingContentId(contentId);
        
        try {
            // console.log('ContentList: Updating local state BEFORE API call');
            
            // Atualiza o estado local ANTES da chamada à API
            setContents(prevContents => {
                // console.log('ContentList: Filtering out content from local state:', contentId);
                return prevContents.filter(content => content.id !== contentId);
            });
            
            // console.log('ContentList: Calling deleteContent API function');
            
            // Chama a função deleteContent do contexto
            await deleteContent(contentId);
            // console.log('ContentList: deleteContent API call succeeded');
            
            // Tentativa adicional de garantir que o estado está atualizado
            if (refreshData) {
                // console.log('ContentList: Calling refreshData after successful deletion');
                await refreshData();
            }
            
            // console.log('ContentList: Setting isRefreshing to true');
            setIsRefreshing(true);
            
            // console.log('ContentList: Deletion process completed successfully');
            alert('Conteúdo excluído com sucesso!');
            
        } catch (error) {
            console.error('ContentList: Error in deletion process:', error);
            alert('Erro ao excluir o conteúdo. Por favor, tente novamente.');
            
            // Força uma atualização da lista para garantir consistência
            // console.log('ContentList: Forcing refresh after error');
            fetchContents();
        } finally {
            // console.log('ContentList: Setting deletingContentId to null');
            setDeletingContentId(null);
        }
    };

    // Cancelar exclusão
    const cancelDelete = () => {
        // console.log('ContentList: cancelDelete called');
        setShowConfirmDelete(null);
    };

    if (!topic) {
        return <div>Tópico não encontrado</div>;
    }

    const isContentDeleting = (contentId: string) => {
        return deletingContentId === contentId;
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Content for: {topic.title}
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
                <ul className="divide-y divide-gray-200">
                    {contents.map((content) => (
                        <li key={content.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                            {/* {console.log(`ContentList: Rendering content with id: ${content.id}`)} */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FileTextIcon size={20} className="text-blue-900 mr-3" />
                                    <div> {content.title}
                                        <p className="text-sm text-gray-500"> Última atualização: {new Date(content.updatedAt).toLocaleDateString()} </p>
                                    </div>
                                </div>                
                                <div className="flex space-x-2 items-center">
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
                                                variant="destructive"                  
                                                size="sm"
                                                onClick={() => confirmDelete(content.id)}
                                                className="bg-red-600 text-white hover:bg-red-700"
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
                                            className={`text-red-600 hover:text-red-800 ${isContentDeleting(content.id) ? 'cursor-not-allowed opacity-50' : ''}`}
                                            disabled={isContentDeleting(content.id)}
                                        >
                                            Delete
                                        </Button>
                                    )}
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
                        > Crie seu primeiro conteúdo
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContentList;