import React from 'react';
import TopicForm from '../../components/admin/TopicForm';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';

const NewTopicPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    navigate('/admin/topics');
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
        <h1 className="text-3xl font-bold text-gray-900">Create New Topic</h1>
        <p className="text-gray-600 mt-2">
          Add a new topic to organize your content.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <TopicForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default NewTopicPage;