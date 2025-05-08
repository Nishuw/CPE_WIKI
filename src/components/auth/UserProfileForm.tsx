import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppUser } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { UserIcon, MailIcon, LockIcon, SaveIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserProfileFormProps {
  user: AppUser;
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
        await updateUsername(newUsername); // AuthContext irá disparar o toast de sucesso
        profileUpdated = true;
      }
      if (emailChanged) {
        await updateUserEmail(newEmail); // AuthContext irá disparar o toast de sucesso
        profileUpdated = true;
      }
      // Se algo foi realmente tentado (mudança detectada) e não houve erro do AuthContext diretamente,
      // mas também nenhuma das operações acima disparou um toast de sucesso específico (porque não mudou)
      // E nenhuma atualização foi feita.
      if (!profileUpdated && (usernameChanged || emailChanged) && !authError) {
        // Isso pode acontecer se o updateUsername/Email for chamado, mas internamente decidir não fazer nada (ex: nome não mudou)
        // E o AuthContext não disparou toast.info. No entanto, o AuthContext já faz isso.
        // Este toast.info é mais para o caso de o usuário clicar em salvar sem mudar nada.
      } else if (!profileUpdated && !usernameChanged && !emailChanged && !authError) {
        toast.info('Nenhuma alteração de perfil detectada.');
      }

    } catch (error) {
      // O toast de erro já é tratado pelo AuthContext ou aqui se for um erro de validação
      // console.error("Erro ao atualizar perfil:", error);
      // Se o erro não for do AuthContext (que já mostra toast), podemos mostrar um genérico
      if (!authError) {
        // Este log é mais para o console, o toast de erro do AuthContext é preferível
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
      await updateUserPassword(password); // AuthContext irá disparar o toast de sucesso
      // toast.success('Senha atualizada com sucesso!'); // REMOVIDO - AuthContext já faz isso
      setPassword(''); 
      setConfirmPassword('');
    } catch (error) {
      // O toast de erro já é tratado pelo AuthContext
      // console.error("Erro ao atualizar senha:", error);
    }
    finally { setIsSavingPassword(false); }
  };

  const displayError = localError || authError;

  const inputBaseClass = "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="space-y-8">
      {displayError && !displayError.includes('login novamente') && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200 flex items-center shadow-sm">
           <AlertCircleIcon size={20} className="mr-3 flex-shrink-0 text-red-500"/>
           <span>{displayError}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Informações do Perfil</h2>
        <form className="space-y-5" onSubmit={handleProfileSubmit}>
          <div>
            <label htmlFor="profile-username" className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
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
            <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <MailIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
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
                variant="primary"
                isLoading={isSavingProfile || authLoading}
                disabled={isSavingProfile || authLoading}
                icon={<SaveIcon size={18} className="mr-2" />}
              >
                {isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
             </Button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Atualizar Senha</h2>
          {authError && authError.includes('login novamente') && (
               <div className="mb-6 p-4 text-sm text-blue-700 bg-blue-100 rounded-lg border border-blue-200 flex items-center shadow-sm">
                   <AlertCircleIcon size={20} className="mr-3 flex-shrink-0 text-blue-500"/>
                  <span>{authError}</span>
               </div>
          )}
          <form className="space-y-5" onSubmit={handlePasswordSubmit}>
              <div>
                 <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                   Nova Senha
                 </label>
                 <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <LockIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
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
                 <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                   Confirmar Nova Senha
                 </label>
                 <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <LockIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
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
                 <p className="text-xs text-red-600 flex items-center pt-1">
                    <AlertCircleIcon size={14} className="mr-1 flex-shrink-0" /> {localError}
                 </p>
              )}
             <div className="flex justify-end pt-2">
                 <Button
                    type="submit"
                    variant="primary"
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
