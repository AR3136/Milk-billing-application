import { create } from 'zustand';
import { createClient } from '../supabase/client';

export type MilkType = 'cow' | 'buffalo' | 'mixed' | 'both';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  milkType: MilkType;
  // For 'both' type customers, individual rates per type
  rateCow: number;
  rateBuffalo: number;
  rate: number;   // default/display rate (used for non-both types)
  balance: number;
  isActive: boolean;
}

export interface MilkEntry {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  shift: 'morning' | 'evening';
  quantity: number;
  rate: number;
  amount: number;
  milkType: MilkType;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  method: 'cash' | 'upi' | 'bank_transfer';
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AppStore {
  customers: Customer[];
  milkEntries: MilkEntry[];
  payments: Payment[];
  expenses: Expense[];
  currentUser: CurrentUser | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (o: boolean) => void;
  loadCurrentUser: () => Promise<CurrentUser | null>;
  fetchData: () => Promise<void>;
  addCustomer: (c: Omit<Customer, 'id' | 'balance'>) => Promise<void>;
  addMilkEntry: (e: Omit<MilkEntry, 'id' | 'amount'>) => Promise<void>;
  addPayment: (p: Omit<Payment, 'id'>) => Promise<void>;
  addExpense: (ex: Omit<Expense, 'id'>) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  customers: [],
  milkEntries: [],
  payments: [],
  expenses: [],
  currentUser: null,
  isLoading: false,
  isSidebarOpen: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (o) => set({ isSidebarOpen: o }),

  loadCurrentUser: async () => {
    const supabase = createClient();
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      const cu: CurrentUser = {
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.name ?? user.email ?? 'User',
        role: user.user_metadata?.role ?? 'operator',
      };
      set({ currentUser: cu });
      return cu;
    } catch {
      return null;
    }
  },

