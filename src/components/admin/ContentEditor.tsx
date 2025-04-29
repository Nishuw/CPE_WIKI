import React, { useState, useEffect } from 'react';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { SaveIcon } from 'lucide-react';

interface ContentEditorProps {
  contentId?: string;
  topicId: string;
  onSuccess?: () => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ 
  contentId, 
  topicId,
  onSuccess 
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const { 
    addContent, 
    updateContent, 
    getContentById 
  } = useContent();
  
  const isEditing = !!contentId;
  
  useEffect(() => {
    if (contentId) {
      const content = getContentById(contentId);
      if (content) {
        setTitle(content.title);
        setBody(content.body);
      }
    }
  }, [contentId, getContentById]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      if (isEditing && contentId) {
        updateContent(contentId, title, body);
      } else {
        addContent(topicId, title, body);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Failed to save content');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {isEditing ? 'Edit Content' : 'Create New Content'}
      </h2>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <Input
        id="content-title"
        label="Content Title"
        type="text"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter content title"
      />
      
      <div className="mb-4">
        <label htmlFor="content-body" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <div className="border border-gray-300 rounded-md">
          {/* Simple text editor toolbar */}
          <div className="bg-gray-50 border-b border-gray-300 p-2 flex space-x-2">
            <button 
              type="button" 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + '<h2>Heading</h2>')}
            >
              H2
            </button>
            <button 
              type="button" 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + '<p>Paragraph text</p>')}
            >
              P
            </button>
            <button 
              type="button" 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + '<strong>Bold text</strong>')}
            >
              B
            </button>
            <button 
              type="button" 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + '<em>Italic text</em>')}
            >
              I
            </button>
            <button 
              type="button" 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + '<a href="https://example.com">Link</a>')}
            >
              Link
            </button>
            <button 
              type="button" 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + '<img src="https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg" alt="Example image" />')}
            >
              Image
            </button>
          </div>
          
          {/* Content textarea */}
          <textarea
            id="content-body"
            className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter content in HTML format"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          You can use HTML tags for formatting. Use the buttons above to insert common elements.
        </p>
      </div>
      
      {/* Preview */}
      <div className="mb-4">
        <h3 className="block text-sm font-medium text-gray-700 mb-1">Preview</h3>
        <div 
          className="border border-gray-300 rounded-md p-4 prose max-w-none bg-white"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          variant="primary"
          icon={<SaveIcon size={16} />}
        >
          {isEditing ? 'Save Changes' : 'Create Content'}
        </Button>
      </div>
    </form>
  );
};

export default ContentEditor;