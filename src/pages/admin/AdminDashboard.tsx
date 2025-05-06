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
  ClockIcon // Import ClockIcon
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
import { Topic, Content, User } from '../../types'; // Import types
import { format } from 'date-fns'; // Import format from date-fns
import { ptBR } from 'date-fns/locale'; // Import locale for Brazilian Portuguese

// Helper function to convert Firestore Timestamp or string/number date to Date object
// Consider moving this to a shared utils file if used elsewhere
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
  return null; // Return null if conversion fails
};

// Interface for combined activity items
interface ActivityItem {
  id: string;
  title: string;
  // Use a single date field for sorting, representing the event time
  eventAt: Date;
  // Type of the item (topic or content)
  itemType: 'topic' | 'content';
  // Type of the event (created or updated)
  eventType: 'created' | 'updated';
  link: string;
  // User who performed the event
  eventByUid: string;
  eventByUsername: string | null;
}

const AdminDashboard: React.FC = () => {
  // Use loading state from ContentContext as well, get getUserByUid
  const { topics, contents, users, loading: contentLoading, getUserByUid } = useContent();
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();

  // Combine loading states
  const isLoading = authLoading || contentLoading;

  // State variables for counts (can be derived from context lengths)
  const topicCount = topics.length;
  const contentCount = contents.length;
  // Assuming users are now loaded in ContentContext
  const userCount = users.length;

  // State for recent activity
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Process recent activity from context data
  useEffect(() => {
    // Only process if content is not loading and users are available (or not loading)
    // Ensure users are loaded before processing activity to get usernames
    if (!contentLoading && users.length > 0) {
      const combined: ActivityItem[] = [];

      // Process topics
      topics.forEach(topic => {
        const createdAtDate = convertToDate(topic.createdAt);
        const updatedAtDate = convertToDate(topic.updatedAt);

        // Add 'created' event
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

        // Add 'updated' event only if updatedAt is significantly different from createdAt
        // Using getTime() and a small threshold to account for potential tiny differences in timestamps
        if (updatedAtDate && createdAtDate && Math.abs(updatedAtDate.getTime() - createdAtDate.getTime()) > 1000) { // > 1 second difference
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
             // Handle case where only updatedAt exists (legacy data?) - treat as update
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

      // Process contents (similar logic)
      contents.forEach(content => {
        const createdAtDate = convertToDate(content.createdAt);
        const updatedAtDate = convertToDate(content.updatedAt);

         // Add 'created' event
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

        // Add 'updated' event only if updatedAt is significantly different from createdAt
         if (updatedAtDate && createdAtDate && Math.abs(updatedAtDate.getTime() - createdAtDate.getTime()) > 1000) { // > 1 second difference
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
             // Handle case where only updatedAt exists (legacy data?) - treat as update
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


      // Sort the combined activity by event time (most recent first)
      combined.sort((a, b) => b.eventAt.getTime() - a.eventAt.getTime());

      // Take the top 5 recent activities
      setRecentActivity(combined.slice(0, 5));

    } else if (!contentLoading && users.length === 0) {
        // Handle case where content is loaded but no users are found (might need a specific message)
        setRecentActivity([]); // Clear activity if no users to link
    }
  }, [topics, contents, users, contentLoading, getUserByUid]); // Add users and getUserByUid as dependencies

  const formatDateTime = useCallback((date: Date): string => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR }); // Use date-fns for consistent formatting
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
        {isAuthenticated && user && (
           <p className="text-gray-600 mt-2">
             Bem-vindo de volta, {user?.displayName || user?.email || 'Admin'}! Gerencie sua plataforma CPE - WIKI aqui.
           </p>
        )}
      </div>

      {/* Display error if any */}
      {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
              {error}
          </div>
      )}

      {/* Display loading or content based on auth/admin status */}
      {authLoading ? (
          <p>Carregando autenticação...</p>
      ) : !isAuthenticated || !isAdmin ? (
          <p className="text-red-600">Acesso não autorizado. Por favor, faça login com uma conta de administrador.</p>
      ) : ( isLoading ? (
             <p className="text-center text-gray-600">Carregando dados do painel...</p>
          ) : (
              <>
                  {/* Stats overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Topic Count */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                          <div className="flex items-center">
                              <div className="bg-blue-100 p-3 rounded-full mr-4 flex-shrink-0">
                                  <FolderIcon size={24} className="text-blue-900" />
                              </div>
                              <div>
                                  <p className="text-lg font-semibold text-gray-900 leading-none">{topicCount}</p>
                                  <p className="text-gray-600 text-sm">Tópicos</p>
                              </div>
                          </div>
                      </div>
                      {/* Content Count */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                          <div className="flex items-center">
                              <div className="bg-teal-100 p-3 rounded-full mr-4 flex-shrink-0">
                                  <FileTextIcon size={24} className="text-teal-700" />
                              </div>
                              <div>
                                  <p className="text-lg font-semibold text-gray-900 leading-none">{contentCount}</p>
                                  <p className="text-gray-600 text-sm">Itens de Conteúdo</p>
                              </div>
                          </div>
                      </div>
                      {/* User Count */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                          <div className="flex items-center">
                              <div className="bg-gray-100 p-3 rounded-full mr-4 flex-shrink-0">
                                  <UsersIcon size={24} className="text-gray-700" />
                              </div>
                              <div>
                                  <p className="text-lg font-semibold text-gray-900 leading-none">{userCount}</p>
                                  <p className="text-gray-600 text-sm">Usuários</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Quick actions and Recent Activity side-by-side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick actions */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8 lg:mb-0">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
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

                    {/* Recent Activity Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <ClockIcon size={20} className="mr-2 text-gray-700"/>
                            Atividade Recente
                        </h2>
                        {/* Use combined loading state */}
                        {isLoading ? (
                            <div className="space-y-3 animate-pulse">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ) : recentActivity.length > 0 ? (
                            <ul className="space-y-3">
                                {recentActivity.map(item => (
                                    <li key={`${item.itemType}-${item.id}-${item.eventType}`}>
                                        <Link
                                            to={item.link}
                                            className="flex items-start p-2 rounded-md hover:bg-gray-100 transition-colors duration-150"
                                        >
                                            {item.itemType === 'topic' ? (
                                                <FolderIcon size={18} className="text-blue-900 mr-2.5 mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <FileTextIcon size={18} className="text-green-700 mr-2.5 mt-0.5 flex-shrink-0" />
                                            )}
                                            <div className="flex-grow">
                                                <p className="text-sm font-medium text-gray-800 leading-tight truncate" title={item.title}>
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {item.eventType === 'created' ? 'Criado em:' : 'Atualizado em: '}
                                                    {formatDateTime(item.eventAt)} por {item.eventByUsername}
                                                </p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">Nenhuma atividade recente encontrada.</p>
                        )}
                    </div>
                  </div> {/* End Quick actions / Recent Activity grid */}
              </>
          )
      )}
    </div>
  );
};

export default AdminDashboard;
