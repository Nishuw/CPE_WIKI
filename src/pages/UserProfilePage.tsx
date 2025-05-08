import React from 'react';
import { Link } from 'react-router-dom'; // 1. Importe o Link
import { useAuth } from '../context/AuthContext';
import UserProfileForm from '../components/auth/UserProfileForm';
import { AlertTriangle, ArrowLeft } from 'lucide-react'; // 2. Importe o ícone ArrowLeft
import { useTheme } from '../context/ThemeContext'; // Import useTheme

// import Spinner from '../components/ui/Spinner'; // Opcional

const UserProfilePage: React.FC = () => {
  const { appUser, isLoading, isAuthenticated } = useAuth();
  const { theme } = useTheme(); // Use theme from context

  // Defina a rota do seu menu principal/dashboard aqui
  const mainMenuPath = '/'; // <-- AJUSTE AQUI para a rota correta (ex: '/dashboard')

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto">

        {/* 3. Adicione o Botão/Link de Voltar AQUI */}
        <div className="mb-6"> {/* Adiciona espaço abaixo do botão */}
          <Link
            to={mainMenuPath}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            <ArrowLeft className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            Voltar ao Menu Principal
          </Link>
        </div>

        {/* Restante do conteúdo da página */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <p className={`text-lg animate-pulse ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Carregando perfil...</p>
          </div>
        ) : !isAuthenticated || !appUser ? (
          <div className={`border-l-4 p-4 rounded-md shadow-sm ${theme === 'dark' ? 'bg-yellow-700 border-yellow-500' : 'bg-yellow-50 border-yellow-400'}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-500'}`} aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  Acesso Negado. Por favor, faça login para ver seu perfil.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 sm:p-8">
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Meu Perfil</h1>
              <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Gerencie suas informações e configurações de segurança.</p>
              <UserProfileForm user={appUser} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;