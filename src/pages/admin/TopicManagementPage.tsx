import React, { useState } from 'react';
import TopicList from '../../components/admin/TopicList';
import TopicForm from '../../components/admin/TopicForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import MoveTopicModal from '../../components/admin/MoveTopicModal';
import { useContent } from '../../context/ContentContext';
import { toast } from 'react-hot-toast';

const TopicManagementPage: React.FC = () => {
  const { deleteTopic, moveTopic, reorderTopic } = useContent();
  const [showForm, setShowForm] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | undefined>(undefined);
  const [parentTopicId, setParentTopicId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [topicToDeleteId, setTopicToDeleteId] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [topicToMoveId, setTopicToMoveId] = useState<string | null>(null);

  const handleAddClick = (parentId: string | null) => {
    setParentTopicId(parentId);
    setEditingTopicId(undefined);
    setShowForm(true);
  };

  const handleEditClick = (topicId: string) => {
    setEditingTopicId(topicId);
    setParentTopicId(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTopicId(undefined);
    setParentTopicId(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTopicId(undefined);
    setParentTopicId(null);
  }

  const handleRequestDeleteTopic = (topicId: string) => {
    setTopicToDeleteId(topicId);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (topicToDeleteId) {
      const promise = deleteTopic(topicToDeleteId);
      toast.promise(promise, {
        loading: 'Excluindo tópico...',
        success: 'Tópico excluído com sucesso!',
        error: (err) => `Erro ao excluir: ${err.message || 'Erro desconhecido'}`
      });
      setShowConfirmDialog(false);
      setTopicToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setTopicToDeleteId(null);
  };

  const handleRequestMoveTopic = (topicId: string) => {
    setTopicToMoveId(topicId);
    setShowMoveModal(true);
  };

  const handleConfirmMove = async (newParentId: string | null) => {
    if (topicToMoveId) {
      if (moveTopic) {
        const promise = moveTopic(topicToMoveId, newParentId);
        toast.promise(promise, {
          loading: 'Movendo tópico...',
          success: 'Tópico movido com sucesso!',
          error: (err) => `Erro ao mover: ${err.message || 'Erro desconhecido'}`
        });
        setShowMoveModal(false);
        setTopicToMoveId(null);
      } else {
          console.error("moveTopic function is not available in ContentContext");
          toast.error('Erro interno: Funcionalidade de mover não encontrada.');
          setShowMoveModal(false);
          setTopicToMoveId(null);
      }
    }
  };

  const handleCancelMove = () => {
    setShowMoveModal(false);
    setTopicToMoveId(null);
  };

  const handleRequestReorderTopic = async (topicId: string, direction: 'up' | 'down') => {
    if (!reorderTopic) {
        console.error("reorderTopic function is not available in ContentContext");
        toast.error('Erro interno: Funcionalidade de reordenar não encontrada.');
        return;
    }
    try {
        await reorderTopic(topicId, direction);
    } catch (error: any) {
        console.error("Error reordering topic:", error);
        toast.error(`Erro ao reordenar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Gerenciamento de Tópicos</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Crie, edite, mova e organize a ordem dos tópicos para estruturar seu conteúdo.
        </p>
      </div>

      {showForm ? (
        <div className="mb-8 bg-white p-6 rounded-lg shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <TopicForm
            topicId={editingTopicId}
            parentId={parentTopicId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      ) : (
        <TopicList
          onAddTopic={handleAddClick}
          onEditTopic={handleEditClick}
          onRequestDeleteTopic={handleRequestDeleteTopic}
          onRequestMoveTopic={handleRequestMoveTopic}
          onRequestReorderTopic={handleRequestReorderTopic}
        />
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirmar Exclusão"
        message="Deseja realmente excluir este tópico? Todos os subtópicos e conteúdos associados também serão removidos permanentemente."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      <MoveTopicModal
        isOpen={showMoveModal}
        topicIdToMove={topicToMoveId}
        onConfirmMove={handleConfirmMove}
        onCancelMove={handleCancelMove}
      />

    </div>
  );
};

export default TopicManagementPage;
