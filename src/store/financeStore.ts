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
  status?: string;
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
  payment_method?: string;
  notes?: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  invested_amount: number;
  current_value: number;
  created_at?: string;
}

interface FinanceState {
  expenses: Expense[];
  goals: Goal[];
  budgets: Budget[];
  categories: Category[];
  recurring: RecurringExpense[];
  incomes: Income[];
  investments: Investment[];
  loading: boolean;
  fetchData: (userId: string) => Promise<void>;
  processRecurringExpenses: (userId: string) => Promise<void>;
  seedCategories: (userId: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  updateRecurring: (id: string, updates: Partial<RecurringExpense>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  { name: 'Food and Dining', color: '#f59e0b', icon: 'pizza', type: 'expense' },
  { name: 'Fitness', color: '#8b5cf6', icon: 'activity', type: 'expense' },
  { name: 'Rents', color: '#6366f1', icon: 'home', type: 'expense' },
  { name: 'Medical', color: '#ec4899', icon: 'heart', type: 'expense' },
  { name: 'Emergency', color: '#ef4444', icon: 'alert-triangle', type: 'expense' },
  { name: 'Utilities', color: '#64748b', icon: 'zap', type: 'expense' },
  { name: 'Groceries', color: '#10b981', icon: 'shopping-bag', type: 'expense' },
  { name: 'Transportation', color: '#3b82f6', icon: 'car', type: 'expense' },
  { name: 'Shopping', color: '#f43f5e', icon: 'shopping-cart', type: 'expense' },
  { name: 'Sports and Entertainment', color: '#14b8a6', icon: 'film', type: 'expense' },
  { name: 'Bills and Emi', color: '#f97316', icon: 'file-text', type: 'expense' },
  { name: 'Investment', color: '#8b5cf6', icon: 'trending-up', type: 'expense' },
  { name: 'Other', color: '#94a3b8', icon: 'more-horizontal', type: 'expense' },
  { name: 'Salary', color: '#22c55e', icon: 'briefcase', type: 'income' },
  { name: 'Investment Return', color: '#10b981', icon: 'trending-up', type: 'income' },
]

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  expenses: [],
  goals: [],
  budgets: [],
  categories: [],
  recurring: [],
  incomes: [],
  investments: [],
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

    // Run Auto-Logging Engine BEFORE fetching data so it includes the newly auto-logged expenses
    await get().processRecurringExpenses(userId)

    const [expRes, goalsRes, budRes, recRes, incRes, invRes] = await Promise.all([
      supabase.from('expenses').select('*, categories(name, color)').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('budgets').select('*, categories(name, color)').eq('user_id', userId),
      supabase.from('recurring_expenses').select('*, categories(name, color)').eq('user_id', userId).order('next_due_date', { ascending: true }),
      supabase.from('income').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('investments').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ])

    set((state) => ({
      categories: activeCategories.length > 0 ? activeCategories : state.categories,
      expenses: expRes.data || [],
      goals: goalsRes.data || [],
      budgets: budRes.data || [],
      recurring: recRes.data || [],
      incomes: incRes.data || [],
      investments: invRes.data || [],
      loading: false
    }))
  },

  processRecurringExpenses: async (userId: string) => {
    // 1. Fetch active recurring expenses where next_due_date <= today
    const today = new Date().toISOString().split('T')[0]
    
    const { data: dueExpenses } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_due_date', today)
      
    if (!dueExpenses || dueExpenses.length === 0) return;
    
    const expensesToInsert = []
    const recurringUpdates = []
    
    for (const rec of dueExpenses) {
      let currentDate = new Date(rec.next_due_date)
      const now = new Date(today)
      
      // We loop in case they haven't logged in for multiple months, to catch up all missed months
      while (currentDate <= now) {
        expensesToInsert.push({
          user_id: userId,
          category_id: rec.category_id,
          amount: rec.amount,
          expense_name: rec.name,
          payment_method: 'Auto-deduct',
          expense_type: 'recurring',
          date: currentDate.toISOString().split('T')[0],
          allocated_months: 1
        })
        
        // Advance by frequency
        if (rec.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1)
        } else if (rec.frequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1)
        } else if (rec.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7)
        } else if (rec.frequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
      
      recurringUpdates.push({
        id: rec.id,
        next_due_date: currentDate.toISOString().split('T')[0]
      })
    }
    
