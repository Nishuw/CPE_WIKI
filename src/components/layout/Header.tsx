import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { LogOutIcon, MenuIcon, UserIcon } from 'lucide-react'; // Import UserIcon

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  // Get isAdmin state and appUser from the context
  const { isAuthenticated, logout, isAdmin, appUser, isLoading } = useAuth(); // Get appUser and isLoading
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // navigate('/login'); // Redirecionamento pode ser tratado pelo Route protection
  };

  return (
    <header className="bg-blue-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          {/* Sidebar toggle button */}
          <button 
            onClick={toggleSidebar}
            className="mr-4 p-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700"            
            aria-label="Alternar barra lateral"
          >
            <MenuIcon size={24} />
          </button>
          <Link to="/" className="text-2xl font-bold">CPE - WIKI</Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Show loading state or user info/login link */}
          {isLoading ? (
              <div className="h-6 w-20 bg-blue-800 rounded animate-pulse"></div> // Placeholder loading
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/* Link to User Profile */}
              <Link
                 to="/profile"
                 className="flex items-center text-sm font-medium text-white hover:text-blue-200 transition-colors"
              >
                {/* Display username or default text */}
                 <UserIcon size={18} className="mr-1"/>
                {appUser?.username || appUser?.email || 'Meu Perfil'} 
              </Link>

              {/* Conditionally render Admin link based on isAdmin state */}
              {isAdmin && (
                <Link 
                  to="/admin"
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Painel Admin
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                icon={<LogOutIcon size={16} />}
                className="text-white hover:bg-blue-800"
              >
                Sair
              </Button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-full hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl"
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
