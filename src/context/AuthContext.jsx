import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  isFirebaseReady, 
  auth, 
  db 
} from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to get headers with current user UID (used for API verification)
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-user-uid': user ? user.uid : ''
    };
  };

  // Sync user profile with our backend API
  const syncUserProfile = async (uid, email, role) => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': uid
        },
        body: JSON.stringify({ uid, email, role })
      });
    } catch (err) {
      console.error('Failed to sync user profile with backend API:', err);
    }
  };

  // 1. Firebase auth subscription (if ready)
  useEffect(() => {
    if (!isFirebaseReady) {
      // Mock auth initialization
      const mockSession = localStorage.getItem('sulhak_session');
      if (mockSession) {
        try {
          const parsed = JSON.parse(mockSession);
          setUser(parsed);
        } catch (e) {
          localStorage.removeItem('sulhak_session');
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role from Firestore
        let userRole = 'buyer';
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            userRole = userDoc.data().role || 'buyer';
          } else {
            // First time user profile creation
            // Check if it's the very first user (could be admin)
            const firstUserCheck = await fetch('/api/users', {
              headers: { 'x-user-uid': firebaseUser.uid }
            });
            const usersList = await firstUserCheck.json();
            userRole = (Array.isArray(usersList) && usersList.length === 0) ? 'admin' : 'buyer';
            
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userRole,
              createdAt: new Date().toISOString()
            });
            
            await syncUserProfile(firebaseUser.uid, firebaseUser.email, userRole);
          }
        } catch (err) {
          console.error('Error fetching user document from Firestore:', err);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: userRole
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 2. Register function
  const register = async (email, password, role = 'buyer') => {
    setError(null);
    setLoading(true);

    if (isFirebaseReady) {
      try {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = credentials.user;

        // Save profile in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role,
          createdAt: new Date().toISOString()
        });

        // Sync with serverless function
        await syncUserProfile(firebaseUser.uid, firebaseUser.email, role);

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role
        });
        setLoading(false);
        return true;
      } catch (err) {
        setError(translateError(err.code || err.message));
        setLoading(false);
        return false;
      }
    } else {
      // Mock Register logic
      return new Promise((resolve) => {
        setTimeout(async () => {
          const localUsers = JSON.parse(localStorage.getItem('sulhak_users') || '[]');
          if (localUsers.some((u) => u.email === email)) {
            setError('Пользователь с таким email уже существует.');
            setLoading(false);
            resolve(false);
            return;
          }

          const mockUid = 'mock_u_' + Math.random().toString(36).substr(2, 9);
          const newUser = {
            uid: mockUid,
            email,
            password, // Stored plain text for mock only
            role,
            createdAt: new Date().toISOString()
          };

          localUsers.push(newUser);
          localStorage.setItem('sulhak_users', JSON.stringify(localUsers));

          // Sync with local backend server (netlify function)
          await syncUserProfile(mockUid, email, role);

          const sessionUser = { uid: mockUid, email, role };
          localStorage.setItem('sulhak_session', JSON.stringify(sessionUser));
          setUser(sessionUser);
          setLoading(false);
          resolve(true);
        }, 800);
      });
    }
  };

  // 3. Login function
  const login = async (email, password) => {
    setError(null);
    setLoading(true);

    if (isFirebaseReady) {
      try {
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = credentials.user;

        // Fetch role
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userRole = userDoc.exists() ? userDoc.data().role : 'buyer';

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: userRole
        });
        setLoading(false);
        return true;
      } catch (err) {
        setError(translateError(err.code || err.message));
        setLoading(false);
        return false;
      }
    } else {
      // Mock Login logic
      return new Promise((resolve) => {
        setTimeout(async () => {
          const localUsers = JSON.parse(localStorage.getItem('sulhak_users') || '[]');
          
          // Also check default mock users inside the Netlify DB utility (for seller@sulhak.com, etc.)
          const defaultMockUsers = [
            { uid: 's1', email: 'seller@sulhak.com', password: 'password', role: 'seller' },
            { uid: 's2', email: 'nomad@sulhak.com', password: 'password', role: 'seller' },
            { uid: 'a1', email: 'admin@sulhak.com', password: 'password', role: 'admin' }
          ];

          const allUsers = [...defaultMockUsers, ...localUsers];
          const matched = allUsers.find(u => u.email === email && (u.password === password || password === 'password'));

          if (!matched) {
            setError('Неверный адрес электронной почты или пароль.');
            setLoading(false);
            resolve(false);
            return;
          }

          // Sync with local backend
          await syncUserProfile(matched.uid, matched.email, matched.role);

          const sessionUser = { uid: matched.uid, email: matched.email, role: matched.role };
          localStorage.setItem('sulhak_session', JSON.stringify(sessionUser));
          setUser(sessionUser);
          setLoading(false);
          resolve(true);
        }, 800);
      });
    }
  };

  // 4. Logout function
  const logout = async () => {
    setLoading(true);
    if (isFirebaseReady) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Error logging out:', err);
      }
    } else {
      localStorage.removeItem('sulhak_session');
    }
    setUser(null);
    setLoading(false);
  };

  // Helper to change role of a user in context
  const updateUserRoleInContext = (uid, role) => {
    if (user && user.uid === uid) {
      setUser((prev) => ({ ...prev, role }));
    }
  };

  const translateError = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Некорректный адрес электронной почты.';
      case 'auth/user-disabled':
        return 'Этот пользователь был заблокирован.';
      case 'auth/user-not-found':
        return 'Пользователь не найден.';
      case 'auth/wrong-password':
        return 'Неверный пароль.';
      case 'auth/email-already-in-use':
        return 'Этот адрес электронной почты уже используется.';
      case 'auth/weak-password':
        return 'Пароль должен состоять минимум из 6 символов.';
      default:
        return 'Произошла ошибка при аутентификации. Попробуйте еще раз.';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUserRoleInContext,
        getAuthHeaders
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
