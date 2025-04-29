import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // setDoc removido, pois a Cloud Function cuidará disso

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>; // Renomeado de createUser
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Função para verificar o status de administrador (via claim ou doc)
  const checkAdminStatus = async (currentUser: User) => {
    // Não seta isLoading true aqui, pois onAuthStateChanged já o faz globalmente
    try {
      const idTokenResult = await currentUser.getIdTokenResult(true); // Força atualização do token
      const claims = idTokenResult.claims;

      if (claims && claims.admin === true) {
        setIsAdmin(true);
        console.log("Usuário é administrador via custom claim.");
        // setIsLoading(false); // Deixa onAuthStateChanged controlar o loading final
        return; // Já sabemos que é admin, não precisa checar Firestore
      }

      // Se não for admin via claim, verifica Firestore (opcional, para flags manuais)
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data()?.isAdmin === true) {
          setIsAdmin(true);
          console.log("Usuário é administrador via Firestore (isAdmin: true).");
      } else {
          setIsAdmin(false);
          console.log("Usuário não é administrador (sem claim ou flag isAdmin no Firestore).");
      }
    } catch (error) {
      console.error("Erro ao verificar status de administrador:", error);
      setIsAdmin(false); // Assume não admin em caso de erro
    } finally {
       // Não seta isLoading false aqui, deixa para o onAuthStateChanged
    }
  };


  const login = async (email: string, password: string) => {
    setIsLoading(true); // Inicia loading para a operação de login
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Sucesso! onAuthStateChanged será chamado e cuidará de atualizar o estado
      console.log("Login iniciado com sucesso para:", userCredential.user.email);
    } catch (err: any) {
      console.error("Erro de login:", err);
      setError(getAuthErrorMessage(err)); // Define a mensagem de erro
      // Limpa estado localmente em caso de falha imediata
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsLoading(false); // <<< IMPORTANTE: Finaliza o loading em caso de erro no login
    } finally {
      // Não é mais necessário o finally aqui, pois o catch já lida com o erro
      // Em caso de sucesso, onAuthStateChanged/checkAdminStatus controlarão o loading
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true); // Inicia loading para a operação de signup
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Sucesso! onAuthStateChanged será acionado.
      console.log("Registro iniciado com sucesso para:", userCredential.user.email);
    } catch (err: any) {
      console.error("Erro de registro:", err);
      setError(getAuthErrorMessage(err)); // Define a mensagem de erro
      // Limpa estado localmente em caso de falha imediata
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsLoading(false); // <<< IMPORTANTE: Finaliza o loading em caso de erro no signup
    } finally {
      // Não é mais necessário o finally aqui, pois o catch já lida com o erro
      // Em caso de sucesso, onAuthStateChanged/checkAdminStatus controlarão o loading
    }
  };


  const logout = async () => {
    setIsLoading(true); // Indica loading durante o logout
    setError(null);
    try {
      await signOut(auth);
      // Sucesso! onAuthStateChanged será acionado com null.
      console.log("Logout realizado.");
      // Limpeza de estado agora é feita principalmente pelo onAuthStateChanged
    } catch (err: any) {
      console.error("Erro no logout:", err);
      setError(getAuthErrorMessage(err));
      setIsLoading(false); // Finaliza loading se houve erro no logout
    } finally {
      // Estado será limpo pelo onAuthStateChanged (user=null)
      // Mas podemos garantir aqui também, especialmente se onAuthStateChanged demorar
       setUser(null);
       setIsAuthenticated(false);
       setIsAdmin(false);
       // O loading será finalizado pelo onAuthStateChanged ao detectar user null
    }
  };


  useEffect(() => {
    setIsLoading(true); // Inicia carregando na montagem
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed. User:", currentUser?.email || 'Nenhum');
      if (currentUser) {
        // Usuário está logado ou acabou de logar/registrar
        setUser(currentUser);
        setIsAuthenticated(true);
        await checkAdminStatus(currentUser); // Verifica se é admin (e atualiza isAdmin)
        setIsLoading(false); // <<< Finaliza o loading APÓS verificar admin
      } else {
        // Usuário deslogado ou não autenticado inicialmente
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false); // <<< Finaliza o loading se não há usuário
      }
    });
    // Cleanup subscription on unmount
    return () => {
        console.log("Unsubscribing from onAuthStateChanged");
        unsubscribe();
    };
  }, []); // Roda apenas uma vez

  // Função auxiliar para mensagens de erro mais amigáveis
  const getAuthErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Formato de email inválido.';
      case 'auth/user-disabled':
        return 'Este usuário foi desabilitado.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': // Novo código de erro para credenciais inválidas
        return 'Email ou senha incorretos.';
      case 'auth/email-already-in-use':
        return 'Este email já está sendo usado por outra conta.';
      case 'auth/weak-password':
        return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/operation-not-allowed':
        return 'Login com email/senha não está habilitado.';
      default:
        return error.message || 'Ocorreu um erro inesperado.';
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup, // Exporta a função de registro
    logout,
    isAdmin,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
