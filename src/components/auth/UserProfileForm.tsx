import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppUser } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { UserIcon, MailIcon, LockIcon, SaveIcon, AlertCircleIcon } from 'lucide-react'; // Import icons
import { toast } from 'react-hot-toast';

interface UserProfileFormProps {
  user: AppUser; // The AppUser data from Firestore
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ user }) => {
  const { updateUsername, updateUserEmail, updateUserPassword, isLoading: authLoading, error: authError } = useAuth();

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Update form state when user prop changes (e.g., after initial load or update)
  useEffect(() => {
    setUsername(user.username);
    setEmail(user.email);
    // Don't reset password fields here
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSavingProfile(true);

    const newUsername = username.trim();
    const newEmail = email.trim();

    // Basic validation
    if (!newUsername) {
      setLocalError('Nome de usuário não pode ser vazio.');
      setIsSavingProfile(false);
      return;
    }
     if (!newEmail) {
        setLocalError('Email não pode ser vazio.');
        setIsSavingProfile(false);
        return;
    }

    let profileUpdated = false;

    // Update username if changed
    if (newUsername !== user.username) {
      try {
         await updateUsername(newUsername);
         profileUpdated = true;
      } catch (error) {
         // Error handled by toast and context, but catch to prevent stopping email update
          console.error("Error updating username:", error);
      }
    }

     // Update email if changed
    if (newEmail !== user.email) {
       try {
          await updateUserEmail(newEmail);
          profileUpdated = true;
       } catch (error) {
          // Error handled by toast and context
          console.error("Error updating email:", error);
       }
    }

    if (!profileUpdated) {
        toast.info('Nenhuma alteração de perfil para salvar.');
    }

    setIsSavingProfile(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSavingPassword(true);

    const newPassword = password.trim();

    // Basic validation
    if (!newPassword) {
      setLocalError('Por favor, insira a nova senha.');
      setIsSavingPassword(false);
      return;
    }
    if (newPassword.length < 6) {
         setLocalError('A nova senha deve ter pelo menos 6 caracteres.');
         setIsSavingPassword(false);
         return;
    }
    if (newPassword !== confirmPassword.trim()) {
      setLocalError('As senhas não conferem.');
      setIsSavingPassword(false);
      return;
    }

    try {
      await updateUserPassword(newPassword);
      setPassword(''); // Clear password fields on success
      setConfirmPassword('');
    } catch (error) {
      // Error handled by toast and context
       console.error("Error updating password:", error);
    }

    setIsSavingPassword(false);
  };

  // Use authError from context if no local error
  const displayError = localError || authError;

  return (
    <div className="space-y-8">
      {displayError && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200 flex items-center">
           <AlertCircleIcon size={18} className="mr-2 flex-shrink-0"/>
          <span>{displayError}</span>
        </div>
      )}

      {/* Profile Information Section */}
      <div className="bg-gray-50 p-6 rounded-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações do Perfil</h2>
        <form className="space-y-4" onSubmit={handleProfileSubmit}>
           <Input
              id="profile-username"
              label="Nome de Usuário"
              type="text"
              required
              placeholder="Seu nome para exibir"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              icon={<UserIcon className="w-5 h-5 text-gray-400" />} 
           />
            <Input
              id="profile-email"
              label="Email"
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              icon={<MailIcon className="w-5 h-5 text-gray-400" />} 
           />
            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingProfile}
              disabled={isSavingProfile || authLoading}
              icon={<SaveIcon size={18} />}
            >
              {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </form>
      </div>

      {/* Password Update Section */}
       <div className="bg-gray-50 p-6 rounded-md">
           <h2 className="text-xl font-semibold text-gray-800 mb-4">Atualizar Senha</h2>
            {authError && authError.includes('login novamente') && (
                 <div className="mb-4 p-3 text-sm text-blue-700 bg-blue-100 rounded-md border border-blue-200 flex items-center">
                     <AlertCircleIcon size={18} className="mr-2 flex-shrink-0"/>
                    <span>Para atualizar sua senha, por favor, faça login novamente.</span>
                 </div>
            )}
           <form className="space-y-4" onSubmit={handlePasswordSubmit}>
               <Input
                  id="current-password"
                  label="Nova Senha"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  icon={<LockIcon className="w-5 h-5 text-gray-400" />} 
               />
                <Input
                  id="confirm-password"
                  label="Confirmar Nova Senha"
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  icon={<LockIcon className="w-5 h-5 text-gray-400" />} 
               />
               <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSavingPassword}
                  disabled={isSavingPassword || authLoading || !password || password !== confirmPassword}
                  icon={<LockIcon size={18} />}
                >
                 {isSavingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
           </form>
       </div>
    </div>
  );
};

export default UserProfileForm;