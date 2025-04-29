import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm'; // Importa o novo componente unificado
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth(); // Pega isLoading e isAdmin

  // Se ainda está carregando a verificação inicial de autenticação, mostra um loading
  // Isso previne o redirecionamento prematuro ou o piscar da tela de login
   if (isLoading) {
    return (
       <div className="min-h-screen bg-gradient-to-br from-blue-900 to-teal-800 flex justify-center items-center">
         {/* Você precisará criar ou importar um componente Spinner */}
         <div className="text-white text-xl">Carregando...</div>
         {/* <Spinner size="large" /> */}
       </div>
     );
  }


  // Se já está autenticado após o carregamento inicial, redireciona
  // Redireciona para /admin se for admin, senão para / (homepage)
  if (isAuthenticated) {
     // O usuário está logado, decide para onde redirecionar
     const redirectPath = isAdmin ? '/admin' : '/'; // Admin vai para dashboard, usuário normal para home
     console.log(`Usuário autenticado. isAdmin: ${isAdmin}. Redirecionando para ${redirectPath}`);
     return <Navigate to={redirectPath} replace />;
   }

  // Se não está carregando e não está autenticado, mostra o formulário
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex justify-center items-center p-4">
       {/* Renderiza o formulário que agora contém a lógica de alternar modo */}
      <AuthForm />
    </div>
  );
};

export default LoginPage;
