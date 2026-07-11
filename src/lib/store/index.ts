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
  messageLanguage?: 'english' | 'marathi';
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

export interface MilkEntryFormData {
  customerId: string;
  customerName: string;
  date: string;
  shift: 'morning' | 'evening';
  quantity: number;
  rate: number;
  milkType: MilkType;
  amount?: number;
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
  customerId?: string;
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
  addMilkEntry: (e: MilkEntryFormData) => Promise<void>;
  addPayment: (p: Omit<Payment, 'id'>) => Promise<void>;
  addExpense: (ex: Omit<Expense, 'id'>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  deleteMilkEntry: (id: string) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateAllCustomerRates: (cowRate: number, buffaloRate: number, mixedRate: number) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'balance'>>) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
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
        .eq('user_id', user.id)
        .is('deleted_at', null)
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
        messageLanguage: c.message_language || 'english',
      }));

      const { data: dbEntries, error: entryError } = await supabase
        .from('milk_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(2000);

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
          amount: Math.round(Number(e.amount)),
          milkType: (e.milk_type ?? cust?.milkType ?? 'cow') as MilkType,
        };
      });

      const { data: dbPayments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
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
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(200);

      if (expError) console.error('Fetch expenses error:', expError.message);

      const expensesList: Expense[] = (dbExpenses ?? []).map(ex => ({
        id: ex.id,
        category: ex.category,
        description: ex.description,
        amount: Number(ex.amount),
        date: ex.date,
        customerId: ex.customer_id || undefined,
      }));

      const updatedCustomers = customersList.map(c => {
        const cEntries = entriesList.filter(e => e.customerId === c.id);
        const totalMilk = cEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

        const totalPaid = paymentsList
          .filter(p => p.customerId === c.id)
          .reduce((sum, p) => sum + p.amount, 0);
        const totalCreditSettle = expensesList
          .filter(ex => ex.category === 'customer_credit_settlement' && ex.customerId === c.id)
          .reduce((sum, ex) => sum + ex.amount, 0);
        const rawBalance = totalMilk - (totalPaid - totalCreditSettle);
        const cleanBalance = Math.abs(rawBalance) < 0.01 ? 0 : parseFloat(rawBalance.toFixed(2));
        return { ...c, balance: cleanBalance };
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
        message_language: c.messageLanguage || 'english',
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

    const calculatedAmount = e.amount !== undefined ? e.amount : Math.round(e.quantity * e.rate);

    const { data: inserted, error } = await supabase
      .from('milk_entries')
      .insert([{
        customer_id: e.customerId,
        user_id: user.id,
        date: e.date,
        shift: e.shift,
        quantity: e.quantity,
        rate_applied: e.rate,
        milk_type: e.milkType
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const amount = Math.round(Number(inserted.amount ?? calculatedAmount));
    const newEntry: MilkEntry = {
      id: inserted.id,
      customerId: inserted.customer_id,
      customerName: e.customerName,
      date: inserted.date,
      shift: inserted.shift as any,
      quantity: Number(inserted.quantity),
      rate: Number(inserted.rate_applied),
      amount,
      milkType: e.milkType,
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
      customers: state.customers.map(cust => {
        if (cust.id === p.customerId) {
          const raw = cust.balance - p.amount;
          const clean = Math.abs(raw) < 0.01 ? 0 : parseFloat(raw.toFixed(2));
          return { ...cust, balance: clean };
        }
        return cust;
      }),
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
        customer_id: ex.customerId || null,
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
      customerId: inserted.customer_id || undefined,
    };
    set((state) => ({ expenses: [newExpense, ...state.expenses] }));
    await get().fetchData();
  },

  deleteCustomer: async (id) => {
    const supabase = createClient();

    // Enforce sole validation rule: Outstanding balance must be exactly 0
    const currentCustomer = get().customers.find(c => c.id === id);
    if (currentCustomer && Math.abs(currentCustomer.balance) > 0.01) {
      throw new Error(`Cannot delete customer: Outstanding balance must be ₹0.00. Current: ₹${currentCustomer.balance.toFixed(2)}.`);
    }

    // 1. Get all milk entries for this customer to delete referencing bill line items
    const { data: customerEntries, error: fetchEntriesErr } = await supabase
      .from('milk_entries')
      .select('id')
      .eq('customer_id', id);

    if (fetchEntriesErr) throw new Error(`Failed to check customer entries: ${fetchEntriesErr.message}`);

    if (customerEntries && customerEntries.length > 0) {
      const entryIds = customerEntries.map(e => e.id);
      const { error: delLineItemsErr } = await supabase
        .from('bill_line_items')
        .delete()
        .in('milk_entry_id', entryIds);
      if (delLineItemsErr) throw new Error(`Failed to delete bill details: ${delLineItemsErr.message}`);
    }

    // 2. Delete customer's bills
    const { error: delBillsErr } = await supabase
      .from('bills')
      .delete()
      .eq('customer_id', id);
    if (delBillsErr) throw new Error(`Failed to delete customer invoices: ${delBillsErr.message}`);

    // 3. Delete customer's milk entries
    const { error: delEntriesErr } = await supabase
      .from('milk_entries')
      .delete()
      .eq('customer_id', id);
    if (delEntriesErr) throw new Error(`Failed to delete customer milk entries: ${delEntriesErr.message}`);

    // 4. Delete customer's payments
    const { error: delPaymentsErr } = await supabase
      .from('payments')
      .delete()
      .eq('customer_id', id);
    if (delPaymentsErr) throw new Error(`Failed to delete customer payments: ${delPaymentsErr.message}`);

    // 5. Perform customer deletion
    const { error: softDelErr } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id);

    if (softDelErr) {
      const { error: hardDelErr } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (hardDelErr) throw new Error(`Failed to delete customer: ${hardDelErr.message}`);
    }

    // Update local state
    set((state) => ({
      customers: state.customers.filter(c => c.id !== id)
    }));
  },

  updateCustomer: async (id, updates) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('customers')
      .update({
        name: updates.name,
        phone: updates.phone,
        milk_type: updates.milkType,
        rate_per_liter: updates.rate,
        rate_cow: updates.rateCow,
        rate_buffalo: updates.rateBuffalo,
        is_active: updates.isActive,
        message_language: updates.messageLanguage,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
    await get().fetchData();
  },

  updateAllCustomerRates: async (cowRate, buffaloRate, mixedRate) => {
    const supabase = createClient();
    const user = get().currentUser;
    if (!user) throw new Error('Not authenticated');

    // Update DB: this updates the standard single rate_per_liter to cow/buffalo/mixed based on their current milkType,
    // and ALSO updates the rate_cow / rate_buffalo columns.
    
    // Update cow
    await supabase.from('customers')
      .update({ rate_per_liter: cowRate, rate_cow: cowRate })
      .eq('milk_type', 'cow');
      
    // Update buffalo
    await supabase.from('customers')
      .update({ rate_per_liter: buffaloRate, rate_buffalo: buffaloRate })
      .eq('milk_type', 'buffalo');
      
    // Update mixed
    await supabase.from('customers')
      .update({ rate_per_liter: mixedRate })
      .eq('milk_type', 'mixed');
      
    // Update both type's individual rates
    await supabase.from('customers')
      .update({ rate_cow: cowRate, rate_buffalo: buffaloRate })
      .eq('milk_type', 'both');

    // Update local state
    set((state) => ({
      customers: state.customers.map(c => {
        let newRate = c.rate;
        if (c.milkType === 'cow') newRate = cowRate;
        else if (c.milkType === 'buffalo') newRate = buffaloRate;
        else if (c.milkType === 'mixed') newRate = mixedRate;
        
        return {
          ...c,
          rate: newRate,
          rateCow: cowRate,
          rateBuffalo: buffaloRate
        };
      })
    }));
  },

  deleteMilkEntry: async (id) => {
    const supabase = createClient();

    // 1. Verify if milk entry belongs to a finalized bill
    const { data: lineItems, error: lineErr } = await supabase
      .from('bill_line_items')
      .select('bill_id')
      .eq('milk_entry_id', id);

    if (lineErr) throw new Error(lineErr.message);

    if (lineItems && lineItems.length > 0) {
      const billIds = lineItems.map(item => item.bill_id);
      
      const { data: bills, error: billsErr } = await supabase
        .from('bills')
        .select('status, bill_number')
        .in('id', billIds)
        .is('deleted_at', null);

      if (billsErr) throw new Error(billsErr.message);

      const finalizedStatuses = ['sent', 'paid', 'partially_paid', 'overdue'];
      const finalizedBill = bills?.find(b => finalizedStatuses.includes(b.status));

      if (finalizedBill) {
        throw new Error(`Cannot delete: This entry belongs to a finalized bill (${finalizedBill.bill_number}). Finalized bills must be reopened or cancelled before modifying associated entries.`);
      }

      // Deleting line item association for draft/generated bills
      const { error: deleteLinesErr } = await supabase
        .from('bill_line_items')
        .delete()
        .eq('milk_entry_id', id);

      if (deleteLinesErr) throw new Error(deleteLinesErr.message);

      // Recalculate affected bills
      for (const billId of billIds) {
        const { data: remainingItems } = await supabase
          .from('bill_line_items')
          .select('quantity, amount')
          .eq('bill_id', billId);

        const newQty = remainingItems?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
        const newAmt = remainingItems?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const { data: billData } = await supabase
          .from('bills')
          .select('balance_forward')
          .eq('id', billId)
          .single();

        const balForward = Number(billData?.balance_forward || 0);

        await supabase
          .from('bills')
          .update({
            total_quantity: newQty,
            total_amount: newAmt,
            net_payable: newAmt + balForward
          })
          .eq('id', billId);
      }
    }

    // 2. Perform the deletion of the milk entry
    const { error: entryDelErr } = await supabase
      .from('milk_entries')
      .delete()
      .eq('id', id);

    if (entryDelErr) throw new Error(entryDelErr.message);

    // 3. Automatically reload state & recalculate everything dynamically
    await get().fetchData();
  },

  deletePayment: async (id) => {
    const supabase = createClient();
    const payment = get().payments.find(p => p.id === id);
    if (!payment) return;

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    set((state) => ({
      payments: state.payments.filter(p => p.id !== id),
      customers: state.customers.map(cust => {
        if (cust.id === payment.customerId) {
          const raw = cust.balance + payment.amount;
          const clean = Math.abs(raw) < 0.01 ? 0 : parseFloat(raw.toFixed(2));
          return { ...cust, balance: clean };
        }
        return cust;
      }),
    }));
  },

  deleteExpense: async (id) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    set((state) => ({
      expenses: state.expenses.filter(ex => ex.id !== id),
    }));
  },

  deleteUserAccount: async () => {
    const supabase = createClient();
    // Try executing RPC
    const { error: rpcErr } = await supabase.rpc('delete_user_account');
    if (rpcErr) throw new Error(rpcErr.message);

    // Sign out session
    await supabase.auth.signOut();

    // Reset local state
    set({
      customers: [],
      milkEntries: [],
      payments: [],
      expenses: [],
      currentUser: null,
    });
  },
}));
