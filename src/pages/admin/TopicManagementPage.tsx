import React, { useState } from 'react';
import TopicList from '../../components/admin/TopicList';
import TopicForm from '../../components/admin/TopicForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import MoveTopicModal from '../../components/admin/MoveTopicModal'; // Import the modal
import { useContent } from '../../context/ContentContext';
import { toast } from 'react-hot-toast'; // Assuming you use react-hot-toast for notifications

const TopicManagementPage: React.FC = () => {
  const { deleteTopic, moveTopic } = useContent(); // Get moveTopic from context

  const [showForm, setShowForm] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | undefined>(undefined);
  const [parentTopicId, setParentTopicId] = useState<string | null>(null);

  // State for delete confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [topicToDeleteId, setTopicToDeleteId] = useState<string | null>(null);

  // State for move topic modal
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
    // Consider adding a success toast here if TopicForm doesn't handle it
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
        error: 'Erro ao excluir tópico.'
      });
    }
    setShowConfirmDialog(false);
    setTopicToDeleteId(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setTopicToDeleteId(null);
  };

  // --- Move Topic Logic Handlers ---

  const handleRequestMoveTopic = (topicId: string) => {
    setTopicToMoveId(topicId);
    setShowMoveModal(true);
  };

  const handleConfirmMove = async (newParentId: string | null) => {
    if (topicToMoveId) {
      // Ensure moveTopic exists before calling
      if (moveTopic) {
        const promise = moveTopic(topicToMoveId, newParentId);
        toast.promise(promise, {
          loading: 'Movendo tópico...',
          success: 'Tópico movido com sucesso!',
          error: 'Erro ao mover tópico.'
        });
      } else {
          console.error("moveTopic function is not available in ContentContext");
          toast.error('Funcionalidade de mover tópico não está implementada corretamente.');
      }
    }
    setShowMoveModal(false);
    setTopicToMoveId(null);
  };

  const handleCancelMove = () => {
    setShowMoveModal(false);
    setTopicToMoveId(null);
  };

  // --- End Move Topic Logic Handlers ---

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Tópicos</h1>
        <p className="text-gray-600 mt-2">
          Crie, edite, mova e organize tópicos para estruturar seu conteúdo.
        </p>
      </div>

      {showForm ? (
        <div className="mb-8">
          <TopicForm
            topicId={editingTopicId}
            parentId={parentTopicId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel} // Pass cancel handler
          />
        </div>
      ) : (
        <TopicList
          onAddTopic={handleAddClick}
          onEditTopic={handleEditClick}
          onRequestDeleteTopic={handleRequestDeleteTopic}
          onRequestMoveTopic={handleRequestMoveTopic} // Pass the move handler
        />
      )}

      {/* Render the delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirmar Exclusão"
        message="Deseja realmente excluir este tópico? Todos os subtópicos e conteúdos associados também serão removidos permanentemente."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      {/* Render the move topic modal */}
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