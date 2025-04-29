import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { LockIcon, MailIcon } from 'lucide-react';

// Define os modos possíveis do formulário
type FormMode = 'login' | 'signup';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Novo estado para confirmação
  const [mode, setMode] = useState<FormMode>('login'); // Estado para controlar o modo (login/signup)
  const { login, signup, isLoading, error: authError } = useAuth(); // Pega signup e renomeia error para evitar conflito
  const [localError, setLocalError] = useState(''); // Erro local para validações (ex: senhas não conferem)

  const isLoginMode = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(''); // Limpa erros locais

    // Validação específica para o modo de registro
    if (!isLoginMode) {
      if (password !== confirmPassword) {
        setLocalError('As senhas não conferem.');
        return; // Interrompe o envio se as senhas não baterem
      }
       if (password.length < 6) {
           setLocalError('A senha deve ter pelo menos 6 caracteres.');
           return;
       }
      // Chamar a função de registro do contexto
      await signup(email, password);
    } else {
      // Chamar a função de login do contexto
      await login(email, password);
    }

    // O redirecionamento será tratado pelo AuthContext/LoginPage baseado no estado isAuthenticated/isAdmin
    // Não precisamos mais do navigate aqui.
  };

  // Função para alternar entre os modos
  const toggleMode = () => {
    setMode(isLoginMode ? 'signup' : 'login');
    setEmail(''); // Limpa campos ao trocar de modo
    setPassword('');
    setConfirmPassword('');
    setLocalError(''); // Limpa erros locais ao trocar de modo
    // Erros do AuthContext são limpos automaticamente nas funções login/signup
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isLoginMode ? 'Login' : 'Criar Conta'}
        </h1>
        <p className="text-gray-600">
          {isLoginMode ? 'Entre com suas credenciais' : 'Preencha os dados para registrar'}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {(authError || localError) && ( // Mostra erro do AuthContext ou erro local
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
            {localError || authError}
          </div>
        )}

        <Input
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
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
          className="w-full !mt-8" // Adiciona !mt-8 para garantir margem superior
          disabled={isLoading}
        >
          {isLoading ? (isLoginMode ? 'Entrando...' : 'Registrando...') : (isLoginMode ? 'Entrar' : 'Registrar')}
        </Button>

         {/* Link para alternar entre modos */}
         <p className="text-sm text-center text-gray-600 !mt-6">
           {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
           <button
             type="button" // Importante para não submeter o form
             onClick={toggleMode}
             className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded"
             disabled={isLoading}
           >
             {isLoginMode ? 'Registre-se' : 'Faça Login'}
           </button>
         </p>

      </form>
    </div>
  );
};

export default AuthForm; // Renomeado para AuthForm, pois agora lida com ambos
