import React, { useState, useEffect, useRef } from 'react';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { SaveIcon, Upload, Image as ImageIcon, X } from 'lucide-react';

interface ContentEditorProps {
  contentId?: string;
  topicId: string;
  onSuccess?: () => void;
}

interface UploadedImage {
  id: string;
  url: string;
  file: File;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  contentId,
  topicId,
  onSuccess
}) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Handler para colar imagens da área de transferência
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!textareaRef.current || !e.clipboardData) return;
      
      const items = e.clipboardData.items;
      let hasImage = false;
      
      // Primeiro verificamos se tem alguma imagem nos itens colados
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          hasImage = true;
          break;
        }
      }
      
      // Se não tem imagem, apenas deixa o comportamento padrão acontecer
      if (!hasImage) return;
      
      // Se chegou aqui, temos pelo menos uma imagem
      // Salvamos o estado atual do textarea antes de qualquer manipulação
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const currentContent = body;
      const textBefore = currentContent.substring(0, cursorPos);
      const textAfter = currentContent.substring(cursorPos);
      
      // Agora processamos as imagens
      e.preventDefault(); // Previne o comportamento padrão de colar
      
      // Processamos cada item que é uma imagem
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            try {
              setIsUploading(true);
              
              // Cria URL para o arquivo
              const imageUrl = URL.createObjectURL(file);
              const imageId = `img-${Date.now()}-${i}`; // Adicionamos índice para evitar colisões
              
              const newImage = {
                id: imageId,
                url: imageUrl,
                file: file
              };
              
              // Adiciona à galeria de imagens
              setUploadedImages(prev => [...prev, newImage]);
              
              // Cria tag de imagem
              const imgTag = `<img src="${imageUrl}" alt="Imagem colada" data-img-id="${imageId}" />`;
              
              // IMPORTANTE: Inserimos a imagem preservando o texto existente
              // Atualizamos diretamente o estado usando a função updater para garantir o estado mais recente
              setBody(prevBody => {
                // Recalcular as posições caso o conteúdo tenha mudado
                const updatedCursorPos = textarea.selectionStart;
                const updatedBefore = prevBody.substring(0, updatedCursorPos);
                const updatedAfter = prevBody.substring(updatedCursorPos);
                
                return updatedBefore + imgTag + updatedAfter;
              });
              
              // Reposicionamos o cursor após a imagem
              setTimeout(() => {
                textarea.focus();
                const imgTagLength = imgTag.length;
                const newCursorPosition = cursorPos + imgTagLength;
                textarea.setSelectionRange(newCursorPosition, newCursorPosition);
              }, 10);
              
            } catch (error) {
              console.error('Erro ao processar imagem colada:', error);
              setError('Falha ao processar imagem colada');
            } finally {
              setIsUploading(false);
            }
          }
        }
      }
    };

    // Adicionamos o evento ao textarea especificamente, não ao documento inteiro
    const textareaElement = textareaRef.current;
    if (textareaElement) {
      textareaElement.addEventListener('paste', handlePaste);
      
      return () => {
        textareaElement.removeEventListener('paste', handlePaste);
      };
    }
    
    // Fallback caso o textarea não esteja disponível
    return () => {};
  }, [body]); // Dependência importante: o body precisa estar aqui para sempre usar o valor mais recente

  // Função para lidar com o upload da imagem
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Simular o upload para um serviço (em produção, substituir por um upload real)
      // Por enquanto, apenas criamos uma URL local para o arquivo
      const imageUrl = URL.createObjectURL(file);
      const imageId = `img-${Date.now()}`;
      
      const newImage = {
        id: imageId,
        url: imageUrl,
        file: file
      };
      
      setUploadedImages(prev => [...prev, newImage]);
      
      // Se o textarea estiver focado, insere a imagem na posição do cursor
      if (document.activeElement === textareaRef.current) {
        // Verificação de segurança: salvamos o conteúdo atual para garantir que não será perdido
        const currentContent = textareaRef.current.value;
        console.log('Conteúdo atual antes de inserir imagem:', currentContent);
        
        insertImageAtCursor(imageId, imageUrl);
      }
      
      setIsUploading(false);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setError('Falha ao fazer upload da imagem');
      setIsUploading(false);
    }
  };

  // Função para inserir a imagem no texto na posição do cursor
  const insertImageAtCursor = (imageId: string, imageUrl: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBefore = body.substring(0, cursorPos);
    const textAfter = body.substring(cursorPos);
    
    // Cria tag de imagem com o ID para referência
    const imgTag = `<img src="${imageUrl}" alt="Imagem carregada" data-img-id="${imageId}" />`;
    
    // Importante: mantém o conteúdo existente e apenas insere a imagem na posição do cursor
    const newBody = textBefore + imgTag + textAfter;
    setBody(newBody);
    
    // Reposiciona o cursor após a imagem inserida
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = cursorPos + imgTag.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
    
    // Debug: verifica se o texto está sendo preservado corretamente
    console.log('Texto anterior à imagem:', textBefore);
    console.log('Texto posterior à imagem:', textAfter);
    console.log('Novo conteúdo completo:', newBody);
  };

  // Função para inserir uma imagem da galeria no ponto de seleção atual
  const insertGalleryImage = (imageId: string, imageUrl: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    textarea.focus();
    
    // Insere a imagem no ponto atual do cursor
    insertImageAtCursor(imageId, imageUrl);
  };

  // Função para remover uma imagem da galeria
  const removeImage = (imageId: string) => {
    // Remove da lista de imagens
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    
    // Remove todas as referências da imagem no conteúdo
    const updatedBody = body.replace(
      new RegExp(`<img[^>]*data-img-id="${imageId}"[^>]*>`, 'g'), 
      ''
    );
    
    setBody(updatedBody);
  };

  // Função para acionar o input de arquivo
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Função para processar o upload de arquivos selecionado
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
      await handleImageUpload(files[i]);
    }
    
    // Limpa o input para permitir o upload do mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para processar quebras de linha no texto para HTML
  const processLineBreaks = (text: string): string => {
    // Substitui todas as quebras de linha por tags <br>
    if (!text) return '';
    return text.split('\n').map(line => line.trim()).join('<br />');
  };

  // Função mais avançada para preservar quebras de linha mesmo com tags HTML
  const preserveLineBreaks = (htmlText: string): string => {
    // Se o texto está vazio, retorna vazio
    if (!htmlText.trim()) return '';
    
    // Se não houver quebras de linha, retorna o texto original
    if (!htmlText.includes('\n')) return htmlText;
    
    // Verifica se o texto contém tags HTML
    const hasHtml = /<[a-z][\s\S]*>/i.test(htmlText);
    
    if (!hasHtml) {
      // Texto puro sem HTML: simplesmente envolve em <p> e converte quebras de linha
      return `<p>${processLineBreaks(htmlText)}</p>`;
    } else {
      // Texto com HTML: precisamos preservar as tags e ainda assim manter as quebras de linha
      const segments = htmlText.split('\n');
      let result = '';
      let insideTag = false;
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        // Se for o último segmento, não adicione <br />
        if (i === segments.length - 1) {
          result += segment;
          continue;
        }
        
        // Conta as tags abertas e fechadas para determinar se estamos dentro de uma tag
        for (let j = 0; j < segment.length; j++) {
          if (segment[j] === '<') insideTag = true;
          else if (segment[j] === '>') insideTag = false;
        }
        
        // Adiciona <br /> apenas se não estivermos dentro de uma tag
        result += segment + (!insideTag ? '<br />' : '\n');
      }
      
      return result;
    }
  };

  // Processa todos os URLs de imagem antes de salvar
  const processImageUrls = async (contentHtml: string): Promise<string> => {
    // Em um sistema real, você precisaria fazer upload de todas as imagens para o servidor
    // e substituir os URLs temporários por URLs permanentes
    
    // Por enquanto, esta função apenas retorna o HTML como está
    // Em produção, você precisaria implementar o upload real das imagens
    return contentHtml;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }

    try {      
      // Processar o conteúdo para preservar quebras de linha, mesmo com tags HTML
      const processedBody = preserveLineBreaks(body);
      
      // Processamento das imagens (upload e substituição de URLs)
      const finalContent = await processImageUrls(processedBody);
      
      if (isEditing && contentId) {
        updateContent(contentId, title, finalContent);
      } else {
        addContent(topicId, title, finalContent);
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
    return preserveLineBreaks(body);
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
          Conteúdo
        </label>
        <div className="border border-gray-300 rounded-md">
          {/* Text editor toolbar */}
          <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-2">
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
              onClick={triggerFileInput}
            >
              <ImageIcon size={16} className="inline mr-1" />
              Carregar Imagem
            </button>
            
            {/* Input de arquivo oculto */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {/* Content textarea */}
          <textarea
            id="content-body"
            ref={textareaRef}
            className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}            
            placeholder="Insira o conteúdo. Pressione Enter para novas linhas. Cole imagens com Ctrl+V ou use o botão 'Carregar Imagem'."
          />
        </div>
        
        <div className="mt-1 text-xs text-gray-500 space-y-1">
          <p>
            Você pode usar tags HTML para formatação e também pressionar Enter para quebras de linha.
          </p>
          <p>
            <strong>Dica:</strong> Copie uma imagem (Ctrl+C) e cole diretamente aqui (Ctrl+V). As imagens serão inseridas na posição do cursor.
          </p>
        </div>
      </div>

      {/* Image gallery */}
      {uploadedImages.length > 0 && (
        <div className="mb-4">
          <h3 className="block text-sm font-medium text-gray-700 mb-2">Imagens Carregadas</h3>
          <div className="flex flex-wrap gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
            {uploadedImages.map((img) => (
              <div key={img.id} className="relative group">
                <div className="w-24 h-24 border border-gray-300 rounded-md overflow-hidden bg-white">
                  <img 
                    src={img.url} 
                    alt="Imagem carregada" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  {/* Botão para inserir imagem */}
                  <button
                    type="button"
                    className="p-1 bg-white rounded-full mx-1"
                    title="Inserir imagem"
                    onClick={() => insertGalleryImage(img.id, img.url)}
                  >
                    <ImageIcon size={16} />
                  </button>
                  
                  {/* Botão para remover imagem */}
                  <button
                    type="button"
                    className="p-1 bg-white rounded-full mx-1"
                    title="Remover imagem"
                    onClick={() => removeImage(img.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Clique em uma imagem para inseri-la na posição atual do cursor.
          </p>
        </div>
      )}

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
          disabled={isUploading}
        >
          {isEditing ? 'Salvar Alterações' : 'Criar Conteúdo'}
        </Button>
      </div>
    </form>
  );
};

export default ContentEditor;