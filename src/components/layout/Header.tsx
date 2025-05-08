import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { LogOutIcon, MenuIcon, UserIcon, SunIcon, MoonIcon } from 'lucide-react'; // Import SunIcon, MoonIcon
import { useTheme } from '../../context/ThemeContext'; // Importar useTheme

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { isAuthenticated, logout, isAdmin, appUser, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Usar o contexto do tema
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // navigate('/login'); // Redirecionamento pode ser tratado pelo Route protection
  };

  return (
    <header className="bg-blue-900 text-white shadow-md dark:bg-gray-800"> {/* Adicionar dark:bg-gray-800 */}
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="mr-4 p-2 rounded-md hover:bg-blue-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-gray-600"
            aria-label="Alternar barra lateral"
          >
            <MenuIcon size={24} />
          </button>
          <Link to="/" className="text-2xl font-bold">CPE - WIKI</Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Botão de alternância de tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-blue-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-gray-600"
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
          </button>

          {isLoading ? (
              <div className="h-6 w-20 bg-blue-800 rounded animate-pulse"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link
                 to="/profile"
                 className="flex items-center text-sm font-medium text-white hover:text-blue-200 transition-colors"
              >
                 <UserIcon size={18} className="mr-1"/>
                {appUser?.username || appUser?.email || 'Meu Perfil'} 
              </Link>

              {isAdmin && (
                <Link 
                  to="/admin"
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-700 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Painel Admin
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                icon={<LogOutIcon size={16} />}
                className="text-white hover:bg-blue-800 dark:hover:bg-gray-700"
              >
                Sair
              </Button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-full hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl dark:from-gray-700 dark:to-gray-900 dark:hover:from-gray-600 dark:hover:to-gray-800"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
