import React, { useState } from 'react';
import TopicList from '../../components/admin/TopicList';
import TopicForm from '../../components/admin/TopicForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog'; // Vamos criar este componente
import { useContent } from '../../context/ContentContext'; // Precisamos do useContent aqui

const TopicManagementPage: React.FC = () => {
  const { deleteTopic } = useContent(); // Obter a função de deletar do contexto

  const [showForm, setShowForm] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | undefined>(undefined);
  const [parentTopicId, setParentTopicId] = useState<string | null>(null);

  // Estado para o diálogo de confirmação
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [topicToDeleteId, setTopicToDeleteId] = useState<string | null>(null);

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

  // Função chamada pelo TopicList quando o botão delete é clicado
  const handleRequestDeleteTopic = (topicId: string) => {
    setTopicToDeleteId(topicId); // Armazena o ID do tópico a ser deletado
    setShowConfirmDialog(true); // Abre o diálogo de confirmação
  };

  // Função chamada quando o usuário confirma a exclusão no diálogo
  const handleConfirmDelete = async () => {
    if (topicToDeleteId) {
      try {
        // console.log(`[TopicManagementPage] User confirmed deletion for topicId: ${topicToDeleteId}. Calling deleteTopic...`);
        await deleteTopic(topicToDeleteId);
        // console.log(`[TopicManagementPage] deleteTopic call finished.`);
      } catch (error) {
        console.error("[TopicManagementPage] Error deleting topic:", error);
        // O erro já é tratado no ContentContext e pode ser exibido lá ou aqui se necessário
      }
    }
    // Fechar o diálogo e limpar o estado
    setShowConfirmDialog(false);
    setTopicToDeleteId(null);
  };

  // Função chamada quando o usuário cancela a exclusão no diálogo
  const handleCancelDelete = () => {
    // console.log(`[TopicManagementPage] User cancelled deletion.`);
    // Fechar o diálogo e limpar o estado
    setShowConfirmDialog(false);
    setTopicToDeleteId(null);
  };


  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Topic Management</h1>
        <p className="text-gray-600 mt-2">
          Create, edit, and organize topics to structure your content.
        </p>
      </div>

      {showForm ? (
        <div className="mb-8">
          <TopicForm
            topicId={editingTopicId}
            parentId={parentTopicId}
            onSuccess={handleFormSuccess}
          />
          <div className="mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel and return to topic list
            </button>
          </div>
        </div>
      ) : (
        <TopicList
          onAddTopic={handleAddClick}
          onEditTopic={handleEditClick}
          onRequestDeleteTopic={handleRequestDeleteTopic} // Passar a nova função
        />
      )}

      {/* Renderizar o diálogo de confirmação */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message="Deseja excluir esse tópico? Isso removerá também todos os subtópicos e conteúdos associados."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

    </div>
  );
};

export default TopicManagementPage;
