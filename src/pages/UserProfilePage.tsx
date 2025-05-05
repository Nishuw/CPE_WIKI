import React from 'react';
import { Link } from 'react-router-dom'; // 1. Importe o Link
import { useAuth } from '../context/AuthContext';
import UserProfileForm from '../components/auth/UserProfileForm';
import { AlertTriangle, ArrowLeft } from 'lucide-react'; // 2. Importe o ícone ArrowLeft

// import Spinner from '../components/ui/Spinner'; // Opcional

const UserProfilePage: React.FC = () => {
  const { appUser, isLoading, isAuthenticated } = useAuth();

  // Defina a rota do seu menu principal/dashboard aqui
  const mainMenuPath = '/'; // <-- AJUSTE AQUI para a rota correta (ex: '/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">

        {/* 3. Adicione o Botão/Link de Voltar AQUI */}
        <div className="mb-6"> {/* Adiciona espaço abaixo do botão */}
          <Link
            to={mainMenuPath}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="w-5 h-5 mr-2 text-gray-500" />
            Voltar ao Menu Principal
          </Link>
        </div>

        {/* Restante do conteúdo da página */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <p className="text-lg text-gray-600 animate-pulse">Carregando perfil...</p>
          </div>
        ) : !isAuthenticated || !appUser ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Acesso Negado. Por favor, faça login para ver seu perfil.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
              <p className="text-sm text-gray-500 mb-8">Gerencie suas informações e configurações de segurança.</p>
              <UserProfileForm user={appUser} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;