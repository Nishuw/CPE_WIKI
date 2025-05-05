import React from 'react';
import { useAuth } from '../context/AuthContext';
import UserProfileForm from '../components/auth/UserProfileForm'; // Import UserProfileForm

const UserProfilePage: React.FC = () => {
  // Get appUser, isLoading, and isAuthenticated from useAuth
  const { appUser, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="text-center mt-8 text-gray-600">Carregando perfil...</div>; 
  }

  if (!isAuthenticated || !appUser) {
    // Redirect to login or show unauthorized message
    // You might want to use navigate here to redirect to login page
    return (
      <div className="text-center mt-8 text-red-600">
        Por favor, faça login para ver seu perfil.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h1>

      {/* Render UserProfileForm component here */}
      <UserProfileForm user={appUser} />

    </div>
  );
};

export default UserProfilePage;
