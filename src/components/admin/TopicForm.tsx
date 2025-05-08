import React, { useState, useEffect } from 'react';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PlusIcon, SaveIcon } from 'lucide-react';

interface TopicFormProps {
  topicId?: string;
  parentId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void; // Added onCancel prop
}
 
const TopicForm: React.FC<TopicFormProps> = ({ 
  topicId, 
  parentId = null,
  onSuccess,
  onCancel // Added onCancel to destructuring
}) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { 
    addTopic, 
    updateTopic, 
    getTopicById,
    topics
  } = useContent();
  
  const isEditing = !!topicId;
  
  useEffect(() => {
    if (topicId) {
      const topic = getTopicById(topicId);
      if (topic) {
        setTitle(topic.title);
      }
    } else {
      setTitle(''); // Clear title when not editing (e.g. adding a new topic after editing one)
    }
  }, [topicId, getTopicById]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }
    
    try {
      if (isEditing && topicId) { // Ensure topicId is present for editing
        updateTopic(topicId, title);
      } else {
        addTopic(title, parentId);
      }
      
      setTitle('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Falha ao salvar o tópico');
      console.error("Error saving topic:", err); // Log the actual error
    }
  };
  
  return (
    // Removed bg-white, p-6, rounded-lg, shadow-sm as parent now handles card styling
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {isEditing ? 'Editar Tópico' : (parentId ? 'Criar Subtópico' : 'Criar Novo Tópico Raiz')}
      </h2>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900 dark:bg-opacity-30 rounded-md">
          {error}
        </div>
      )}
      
      <Input
          id="topic-title"
          label="Título do Tópico"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Insira o título do tópico"
        />

        {parentId && getTopicById(parentId) && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Será criado como subtópico de: <strong>{getTopicById(parentId)?.title}</strong>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button
              type="button" // Important: type is button to not submit form
              variant="outline" // Or another appropriate variant like 'ghost' or 'secondary'
              onClick={onCancel} 
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            icon={isEditing ? <SaveIcon size={16} /> : <PlusIcon size={16} />}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Tópico'}
          </Button>
        </div>
      </form>
    );
  };
 
  export default TopicForm;