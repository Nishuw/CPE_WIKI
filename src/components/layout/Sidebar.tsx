import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import { Topic, Content } from '../../types';
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, SearchIcon, XIcon, FileTextIcon } from 'lucide-react';

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
  const { topics, getChildTopics, getContentsByTopicId } = useContent();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const rootTopics = useMemo(() => {
    return getChildTopics(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getChildTopics, topics]);

  const expandParentTopics = useCallback((topicId: string | undefined | null, allTopics: Topic[]) => {
    if (!topicId) return;
    setExpandedTopics(prev => {
      const newState = { ...prev };
      let currentTopic = allTopics.find(t => t.id === topicId);
      while (currentTopic) {
        newState[currentTopic.id] = true;
        if (!currentTopic.parent) break;
        currentTopic = allTopics.find(t => t.id === currentTopic.parent);
      }
      return newState;
    });
  }, []);

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    let targetTopicId: string | undefined = undefined;
    if (pathSegments[0] === 'topics' && pathSegments[1]) {
       targetTopicId = pathSegments[1];
    }
    if (targetTopicId) {
      expandParentTopics(targetTopicId, topics);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, topics, expandParentTopics]);

  const topicMatchesSearch = useCallback((topicId: string, term: string, allTopics: Topic[], getChildTopicsFn: Function, getContentsFn: Function): boolean => {
    if (!term) return true;
    const lowerCaseTerm = term.toLowerCase();
    const topic = allTopics.find(t => t.id === topicId);
    if (!topic) return false;
    if (topic.title.toLowerCase().includes(lowerCaseTerm)) {
        return true;
    }
    const contents = getContentsFn(topicId);
    if (contents.some((c: Content) => c.title.toLowerCase().includes(lowerCaseTerm))) {
        return true;
    }
    const children = getChildTopicsFn(topicId);
    return children.some((child: Topic) => topicMatchesSearch(child.id, term, allTopics, getChildTopicsFn, getContentsFn));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const renderTopics = (parentTopics: Topic[], level: number = 0): (JSX.Element | null)[] => {
    return parentTopics.map((topic) => {
      if (searchTerm && !topicMatchesSearch(topic.id, searchTerm, topics, getChildTopics, getContentsByTopicId)) {
          return null;
      }
      const childTopics = getChildTopics(topic.id);
      const contents = getContentsByTopicId(topic.id);
      const isActiveTopic = topic.id === currentTopicId;
      const isManuallyExpanded = !!expandedTopics[topic.id];
      const isVisuallyExpanded = searchTerm || isManuallyExpanded;
      const hasSubTopics = childTopics.length > 0;
      const filteredContents = searchTerm
        ? contents.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : contents;
      const hasContentToShow = filteredContents.length > 0;
      const canShowExpandButton = hasSubTopics || contents.length > 0;
      const canRenderUl = hasSubTopics || hasContentToShow;
      const currentLevelPadding = 16 + level * 16;
      const nextLevelPadding = 16 + (level + 1) * 16;

      return (
        <li key={topic.id} className="my-0.5">
          <div
            className={`
              flex items-center justify-between py-1.5 px-2 text-sm rounded-md transition-colors group relative
              ${isActiveTopic 
                ? "bg-blue-100 text-blue-900 dark:bg-blue-700 dark:text-blue-100 font-semibold" 
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"}
            `}
             style={{ paddingLeft: `${currentLevelPadding}px` }}
          >
            <Link to={`/topics/${topic.id}`} className="flex items-center flex-grow min-w-0 mr-4" title={topic.title}>
                <FolderIcon size={18} className={`mr-2 flex-shrink-0 ${isActiveTopic 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300'}`} />
                <span className="truncate">{topic.title}</span>
            </Link>
            {canShowExpandButton && (
                <button
                    onClick={(e) => { e.stopPropagation(); toggleTopic(topic.id); }}
                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 absolute right-2 top-1/2 transform -translate-y-1/2"
                    aria-expanded={isVisuallyExpanded}
                    aria-label={isVisuallyExpanded ? 'Recolher' : 'Expandir'}
                 >
                  {isVisuallyExpanded
                    ? <ChevronDownIcon size={16} className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" />
                    : <ChevronRightIcon size={16} className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" />
                  }
                 </button>
            )}
          </div>
          {canRenderUl && isVisuallyExpanded && (
             <ul className="mt-0.5 space-y-0.5 pl-0">
                {hasSubTopics && renderTopics(childTopics, level + 1)}
                {hasContentToShow && (
                   <>
                    {filteredContents.map((content) => {
                        const isActiveContent = location.pathname.endsWith(`/content/${content.id}`);
                        const contentPadding = nextLevelPadding;
                        return (
                        <li key={content.id}>
                            <Link
                            to={`/topics/${topic.id}/content/${content.id}`}
                            className={`
                                flex items-center py-1 px-2 text-sm rounded-md transition-colors group
                                ${isActiveContent 
                                    ? "bg-green-100 text-green-900 dark:bg-green-700 dark:text-green-100 font-medium" 
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"}
                            `}
                            style={{ paddingLeft: `${contentPadding}px` }}
                            title={content.title}
                            >
                            <FileTextIcon size={16} className={`mr-2 flex-shrink-0 ${isActiveContent 
                                ? 'text-green-700 dark:text-green-300' 
                                : 'text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300'}`} />
                            <span className="truncate">{content.title}</span>
                            </Link>
                        </li>
                        );
                    })}
                   </>
                )}
             </ul>
          )}
        </li>
      );
    }).filter(Boolean);
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 w-72 h-screen bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-r dark:border-gray-700 shadow-sm
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}
      aria-label="Sidebar de Navegação"
    >
       <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-b dark:border-gray-700 flex-shrink-0">
           <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100" id="sidebar-title">Navegação</h2>
            <button
                onClick={toggleSidebar}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Fechar sidebar"
            >
                <XIcon size={20} />
            </button>
       </div>

      <div className="p-4 border-b border-gray-200 dark:border-b dark:border-gray-700 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            aria-label="Buscar tópicos e conteúdos"
          />
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
          {searchTerm && (
             <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-600"
                aria-label="Limpar busca"
            >
                <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-2 pb-4">
        {topics.length > 0 ? (
          <ul className="space-y-0.5" aria-labelledby="sidebar-title">
             {renderTopics(rootTopics)}
          </ul>
        ) : (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Nenhum tópico disponível.</p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;