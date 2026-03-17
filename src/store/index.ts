"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
    sidebarCollapsed: boolean;
    sidebarOpen: boolean;
    selectedTenantId: string | null;
    selectedEventId: string | null;
    toggleSidebarCollapse: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSelectedTenantId: (id: string | null) => void;
    setSelectedEventId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarCollapsed: false,
            sidebarOpen: false,
            selectedTenantId: null,
            selectedEventId: null,
            toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
            setSelectedTenantId: (id: string | null) => set({ selectedTenantId: id }),
            setSelectedEventId: (id: string | null) => set({ selectedEventId: id }),
        }),
        {
            name: "icms-ui-store",
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                selectedTenantId: state.selectedTenantId,
                selectedEventId: state.selectedEventId,
            }),
        }
    )
);
