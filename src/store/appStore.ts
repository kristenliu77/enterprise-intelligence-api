import { create } from "zustand";
import type { Lead } from "../types";
import { leads as initialLeads } from "../mock/data";

interface UserInfo {
  username: string;
  organization: string;
  role: string;
}

interface AppState {
  collapsed: boolean;
  mobileNavOpen: boolean;
  user: UserInfo | null;
  favorites: string[];
  leads: Lead[];
  setCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleFavorite: (id: string) => void;
  addLead: (lead: Lead) => void;
  updateLeadStage: (id: string, stage: Lead["stage"]) => void;
}

const savedUser = localStorage.getItem("businessHeatUser");

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  mobileNavOpen: false,
  user: savedUser ? (JSON.parse(savedUser) as UserInfo) : null,
  favorites: [],
  leads: initialLeads,
  setCollapsed: (collapsed) => set({ collapsed }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  login: async (username, password) => {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 400);
    });
    if (username === "admin" && password === "admin123") {
      const user = { username, organization: "光谷招商数字化专班", role: "招商主管" };
      localStorage.setItem("businessHeatUser", JSON.stringify(user));
      set({ user });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem("businessHeatUser");
    set({ user: null });
  },
  toggleFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((item) => item !== id)
        : [...state.favorites, id]
    })),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLeadStage: (id, stage) =>
    set((state) => ({
      leads: state.leads.map((lead) => (lead.id === id ? { ...lead, stage } : lead))
    }))
}));
