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
      setError('Title is required');
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
      setError('Failed to save topic');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800">
        {isEditing ? 'Edit Topic' : 'Create New Topic'}
      </h2>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <Input
        id="topic-title"
        label="Topic Title"
        type="text"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter topic title"
      />
      
      {parentId && (
        <div className="text-sm text-gray-500">
          This topic will be created under: {getTopicById(parentId)?.title || 'Root'}
        </div>
      )}
      
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          variant="primary"
          icon={isEditing ? <SaveIcon size={16} /> : <PlusIcon size={16} />}
        >
          {isEditing ? 'Save Changes' : 'Create Topic'}
        </Button>
      </div>
    </form>
  );
};

export default TopicForm;