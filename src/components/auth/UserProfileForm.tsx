import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppUser } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { UserIcon, MailIcon, LockIcon, SaveIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme

interface UserProfileFormProps {
  user: AppUser;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ user }) => {
  const { updateUsername, updateUserEmail, updateUserPassword, isLoading: authLoading, error: authError } = useAuth();
  const { theme } = useTheme(); // Use theme from context
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(user.username);
    setEmail(user.email);
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!username.trim()) { setLocalError('Nome de usuário não pode ser vazio.'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) { setLocalError('Por favor, insira um email válido.'); return; }

    setIsSavingProfile(true);
    const newUsername = username.trim();
    const newEmail = email.trim();
    let profileUpdated = false;
    let usernameChanged = newUsername !== user.username;
    let emailChanged = newEmail !== user.email;

    try {
      if (usernameChanged) {
        await updateUsername(newUsername);
        profileUpdated = true;
      }
      if (emailChanged) {
        await updateUserEmail(newEmail);
        profileUpdated = true;
      }
      if (!profileUpdated && (usernameChanged || emailChanged) && !authError) {
      } else if (!profileUpdated && !usernameChanged && !emailChanged && !authError) {
        toast.info('Nenhuma alteração de perfil detectada.');
      }

    } catch (error) {
      if (!authError) {
      }
    }
    finally { setIsSavingProfile(false); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!password) { setLocalError('Por favor, insira a nova senha.'); return; }
    if (password.length < 6) { setLocalError('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setLocalError('As senhas não conferem.'); return; }

    setIsSavingPassword(true);
    try {
      await updateUserPassword(password);
      setPassword(''); 
      setConfirmPassword('');
    } catch (error) {
    }
    finally { setIsSavingPassword(false); }
  };

  const displayError = localError || authError;

  const inputBaseClass = `block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm sm:text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-indigo-500 focus:border-indigo-500' : 'border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'}`;
  const labelClass = `block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;
  const iconClass = `h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`;
  const cardBaseClass = `border rounded-lg p-6 shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const cardTitleClass = `text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`;
  const errorTextClass = `text-xs flex items-center pt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`;
  const errorAlertBaseClass = `p-4 text-sm rounded-lg border flex items-center shadow-sm`;
  const errorAlertErrorClass = `${errorAlertBaseClass} ${theme === 'dark' ? 'text-red-300 bg-red-900 border-red-700' : 'text-red-700 bg-red-100 border-red-200'}`;
  const errorAlertInfoClass = `${errorAlertBaseClass} ${theme === 'dark' ? 'text-blue-300 bg-blue-900 border-blue-700' : 'text-blue-700 bg-blue-100 border-blue-200'}`;
  const errorAlertIconClass = `mr-3 flex-shrink-0`;

  return (
    <div className="space-y-8">
      {displayError && !displayError.includes('login novamente') && (
        <div className={errorAlertErrorClass}>
           <AlertCircleIcon size={20} className={`${errorAlertIconClass} ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}/>
           <span>{displayError}</span>
        </div>
      )}

      <div className={cardBaseClass}>
        <h2 className={cardTitleClass}>Informações do Perfil</h2>
        <form className="space-y-5" onSubmit={handleProfileSubmit}>
          <div>
            <label htmlFor="profile-username" className={labelClass}>
              Nome de Usuário
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className={iconClass} aria-hidden="true" />
              </div>
              <Input
                id="profile-username"
                type="text"
                required
                placeholder="Seu nome para exibir"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputBaseClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-email" className={labelClass}>
              Email
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <MailIcon className={iconClass} aria-hidden="true" />
              </div>
              <Input
                id="profile-email"
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputBaseClass}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
             <Button
                type="submit"
                variant={theme === 'dark' ? 'secondary' : 'primary'} // Example of changing button variant
                isLoading={isSavingProfile || authLoading}
                disabled={isSavingProfile || authLoading}
                icon={<SaveIcon size={18} className="mr-2" />}
              >
                {isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
             </Button>
          </div>
        </form>
      </div>

      <div className={cardBaseClass}>
          <h2 className={cardTitleClass}>Atualizar Senha</h2>
          {authError && authError.includes('login novamente') && (
               <div className={errorAlertInfoClass}>
                   <AlertCircleIcon size={20} className={`${errorAlertIconClass} ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`}/>
                  <span>{authError}</span>
               </div>
          )}
          <form className="space-y-5" onSubmit={handlePasswordSubmit}>
              <div>
                 <label htmlFor="new-password" className={labelClass}>
                   Nova Senha
                 </label>
                 <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <LockIcon className={iconClass} aria-hidden="true" />
                    </div>
                    <Input
                       id="new-password"
                       type="password"
                       required
                       placeholder="Mínimo 6 caracteres"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className={inputBaseClass}
                    />
                 </div>
              </div>
              <div>
                 <label htmlFor="confirm-password" className={labelClass}>
                   Confirmar Nova Senha
                 </label>
                 <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <LockIcon className={iconClass} aria-hidden="true" />
                    </div>
                    <Input
                       id="confirm-password"
                       type="password"
                       required
                       placeholder="Repita a nova senha"
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                       className={inputBaseClass}
                    />
                 </div>
              </div>
             {localError && !localError.includes('login novamente') && (
                 <p className={errorTextClass}>
                    <AlertCircleIcon size={14} className="mr-1 flex-shrink-0" /> {localError}
                 </p>
              )}
             <div className="flex justify-end pt-2">
                 <Button
                    type="submit"
                    variant={theme === 'dark' ? 'secondary' : 'primary'} // Example of changing button variant
                    isLoading={isSavingPassword || authLoading}
                    disabled={isSavingPassword || authLoading || !password || password.length < 6 || password !== confirmPassword}
                    icon={<LockIcon size={18} className="mr-2" />}
                  >
                   {isSavingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                  </Button>
             </div>
          </form>
      </div>
    </div>
  );
};

export default UserProfileForm;
