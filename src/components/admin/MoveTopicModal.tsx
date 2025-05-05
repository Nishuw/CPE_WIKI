import React, { useState, useMemo, useEffect } from 'react';
import { useContent } from '../../context/ContentContext';
import { Topic } from '../../types';
import Button from '../ui/Button';
import { XIcon, CornerUpLeftIcon } from 'lucide-react';

interface MoveTopicModalProps {
  isOpen: boolean;
  topicIdToMove: string | null;
  onConfirmMove: (newParentId: string | null) => void;
  onCancelMove: () => void;
}

const MoveTopicModal: React.FC<MoveTopicModalProps> = ({
  isOpen,
  topicIdToMove,
  onConfirmMove,
  onCancelMove,
}) => {
  const { topics, getTopicById, getTopicDescendants } = useContent();
  const [selectedParentId, setSelectedParentId] = useState<string | null | undefined>(undefined); // undefined means no selection yet

  const topicToMove = topicIdToMove ? getTopicById(topicIdToMove) : null;

  // Reset selection when modal opens or topic changes
  useEffect(() => {
    if (isOpen) {
        // Set initial selected parent based on current topic's parent, if available
        setSelectedParentId(topicToMove?.parentId);
    } else {
        setSelectedParentId(undefined); // Reset on close
    }
  }, [isOpen, topicToMove]);

  // Memoize the list of possible parent topics
  const possibleParents = useMemo(() => {
    if (!topics || !topicIdToMove || !getTopicDescendants) return [];

    const descendants = getTopicDescendants(topicIdToMove);
    const descendantIds = new Set(descendants.map(t => t.id));
    descendantIds.add(topicIdToMove); // Cannot move to self

    // Filter out the topic itself and its descendants
    return topics.filter(topic => !descendantIds.has(topic.id));

  }, [topics, topicIdToMove, getTopicDescendants]);

  const handleConfirm = () => {
    if (selectedParentId !== undefined) {
      onConfirmMove(selectedParentId);
    }
  };

  const buildTopicOptions = (parentId: string | null, level: number = 0): JSX.Element[] => {
    return possibleParents
      .filter(topic => topic.parentId === parentId)
      .sort((a, b) => a.title.localeCompare(b.title))
      .flatMap(topic => [
        <option key={topic.id} value={topic.id} style={{ paddingLeft: `${level * 1.5}rem` }}>
          {topic.title}
        </option>,
        ...buildTopicOptions(topic.id, level + 1) // Recursively add children
      ]);
  };

  if (!isOpen || !topicToMove) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Mover Tópico: {topicToMove.title}</h2>
          <button onClick={onCancelMove} className="text-gray-500 hover:text-gray-800">
            <XIcon size={24} />
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="parentTopicSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar Novo Tópico Pai:
          </label>
          <select
            id="parentTopicSelect"
            value={selectedParentId === null ? '__ROOT__' : selectedParentId || ''} // Handle null (root) and undefined (initial)
            onChange={(e) => {
                const value = e.target.value;
                setSelectedParentId(value === '__ROOT__' ? null : value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          >
            <option value="__ROOT__" style={{ fontStyle: 'italic' }}>-- Nível Raiz --</option>
            {buildTopicOptions(null)} 
          </select>
          {selectedParentId === undefined && (
             <p className="text-xs text-red-600 mt-1">Por favor, selecione um destino.</p> // Simple validation indicator
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancelMove}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedParentId === undefined || selectedParentId === topicToMove.parentId} // Disable if no change or selection
            icon={<CornerUpLeftIcon size={16}/>} // Optional: Icon for move action
          >
            Mover Tópico
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoveTopicModal;