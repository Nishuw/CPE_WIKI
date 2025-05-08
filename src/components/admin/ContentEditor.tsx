import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { SaveIcon, Image as ImageIcon, X } from 'lucide-react';
import { storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';

interface ContentEditorProps {
  contentId?: string;
  topicId: string;
  onSuccess?: () => void;
}

interface UploadedImage {
  localId: string;
  name: string;
  file?: File;
  blobUrl?: string;
  firebaseUrl?: string;
  firebasePath?: string;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  contentId,
  topicId,
  onSuccess
}) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  
  const [pendingImages, setPendingImages] = useState<Map<string, File>>(new Map());
  const [currentSessionImages, setCurrentSessionImages] = useState<UploadedImage[]>([]);

  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, isLoading: authIsLoading, isAuthenticated } = useAuth();
  const [initialImagePathsInContent, setInitialImagePathsInContent] = useState<Set<string>>(new Set());
  
  const { 
    addContent, 
    updateContent, 
    getContentById,
    isLoading: contentIsLoading,
  } = useContent();
  
  const isEditing = !!contentId;

  const extractImagePathsFromHtml = useCallback((htmlString: string): Set<string> => {
    const paths = new Set<string>();
    const imgRegex = /<img[^>]+data-img-path=["']([^"']+)["'][^>]*>/g;
    let match;
    while ((match = imgRegex.exec(htmlString)) !== null) {
      paths.add(match[1]);
    }
    return paths;
  }, []);
  
  useEffect(() => {
    if (isEditing && contentId) {
      const content = getContentById(contentId);
      if (content) {
        setTitle(content.title);
        setBody(content.body);
        setInitialImagePathsInContent(extractImagePathsFromHtml(content.body));
        
        const existingImages: UploadedImage[] = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(content.body, 'text/html');
        doc.querySelectorAll('img[data-img-path]').forEach(img => {
          const firebaseUrl = img.getAttribute('src');
          const firebasePath = img.getAttribute('data-img-path');
          const alt = img.getAttribute('alt') || 'Imagem carregada';
          if (firebaseUrl && firebasePath) {
            existingImages.push({
              localId: `firebase-${firebasePath.replace(/[^a-zA-Z0-9]/g, '')}`,
              name: alt,
              firebaseUrl,
              firebasePath,
            });
          }
        });
        setCurrentSessionImages(existingImages);
      }
    } else {
      setTitle("");
      setBody("");
      setInitialImagePathsInContent(new Set());
      setCurrentSessionImages([]);
      setPendingImages(new Map());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, getContentById, isEditing, extractImagePathsFromHtml]);

  useEffect(() => {
    return () => {
      currentSessionImages.forEach(img => {
        if (img.blobUrl) {
          URL.revokeObjectURL(img.blobUrl);
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFileToFirebase = async (file: File, localId: string): Promise<{ downloadURL: string; filePath: string }> => {
    if (!user) throw new Error('Usuário não autenticado.');
    const filePath = `content_images/${user.uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [localId]: progress }));
        },
        (error) => {
          console.error(`Falha no upload da imagem ${localId}:`, error);
          setUploadProgress(prev => ({ ...prev, [localId]: -1 }));
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadProgress(prev => ({ ...prev, [localId]: 100 }));
            resolve({ downloadURL, filePath });
          } catch (e) {
            console.error(`Erro ao obter URL de download para ${localId}:`, e);
            reject(e);
          }
        }
      );
    });
  };

  const addLocalImageToEditor = (file: File) => {
    const localId = `local-img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const blobUrl = URL.createObjectURL(file);
    setPendingImages(prev => new Map(prev).set(localId, file));
    const newImage: UploadedImage = { localId, name: file.name, file, blobUrl };
    setCurrentSessionImages(prev => [...prev, newImage]);
    const imgTag = `<img src="${blobUrl}" alt="${file.name || 'Imagem local'}" data-local-id="${localId}" />`;
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = body.substring(0, cursorPos);
      const textAfter = body.substring(cursorPos);
      setBody(textBefore + imgTag + textAfter);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos + imgTag.length, cursorPos + imgTag.length);
      }, 0);
    } else {
        setBody(prevBody => prevBody + imgTag);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!textareaRef.current || !e.clipboardData || !isAuthenticated) return;
      const items = e.clipboardData.items;
      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageFile = items[i].getAsFile();
          break;
        }
      }
      if (imageFile) {
        e.preventDefault();
        addLocalImageToEditor(imageFile);
      }
    };
    const textareaElement = textareaRef.current;
    if (textareaElement && isAuthenticated) {
      textareaElement.addEventListener('paste', handlePaste);
      return () => textareaElement.removeEventListener('paste', handlePaste);
    }
    return () => {};
  }, [isAuthenticated, body, addLocalImageToEditor]); // Adicionado addLocalImageToEditor às dependências

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !isAuthenticated) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        addLocalImageToEditor(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertGalleryImage = (image: UploadedImage) => {
    if (!textareaRef.current) return;
    textareaRef.current.focus();
    let imgTag: string;
    if (image.blobUrl && image.localId) {
      imgTag = `<img src="${image.blobUrl}" alt="${image.name}" data-local-id="${image.localId}" />`;
    } else if (image.firebaseUrl && image.firebasePath) {
      imgTag = `<img src="${image.firebaseUrl}" alt="${image.name}" data-img-path="${image.firebasePath}" />`;
    } else {
      return;
    }
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const currentTextValue = textarea.value;
    const textBefore = currentTextValue.substring(0, cursorPos);
    const textAfter = currentTextValue.substring(cursorPos);
    setBody(textBefore + imgTag + textAfter);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + imgTag.length, cursorPos + imgTag.length);
    }, 0);
  };

  const removeImageFromSession = (localIdToRemove: string) => {
    const imageToRemove = currentSessionImages.find(img => img.localId === localIdToRemove);
    if (imageToRemove) {
      if (imageToRemove.blobUrl) {
        URL.revokeObjectURL(imageToRemove.blobUrl);
        setPendingImages(prev => {
          const newMap = new Map(prev);
          newMap.delete(localIdToRemove);
          return newMap;
        });
      }
      setCurrentSessionImages(prev => prev.filter(img => img.localId !== localIdToRemove));
      if (imageToRemove.blobUrl) {
          setBody(prevBody => prevBody.replace(new RegExp(`<img[^>]*data-local-id=["']${localIdToRemove}["'][^>]*>`, 'g'), ''));
      } else if (imageToRemove.firebasePath) {
          setBody(prevBody => prevBody.replace(new RegExp(`<img[^>]*data-img-path=["']${imageToRemove.firebasePath}["'][^>]*>`, 'g'), ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('O título é obrigatório'); return; }
    if (!user || !isAuthenticated) { setError('Você precisa estar logado para salvar.'); return; }
    if (isUploadingGlobal) { setError('Upload de imagens em progresso. Aguarde.'); return; }

    setIsUploadingGlobal(true);
    setUploadProgress({});

    let currentBodyHtml = body;
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentBodyHtml, 'text/html');
    const imgElements = Array.from(doc.querySelectorAll('img[data-local-id]'));
    const updatedSessionImages = [...currentSessionImages];

    try {
      const uploadPromises: Promise<void>[] = [];
      for (const imgElement of imgElements) {
        const localId = imgElement.getAttribute('data-local-id');
        if (!localId) continue;
        const imageFile = pendingImages.get(localId);
        if (imageFile) {
          uploadPromises.push(
            uploadFileToFirebase(imageFile, localId).then(({ downloadURL, filePath }) => {
              imgElement.setAttribute('src', downloadURL);
              imgElement.setAttribute('data-img-path', filePath);
              imgElement.removeAttribute('data-local-id');
              const imgIndex = updatedSessionImages.findIndex(img => img.localId === localId);
              if (imgIndex > -1) {
                if(updatedSessionImages[imgIndex].blobUrl) {
                    URL.revokeObjectURL(updatedSessionImages[imgIndex].blobUrl!); 
                }
                updatedSessionImages[imgIndex] = {
                  ...updatedSessionImages[imgIndex],
                  firebaseUrl: downloadURL,
                  firebasePath: filePath,
                  file: undefined,
                  blobUrl: undefined,
                };
              }
              pendingImages.delete(localId);
            }).catch(uploadError => {
                console.error(`Erro no upload para ${localId}:`, uploadError);
                setError(prev => prev + ` Falha no upload de ${imageFile.name}.`);
            })
          );
        }
      }
      await Promise.all(uploadPromises);
      currentBodyHtml = doc.body.innerHTML;
      const finalImagePathsInBody = extractImagePathsFromHtml(currentBodyHtml);
      const pathsToDelete = new Set<string>();
      if (isEditing) {
        initialImagePathsInContent.forEach(initialPath => {
          if (!finalImagePathsInBody.has(initialPath)) {
            pathsToDelete.add(initialPath);
          }
        });
      }
      for (const path of pathsToDelete) {
        try {
          const imageRef = ref(storage, path);
          await deleteObject(imageRef);
          console.log(`Imagem deletada do Storage: ${path}`);
        } catch (deleteError: any) {
          console.error(`Falha ao deletar imagem ${path} do Storage:`, deleteError);
          setError(prev => prev + ` Aviso: Falha ao deletar imagem antiga ${path}.`);
        }
      }
      if (isEditing && contentId) {
        await updateContent(contentId, title, currentBodyHtml);
      } else {
        await addContent(topicId, title, currentBodyHtml);
      }
      setBody(currentBodyHtml);
      setInitialImagePathsInContent(finalImagePathsInBody);
      setCurrentSessionImages(updatedSessionImages.filter(img => img.firebasePath && finalImagePathsInBody.has(img.firebasePath) || img.blobUrl));
      setPendingImages(new Map());
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Erro durante o handleSubmit:", err);
      setError(`Falha ao salvar conteúdo: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsUploadingGlobal(false);
    }
  };

  if (authIsLoading || (isEditing && contentIsLoading && !getContentById(contentId!))) {
      return <p>Carregando editor...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {isEditing ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}
      </h2>
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md whitespace-pre-wrap">{error}</div>}
      
      {isUploadingGlobal && <p className="text-sm text-blue-600">Salvando e processando imagens...</p>}
      {Object.entries(uploadProgress).map(([localId, progress]) => {
        const image = currentSessionImages.find(img => img.localId === localId);
        if (image && progress >= 0 && progress < 100) {
          return <div key={localId} className="text-xs text-gray-600">Enviando {image.name || localId}: {progress.toFixed(0)}%</div>;
        }
        if (image && progress === -1) {
            return <div key={localId} className="text-xs text-red-600">Erro ao enviar {image.name || localId}</div>;
        }
        return null;
      })}

      <Input id="content-title" label="Título do Conteúdo" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Insira o título do conteúdo" disabled={!isAuthenticated || isUploadingGlobal} />
      
      <div className="mb-4">
        <label htmlFor="content-body" className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
        <div className="border border-gray-300 rounded-md">
          <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-2 items-center">
            <button type="button" className="p-1 rounded hover:bg-gray-200 disabled:opacity-50" onClick={() => setBody(b => b + "<h2>Título</h2>")} disabled={!isAuthenticated || isUploadingGlobal}>Título H2</button>
            <button type="button" className="p-1 rounded hover:bg-gray-200 disabled:opacity-50" onClick={() => setBody(b => b + "<p>Parágrafo</p>")} disabled={!isAuthenticated || isUploadingGlobal}>Parágrafo</button>
            <button type="button" className="p-1 rounded hover:bg-gray-200 disabled:opacity-50" onClick={() => setBody(b => b + "<strong>Negrito</strong>")} disabled={!isAuthenticated || isUploadingGlobal}>Negrito</button>
            <button type="button" className="p-1 rounded hover:bg-gray-200 disabled:opacity-50" onClick={() => setBody(b => b + "<em>Itálico</em>")} disabled={!isAuthenticated || isUploadingGlobal}>Itálico</button>
            <button type="button" className="p-1 rounded hover:bg-gray-200 disabled:opacity-50" onClick={() => setBody(b => b + '<a href="">Link</a>')} disabled={!isAuthenticated || isUploadingGlobal}>Link/Url</button>
            <button type="button" className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center" onClick={() => fileInputRef.current?.click()} disabled={!isAuthenticated || isUploadingGlobal}><ImageIcon size={16} className="inline mr-1" />Carregar Imagem</button>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} accept="image/*" multiple className="hidden" disabled={!isAuthenticated || isUploadingGlobal} />
          </div>
          <textarea id="content-body" ref={textareaRef} className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none min-h-[200px]" rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder={isAuthenticated ? "Insira o conteúdo aqui. Cole imagens (Ctrl+V) ou use 'Carregar Imagem'." : "Faça login para adicionar conteúdo."} disabled={!isAuthenticated || isUploadingGlobal} />
        </div>
      </div>

      {currentSessionImages.length > 0 && (
        <div className="mb-4">
          <h3 className="block text-sm font-medium text-gray-700 mb-2">Galeria de Imagens da Sessão</h3>
          <div className="flex flex-wrap gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
            {currentSessionImages.map((img) => {
              const progress = uploadProgress[img.localId];
              const displayUrl = img.blobUrl || img.firebaseUrl;
              if (!displayUrl) return null;

              return (
              <div key={img.localId} className="relative group w-24 h-24">
                {progress > 0 && progress < 100 && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xs z-10 rounded-md">{progress.toFixed(0)}%</div>}
                {progress === -1 && <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-70 text-white text-xs z-10 rounded-md">Erro!</div>}
                
                <div className="w-full h-full border border-gray-300 rounded-md overflow-hidden bg-white">
                  <img src={displayUrl} alt={img.name} className={`w-full h-full object-cover ${progress > 0 && progress < 100 && progress !== -1 ? 'opacity-50' : ''}`} />
                </div>
                
                {((typeof progress === 'undefined' && img.blobUrl) || progress === 100 || progress === -1 || (!img.file && img.firebaseUrl) ) && !isUploadingGlobal && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-md">
                    <button type="button" className="p-1 bg-white rounded-full mx-1 shadow-md hover:bg-gray-100" title="Inserir imagem no editor" onClick={() => insertGalleryImage(img)}><ImageIcon size={16} /></button>
                    <button type="button" className="p-1 bg-white text-red-600 rounded-full mx-1 shadow-md hover:bg-gray-100" title="Remover da galeria (e do editor se presente)" onClick={() => removeImageFromSession(img.localId)}><X size={16} /></button>
                  </div>
                )}
              </div>
            );})}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="block text-sm font-medium text-gray-700 mb-1">Pré-visualização</h3>
        <div 
          className="border border-gray-300 rounded-md p-4 prose max-w-none bg-white min-h-[100px] whitespace-pre-line" 
          dangerouslySetInnerHTML={{ __html: body }} 
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit" variant="primary" icon={<SaveIcon size={16} />} disabled={!isAuthenticated || isUploadingGlobal || contentIsLoading}>
          {isEditing ? 'Salvar Alterações' : 'Criar Conteúdo'}
        </Button>
      </div>
    </form>
  );
};

export default ContentEditor;
