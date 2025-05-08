import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseAuthUser,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { User as AppUser } from '../types';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: FirebaseAuthUser | null;
  appUser: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  updateUsername: (newUsername: string) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
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
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
      let unsubscribe: (() => void) | undefined;
      if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
              if (docSnapshot.exists()) {
                  const userData = docSnapshot.data() as AppUser;
                  setAppUser({ id: docSnapshot.id, ...userData });
                  setIsAdmin(userData.role === 'admin');
                  // console.log("AppUser data updated from Firestore:", userData);
              } else {
                  setAppUser(null);
                  setIsAdmin(false);
                  // console.warn("Firestore document for user", user.uid, "not found.");
              }
          }, (err) => {
              // console.error("Error listening to user document:", err); 
              setError('Falha ao carregar dados do usuário.');
              setAppUser(null);
              setIsAdmin(false);
          });
      } else {
          setAppUser(null);
          setIsAdmin(false);
      }

      return () => {
          if (unsubscribe) unsubscribe();
      };

  }, [user]);

  useEffect(() => {
    setIsLoading(true); 
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // console.log("Auth state changed. UID:", currentUser?.uid || 'Nenhum');
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
       setIsLoading(false);
    });

    return () => {
        // console.log("Unsubscribing from onAuthStateChanged");
        unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true); 
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // console.error("Erro de login:", err);
      setError(getAuthErrorMessage(err)); 
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: firebaseUser.email,
        username: username.trim(),
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // console.log("Usuário registrado e documento no Firestore criado para:", firebaseUser.email);
    } catch (err: any) {
      // console.error("Erro de registro:", err);
      setError(getAuthErrorMessage(err));
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true); 
    setError(null);
    try {
      await signOut(auth);
      // console.log("Logout realizado.");
    } catch (err: any) {
      // console.error("Erro no logout:", err);
      setError(getAuthErrorMessage(err));
      setIsLoading(false);
    }
  };

  const updateUsername = async (newUsername: string) => {
      if (!user || !appUser) { 
          toast.error('Usuário não autenticado.');
          return;
      }
      if (newUsername.trim() === appUser.username) {
           toast.info('Nome de usuário não alterado.');
           return Promise.resolve();
      }
      try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
              username: newUsername.trim(),
              updatedAt: serverTimestamp(),
          });
          toast.success('Nome de usuário atualizado!');
          // console.log("Username updated in Firestore for", user.uid);
      } catch (err: any) {
          // console.error("Error updating username:", err);
          toast.error('Falha ao atualizar nome de usuário.');
          throw err;
      }
  };

  const updateUserEmail = async (newEmail: string) => {
       if (!user || !appUser) { 
           toast.error('Usuário não autenticado.');
           return;
       }
       if (newEmail.trim() === appUser.email) {
            toast.info('Email não alterado.');
            return Promise.resolve();
       }
      try {
          await updateEmail(user, newEmail.trim());
          const userDocRef = doc(db, 'users', user.uid);
           await updateDoc(userDocRef, {
              email: newEmail.trim(),
               updatedAt: serverTimestamp(),
          });
          toast.success('Email atualizado!');
          // console.log("Email updated in Auth and Firestore for", user.uid);
      } catch (err: any) {
          // console.error("Error updating email:", err);
           if (err.code === 'auth/requires-recent-login') {
               toast.error('Por favor, faça login novamente para atualizar seu email.');
               setError('Para atualizar seu email, faça login novamente.');
           } else if (err.code === 'auth/invalid-email') {
               toast.error('Formato de email inválido.');
                setError('Formato de email inválido.');
           }
           else {
             toast.error('Falha ao atualizar email.');
             setError('Falha ao atualizar email.');
           }
          throw err;
      }
  };

   const updateUserPassword = async (newPassword: string) => {
       if (!user) { 
           toast.error('Usuário não autenticado.');
           return;
       }
       if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
             setError('A senha deve ter pelo menos 6 caracteres.');
            return Promise.reject(new Error('Senha muito curta'));
       }
      try {
          await updatePassword(user, newPassword);
           const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
               updatedAt: serverTimestamp(),
           });
          toast.success('Senha atualizada!');
          // console.log("Password updated for", user.uid);
      } catch (err: any) {
          // console.error("Error updating password:", err);
           if (err.code === 'auth/requires-recent-login') {
               toast.error('Por favor, faça login novamente para atualizar sua senha.');
               setError('Para atualizar sua senha, faça login novamente.');
           } else {
             toast.error('Falha ao atualizar senha.');
              setError('Falha ao atualizar senha.');
           }
          throw err;
      }
   };

  const getAuthErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'auth/invalid-email': return 'Formato de email inválido.';
      case 'auth/user-disabled': return 'Este usuário foi desabilitado.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Email ou senha incorretos.';
      case 'auth/email-already-in-use': return 'Este email já está sendo usado por outra conta.';
      case 'auth/weak-password': return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/operation-not-allowed': return 'Login com email/senha não está habilitado.';
      case 'auth/requires-recent-login': return 'Para completar esta ação, faça login novamente.';
      default: return error.message || 'Ocorreu um erro inesperado.';
    }
  };

  const value: AuthContextType = {
    user,
    appUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    isAdmin,
    updateUsername,
    updateUserEmail,
    updateUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
