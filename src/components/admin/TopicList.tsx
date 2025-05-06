import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button'; // Assuming Button component exists
import { Topic } from '../../types'; // Import Topic type explicitly

// Import necessary icons, including Up and Down arrows
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightLeftIcon,
  ArrowUpIcon,    // <-- Add ArrowUpIcon
  ArrowDownIcon   // <-- Add ArrowDownIcon
} from 'lucide-react';

// Import date-fns for date formatting
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Import locale for Brazilian Portuguese

// Define the props for the TopicList component
interface TopicListProps {
  onAddTopic?: (parentId: string | null) => void; // Optional: Function to trigger adding a topic
  onEditTopic?: (topicId: string) => void; // Optional: Function to trigger editing a topic
  onRequestDeleteTopic: (topicId: string) => void; // Required: Function to request topic deletion
  onRequestMoveTopic: (topicId: string) => void; // Required: Function to request moving topic (to different parent)
  onRequestReorderTopic: (topicId: string, direction: 'up' | 'down') => Promise<void>; // <-- New Prop for reordering
}

const TopicList: React.FC<TopicListProps> = ({
  onAddTopic,
  onEditTopic,
  onRequestDeleteTopic,
  onRequestMoveTopic,
  onRequestReorderTopic
}) => {
  // Get data and functions from the content context
  const { topics, getChildTopics, getUserByUid } = useContent(); // <-- Added getUserByUid
  // State to keep track of which topics are expanded to show children
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  // Show loading indicator if topics or the getter function aren't ready yet
  if (!topics || !getChildTopics || !getUserByUid) { // <-- Check for getUserByUid too
    return <div>Carregando tópicos...</div>;
  }

  // Get the root topics (topics with no parent) using the (now ordering) getChildTopics function
  const rootTopics = getChildTopics(null);

  // Toggles the expanded state of a topic
  const toggleExpand = (topicId: string) => {
    setExpandedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId) // Remove if already included (collapse)
        : [...prev, topicId] // Add if not included (expand)
    );
  };

  // Handler for delete button click
  const handleDeleteTopicClick = (topicId: string, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent default link behavior if any
    event.stopPropagation(); // Prevent event bubbling up (e.g., to row click)
    onRequestDeleteTopic(topicId); // Call the prop function
  };

  // Handler for move button (change parent) click
  const handleMoveTopicClick = (topicId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRequestMoveTopic(topicId); // Call the prop function
  };

  // *** Recursive function to render each topic item and its children ***
  // Now accepts index and totalSiblings to enable/disable reorder buttons
  const renderTopicItem = (topic: Topic, level: number = 0, index?: number, totalSiblings?: number) => {
    // Get children for the current topic (already sorted by position from context)
    const children = getChildTopics(topic.id);
    const hasChildren = children.length > 0;
    // Check if the current topic is expanded
    const isExpanded = expandedTopics.includes(topic.id);

    // Determine if reorder buttons should be enabled
    // Can only reorder if it's not a root topic (level > 0) and index/total are provided
    const canMoveUp = level > 0 && index !== undefined && index > 0; // Cannot move up if it's the first item (index 0)
    const canMoveDown = level > 0 && index !== undefined && totalSiblings !== undefined && index < totalSiblings - 1; // Cannot move down if it's the last item

    // Handler for reorder button clicks (Up/Down)
    const handleReorderTopicClick = (topicId: string, direction: 'up' | 'down', event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onRequestReorderTopic(topicId, direction);
    };

    // Get the user who last updated the topic
    const updatedByUser = topic.updatedBy ? getUserByUid(topic.updatedBy) : undefined;

    // Format the last updated date
    const formattedUpdatedAt = topic.updatedAt && topic.updatedAt.toDate ?
      format(topic.updatedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'; // Using date-fns

    return (
      // Use React.Fragment to avoid adding extra DOM elements per topic row + children group
      <React.Fragment key={topic.id}>
        {/* Table Row for the Topic */}
        <tr className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
          {/* Cell for Topic Name and Indentation/Expand Button */}
          <td className="px-6 py-3 whitespace-nowrap text-sm"> {/* Adjusted py */}
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 1.5}rem` }} // Apply indentation based on level
            >
              {/* Expand/Collapse Button (only if topic has children) */}
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(topic.id)}
                  className="mr-2 text-gray-500 hover:text-gray-800 focus:outline-none p-1 -ml-1 rounded-full hover:bg-gray-200" // Added padding/rounding for better click target
                  aria-label={isExpanded ? 'Recolher subtópicos' : 'Expandir subtópicos'}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronDownIcon size={16} /> // Smaller icon
                  ) : (
                    <ChevronRightIcon size={16} /> // Smaller icon
                  )}
                </button>
              )}
              {/* Placeholder for alignment when no children but indented */}
              {!hasChildren && level > 0 && (
                  <span className="inline-block w-[20px] mr-2"></span> // Adjusted width slightly
              )}
              {/* Link to view/edit the topic */}
              <Link to={`/admin/topics/${topic.id}`} className="text-blue-800 hover:text-blue-600 hover:underline font-medium">
                {topic.title}
              </Link>
            </div>
          </td>

          {/* Cell for Last Updated Info */}
          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
            {topic.updatedAt ? (
              <span className="block text-gray-600">{formattedUpdatedAt}</span>
            ) : (
              <span className="block text-gray-500">N/A</span>
            )}
            {updatedByUser ? (
              <span className="block text-gray-500 text-xs">por {updatedByUser.username}</span>
            ) : topic.createdBy ? (
               <span className="block text-gray-500 text-xs">por {getUserByUid(topic.createdBy)?.username || 'Usuário Desconhecido'} (Criador)</span>
            ) : null}
          </td>

          {/* Cell for Action Buttons */}
          <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium w-auto sm:w-64"> {/* Fixed width for actions on larger screens */}
            {/* Flex container for action buttons */}
            <div className="flex justify-end items-center space-x-1"> {/* Reduced space */}

              {/* --- Reorder Buttons (Up/Down) --- */}
              {/* Render only for non-root topics (level > 0) */}
              {level > 0 && (
                <>
                  {/* Move Up Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleReorderTopicClick(topic.id, 'up', e)}
                    disabled={!canMoveUp} // Disable if it's the first item
                    title="Mover para Cima"
                    className={`p-1 ${!canMoveUp ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded'}`}
                  >
                    <ArrowUpIcon size={16} />
                  </Button>

                  {/* Move Down Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleReorderTopicClick(topic.id, 'down', e)}
                    disabled={!canMoveDown} // Disable if it's the last item
                    title="Mover para Baixo"
                     className={`p-1 ${!canMoveDown ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded'}`}
                  >
                    <ArrowDownIcon size={16} />
                  </Button>
                 </>
              )}
              {/* --- End Reorder Buttons --- */}


              {/* Move Topic (Change Parent) Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleMoveTopicClick(topic.id, e)}
                title="Mover Tópico (mudar pai)"
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <ArrowRightLeftIcon size={16} />
              </Button>

              {/* Edit Topic Button (conditional) */}
              {onEditTopic && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditTopic(topic.id); }}
                  title="Editar Tópico"
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                >
                  <EditIcon size={16} />
                </Button>
              )}

              {/* Delete Topic Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteTopicClick(topic.id, e)}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded" // Added hover/rounding
                title="Excluir Tópico"
              >
                <TrashIcon size={16} />
              </Button>

              {/* Add Subtopic Button (conditional) */}
              {onAddTopic && (
                 <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddTopic(topic.id); }}
                  title="Adicionar Subtópico"
                  className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded" // Added hover/rounding
                >
                  <PlusIcon size={16} />
                </Button>
              )}
            </div>
          </td>
        </tr>

        {/* Recursive Rendering of Children */}
        {/* Render children only if the topic is expanded and has children */}
        {isExpanded && hasChildren && (
          // Map through the children (already sorted) and render them recursively
          // Pass the incremented level, the child's index, and the total number of children
          children.map((child, idx) => renderTopicItem(child, level + 1, idx, children.length))
        )}
      </React.Fragment>
    );
  }; // End of renderTopicItem function

  // --- Component Return (Main Table Structure) ---
  return (
    <div className="bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-200">
      {/* Header Section */}
      <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-xl leading-6 font-semibold text-gray-900">
          Gerenciar Tópicos
        </h3>
        {/* Button to add a root topic (conditional) */}
        {onAddTopic && (
          <Button
            variant="default" // Assuming a default style for primary actions
            size="sm"
            onClick={() => onAddTopic(null)} // Pass null parentId for root topic
            icon={<PlusIcon size={16} className="mr-1 -ml-0.5" />} // Icon before text
          >
            Novo Tópico Raiz
          </Button>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Head */}
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome do Tópico
              </th>
              {/* New Header for Last Updated */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Atualização
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-auto sm:w-64"> {/* Fixed width for actions on larger screens */}
                Ações
              </th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Render root topics or a message if none exist */}
            {rootTopics.length > 0 ? (
              // Map through root topics and render each item starting at level 0
              rootTopics.map((topic, index) => renderTopicItem(topic, 0, index, rootTopics.length))
            ) : (
              // Row displayed when there are no topics
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500"> {/* Increased padding and colspan */}
                  Nenhum tópico encontrado. Clique em "Novo Tópico Raiz" para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopicList;
