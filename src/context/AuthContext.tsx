import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: AppUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isMustChangePassword: boolean;
  login: (loginIdentifier: string, pass: string) => Promise<AppUser | null>;
  loginStudent: (loginIdentifier: string, pass: string) => Promise<{ user: FirebaseUser; profile: AppUser }>;
  logout: () => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (user: FirebaseUser | null) => {
    if (!user) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authService.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (err) {
      console.warn('Failed to load user authorization profile:', err);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.subscribeAuthState(async (user) => {
      setCurrentUser(user);
      await fetchProfile(user);
    });

    return () => unsubscribe();
  }, []);

  const login = async (loginIdentifier: string, pass: string): Promise<AppUser | null> => {
    const user = await authService.login(loginIdentifier, pass);
    const profile = await authService.getUserProfile(user.uid);
    setUserProfile(profile);
    return profile;
  };

  const loginStudent = async (
    loginIdentifier: string,
    pass: string
  ): Promise<{ user: FirebaseUser; profile: AppUser }> => {
    const result = await authService.loginStudent(loginIdentifier, pass);
    setCurrentUser(result.user);
    setUserProfile(result.profile);
    return result;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const changePassword = async (newPass: string): Promise<void> => {
    if (!currentUser) throw new Error('Authentication session required.');
    
    // 1. Update Firebase Auth password
    await authService.updateUserPassword(newPass);

    // 2. If user had mustChangePassword flag, clear it in Firestore
    if (userProfile?.mustChangePassword) {
      await authService.clearMustChangePasswordFlag(currentUser.uid);
      setUserProfile((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  const role: UserRole | null = userProfile?.active ? userProfile.role : null;
  const isMustChangePassword: boolean = Boolean(
    currentUser && userProfile?.active && userProfile.mustChangePassword
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        isLoading,
        isMustChangePassword,
        login,
        loginStudent,
        logout,
        changePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
