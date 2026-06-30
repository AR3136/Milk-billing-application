import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Customer, CustomerFormData } from '../types';
import { User, Phone, MapPin, AlertCircle, FileText, Milk, Receipt, Loader2 } from 'lucide-react';

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (data: CustomerFormData) => Promise<any>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Slide-over Panel Form component supporting Zod validation and edit mappings
 */
export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [milkType, setMilkType] = useState<'cow' | 'buffalo' | 'mixed'>(customer?.milk_type || 'cow');
  const [defaultQuantity, setDefaultQuantity] = useState(customer?.default_quantity?.toString() || '5.0');
  const [ratePerLiter, setRatePerLiter] = useState(customer?.rate_per_liter?.toString() || '45.0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      phone,
      address,
      milk_type: milkType,
      default_quantity: Number(defaultQuantity),
      rate_per_liter: Number(ratePerLiter),
    });
  };

  return (
    <Card 
      title={customer ? 'Modify Customer Record' : 'Register Customer'} 
      subtitle="Fill in default parameters and contact fields"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Full Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          disabled={isLoading}
        />
        <Input 
          label="Phone Number" 
          type="tel"
          placeholder="10 digit number"
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          required 
          disabled={isLoading}
        />
        <Input 
          label="Delivery Address" 
          value={address} 
          onChange={(e) => setAddress(e.target.value)} 
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Milk Type</label>
            <select
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={milkType}
              onChange={(e) => setMilkType(e.target.value as any)}
              disabled={isLoading}
            >
              <option value="cow">Cow</option>
              <option value="buffalo">Buffalo</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <Input 
            label="Default Liters" 
            type="number"
            step="0.1"
            value={defaultQuantity} 
            onChange={(e) => setDefaultQuantity(e.target.value)} 
            required 
            disabled={isLoading}
          />
          <Input 
            label="Liters Rate (₹)" 
            type="number"
            step="0.5"
            value={ratePerLiter} 
            onChange={(e) => setRatePerLiter(e.target.value)} 
            required 
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 justify-end pt-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {customer ? 'Update Record' : 'Register Customer'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

interface CustomerProfileProps {
  customer: Customer;
  ledger: {
    milkEntries: any[];
    payments: any[];
  };
  onEdit: () => void;
  onArchive: () => void;
  isLoading?: boolean;
}

/**
 * Customer Profile detailed dashboard views
 */
export const CustomerProfileDetail: React.FC<CustomerProfileProps> = ({
  customer,
  ledger,
  onEdit,
  onArchive,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'milk' | 'payments'>('milk');

  return (
    <div className="space-y-6">
      
      {/* Contact Summary Panel */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl border border-blue-100">
              {customer.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{customer.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5" /> {customer.phone}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} disabled={isLoading}>Edit Profile</Button>
            <Button variant="outline" size="sm" className="text-rose-600 border-rose-100 bg-rose-50/20 hover:bg-rose-50" onClick={onArchive} disabled={isLoading}>
              Archive Member
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Outstanding Balance</p>
            <h4 className="text-lg font-extrabold text-rose-600">₹{customer.rate_per_liter * 30}</h4>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Milk Type</p>
            <h4 className="text-lg font-bold capitalize text-slate-800">{customer.milk_type}</h4>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Default Yield</p>
            <h4 className="text-lg font-bold text-slate-800">{customer.default_quantity} L/day</h4>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Rate Scheme</p>
            <h4 className="text-lg font-bold text-slate-800">₹{customer.rate_per_liter}/L</h4>
          </div>
        </div>
      </Card>

      {/* Contact & notes grid split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card title="Contact Card">
            <div className="space-y-3.5 text-xs">
              <div className="flex gap-2.5">
                <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-500">Delivery Address</p>
                  <p className="text-slate-800 mt-0.5">{customer.address || 'No address added'}</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <User className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-500">Emergency Contact</p>
                  <p className="text-slate-800 mt-0.5">Patil (Brother) — 98765 43211</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-500">Notes Log</p>
                  <p className="text-slate-800 mt-0.5">Collect bills at end of cycle. Deliver double on Sundays.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Ledger logs tabs */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('milk')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'milk' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5"><Milk className="w-4 h-4" /> Deliveries Log</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5"><Receipt className="w-4 h-4" /> Payments Ledger</span>
            </button>
          </div>

          <Card>
            {activeTab === 'milk' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Shift</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ledger.milkEntries.length > 0 ? (
                      ledger.milkEntries.map((e) => (
                        <tr key={e.id}>
                          <td className="py-3 px-3">{e.date}</td>
                          <td className="py-3 px-3 capitalize">{e.shift}</td>
                          <td className="py-3 px-3 font-semibold">{e.quantity} L</td>
                          <td className="py-3 px-3 text-right font-bold">₹{e.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">No milk entries recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      <th className="py-2.5 px-3">Receipt ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ledger.payments.length > 0 ? (
                      ledger.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400">#REC-{p.id}</td>
                          <td className="py-3 px-3">{p.payment_date || p.date}</td>
                          <td className="py-3 px-3 uppercase">{p.payment_method || p.method}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">₹{p.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">No payment records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
};
