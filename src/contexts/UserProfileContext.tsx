import React, { createContext, useContext, ReactNode } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

type UserProfile = {
  id: string;
  display_name: string;
  photo_url: string | null;
  photo_path: string | null;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

type UserProfileContextType = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateDisplayName: (name: string) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const userProfileHook = useUserProfile();
  
  return (
    <UserProfileContext.Provider value={userProfileHook}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfileContext = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfileContext must be used within a UserProfileProvider');
  }
  return context;
};