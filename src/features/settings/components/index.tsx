import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { getUPIQRCodeLink } from '../services';
import { Settings, Save, ToggleLeft, ToggleRight, Download, UploadCloud, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface BusinessProfileFormProps {
  onSave: (data: any) => Promise<any>;
  isLoading?: boolean;
}

/**
 * Form details card for profile parameters
 */
export const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ onSave, isLoading = false }) => {
  const [name, setName] = useState('Ganga Dairy Farm');
  const [phone, setPhone] = useState('9876543210');
  const [address, setAddress] = useState('Pune, Maharashtra');
  const [upi, setUpi] = useState('gangadairy@ybl');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      business_name: name,
      business_phone: phone,
      business_address: address,
      currency: 'INR',
    });
  };

  return (
    <Card title="Corporate Details" subtitle="Settings used for invoice headers">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Business Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            disabled={isLoading}
          />
          <Input 
            label="Support Phone" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            disabled={isLoading}
          />
        </div>
        <Input 
          label="Helpline Address" 
          value={address} 
          onChange={e => setAddress(e.target.value)} 
          disabled={isLoading}
        />
        <Input 
          label="UPI Account ID (for invoice payment QR)" 
          placeholder="e.g. name@bank"
          value={upi} 
          onChange={e => setUpi(e.target.value)} 
          disabled={isLoading}
        />
        
        <Button type="submit" disabled={isLoading} className="gap-2 rounded-xl">
          <Save className="w-4 h-4" /> Save General Details
        </Button>
      </form>
    </Card>
  );
};

interface UPIQRViewerProps {
  upiId: string;
  amount: number;
  invoice: string;
}

/**
 * UPI QR Code viewer card
 */
export const UPIQRViewer: React.FC<UPIQRViewerProps> = ({ upiId, amount, invoice }) => {
  const qrLink = getUPIQRCodeLink({
    upiId,
    payeeName: 'Ganga Dairy Farm',
    amount,
    invoiceNumber: invoice
  });

  return (
    <Card title="Instant Payment QR" subtitle="Generate scan-to-pay codes for invoices">
      <div className="flex flex-col items-center justify-center text-center space-y-3.5 text-xs">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
          <img src={qrLink} alt="UPI QR Code" className="w-40 h-40" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Scan to Settle: ₹{amount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Account ID: {upiId} • Invoice: {invoice}</p>
        </div>
      </div>
    </Card>
  );
};

interface SystemAdminCardProps {
  onTriggerBackup: () => Promise<any>;
  isLoading?: boolean;
}

/**
 * System configurations card containing backup controls and languages
 */
export const SystemAdminCard: React.FC<SystemAdminCardProps> = ({ onTriggerBackup, isLoading = false }) => {
  return (
    <Card title="Maintenance Controls" subtitle="Run backups and updates checks">
      <div className="space-y-4 text-xs">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800">
          <Settings className="w-5 h-5 shrink-0 animate-spin" />
          <div>
            <h6 className="text-xs font-bold">Maintenance Status OK</h6>
            <p className="text-[10px] text-blue-700 mt-0.5">Database tables sync status matches Supabase.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onTriggerBackup} disabled={isLoading} className="gap-2 rounded-xl py-2.5">
            <Download className="w-4 h-4" /> Download Backup
          </Button>
          <Button variant="outline" disabled={isLoading} className="gap-2 rounded-xl py-2.5">
            <UploadCloud className="w-4 h-4" /> Restore Data
          </Button>
        </div>
      </div>
    </Card>
  );
};
