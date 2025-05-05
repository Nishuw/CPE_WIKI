import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Supondo que ContentContext forneça esses tipos e funções
import { useContent } from '../../context/ContentContext';
import { Topic, Content } from '../../types'; // Certifique-se que esses caminhos estão corretos
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, SearchIcon, XIcon, FileTextIcon } from 'lucide-react'; // Usando FileTextIcon

interface SidebarProps {
  currentTopicId?: string; // O ID do tópico atualmente selecionado
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentTopicId,
  isSidebarOpen,
  toggleSidebar,
}) => {
  // Hooks para estado e contexto
  const { topics, getChildTopics, getContentsByTopicId } = useContent();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Memoiza os tópicos raiz para evitar recálculo a cada renderização, a menos que as dependências mudem
  const rootTopics = useMemo(() => {
    return getChildTopics(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getChildTopics, topics]); // Depende da função e dos dados dos tópicos

  // --- Lógica de Expansão de Caminho ---
  // Função para expandir um tópico e todos os seus pais até a raiz
  const expandParentTopics = useCallback((topicId: string | undefined | null, allTopics: Topic[]) => {
    if (!topicId) return;
    setExpandedTopics(prev => {
      const newState = { ...prev };
      let currentTopic = allTopics.find(t => t.id === topicId);
      while (currentTopic) {
        newState[currentTopic.id] = true; // Marca como expandido
        if (!currentTopic.parent) break; // Para se for raiz
        currentTopic = allTopics.find(t => t.id === currentTopic.parent); // Move para cima
      }
      return newState;
    });
  }, []); // Função estável, sem dependências necessárias aqui dentro

  // Efeito para expandir o caminho baseado na URL atual
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    let targetTopicId: string | undefined = undefined;
    // Supondo estrutura de URL como /topics/:topicId/...
    if (pathSegments[0] === 'topics' && pathSegments[1]) {
       targetTopicId = pathSegments[1];
    }
    // Se um tópico é identificado na URL, expande seus pais
    if (targetTopicId) {
      expandParentTopics(targetTopicId, topics);
    }
    // Nota: Isso não recolhe automaticamente outros ramos.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, topics, expandParentTopics]); // Re-executa se localização, tópicos ou a função mudar

  // --- Lógica de Correspondência da Busca ---
  // Função para verificar se um tópico ou seus descendentes/conteúdo correspondem ao termo de busca
  const topicMatchesSearch = useCallback((topicId: string, term: string, allTopics: Topic[], getChildTopicsFn: Function, getContentsFn: Function): boolean => {
    if (!term) return true; // Se não há termo de busca, tudo "corresponde"

    const lowerCaseTerm = term.toLowerCase();
    const topic = allTopics.find(t => t.id === topicId);
    if (!topic) return false; // Tópico não encontrado

    // Verifica título do tópico
    if (topic.title.toLowerCase().includes(lowerCaseTerm)) {
        return true;
    }

    // Verifica títulos do conteúdo do tópico
    const contents = getContentsFn(topicId);
    if (contents.some((c: Content) => c.title.toLowerCase().includes(lowerCaseTerm))) {
        return true;
    }

    // Verifica filhos recursivamente
    const children = getChildTopicsFn(topicId);
    // Usa a mesma função recursivamente para os filhos
    return children.some((child: Topic) => topicMatchesSearch(child.id, term, allTopics, getChildTopicsFn, getContentsFn));

  // Dependências estáveis do contexto são assumidas, ou adicione-as se puderem mudar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* getChildTopics, getContentsByTopicId, topics */]);


  // --- Manipulador de Evento ---
  // Alterna o estado de expansão manual de um tópico
  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId], // Inverte o estado booleano
    }));
  };

  // --- Lógica de Renderização ---
  // Função Recursiva para renderizar a árvore de tópicos
  const renderTopics = (parentTopics: Topic[], level: number = 0): (JSX.Element | null)[] => {

    return parentTopics.map((topic) => {

      // *** PASSO DE FILTRAGEM DA BUSCA ***
      // Se estiver buscando e este tópico (e seus descendentes) não corresponderem, pule a renderização.
      if (searchTerm && !topicMatchesSearch(topic.id, searchTerm, topics, getChildTopics, getContentsByTopicId)) {
          return null; // Não renderiza este item ou seus filhos
      }

      // --- Se for renderizar, coleta os dados necessários ---
      const childTopics = getChildTopics(topic.id);
      const contents = getContentsByTopicId(topic.id);
      const isActiveTopic = topic.id === currentTopicId; // Este é o tópico principal selecionado?

      // Lógica do estado de expansão
      const isManuallyExpanded = !!expandedTopics[topic.id]; // Estado real da interação do usuário
      const isVisuallyExpanded = searchTerm || isManuallyExpanded; // Deve APARECER expandido (se buscando OU manualmente expandido)

      const hasSubTopics = childTopics.length > 0;

      // Filtra o conteúdo DIRETO DESTE tópico baseado no termo de busca
      const filteredContents = searchTerm
        ? contents.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : contents;

      const hasContentToShow = filteredContents.length > 0; // Este tópico tem conteúdo visível após filtrar?

      // Este tópico pode ser expandido? (Tem sub-tópicos OU conteúdo para mostrar?)
      // Nota: usar `contents.length` para o botão garante que ele apareça mesmo se o conteúdo for filtrado depois
      const canShowExpandButton = hasSubTopics || contents.length > 0;
      // O UL pode ser renderizado? (Tem subtópicos para renderizar OU conteúdo visível?)
      const canRenderUl = hasSubTopics || hasContentToShow;


      // --- Calcula o Padding baseado no nível da recursão ---
      const currentLevelPadding = 16 + level * 16;
      const nextLevelPadding = 16 + (level + 1) * 16;

      // --- Renderiza o Item da Lista ---
      return (
        <li key={topic.id} className="my-0.5">
          {/* Container para o link do tópico e botão de toggle */}
          <div
            className={`
              flex items-center justify-between py-1.5 px-2 text-sm rounded-md transition-colors group relative
              ${isActiveTopic ? "bg-blue-100 text-blue-900 font-semibold" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
            `}
             style={{ paddingLeft: `${currentLevelPadding}px` }}
          >
            {/* Link para a página do tópico */}
            <Link to={`/topics/${topic.id}`} className="flex items-center flex-grow min-w-0 mr-4" title={topic.title}>
                <FolderIcon size={18} className={`mr-2 flex-shrink-0 ${isActiveTopic ? 'text-blue-700' : 'text-blue-600 group-hover:text-blue-700'}`} />
                <span className="truncate">{topic.title}</span>
            </Link>

            {/* Botão de Toggle Expandir/Recolher (Chevron) */}
            {/* Mostra o botão se o tópico originalmente tinha filhos ou conteúdo */}
            {canShowExpandButton && (
                <button
                    onClick={(e) => { e.stopPropagation(); toggleTopic(topic.id); }} // Alterna estado ao clicar
                    className="p-0.5 rounded hover:bg-gray-200 absolute right-2 top-1/2 transform -translate-y-1/2"
                    aria-expanded={isVisuallyExpanded} // Reflete estado visual
                    aria-label={isVisuallyExpanded ? 'Recolher' : 'Expandir'}
                 >
                  {/* Mostra seta para baixo se visualmente expandido, seta para direita caso contrário */}
                  {isVisuallyExpanded
                    ? <ChevronDownIcon size={16} className="text-gray-500 group-hover:text-gray-700" />
                    : <ChevronRightIcon size={16} className="text-gray-500 group-hover:text-gray-700" />
                  }
                 </button>
            )}
          </div>

          {/* Renderiza Lista Aninhada (Sub-tópicos e Conteúdo) */}
          {/* Renderiza se pode ter filhos/conteúdo E está visualmente expandido */}
          {canRenderUl && isVisuallyExpanded && (
             <ul className="mt-0.5 space-y-0.5 pl-0"> {/* Indentação tratada pelos itens internos */}

                {/* Renderiza sub-tópicos recursivamente */}
                {hasSubTopics && renderTopics(childTopics, level + 1)}

                {/* Renderiza itens de conteúdo filtrados */}
                {hasContentToShow && (
                   <> {/* Fragmento para agrupar itens da lista */}
                    {filteredContents.map((content) => {
                        // Verifica se o path deste item de conteúdo específico está ativo
                        const isActiveContent = location.pathname.endsWith(`/content/${content.id}`);
                        const contentPadding = nextLevelPadding; // Usa padding do próximo nível

                        return (
                        <li key={content.id}>
                            <Link
                            to={`/topics/${topic.id}/content/${content.id}`} // Link para página de conteúdo
                            className={`
                                flex items-center py-1 px-2 text-sm rounded-md transition-colors group
                                ${isActiveContent ? "bg-green-100 text-green-900 font-medium" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}
                            `}
                            style={{ paddingLeft: `${contentPadding}px` }} // Aplica padding calculado
                            title={content.title}
                            >
                            {/* Ícone do item de conteúdo */}
                            <FileTextIcon size={16} className={`mr-2 flex-shrink-0 ${isActiveContent ? 'text-green-700' : 'text-gray-500 group-hover:text-gray-600'}`} />
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
      // Filtra resultados nulos do passo de filtragem da busca
    }).filter(Boolean);
  };

  // --- Retorno JSX do Componente ---
  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 w-72 h-screen bg-white border-r border-gray-200 shadow-sm
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}
      aria-label="Sidebar de Navegação"
    >
      {/* Seção do Cabeçalho */}
       <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
           <h2 className="text-lg font-semibold text-gray-800" id="sidebar-title">Navegação</h2>
            {/* Botão Fechar */}
            <button
                onClick={toggleSidebar}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Fechar sidebar"
            >
                <XIcon size={20} />
            </button>
       </div>

      {/* Seção do Input de Busca */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Atualiza estado do termo de busca
            className="w-full px-3 py-1.5 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Buscar tópicos e conteúdos"
          />
          {/* Ícone de Busca */}
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          {/* Botão Limpar Busca (aparece quando searchTerm não está vazio) */}
          {searchTerm && (
             <button
                onClick={() => setSearchTerm('')} // Limpa o termo de busca
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Limpar busca"
            >
                <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Seção da Árvore de Navegação Rolável */}
      <div className="flex-grow overflow-y-auto p-2 pb-4"> {/* Adicionado padding-bottom */}
        {/* Verifica se há tópicos disponíveis */}
        {topics.length > 0 ? (
          <ul className="space-y-0.5" aria-labelledby="sidebar-title">
             {/* Sempre começa a renderização a partir dos tópicos raiz */}
             {/* A função renderTopics trata a filtragem baseada no searchTerm */}
             {renderTopics(rootTopics)}
          </ul>
        ) : (
          // Exibe mensagem se não houver tópicos
          <p className="p-4 text-sm text-gray-500">Nenhum tópico disponível.</p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;