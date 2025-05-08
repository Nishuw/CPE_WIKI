import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button'; 
import Input from '../ui/Input';
import { LockIcon, MailIcon, UserIcon } from 'lucide-react'; // Import UserIcon

// Define os modos possíveis do formulário
type FormMode = 'login' | 'signup';

// Define a prop para forçar tema, se necessário no futuro, mas por agora vamos focar nas classes diretas.
interface AuthFormProps {
  forceTheme?: 'light' | 'dark'; // Prop para forçar tema no container do AuthForm, não nos inputs diretamente
}

const AuthForm: React.FC<AuthFormProps> = ({ forceTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<FormMode>('login');
  const { login, signup, isLoading, error: authError } = useAuth(); 
  const [localError, setLocalError] = useState('');

  const isLoginMode = mode === 'login';

  // Classes para forçar tema claro nos inputs e labels
  const lightInputClass = "!bg-white !text-gray-900 !border-gray-300 placeholder:!text-gray-400 focus:!ring-blue-500 focus:!border-blue-500";
  const lightLabelClass = "!text-gray-700";
  const lightIconClass = "!text-gray-400";
  const lightLinkClass = "!text-indigo-600 hover:!text-indigo-500";
  const lightSubtextClass = "!text-gray-600";
  const lightTitleClass = "!text-gray-800";
  const lightErrorTextClass = "!text-red-700 !bg-red-100 !border-red-200";

  // Determina as classes do container do AuthForm
  // Se forceTheme for light, usa fundo branco. Caso contrário, permite que o tema do sistema (se houver) funcione.
  const authFormContainerClass = `w-full max-w-md p-8 space-y-6 rounded-lg shadow-xl border ${forceTheme === 'light' ? 'bg-white border-gray-200' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!isLoginMode) {
      if (!username.trim()) {
          setLocalError('Por favor, insira um nome de usuário.');
          return;
      }
      if (password !== confirmPassword) {
        setLocalError('As senhas não conferem.');
        return;
      }
       if (password.length < 6) {
           setLocalError('A senha deve ter pelo menos 6 caracteres.');
           return;
       }
      await signup(email, password, username.trim());
    } else {
      await login(email, password);
    }
  };

  const toggleMode = () => {
    setMode(isLoginMode ? 'signup' : 'login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setLocalError('');
  };

  return (
    // Aplica a classe do container aqui. Para este caso específico, queremos sempre branco.
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="text-center">
        <h1 className={`text-3xl font-bold mb-2 ${lightTitleClass}`}>
          {isLoginMode ? 'Entrar' : 'Criar Conta'}
        </h1>
        <p className={lightSubtextClass}>
          {isLoginMode ? 'Entre com suas credenciais' : 'Preencha os dados para se registrar'}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {(authError || localError) && (
          <div className={`p-3 text-sm rounded-md border ${lightErrorTextClass}`} data-testid="auth-error">
            {localError || authError}
          </div>
        )}

        {!isLoginMode && (
             <Input
                id="username"
                label="Nome de Usuário"
                type="text"
                required
                autoComplete="username"
                placeholder="Seu nome para exibir"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`pl-10 ${lightInputClass}`}
                labelClassName={lightLabelClass} // Passa a classe da label para o Input
                icon={<UserIcon className={`w-5 h-5 ${lightIconClass}`} />} 
             />
        )}

        <Input
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`pl-10 ${lightInputClass}`}
          labelClassName={lightLabelClass} // Passa a classe da label para o Input
          icon={<MailIcon className={`w-5 h-5 ${lightIconClass}`} />}
        />

        <Input
          id="password"
          label="Senha"
          type="password"
          required
          autoComplete={isLoginMode ? "current-password" : "new-password"}
          placeholder={isLoginMode ? "Sua senha" : "Mínimo 6 caracteres"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`pl-10 ${lightInputClass}`}
          labelClassName={lightLabelClass} // Passa a classe da label para o Input
          icon={<LockIcon className={`w-5 h-5 ${lightIconClass}`} />}
        />

        {!isLoginMode && (
          <Input
            id="confirmPassword"
            label="Confirmar Senha"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`pl-10 ${lightInputClass}`}
            labelClassName={lightLabelClass} // Passa a classe da label para o Input
            icon={<LockIcon className={`w-5 h-5 ${lightIconClass}`} />}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full !mt-8"
          disabled={isLoading}
        >
          {isLoading ? (isLoginMode ? 'Entrando...' : 'Cadastrando...') : (isLoginMode ? 'Entrar' : 'Cadastrar')}
        </Button>

         <p className={`text-sm text-center !mt-6 ${lightSubtextClass}`} data-testid="toggle-mode-text">
           {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
           <button
             type="button"
             onClick={toggleMode}
             className={`ml-1 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded ${lightLinkClass}`}
             disabled={isLoading}
           >
             {isLoginMode ? 'Cadastre-se' : 'Faça Login'}
           </button>
         </p>

      </form>
    </div>
  );
};

export default AuthForm;
