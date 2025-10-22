import { create } from 'zustand';

interface BusinessUnitModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useBusinessUnitModal = create<BusinessUnitModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));