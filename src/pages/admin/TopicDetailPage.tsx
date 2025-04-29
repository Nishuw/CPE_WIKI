import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import ContentList from '../../components/admin/ContentList';
import ContentEditor from '../../components/admin/ContentEditor';
import Button from '../../components/ui/Button';
import { ArrowLeftIcon } from 'lucide-react';

const TopicDetailPage: React.FC = () => {
  const { topicId = '' } = useParams<{ topicId: string }>();
  const { getTopicById, getChildTopics } = useContent();
  const [showEditor, setShowEditor] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | undefined>(undefined);
  
  const topic = getTopicById(topicId);
  const childTopics = getChildTopics(topicId);
  
  if (!topic) {
    return <Navigate to="/admin/topics" replace />;
  }
  
  const handleAddContent = () => {
    setEditingContentId(undefined);
    setShowEditor(true);
  };
  
  const handleEditContent = (contentId: string) => {
    setEditingContentId(contentId);
    setShowEditor(true);
  };
  
  const handleEditorSuccess = () => {
    setShowEditor(false);
    setEditingContentId(undefined);
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link 
          to="/admin/topics"
          className="inline-flex items-center text-blue-900 hover:underline"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Back to Topics
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{topic.title}</h1>
        <p className="text-gray-600 mt-2">
          Manage content and subtopics for this topic.
        </p>
      </div>
      
      {showEditor ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <ContentEditor 
            contentId={editingContentId}
            topicId={topicId}
            onSuccess={handleEditorSuccess}
          />
          <div className="mt-4">
            <button
              onClick={() => setShowEditor(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel and return to content list
            </button>
          </div>
        </div>
      ) : (
        <ContentList 
          topicId={topicId}
          onAddContent={handleAddContent}
          onEditContent={handleEditContent}
        />
      )}
      
      {childTopics.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Subtopics</h2>
          <div className="space-y-2">
            {childTopics.map(childTopic => (
              <div key={childTopic.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                <Link 
                  to={`/admin/topics/${childTopic.id}`}
                  className="font-medium text-blue-900 hover:underline"
                >
                  {childTopic.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicDetailPage;