import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  FolderIcon,
  FileTextIcon,
  UsersIcon,
  PlusIcon,
  UserCogIcon,
  ClockIcon,
  AlertTriangleIcon, // Adicionado
  SaveIcon // Adicionado
} from 'lucide-react';
import { Timestamp, doc, setDoc, getDoc, getFirestore } from 'firebase/firestore'; // Adicionado
import { app } from '../../firebase'; // Adicionado
import { Topic, Content, User } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const convertToDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  if (dateValue instanceof Date) {
    return dateValue;
  }
  try {
    const date = new Date(dateValue as string | number);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
};

interface ActivityItem {
  id: string;
  title: string;
  eventAt: Date;
  itemType: 'topic' | 'content';
  eventType: 'created' | 'updated';
  link: string;
  eventByUid: string;
  eventByUsername: string | null;
}

const AdminDashboard: React.FC = () => {
  const { topics, contents, users, loading: contentLoading, getUserByUid } = useContent();
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const isLoading = authLoading || contentLoading;
  const topicCount = topics.length;
  const contentCount = contents.length;
  const userCount = users.length;
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null); // Erro geral do painel

  // Estados para a mensagem da HomePage
  const [homePageMessage, setHomePageMessage] = useState('');
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null); // Erro específico da mensagem
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  const db = getFirestore(app);
  const messageDocRef = doc(db, 'configuracoesSite', 'mensagemHomePage');

  // Carregar mensagem existente
  useEffect(() => {
    const fetchMessage = async () => {
      setIsLoadingMessage(true);
      setMessageError(null);
      try {
        const docSnap = await getDoc(messageDocRef);
        if (docSnap.exists()) {
          setHomePageMessage(docSnap.data()?.alertaTexto || '');
        } else {
          setHomePageMessage('');
        }
      } catch (err) {
        console.error("Erro ao buscar mensagem da homepage:", err);
        setMessageError("Falha ao carregar a mensagem da homepage.");
      }
      finally {
        setIsLoadingMessage(false);
      }
    };

    if (isAdmin && isAuthenticated) { // Apenas busca se for admin autenticado
      fetchMessage();
    }
  }, [isAdmin, isAuthenticated]); // Adicionado isAuthenticated

  const handleSaveMessage = async () => {
    if (!isAdmin) {
      setMessageError("Apenas administradores podem salvar esta mensagem.");
      return;
    }
    setIsSavingMessage(true);
    setMessageError(null);
    setMessageSuccess(null);
    try {
      await setDoc(messageDocRef, { 
        alertaTexto: homePageMessage.trim(), 
        alertaAtivo: homePageMessage.trim() !== '' 
      });
      setMessageSuccess("Mensagem salva com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar mensagem da homepage:", err);
      setMessageError("Falha ao salvar a mensagem. Tente novamente.");
    }
    finally {
      setIsSavingMessage(false);
      setTimeout(() => setMessageSuccess(null), 3000);
    }
  };

  useEffect(() => {
    if (!contentLoading && users.length > 0) {
      const combined: ActivityItem[] = [];
      topics.forEach(topic => {
        const createdAtDate = convertToDate(topic.createdAt);
        const updatedAtDate = convertToDate(topic.updatedAt);
        if (createdAtDate) {
          const creator = getUserByUid(topic.createdBy);
          const createdByUsername = creator?.username || 'Desconhecido';
          combined.push({
            id: topic.id,
            title: topic.title,
            eventAt: createdAtDate,
            itemType: 'topic',
            eventType: 'created',
            link: `/admin/topics/${topic.id}`,
            eventByUid: topic.createdBy,
            eventByUsername: createdByUsername
          });
        }
        if (updatedAtDate && createdAtDate && Math.abs(updatedAtDate.getTime() - createdAtDate.getTime()) > 1000) {
           const updater = getUserByUid(topic.updatedBy);
           const updatedByUsername = updater?.username || 'Desconhecido';
          combined.push({
            id: topic.id,
            title: topic.title,
            eventAt: updatedAtDate,
            itemType: 'topic',
            eventType: 'updated',
            link: `/admin/topics/${topic.id}`,
            eventByUid: topic.updatedBy,
            eventByUsername: updatedByUsername
          });
        } else if (updatedAtDate && !createdAtDate) {
             const updater = getUserByUid(topic.updatedBy || topic.createdBy);
             const updatedByUsername = updater?.username || 'Desconhecido';
             combined.push({
                id: topic.id,
                title: topic.title,
                eventAt: updatedAtDate,
                itemType: 'topic',
                eventType: 'updated',
                link: `/admin/topics/${topic.id}`,
                eventByUid: topic.updatedBy || topic.createdBy,
                eventByUsername: updatedByUsername
            });
        }
      });
      contents.forEach(content => {
        const createdAtDate = convertToDate(content.createdAt);
        const updatedAtDate = convertToDate(content.updatedAt);
         if (createdAtDate) {
             const creator = getUserByUid(content.createdBy);
             const createdByUsername = creator?.username || 'Desconhecido';
             combined.push({
                 id: content.id,
                 title: content.title,
                 eventAt: createdAtDate,
                 itemType: 'content',
                 eventType: 'created',
                 link: `/admin/content/edit/${content.id}`,
                 eventByUid: content.createdBy,
                 eventByUsername: createdByUsername
             });
         }
         if (updatedAtDate && createdAtDate && Math.abs(updatedAtDate.getTime() - createdAtDate.getTime()) > 1000) {
            const updater = getUserByUid(content.updatedBy);
            const updatedByUsername = updater?.username || 'Desconhecido';
            combined.push({
                id: content.id,
                title: content.title,
                eventAt: updatedAtDate,
                itemType: 'content',
                eventType: 'updated',
                link: `/admin/content/edit/${content.id}`,
                eventByUid: content.updatedBy,
                eventByUsername: updatedByUsername
            });
        } else if (updatedAtDate && !createdAtDate) {
             const updater = getUserByUid(content.updatedBy || content.createdBy);
             const updatedByUsername = updater?.username || 'Desconhecido';
             combined.push({
                id: content.id,
                title: content.title,
                eventAt: updatedAtDate,
                itemType: 'content',
                eventType: 'updated',
                link: `/admin/content/edit/${content.id}`,
                eventByUid: content.updatedBy || content.createdBy,
                eventByUsername: updatedByUsername
            });
        }
      });
      combined.sort((a, b) => b.eventAt.getTime() - a.eventAt.getTime());
      setRecentActivity(combined.slice(0, 5));
    } else if (!contentLoading && users.length === 0) {
        setRecentActivity([]);
    }
  }, [topics, contents, users, contentLoading, getUserByUid]);

  const formatDateTime = useCallback((date: Date): string => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel de Administração</h1>
        {isAuthenticated && user && (
           <p className="text-gray-600 dark:text-gray-300 mt-2">
             Bem-vindo de volta, {user?.displayName || user?.email || 'Admin'}! Gerencie sua plataforma CPE - WIKI aqui.
           </p>
        )}
      </div>

      {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
              {error}
          </div>
      )}

      {authLoading ? (
          <p className="dark:text-gray-300">Carregando autenticação...</p>
      ) : !isAuthenticated || !isAdmin ? (
          <p className="text-red-600 dark:text-red-400">Acesso não autorizado. Por favor, faça login com uma conta de administrador.</p>
      ) : ( isLoading && isLoadingMessage ? (
             <p className="text-center text-gray-600 dark:text-gray-400">Carregando dados do painel...</p>
          ) : (
              <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* ... cards de contagem ... */}
                      <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
                          <div className="flex items-center">
                              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4 flex-shrink-0">
                                  <FolderIcon size={24} className="text-blue-900 dark:text-blue-300" />
                              </div>
                              <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none">{topicCount}</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm">Tópicos</p>
                              </div>
                          </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
                          <div className="flex items-center">
                              <div className="bg-teal-100 dark:bg-teal-900 p-3 rounded-full mr-4 flex-shrink-0">
                                  <FileTextIcon size={24} className="text-teal-700 dark:text-teal-300" />
                              </div>
                              <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none">{contentCount}</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm">Itens de Conteúdo</p>
                              </div>
                          </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
                          <div className="flex items-center">
                              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mr-4 flex-shrink-0">
                                  <UsersIcon size={24} className="text-gray-700 dark:text-gray-300" />
                              </div>
                              <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none">{userCount}</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm">Usuários</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Ajuste para colocar 3 cards na mesma linha em telas grandes, ou manter o layout original */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Ações Rápidas</h2>
                        <div className="flex flex-col space-y-4">
                            <Link to="/admin/topics" className="block">
                                <Button variant="outline" size="lg" className="w-full justify-start" icon={<FolderIcon size={18} />}>
                                    Gerenciar Tópicos
                                </Button>
                            </Link>
                            <Link to="/admin/topics/new" className="block">
                                <Button variant="outline" size="lg" className="w-full justify-start" icon={<PlusIcon size={18} />}>
                                    Criar Novo Tópico
                                </Button>
                            </Link>
                            <Link to="/admin/users" className="block">
                                <Button variant="outline" size="lg" className="w-full justify-start" icon={<UserCogIcon size={18} />}>
                                    Gerenciar Usuários
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                            <ClockIcon size={20} className="mr-2 text-gray-700 dark:text-gray-300"/>
                            Atividade Recente
                        </h2>
                        {contentLoading ? ( // Usar contentLoading para a lista de atividades
                            <div className="space-y-3 animate-pulse">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                ))}
                            </div>
                        ) : recentActivity.length > 0 ? (
                            <ul className="space-y-3">
                                {recentActivity.map(item => (
                                    <li key={`${item.itemType}-${item.id}-${item.eventType}`}>
                                        <Link
                                            to={item.link}
                                            className="flex items-start p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                                        >
                                            {item.itemType === 'topic' ? (
                                                <FolderIcon size={18} className="text-blue-900 dark:text-blue-400 mr-2.5 mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <FileTextIcon size={18} className="text-green-700 dark:text-green-400 mr-2.5 mt-0.5 flex-shrink-0" />
                                            )}
                                            <div className="flex-grow">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight truncate" title={item.title}>
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {item.eventType === 'created' ? 'Criado em:' : 'Atualizado em: '}
                                                    {formatDateTime(item.eventAt)} por {item.eventByUsername}
                                                </p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhuma atividade recente encontrada.</p>
                        )}
                    </div>

                    {/* Card para Gerenciar Mensagem da HomePage */}
                    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800 lg:col-span-1"> {/* Alterado para lg:col-span-1 para caber em 3 colunas */}
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                        <AlertTriangleIcon size={20} className="mr-2 text-yellow-600 dark:text-yellow-400"/>
                        Alerta HomePage
                      </h2>
                      {isLoadingMessage ? (
                        <p className="text-gray-500 dark:text-gray-400">Carregando mensagem...</p>
                      ) : (
                        <>
                          {messageError && (
                            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{messageError}</p>
                          )}
                          {messageSuccess && (
                            <p className="text-sm text-green-600 dark:text-green-400 mb-3">{messageSuccess}</p>
                          )}
                          <textarea
                            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            rows={3} // Reduzido rows
                            value={homePageMessage}
                            onChange={(e) => setHomePageMessage(e.target.value)}
                            placeholder="Mensagem de alerta..."
                            disabled={isSavingMessage || !isAdmin}
                          />
                          <Button
                            onClick={handleSaveMessage}
                            disabled={isSavingMessage || !isAdmin}
                            className="mt-3 w-full" // Ajustado para w-full
                            icon={<SaveIcon size={18} />}
                            size="sm" // Adicionado size sm
                          >
                            {isSavingMessage ? 'Salvando...' : 'Salvar'}
                          </Button>
                          {!homePageMessage.trim() && !isLoadingMessage && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                              Vazio para não exibir alerta.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
              </>
          )
      )}
    </div>
  );
};

export default AdminDashboard;
