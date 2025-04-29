import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderIcon, 
  FileTextIcon, 
  UsersIcon,
  PlusIcon,
  UserCogIcon
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';

const AdminDashboard: React.FC = () => {
  const { topics, contents } = useContent();
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();

  // State variables for counts
  const [topicCount, setTopicCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AdminDashboard useEffect running.');
    console.log('isLoading:', isLoading);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('isAdmin:', isAdmin);

    let unsubscribeTopics: () => void;
    let unsubscribeContents: () => void;

    if (!isLoading && isAuthenticated && isAdmin) { // Changed from (!isLoading && isAuthenticated && isAdmin)
      console.log("AdminDashboard: User is authenticated and admin. Setting up listeners.");
      const fetchCounts = async () => {
        try {
          // Fetch user count (still using getDocs as real-time updates might not be critical here)
          const usersCollection = collection(db, 'users');
          const usersSnapshot = await getDocs(usersCollection);
          setUserCount(usersSnapshot.size);
          setError(null);
        } catch (err: any) {
          console.error("Error fetching user count from Firestore:", err);
           if (err.code === 'permission-denied') {
            setError('Permissão negada ao buscar usuários. Verifique se você está logado como administrador e as regras do Firestore.');
          } else {
            setError(err.message || 'Ocorreu um erro ao buscar os dados de usuários.');
          }
        }
      };

      // Set up real-time listener for topic count
      const topicsCollection = collection(db, 'topics');
      unsubscribeTopics = onSnapshot(topicsCollection, (snapshot) => {
        console.log('Topics snapshot received. Size:', snapshot.size);
        setTopicCount(snapshot.size);
      }, (err) => {
        console.error("Error listening to topics collection:", err);
        console.error("Error code:", err.code);
         if (err.code === 'permission-denied') {
           setError('Permissão negada ao ouvir tópicos. Verifique se você está logado como administrador e as regras do Firestore.');
         } else {
           setError(err.message || 'Ocorreu um erro ao carregar os tópicos em tempo real.');
         }
      });

      // Set up real-time listener for content count
      const contentCollection = collection(db, 'contents');
      unsubscribeContents = onSnapshot(contentCollection, (snapshot) => {
         console.log('Contents snapshot received. Size:', snapshot.size);
        setContentCount(snapshot.size);
      }, (err) => {
        console.error("Error listening to contents collection:", err);
        console.error("Error code:", err.code);
         if (err.code === 'permission-denied') {
           setError('Permissão negada ao ouvir conteúdos. Verifique se você está logado como administrador e as regras do Firestore.');
         } else {
           setError(err.message || 'Ocorreu um erro ao carregar os conteúdos em tempo real.');
         }
      });

      fetchCounts();
    } else if (!isLoading && (!isAuthenticated || !isAdmin)) {
       console.log('AdminDashboard: User not authenticated or not admin. Clearing counts.');
       // Clear counts and set error if not authenticated or not admin
       setTopicCount(0);
       setContentCount(0);
       setUserCount(0);
       if (!isAuthenticated) setError('Você precisa estar logado para ver o painel de administração.');
       else if (!isAdmin) setError('Você não tem permissão para acessar esta página.');
    } else if (isLoading) {
      console.log('AdminDashboard: Loading...');
    }

    // Cleanup listeners on component unmount
    return () => {
      console.log('AdminDashboard cleanup running.');
      if (unsubscribeTopics) {
        console.log('Unsubscribing from topics listener.');
        unsubscribeTopics();
      }
      if (unsubscribeContents) {
         console.log('Unsubscribing from contents listener.');
        unsubscribeContents();
      }
    };

  }, [isAuthenticated, isAdmin, isLoading]); // Dependencies include auth and loading states

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
        <p className="text-gray-600 mt-2">
         Bem-vindo de volta, {user?.username}! Gerencie sua plataforma CPE - WIKI aqui.
          </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FolderIcon size={24} className="text-blue-900" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{topicCount}</p>
              <p className="text-gray-600">Tópicos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-teal-100 p-3 rounded-full mr-4">
              <FileTextIcon size={24} className="text-teal-700" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{contentCount}</p>
              <p className="text-gray-600">Itens de conteúdo</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-gray-100 p-3 rounded-full mr-4">
              <UsersIcon size={24} className="text-gray-700" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{userCount}</p>
              <p className="text-gray-600">Usuários</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8"> 
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/topics">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start"
              icon={<FolderIcon size={18} />}
            >
              Manage Topics
            </Button>
          </Link>

          <Link to="/admin/topics/new">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start"
              icon={<PlusIcon size={18} />}
            >
              Create New Topic
            </Button>
          </Link>

          <Link to="/admin/users">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start"
              icon={<UserCogIcon size={18} />}
            >
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent activity - simplified for this demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Atividade Recente</h2>
        <div className="space-y-4">
          {contents.slice(0, 5).map(content => (
            <div key={content.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0">
              <FileTextIcon size={18} className="text-blue-900 mr-3 mt-1" />
              <div>
                <p className="font-medium text-gray-900">{content.title}</p>
                <p className="text-sm text-gray-500">
                  Atualizado {new Date(content.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}

          {contents.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
      {error && <div className="text-red-500">Erro: {error}</div>}
    </div>
  );
};

export default AdminDashboard;