import { create } from 'zustand';

interface GroupState {
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  selectedGroupId: null,
  setSelectedGroupId: (id) => set({ selectedGroupId: id }),
}));
