'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { Save, ToggleLeft, ToggleRight, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const updateAllCustomerRates = useAppStore(state => state.updateAllCustomerRates);
  const [businessName, setBusinessName] = useState('Ganga Dairy Farm');
  const [helpline, setHelpline] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Ganga Chowk, Sector-4, Pune, Maharashtra');
  const [cowRate, setCowRate] = useState('45');
  const [buffaloRate, setBuffaloRate] = useState('60');
  const [mixedRate, setMixedRate] = useState('52');

  // WhatsApp templates
  const [whatsappGreeting, setWhatsappGreeting] = useState('Hello');
  const [whatsappThankyou, setWhatsappThankyou] = useState('Please clear the dues. Thank you!');

  // Toggles
  const [calcEnabled, setCalcEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [backupEnabled, setBackupEnabled] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBusinessName(localStorage.getItem('business_name') || 'Ganga Dairy Farm');
      setHelpline(localStorage.getItem('business_phone') || '+91 98765 43210');
      setAddress(localStorage.getItem('business_address') || 'Ganga Chowk, Sector-4, Pune, Maharashtra');
      setCowRate(localStorage.getItem('rate_cow') || '45');
      setBuffaloRate(localStorage.getItem('rate_buffalo') || '60');
      setMixedRate(localStorage.getItem('rate_mixed') || '52');
      
      setWhatsappGreeting(localStorage.getItem('whatsapp_greeting') || 'Hello');
      setWhatsappThankyou(localStorage.getItem('whatsapp_thankyou') || 'Please clear the dues. Thank you!');

      setCalcEnabled(localStorage.getItem('toggle_calc') !== 'false');
      setSmsEnabled(localStorage.getItem('toggle_sms') === 'true');
      setBackupEnabled(localStorage.getItem('toggle_backup') !== 'false');
    }
  }, []);

  const handleSaveGeneral = async () => {
    localStorage.setItem('business_name', businessName);
    localStorage.setItem('business_phone', helpline);
    localStorage.setItem('business_address', address);
    localStorage.setItem('rate_cow', cowRate);
    localStorage.setItem('rate_buffalo', buffaloRate);
    localStorage.setItem('rate_mixed', mixedRate);
    
    try {
      await updateAllCustomerRates(Number(cowRate), Number(buffaloRate), Number(mixedRate));
      toast.success('Settings saved and all existing customer rates updated globally!');
    } catch (err: any) {
      toast.error(err.message || 'Settings saved, but failed to update existing customers.');
    }
  };

  const handleSaveTemplates = () => {
    localStorage.setItem('whatsapp_greeting', whatsappGreeting);
    localStorage.setItem('whatsapp_thankyou', whatsappThankyou);
    toast.success('WhatsApp templates updated successfully!');
  };

  return (
    <DashboardLayoutShell title="Settings Control">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="General Profile Settings" subtitle="Business details used in invoices headers">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Business Legal Name" 
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)} 
                />
                <Input 
                  label="Admin Helpline Contact" 
                  value={helpline} 
                  onChange={(e) => setHelpline(e.target.value)} 
                />
              </div>
              <Input 
                label="Business Address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Default Cow Rate (₹)" 
                  type="number" 
                  value={cowRate} 
                  onChange={(e) => setCowRate(e.target.value)} 
                />
                <Input 
                  label="Default Buffalo Rate (₹)" 
                  type="number" 
                  value={buffaloRate} 
                  onChange={(e) => setBuffaloRate(e.target.value)} 
                />
                <Input 
                  label="Mixed Yield Rate (₹)" 
                  type="number" 
                  value={mixedRate} 
                  onChange={(e) => setMixedRate(e.target.value)} 
                />
              </div>
              <Button onClick={handleSaveGeneral} className="gap-2 rounded-xl">
                <Save className="w-4 h-4" /> Save Business Details
              </Button>
            </div>
          </Card>

          {/* WhatsApp Template editor */}
          <Card title="WhatsApp Message Template" subtitle="Configure greeting prefix and ending footer note">
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-300 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <p className="font-semibold">Shared Template Structure:</p>
                <p className="mt-1 leading-relaxed">The message body will look exactly like your copied clipboard invoice, starting with your customizable greeting prefix and ending with your custom closing footer.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Greeting Prefix Word" 
                  value={whatsappGreeting}
                  onChange={(e) => setWhatsappGreeting(e.target.value)}
                  placeholder="e.g. Hello, Dear, Namaste"
                />
                <Input 
                  label="Ending / Thank You Note" 
                  value={whatsappThankyou}
                  onChange={(e) => setWhatsappThankyou(e.target.value)}
                  placeholder="e.g. Please clear the dues. Thank you!"
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveTemplates} className="gap-2 rounded-xl">
                  <MessageSquare className="w-4 h-4" /> Save Message Templates
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Switches Toggle list */}
        <div>
          <Card title="Feature Configuration" subtitle="Toggle optional modules">
            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between items-center py-2">
                <div>
                  <h5 className="text-xs font-semibold">Enable Fat/SNF calculations</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Add fat tracking inputs to milk entry</p>
                </div>
                {calcEnabled ? (
                  <ToggleRight 
                    onClick={() => { setCalcEnabled(false); localStorage.setItem('toggle_calc', 'false'); }}
                    className="w-8 h-8 text-blue-600 cursor-pointer" 
                  />
                ) : (
                  <ToggleLeft 
                    onClick={() => { setCalcEnabled(true); localStorage.setItem('toggle_calc', 'true'); }}
                    className="w-8 h-8 text-slate-300 cursor-pointer" 
                  />
                )}
              </div>
              <div className="flex justify-between items-center pt-3">
                <div>
                  <h5 className="text-xs font-semibold">SMS Billing Notifications</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Send updates to client phones</p>
                </div>
                {smsEnabled ? (
                  <ToggleRight 
                    onClick={() => { setSmsEnabled(false); localStorage.setItem('toggle_sms', 'false'); }}
                    className="w-8 h-8 text-blue-600 cursor-pointer" 
                  />
                ) : (
                  <ToggleLeft 
                    onClick={() => { setSmsEnabled(true); localStorage.setItem('toggle_sms', 'true'); }}
                    className="w-8 h-8 text-slate-300 cursor-pointer" 
                  />
                )}
              </div>
              <div className="flex justify-between items-center pt-3">
                <div>
                  <h5 className="text-xs font-semibold">Automatic System Backups</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Backup Supabase daily</p>
                </div>
                {backupEnabled ? (
                  <ToggleRight 
                    onClick={() => { setBackupEnabled(false); localStorage.setItem('toggle_backup', 'false'); }}
                    className="w-8 h-8 text-blue-600 cursor-pointer" 
                  />
                ) : (
                  <ToggleLeft 
                    onClick={() => { setBackupEnabled(true); localStorage.setItem('toggle_backup', 'true'); }}
                    className="w-8 h-8 text-slate-300 cursor-pointer" 
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayoutShell>
  );
}
