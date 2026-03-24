import { create } from 'zustand';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const today = new Date();
const defaultStartDate = format(startOfMonth(today), 'yyyy-MM-dd');
const defaultEndDate = format(endOfMonth(today), 'yyyy-MM-dd');

const initialState = {
  fecha_inicio: defaultStartDate,
  fecha_fin: defaultEndDate,
  sistemas_origen: [],
  coordinadores: [],
  meses: [],
  franjas: [],
  categorias_contacto: []
};

export const useDashboardStore = create((set) => ({
  filters: initialState,
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  resetFilters: () => set({
    filters: initialState
  })
}));
