import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Ajuste o caminho se necessário
import { db } from '../../firebase'; // Importe a instância do Firestore (db)
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore'; // Importe doc e deleteDoc

// Interface para representar um usuário (do Firestore agora)
interface DisplayUser {
  uid: string;
  email: string;
  // Adicione outros campos que você armazenar no Firestore
}

const MASTER_EMAIL = 'admin@admin.com'; // Para filtrar na consulta

const UserManagementPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // console.log("UserManagementPage useEffect running..."); // Log para verificar se o componente está carregando
    const fetchUsersFromFirestore = async () => {
      setIsLoading(true);
      setError(null);

      if (!isAdmin) {
        setError("Acesso não autorizado.");
        setIsLoading(false);
        return; // Segurança extra, AdminRoute já protege
      }

      try {
        // 1. Referência à coleção 'users'
        const usersCollectionRef = collection(db, 'users');

        // Consulta para buscar todos os documentos na coleção 'users'
        const q = query(usersCollectionRef);

        // 3. Executar a consulta
        const querySnapshot = await getDocs(q);

        // 4. Mapear os resultados e filtrar o admin
        const fetchedUsers: DisplayUser[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as DisplayUser;
          // Filtra o admin master AQUI caso ele exista na coleção
          if (userData.email !== MASTER_EMAIL) {
             fetchedUsers.push({
               uid: doc.id, // Pega o ID do documento (que deve ser o UID)
               ...userData, // Pega os outros campos (email, etc.)
             });
          }
        });

        setUsers(fetchedUsers);
        // console.log(`Fetched ${fetchedUsers.length} users (excluding master admin).`); // Log após buscar usuários

      } catch (err: any) {
        console.error("Erro ao buscar usuários do Firestore:", err);
        if (err.code === 'permission-denied') {
             setError('Permissão negada. Verifique se você está logado como administrador e as regras do Firestore.');
        } else {
             setError(err.message || 'Ocorreu um erro ao buscar os usuários.');
        }
      } finally {
        setIsLoading(false);
        // console.log("fetchUsersFromFirestore finished."); // Log no final da função de fetch
      }
    };

    fetchUsersFromFirestore();

  }, [isAdmin]); // Re-executa se isAdmin mudar

  const handleDeleteUser = async (uid: string) => {
    // console.log(`Attempting to delete user with UID: ${uid}`); // Log no início
    if (!isAdmin) {
      // console.log("User is not admin, cannot delete."); // Log se não for admin
      alert("Acesso não autorizado para deletar usuários.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover o usuário com UID: ${uid} da lista? (Isso NÃO deleta o usuário do Firebase Auth)`)) {
      try {
        // console.log(`Confirmed deletion for UID: ${uid}. Deleting document from Firestore.`); // Log antes de deletar
        const userDocRef = doc(db, 'users', uid);
        await deleteDoc(userDocRef);

        // console.log(`Successfully deleted document for UID: ${uid} from Firestore.`); // Log após deletar com sucesso

        // Atualizar a lista localmente
        setUsers(users.filter(user => user.uid !== uid));
        // console.log(`Updated local user list.`); // Log após atualizar a lista

        alert(`Usuário com UID: ${uid} removido da lista.`);
      } catch (err: any) {
        console.error("Erro ao deletar usuário do Firestore:", err); // Log do erro
        alert(`Ocorreu um erro ao remover o usuário: ${err.message || 'Erro desconhecido'}`);
      }
    } else {
      // console.log(`Deletion cancelled for UID: ${uid}.`); // Log se cancelar
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando usuários...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Erro: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Gerenciamento de Usuários (Firestore)</h1>
       <p className="text-sm text-gray-600 mb-4">
         Lembrete: Esta lista reflete os usuários na coleção 'users' do Firestore. Novos usuários do Firebase Auth precisam ser adicionados manualmente aqui.
         Deletar daqui <strong>NÃO</strong> deleta o usuário do Firebase Auth.
       </p>
      {users.length === 0 ? (
        <p>Nenhum usuário encontrado na coleção 'users' do Firestore (ou apenas o usuário master).</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.uid} className="p-3 border rounded shadow-sm bg-white flex justify-between items-center">
              <div>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>UID:</strong> {user.uid}</p>
              </div>
              <button
                className="text-red-500 hover:text-red-700 text-sm font-semibold"
                onClick={() => handleDeleteUser(user.uid)}
              >
                Remover da lista
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Opcional: Adicionar um formulário aqui para o admin inserir UID/Email de novos usuários */}
    </div>
  );
};

export default UserManagementPage;
