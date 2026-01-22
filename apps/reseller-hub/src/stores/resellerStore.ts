import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Reseller {
  id: string;
  companyName: string;
  contactEmail: string;
  tier: string;
}

interface ResellerState {
  user: User | null;
  accessToken: string | null;
  currentReseller: Reseller | null;
  currentOutletId: string | null;

  // Actions
  login: (user: User, accessToken: string, reseller?: Reseller) => void;
  logout: () => void;
  setCurrentReseller: (reseller: Reseller | null) => void;
  setCurrentOutlet: (outletId: string | null) => void;
}

export const useResellerStore = create<ResellerState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      currentReseller: null,
      currentOutletId: null,

      login: (user, accessToken, reseller) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, currentReseller: reseller || null });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, currentReseller: null, currentOutletId: null });
      },

      setCurrentReseller: (reseller) => set({ currentReseller: reseller, currentOutletId: null }),

      setCurrentOutlet: (outletId) => set({ currentOutletId: outletId }),
    }),
    {
      name: 'reseller-hub-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        currentReseller: state.currentReseller,
        currentOutletId: state.currentOutletId,
      }),
    }
  )
);
