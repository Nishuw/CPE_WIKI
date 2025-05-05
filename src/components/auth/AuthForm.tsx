import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button'; 
import Input from '../ui/Input';
import { LockIcon, MailIcon, UserIcon } from 'lucide-react'; // Import UserIcon

// Define os modos possíveis do formulário
type FormMode = 'login' | 'signup';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState(''); // Novo estado para username
  const [mode, setMode] = useState<FormMode>('login');
  // Assumindo que a função signup no useAuth agora aceita username
  const { login, signup, isLoading, error: authError } = useAuth(); 
  const [localError, setLocalError] = useState('');

  const isLoginMode = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!isLoginMode) {
      // Validação para o modo de registro (incluindo username)
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
      // Chamar a função de registro do contexto com username
      await signup(email, password, username.trim()); // Passa username
    } else {
      // Chamar a função de login do contexto
      await login(email, password);
    }
  };

  const toggleMode = () => {
    setMode(isLoginMode ? 'signup' : 'login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername(''); // Limpa username ao trocar de modo
    setLocalError('');
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isLoginMode ? 'Entrar' : 'Criar Conta'}
        </h1>
        <p className="text-gray-600">
          {isLoginMode ? 'Entre com suas credenciais' : 'Preencha os dados para se registrar'}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {(authError || localError) && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200" data-testid="auth-error">
            {localError || authError}
          </div>
        )}

        {/* Campo de Username - Apenas no modo Signup */}
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
                className="pl-10"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />} // Use UserIcon
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
          className="pl-10"
          icon={<MailIcon className="w-5 h-5 text-gray-400" />}
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
          className="pl-10"
          icon={<LockIcon className="w-5 h-5 text-gray-400" />}
        />

        {/* Campo de Confirmar Senha - Apenas no modo Signup */}
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
            className="pl-10"
            icon={<LockIcon className="w-5 h-5 text-gray-400" />}
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

         <p className="text-sm text-center text-gray-600 !mt-6" data-testid="toggle-mode-text">
           {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
           <button
             type="button"
             onClick={toggleMode}
             className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded"
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
