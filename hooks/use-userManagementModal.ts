import { UserRole } from '@prisma/client';
import { create } from 'zustand';

// The data shape needed for the modal
export type UserAssignmentData = {
  userId: string;
  username: string | null;
  role: UserRole;
}

interface UserManagementModalStore {
  initialData: UserAssignmentData | null;
  isOpen: boolean;
  availableRoles: UserRole[];
  onOpen: (availableRoles: UserRole[], data?: UserAssignmentData) => void;
  onClose: () => void;
}

export const useUserManagementModal = create<UserManagementModalStore>((set) => ({
  initialData: null,
  isOpen: false,
  availableRoles: [],
  onOpen: (availableRoles, data) => 
    set({ 
      isOpen: true, 
      availableRoles, 
      initialData: data || null 
    }),
  onClose: () => 
    set({ 
      isOpen: false, 
      initialData: null, 
      availableRoles: [] 
    }),
}));