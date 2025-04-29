import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import { Topic } from '../../types';
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, SearchIcon, XIcon } from 'lucide-react';

interface SidebarProps {
  currentTopicId?: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentTopicId,
  isSidebarOpen,
  toggleSidebar,
}) => {
  const { topics, getChildTopics } = useContent();
  const [searchTerm, setSearchTerm] = useState('');
  const rootTopics = getChildTopics(null);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (Object.keys(expandedTopics).length === 0) {
      const initialExpandedState: Record<string, boolean> = {};
      rootTopics.forEach((topic) => (initialExpandedState[topic.id] = false));
      setExpandedTopics(initialExpandedState);
    }
  }, [rootTopics]);

  const filterTopics = (topics: Topic[], term: string): Topic[] => {
    return topics.filter(topic =>
      topic.title.toLowerCase().includes(term.toLowerCase())
    );
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const renderTopics = (parentTopics: Topic[], level: number = 0) => {
    const filteredTopics = searchTerm ? filterTopics(parentTopics, searchTerm) : parentTopics;

    return (
      <ul className={`space-y-1 ${level > 0 ? "ml-4 pl-2 border-l border-gray-200" : ""}`}>
        {filteredTopics.map((topic) => {
          const children = getChildTopics(topic.id);
          const isActive = topic.id === currentTopicId;
          const hasChildren = children.length > 0;
          const paddingLeft = 4 + level * 2;

          return (
            <li key={topic.id}>
              <Link 
                to={`/topics/${topic.id}`}
                onClick={(e) => {
                  if (hasChildren) {
                    e.preventDefault();
                    toggleTopic(topic.id);
                  }
                }}
                className={`
                  flex items-center py-2 text-sm rounded-md transition-colors cursor-pointer
                  ${isActive ? "bg-blue-100 text-blue-900 font-medium" : "text-gray-700 hover:bg-gray-100"}
                `}
                style={{ paddingLeft: `${paddingLeft}px` }}
              >
                <FolderIcon size={18} className="mr-2 text-blue-800" />
                <span>{topic.title}</span>
                {hasChildren && (
                  <span className="ml-auto">
                    {expandedTopics[topic.id] ? 
                      <ChevronDownIcon size={16} /> : 
                      <ChevronRightIcon size={16} />
                    }
                  </span>
                )}
              </Link>
              {hasChildren && expandedTopics[topic.id] && renderTopics(children, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 w-72 h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16
      `}
    >
      {/* Close button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Close sidebar"
      >
        <XIcon size={20} />
      </button>

      <div className="p-4 overflow-y-auto h-[calc(100vh-100px)]">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h2>

          <div className="relative">
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {rootTopics.length > 0 ? (
            renderTopics(rootTopics)
          ) : ( 
            <p className="text-sm text-gray-500">No topics available</p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;