    // Bulk insert expenses
    if (expensesToInsert.length > 0) {
      await supabase.from('expenses').insert(expensesToInsert)
    }
    
    // Bulk update recurring dates (Supabase JS doesn't easily support bulk update with different values per row, so loop it)
    for (const update of recurringUpdates) {
      await supabase.from('recurring_expenses').update({ next_due_date: update.next_due_date }).eq('id', update.id)
    }
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
    const expenseToDelete = get().expenses.find(e => e.id === id)
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    
    if (!error) {
      set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }))
      
      // If this was a goal expense, also delete the achieved goal
      if (expenseToDelete && expenseToDelete.expense_name.startsWith('Goal Achieved: ')) {
        const goalName = expenseToDelete.expense_name.replace('Goal Achieved: ', '')
        const goalToDelete = get().goals.find(g => g.name === goalName && g.status === 'achieved')
        if (goalToDelete) {
           await supabase.from('goals').delete().eq('id', goalToDelete.id)
           set(state => ({ goals: state.goals.filter(g => g.id !== goalToDelete.id) }))
        }
      }

      // If this was an investment expense, delete the investment
      if (expenseToDelete && (expenseToDelete.expense_name.startsWith('Investment: ') || expenseToDelete.expense_name.startsWith('Investment Buy: '))) {
        let invName = expenseToDelete.expense_name.replace('Investment Buy: ', '')
        invName = invName.replace('Investment: ', '')
        
        const invToDelete = get().investments.find(i => i.name === invName)
        if (invToDelete) {
           await supabase.from('investments').delete().eq('id', invToDelete.id)
           set(state => ({ investments: state.investments.filter(i => i.id !== invToDelete.id) }))
        }
      }
    }
  },

  deleteGoal: async (id: string) => {
    const goalToDelete = get().goals.find(g => g.id === id)
    const { error } = await supabase.from('goals').delete().eq('id', id)
    
    if (!error) {
      set(state => ({ goals: state.goals.filter(g => g.id !== id) }))
      
      // If the goal was achieved, delete the associated expense to refund the savings
      if (goalToDelete && goalToDelete.status === 'achieved') {
        const expenseName = `Goal Achieved: ${goalToDelete.name}`
        const expenseToDelete = get().expenses.find(e => e.expense_name === expenseName)
        if (expenseToDelete) {
          await supabase.from('expenses').delete().eq('id', expenseToDelete.id)
          set(state => ({ expenses: state.expenses.filter(e => e.id !== expenseToDelete.id) }))
        }
      }
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
  },

  deleteInvestment: async (id: string) => {
    const invToDelete = get().investments.find(i => i.id === id)
    const { error } = await supabase.from('investments').delete().eq('id', id)
    if (!error) {
      set(state => ({ investments: state.investments.filter(i => i.id !== id) }))
      
      // Delete all associated expenses and incomes
      if (invToDelete) {
        // Delete related expenses
        const nameMatch = `Investment: ${invToDelete.name}`
        const buyMatch = `Investment Buy: ${invToDelete.name}`
        
        const expensesToDelete = get().expenses.filter(e => e.expense_name === nameMatch || e.expense_name === buyMatch)
        for (const exp of expensesToDelete) {
          await supabase.from('expenses').delete().eq('id', exp.id)
        }
        
        // Delete related incomes
        const sellMatch = `Investment Sell: ${invToDelete.name}`
        const incomesToDelete = get().incomes.filter(inc => inc.source === sellMatch)
        for (const inc of incomesToDelete) {
          await supabase.from('income').delete().eq('id', inc.id)
        }
        
        set(state => ({
          expenses: state.expenses.filter(e => e.expense_name !== nameMatch && e.expense_name !== buyMatch),
          incomes: state.incomes.filter(inc => inc.source !== sellMatch)
        }))
      }
    }
  },

  updateInvestment: async (id: string, updates: Partial<Investment>) => {
    const { error } = await supabase.from('investments').update(updates).eq('id', id)
    if (!error) {
      set(state => ({
        investments: state.investments.map(i => (i.id === id ? { ...i, ...updates } : i))
      }))
    }
  },

  addInvestment: async (investment) => {
    const { data: userResponse } = await supabase.auth.getUser()
    const user = userResponse.user
    if (!user) return

    const { data, error } = await supabase.from('investments').insert({
      ...investment,
      user_id: user.id
    }).select().single()

    if (data && !error) {
      set(state => ({ investments: [data, ...state.investments] }))
    }
  }
}))
