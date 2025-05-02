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
  const [title, setTitle] = useState("");
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

  // Função para processar quebras de linha no texto para HTML
  const processLineBreaks = (text: string): string => {
    // Substitui todas as quebras de linha por tags <br>
    return text.split('\n').map(line => line.trim()).join('<br />');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }

    try {      
      // Processar o conteúdo para preservar quebras de linha se o texto não contiver tags HTML
      let processedBody = body;
      if (!body.includes('<') && !body.includes('>')) {
        // Se o texto não contém tags HTML, processamos as quebras de linha
        processedBody = `<p>${processLineBreaks(body)}</p>`;
      }
      
      if (isEditing && contentId) {
        updateContent(contentId, title, processedBody);
      } else {
        addContent(topicId, title, processedBody);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Falha ao salvar o conteúdo');
    }
  };

  // Função para renderizar a prévia com as quebras de linha preservadas
  const renderPreview = () => {
    if (body.includes('<') && body.includes('>')) {
      return body; // Se já contém HTML, retorna como está
    } else {
      // Se é texto puro, substitui quebras de linha por <br>
      return `<p>${processLineBreaks(body)}</p>`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {isEditing ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}
      </h2>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <Input
        id="content-title"
        label="Título do Conteúdo"
        type="text"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Insira o título do conteúdo"
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
              onClick={() => setBody(body + "<h2>Heading</h2>")}
            >
              Título
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + "<p>Paragraph text</p>")}
            >
              Parágrafo
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + "<strong>Bold text</strong>")}
            >
              Negrito
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + "<em>Italic text</em>")}
            >
              Itálico
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + '<a href="https://example.com">Link</a>')}
            >
              Link/Url
            </button>
            <button 
              type="button" 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => setBody(body + '<img src="https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg" alt="Example image" />')}
            >
              Imagem
            </button>
            <p className="text-xs text-gray-500 ml-2 flex items-center">
              Dica: Pressione Enter para criar novas linhas no texto
            </p>
          </div>

          {/* Content textarea */}
          <textarea
            id="content-body"
            className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}            
            placeholder="Insira o conteúdo. Pressione Enter para novas linhas."
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Você pode usar tags HTML para formatação ou simplesmente pressionar Enter para quebras de linha.
        </p>
      </div>

      {/* Preview */}
      <div className="mb-4">        
        <h3 className="block text-sm font-medium text-gray-700 mb-1">Pré-visualização</h3>
        <div 
          className="border border-gray-300 rounded-md p-4 prose max-w-none bg-white"
          dangerouslySetInnerHTML={{ __html: renderPreview() }}
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          variant="primary"
          icon={<SaveIcon size={16} />}
        >
          {isEditing ? 'Salvar Alterações' : 'Criar Conteúdo'}
        </Button>
      </div>
    </form>
  );
};

export default ContentEditor;