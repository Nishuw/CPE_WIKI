import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseAuthUser, // Alias for Firebase Auth User type
  updateProfile, // Import updateProfile
  updateEmail, // Import updateEmail
  updatePassword // Import updatePassword
} from 'firebase/auth';
import { 
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot // Import onSnapshot here
} from 'firebase/firestore';
import { User as AppUser } from '../types'; // Alias for your App User type
import { toast } from 'react-hot-toast'; // Assuming toast is used for notifications

interface AuthContextType {
  user: FirebaseAuthUser | null; // Firebase Auth User
  appUser: AppUser | null; // Your App User from Firestore
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>; // Updated signup
  logout: () => Promise<void>;
  isAdmin: boolean;
  updateUsername: (newUsername: string) => Promise<void>; // Add updateUsername
  updateUserEmail: (newEmail: string) => Promise<void>; // Add updateUserEmail
  updateUserPassword: (newPassword: string) => Promise<void>; // Add updateUserPassword
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
  const [user, setUser] = useState<FirebaseAuthUser | null>(null); // Firebase Auth User
  const [appUser, setAppUser] = useState<AppUser | null>(null); // App User from Firestore
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // --- Firestore Listener for App User Data ---
  useEffect(() => {
      let unsubscribe: () => void;
      if (user) {
          // Listen to the specific user document in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
              if (docSnapshot.exists()) {
                  const userData = docSnapshot.data() as AppUser;
                  setAppUser({ id: docSnapshot.id, ...userData }); // Store AppUser including ID
                  setIsAdmin(userData.role === 'admin'); // Determine admin status from role
                  console.log("AppUser data updated from Firestore:", userData);
              } else {
                  // Document doesn't exist, maybe user was deleted from Firestore?
                  setAppUser(null);
                  setIsAdmin(false);
                  console.warn("Firestore document for user", user.uid, "not found.");
                  // Optionally handle this case, e.g., log the user out or show an error
              }
          }, (err) => {
              console.error("Error listening to user document:", err);
              setError('Falha ao carregar dados do usuário.');
              setAppUser(null);
              setIsAdmin(false);
          });
      } else {
          // No Firebase Auth user, clear AppUser state
          setAppUser(null);
          setIsAdmin(false);
      }

      // Cleanup listener
      return () => {
          if (unsubscribe) unsubscribe();
      };

  }, [user]); // Re-run when Firebase Auth user changes

  // --- Authentication State Listener ---
  useEffect(() => {
    setIsLoading(true); 
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed. UID:", currentUser?.uid || 'Nenhum');
      if (currentUser) {
        setUser(currentUser); // Set Firebase Auth user
        setIsAuthenticated(true);
        // AppUser data and isAdmin status will be set by the Firestore listener now
      } else {
        // User logged out
        setUser(null);
        setIsAuthenticated(false);
        // AppUser and isAdmin will be cleared by the Firestore listener's effect
      }
       setIsLoading(false); // Finalize loading once Auth state is determined
    });

    return () => {
        console.log("Unsubscribing from onAuthStateChanged");
        unsubscribe();
    };
  }, []); // Roda apenas uma vez na montagem


  // --- Authentication Operations ---

  const login = async (email: string, password: string) => {
    setIsLoading(true); 
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged listener handles state update on success
    } catch (err: any) {
      console.error("Erro de login:", err);
      setError(getAuthErrorMessage(err)); 
      setIsLoading(false); // Stop loading on failure
    }
  };

  // Updated signup function to create user in Auth and Firestore doc
  const signup = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: firebaseUser.email, // Store email in Firestore doc
        username: username.trim(), // Store the provided username
        role: 'user', // Default role is user
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Optional: Update display name in Firebase Auth (less critical than Firestore doc)
      // await updateProfile(firebaseUser, { displayName: username.trim() });

      // onAuthStateChanged listener handles further state update
      console.log("Usuário registrado e documento no Firestore criado para:", firebaseUser.email);
    } catch (err: any) {
      console.error("Erro de registro:", err);
      setError(getAuthErrorMessage(err));
      setIsLoading(false); // Stop loading on failure
       // Consider cleaning up the Auth user if Firestore doc creation fails?
    }
  };


  const logout = async () => {
    setIsLoading(true); 
    setError(null);
    try {
      await signOut(auth);
      // onAuthStateChanged listener handles state update (clearing user, appUser, isAdmin)
       console.log("Logout realizado.");
    } catch (err: any) {
      console.error("Erro no logout:", err);
      setError(getAuthErrorMessage(err));
      setIsLoading(false); // Finalize loading if error
    }
  };

  // --- User Profile Update Operations ---

  const updateUsername = async (newUsername: string) => {
      if (!user || !appUser) { 
          toast.error('Usuário não autenticado.');
          return;
      }
      if (newUsername.trim() === appUser.username) { // Avoid unnecessary updates
           toast.info('Nome de usuário não alterado.');
           return Promise.resolve(); // Resolve immediately
      }

      try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
              username: newUsername.trim(),
              updatedAt: serverTimestamp(),
          });
          // Firestore listener will update the appUser state
          toast.success('Nome de usuário atualizado!');
          console.log("Username updated in Firestore for", user.uid);
      } catch (err: any) {
          console.error("Error updating username:", err);
          toast.error('Falha ao atualizar nome de usuário.');
          throw err; // Re-throw for component to handle if needed
      }
  };

  const updateUserEmail = async (newEmail: string) => {
       if (!user || !appUser) { 
           toast.error('Usuário não autenticado.');
           return;
       }
       if (newEmail.trim() === appUser.email) { // Avoid unnecessary updates
            toast.info('Email não alterado.');
            return Promise.resolve(); // Resolve immediately
       }

      try {
          // Update in Firebase Authentication
          await updateEmail(user, newEmail.trim());
          
          // Update in Firestore document as well (optional but good for consistency)
          const userDocRef = doc(db, 'users', user.uid);
           await updateDoc(userDocRef, {
              email: newEmail.trim(),
               updatedAt: serverTimestamp(),
          });

          // Auth state listener might update user.email, Firestore listener updates appUser.email
          toast.success('Email atualizado!');
          console.log("Email updated in Auth and Firestore for", user.uid);
      } catch (err: any) {
          console.error("Error updating email:", err);
           // Handle specific auth errors like auth/requires-recent-login
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
          throw err; // Re-throw
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
            return Promise.reject(new Error('Senha muito curta')); // Reject with an error
       }

      try {
          // Update in Firebase Authentication
          await updatePassword(user, newPassword);

           // Optionally update a timestamp in Firestore to mark profile update time
           const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
               updatedAt: serverTimestamp(), // Mark profile update time
           });

          toast.success('Senha atualizada!');
          console.log("Password updated for", user.uid);
      } catch (err: any) {
          console.error("Error updating password:", err);
           // Handle specific auth errors like auth/requires-recent-login
           if (err.code === 'auth/requires-recent-login') {
               toast.error('Por favor, faça login novamente para atualizar sua senha.');
               setError('Para atualizar sua senha, faça login novamente.');
           } else {
             toast.error('Falha ao atualizar senha.');
              setError('Falha ao atualizar senha.');
           }
          throw err; // Re-throw
      }
   };


  // Helper for auth error messages
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
    user, // Firebase Auth user object
    appUser, // AppUser from Firestore
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    isAdmin,
    updateUsername, // Expose updateUsername
    updateUserEmail, // Expose updateUserEmail
    updateUserPassword, // Expose updateUserPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
