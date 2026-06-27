import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income';
}

export interface Expense {
  id: string;
  amount: number;
  expense_name: string;
  payment_method: string;
  expense_type: string;
  date: string;
  category_id: string;
  allocated_months?: number;
  end_date?: string;
  categories?: { name: string; color: string };
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  spent?: number; // Calculated later
  categories?: { name: string; color: string };
}

export interface RecurringExpense {
  id: string;
  category_id: string;
  name: string;
  amount: number;
  frequency: string;
  next_due_date: string;
  is_active: boolean;
  categories?: { name: string; color: string };
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
  notes?: string;
}

interface FinanceState {
  expenses: Expense[];
  goals: Goal[];
  budgets: Budget[];
  categories: Category[];
  recurring: RecurringExpense[];
  incomes: Income[];
  loading: boolean;
  fetchData: (userId: string) => Promise<void>;
  seedCategories: (userId: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  updateRecurring: (id: string, updates: Partial<RecurringExpense>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#f59e0b', icon: 'pizza', type: 'expense' },
  { name: 'Groceries', color: '#10b981', icon: 'shopping-bag', type: 'expense' },
  { name: 'Transportation', color: '#3b82f6', icon: 'car', type: 'expense' },
  { name: 'Shopping', color: '#ef4444', icon: 'shopping-cart', type: 'expense' },
  { name: 'Healthcare', color: '#ec4899', icon: 'heart', type: 'expense' },
  { name: 'Fitness', color: '#8b5cf6', icon: 'activity', type: 'expense' },
  { name: 'Entertainment', color: '#14b8a6', icon: 'film', type: 'expense' },
  { name: 'Utilities', color: '#64748b', icon: 'zap', type: 'expense' },
  { name: 'Other', color: '#94a3b8', icon: 'more-horizontal', type: 'expense' },
  { name: 'Salary', color: '#22c55e', icon: 'briefcase', type: 'income' },
]

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  expenses: [],
  goals: [],
  budgets: [],
  categories: [],
  recurring: [],
  incomes: [],
  loading: false,

  fetchData: async (userId: string) => {
    set({ loading: true })
    
    // Check categories
    const { data: cats } = await supabase.from('categories').select('*').eq('user_id', userId)
    
    let activeCategories: Category[] = []
    if (!cats || cats.length === 0) {
      await get().seedCategories(userId)
      // The seed function will set the categories state directly
    } else {
      // Deduplicate categories by name to prevent bug on strict mode double inserts
      activeCategories = Array.from(new Map((cats as Category[]).map(c => [c.name, c])).values())
    }

    const [expRes, goalsRes, budRes, recRes, incRes] = await Promise.all([
      supabase.from('expenses').select('*, categories(name, color)').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('budgets').select('*, categories(name, color)').eq('user_id', userId),
      supabase.from('recurring_expenses').select('*, categories(name, color)').eq('user_id', userId).order('next_due_date', { ascending: true }),
      supabase.from('income').select('*').eq('user_id', userId).order('date', { ascending: false })
    ])

    set((state) => ({
      categories: activeCategories.length > 0 ? activeCategories : state.categories,
      expenses: expRes.data || [],
      goals: goalsRes.data || [],
      budgets: budRes.data || [],
      recurring: recRes.data || [],
      incomes: incRes.data || [],
      loading: false
    }))
  },

  seedCategories: async (userId: string) => {
    const categoriesToInsert = DEFAULT_CATEGORIES.map(c => ({
      user_id: userId,
      name: c.name,
      color: c.color,
      icon: c.icon,
      type: c.type,
      is_default: true
    }))
    
    const { data } = await supabase.from('categories').insert(categoriesToInsert).select()
    if (data) {
      set({ categories: data as Category[] })
    }
  },

  deleteExpense: async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error) {
      set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }))
    }
  },

  deleteGoal: async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (!error) {
      set(state => ({ goals: state.goals.filter(g => g.id !== id) }))
    }
  },

  updateGoal: async (id: string, updates: Partial<Goal>) => {
    const { error } = await supabase.from('goals').update(updates).eq('id', id)
    if (!error) {
      set(state => ({
        goals: state.goals.map(g => (g.id === id ? { ...g, ...updates } : g))
      }))
    }
  },

  deleteBudget: async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (!error) {
      set(state => ({ budgets: state.budgets.filter(b => b.id !== id) }))
    }
  },

  updateBudget: async (id: string, updates: Partial<Budget>) => {
    const { error } = await supabase.from('budgets').update(updates).eq('id', id)
    if (!error) {
      set(state => ({
        budgets: state.budgets.map(b => (b.id === id ? { ...b, ...updates } : b))
      }))
    }
  },

  deleteRecurring: async (id: string) => {
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
    if (!error) {
      set(state => ({ recurring: state.recurring.filter(r => r.id !== id) }))
    }
  },

  updateRecurring: async (id: string, updates: Partial<RecurringExpense>) => {
    const { error } = await supabase.from('recurring_expenses').update(updates).eq('id', id)
    if (!error) {
      set(state => ({
        recurring: state.recurring.map(r => (r.id === id ? { ...r, ...updates } : r))
      }))
    }
  },

  deleteIncome: async (id: string) => {
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (!error) {
      set(state => ({ incomes: state.incomes.filter(i => i.id !== id) }))
    }
  }
}))
