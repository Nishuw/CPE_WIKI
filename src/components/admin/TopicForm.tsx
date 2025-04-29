import React, { useState, useEffect } from 'react';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PlusIcon, SaveIcon } from 'lucide-react';

interface TopicFormProps {
  topicId?: string;
  parentId?: string | null;
  onSuccess?: () => void;
}
 
const TopicForm: React.FC<TopicFormProps> = ({ 
  topicId, 
  parentId = null,
  onSuccess 
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
      if (isEditing) {
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
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800">
        {isEditing ? 'Editar Tópico' : 'Criar Novo Tópico'}
      </h2>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
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

        {parentId && (
          <div className="text-sm text-gray-500">
            Este tópico será criado em: {getTopicById(parentId)?.title || 'Raiz'}
          </div>
        )}

        <div className="flex justify-end space-x-4">
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