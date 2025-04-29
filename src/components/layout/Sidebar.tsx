import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import { Topic } from '../../types';
import { ChevronRightIcon, FolderIcon, SearchIcon, XIcon } from 'lucide-react'; // Import XIcon

interface SidebarProps {
  currentTopicId?: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void; // Add toggleSidebar to props
}

const Sidebar: React.FC<SidebarProps> = ({
  currentTopicId,
  isSidebarOpen,
  toggleSidebar, // Destructure toggleSidebar from props
}) => {
  const { topics, getChildTopics } = useContent();
  const [searchTerm, setSearchTerm] = useState('');
  const rootTopics = getChildTopics(null);

  const filterTopics = (topics: Topic[], term: string): Topic[] => {
    return topics.filter(topic =>
      topic.title.toLowerCase().includes(term.toLowerCase())
    );
  };

  const renderTopics = (parentTopics: Topic[]) => {
    const filteredTopics = searchTerm ? filterTopics(parentTopics, searchTerm) : parentTopics;

    return (
      <ul className="space-y-1">
        {filteredTopics.map((topic) => {
          const children = getChildTopics(topic.id);
          const isActive = topic.id === currentTopicId;
          const hasChildren = children.length > 0;

          return (
            <li key={topic.id}>
              <Link
                to={`/topics/${topic.id}`}
                className={`
                  flex items-center px-4 py-2 text-sm rounded-md transition-colors
                  ${isActive
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <FolderIcon size={18} className="mr-2 text-blue-800" />
                <span>{topic.title}</span>
                {hasChildren && (
                  <ChevronRightIcon size={16} className="ml-auto" />
                )}
              </Link>

              {hasChildren && !searchTerm && (
                <div className="ml-4 pl-2 border-l border-gray-200">
                  {renderTopics(children)}
                </div>
              )}
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
        pt-16 // Add padding to account for the header
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

      <div className="p-4 overflow-y-auto h-[calc(100vh-100px)]"> {/* Adjust height to account for header and padding and close button */}
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

        <div className="overflow-y-auto max-h-[calc(100vh-200px)]"> {/* Re-adjust inner scrollable area height */}
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