  fetchData: async () => {
    set({ isLoading: true });
    const supabase = createClient();

    let user = get().currentUser;
    if (!user) {
      user = await get().loadCurrentUser();
    }
    if (!user) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data: dbCustomers, error: custError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: true });

      if (custError) {
        console.error('Fetch customers error:', custError.message);
        set({ isLoading: false });
        return;
      }

      const customersList: Customer[] = (dbCustomers ?? []).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        milkType: c.milk_type as MilkType,
        rate: Number(c.rate_per_liter),
        rateCow: Number(c.rate_cow ?? c.rate_per_liter),
        rateBuffalo: Number(c.rate_buffalo ?? c.rate_per_liter),
        balance: 0,
        isActive: c.is_active,
      }));

      const { data: dbEntries, error: entryError } = await supabase
        .from('milk_entries')
        .select('*')
        .order('date', { ascending: false })
        .limit(200);

      if (entryError) console.error('Fetch entries error:', entryError.message);

      const entriesList: MilkEntry[] = (dbEntries ?? []).map(e => {
        const cust = customersList.find(c => c.id === e.customer_id);
        return {
          id: e.id,
          customerId: e.customer_id,
          customerName: cust?.name ?? 'Unknown',
          date: e.date,
          shift: e.shift as any,
          quantity: Number(e.quantity),
          rate: Number(e.rate_applied),
          amount: Number(e.amount),
          milkType: (e.milk_type ?? cust?.milkType ?? 'cow') as MilkType,
        };
      });

      const { data: dbPayments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(200);

      if (payError) console.error('Fetch payments error:', payError.message);

      const paymentsList: Payment[] = (dbPayments ?? []).map(p => {
        const cust = customersList.find(c => c.id === p.customer_id);
        return {
          id: p.id,
          customerId: p.customer_id,
          customerName: cust?.name ?? 'Unknown',
          amount: Number(p.amount),
          date: p.payment_date?.slice(0, 10) ?? '',
          method: p.payment_method as any,
        };
      });

      const { data: dbExpenses, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
        .limit(200);

      if (expError) console.error('Fetch expenses error:', expError.message);

      const expensesList: Expense[] = (dbExpenses ?? []).map(ex => ({
        id: ex.id,
        category: ex.category,
        description: ex.description,
        amount: Number(ex.amount),
        date: ex.date,
      }));

      const updatedCustomers = customersList.map(c => {
        const totalMilk = entriesList
          .filter(e => e.customerId === c.id)
          .reduce((sum, e) => sum + e.amount, 0);
        const totalPaid = paymentsList
          .filter(p => p.customerId === c.id)
          .reduce((sum, p) => sum + p.amount, 0);
        return { ...c, balance: Math.max(0, totalMilk - totalPaid) };
      });

      set({
        customers: updatedCustomers,
        milkEntries: entriesList,
        payments: paymentsList,
        expenses: expensesList,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('fetchData error:', err?.message ?? err);
      set({ isLoading: false });
    }
  },

  addCustomer: async (c) => {
    const supabase = createClient();
    const user = get().currentUser;
    if (!user) throw new Error('Not authenticated');

    const { data: inserted, error } = await supabase
      .from('customers')
      .insert([{
        user_id: user.id,
        name: c.name,
        phone: c.phone,
        milk_type: c.milkType,
        rate_per_liter: c.rate,
        rate_cow: c.rateCow,
        rate_buffalo: c.rateBuffalo,
        default_quantity: 5.0,
        is_active: c.isActive,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const mapped: Customer = {
      id: inserted.id,
      name: inserted.name,
      phone: inserted.phone,
      milkType: inserted.milk_type as MilkType,
      rate: Number(inserted.rate_per_liter),
      rateCow: Number(inserted.rate_cow ?? inserted.rate_per_liter),
      rateBuffalo: Number(inserted.rate_buffalo ?? inserted.rate_per_liter),
      balance: 0,
      isActive: inserted.is_active,
    };
    set((state) => ({ customers: [...state.customers, mapped] }));
  },

  addMilkEntry: async (e) => {
    const supabase = createClient();
    const user = get().currentUser;
    if (!user) throw new Error('Not authenticated');

    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.customerId);
    if (!isValidUUID) throw new Error('Invalid customer selected. Please pick a valid customer.');

    const { data: inserted, error } = await supabase
      .from('milk_entries')
      .insert([{
        customer_id: e.customerId,
        user_id: user.id,
        date: e.date,
        shift: e.shift,
        quantity: e.quantity,
        rate_applied: e.rate,
        milk_type: e.milkType,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const amount = Number(inserted.amount ?? e.quantity * e.rate);
    const newEntry: MilkEntry = {
      id: inserted.id,
      customerId: inserted.customer_id,
      customerName: e.customerName,
      date: inserted.date,
      shift: inserted.shift as any,
      quantity: Number(inserted.quantity),
      rate: Number(inserted.rate_applied),
      amount,
      milkType: (inserted.milk_type ?? e.milkType) as MilkType,
    };

    set((state) => ({
      milkEntries: [newEntry, ...state.milkEntries],
      customers: state.customers.map(cust =>
        cust.id === e.customerId
          ? { ...cust, balance: cust.balance + amount }
          : cust
      ),
    }));
  },

  addPayment: async (p) => {
    const supabase = createClient();
    const user = get().currentUser;
    if (!user) throw new Error('Not authenticated');

    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.customerId);
    if (!isValidUUID) throw new Error('Invalid customer selected.');

    const { data: inserted, error } = await supabase
      .from('payments')
      .insert([{
        customer_id: p.customerId,
        user_id: user.id,
        amount: p.amount,
        payment_date: new Date(p.date).toISOString(),
        payment_method: p.method,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const newPayment: Payment = {
      id: inserted.id,
      customerId: inserted.customer_id,
      customerName: p.customerName,
      amount: Number(inserted.amount),
      date: inserted.payment_date?.slice(0, 10) ?? p.date,
      method: inserted.payment_method as any,
    };

    set((state) => ({
      payments: [newPayment, ...state.payments],
      customers: state.customers.map(cust =>
        cust.id === p.customerId
          ? { ...cust, balance: Math.max(0, cust.balance - p.amount) }
          : cust
      ),
    }));
  },

  addExpense: async (ex) => {
    const supabase = createClient();
    const user = get().currentUser;
    if (!user) throw new Error('Not authenticated');

    const { data: inserted, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: user.id,
        category: ex.category,
        description: ex.description,
        amount: ex.amount,
        date: ex.date,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const newExpense: Expense = {
      id: inserted.id,
      category: inserted.category,
      description: inserted.description,
      amount: Number(inserted.amount),
      date: inserted.date,
    };
    set((state) => ({ expenses: [newExpense, ...state.expenses] }));
  },
}));
