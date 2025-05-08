import React from 'react';

// Adicionada a prop variant para customizar o botão de confirmação
interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string; // Adicionado título opcional
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string; // Texto customizável para o botão de confirmação
  cancelText?: string;  // Texto customizável para o botão de cancelamento
  variant?: 'danger' | 'primary' | 'default'; // Variante para o estilo do botão de confirmação
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary', // Default para primário se não especificado
}) => {
  if (!isOpen) return null;

  let confirmButtonClasses = 'px-4 py-2 text-white rounded focus:outline-none';
  switch (variant) {
    case 'danger':
      confirmButtonClasses += ' bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600';
      break;
    case 'primary':
      confirmButtonClasses += ' bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500';
      break;
    default: // 'default' or any other value
      confirmButtonClasses += ' bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500';
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 dark:bg-opacity-70">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
        {title && (
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">{title}</h3>
        )}
        <p className="text-gray-700 dark:text-gray-300 mb-6 text-center whitespace-pre-line">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={confirmButtonClasses}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
