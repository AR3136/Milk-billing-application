'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayoutShell } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { Save, ToggleLeft, ToggleRight, MessageSquare, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const router = useRouter();
  const updateAllCustomerRates = useAppStore(state => state.updateAllCustomerRates);
  const deleteUserAccount = useAppStore(state => state.deleteUserAccount);
  const currentUser = useAppStore(state => state.currentUser);

  const [businessName, setBusinessName] = useState('DairyLedger');
  const [helpline, setHelpline] = useState('+91 98765 43210');
  const [address, setAddress] = useState('DairyLedger Headquarters, Pune, Maharashtra');
  const [cowRate, setCowRate] = useState('45');
  const [buffaloRate, setBuffaloRate] = useState('60');
  const [mixedRate, setMixedRate] = useState('52');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // WhatsApp templates
  const [whatsappGreeting, setWhatsappGreeting] = useState('Hello');
  const [whatsappThankyou, setWhatsappThankyou] = useState('Please clear the dues. Thank you!');
  const [whatsappNoMilk, setWhatsappNoMilk] = useState('You did not take milk today.');

  const [whatsappGreetingMr, setWhatsappGreetingMr] = useState('नमस्कार');
  const [whatsappThankyouMr, setWhatsappThankyouMr] = useState('कृपया थकबाकी जमा करा. धन्यवाद!');
  const [whatsappNoMilkMr, setWhatsappNoMilkMr] = useState('तुम्ही आज दूध घेतले नाही.');

  const [whatsappPaymentThanks, setWhatsappPaymentThanks] = useState('We have successfully received your payment of ₹[Amount] on [Date] via [Method]. Thank you for the payment!');
  const [whatsappPaymentThanksMr, setWhatsappPaymentThanksMr] = useState('आम्हाला तुमची ₹[Amount] ची देय रक्कम [Date] रोजी [Method] द्वारे प्राप्त झाली आहे. पेमेंट केल्याबद्दल धन्यवाद!');

  // Toggles
  const [calcEnabled, setCalcEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [backupEnabled, setBackupEnabled] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBusinessName(localStorage.getItem('business_name') || 'DairyLedger');
      setHelpline(localStorage.getItem('business_phone') || '+91 98765 43210');
      setAddress(localStorage.getItem('business_address') || 'DairyLedger Headquarters, Pune, Maharashtra');
      setCowRate(localStorage.getItem('rate_cow') || '45');
      setBuffaloRate(localStorage.getItem('rate_buffalo') || '60');
      setMixedRate(localStorage.getItem('rate_mixed') || '52');
      
      setWhatsappGreeting(localStorage.getItem('whatsapp_greeting') || 'Hello');
      setWhatsappThankyou(localStorage.getItem('whatsapp_thankyou') || 'Please clear the dues. Thank you!');
      setWhatsappNoMilk(localStorage.getItem('whatsapp_no_milk') || 'You did not take milk today.');

      setWhatsappGreetingMr(localStorage.getItem('whatsapp_greeting_mr') || 'नमस्कार');
      setWhatsappThankyouMr(localStorage.getItem('whatsapp_thankyou_mr') || 'कृपया थकबाकी जमा करा. धन्यवाद!');
      setWhatsappNoMilkMr(localStorage.getItem('whatsapp_no_milk_mr') || 'तुम्ही आज दूध घेतले नाही.');

      setWhatsappPaymentThanks(localStorage.getItem('whatsapp_payment_thanks') || 'We have successfully received your payment of ₹[Amount] on [Date] via [Method]. Thank you for the payment!');
      setWhatsappPaymentThanksMr(localStorage.getItem('whatsapp_payment_thanks_mr') || 'आम्हाला तुमची ₹[Amount] ची देय रक्कम [Date] रोजी [Method] द्वारे प्राप्त झाली आहे. पेमेंट केल्याबद्दल धन्यवाद!');

      setCalcEnabled(localStorage.getItem('toggle_calc') !== 'false');
      setSmsEnabled(localStorage.getItem('toggle_sms') === 'true');
      setBackupEnabled(localStorage.getItem('toggle_backup') !== 'false');
    }
  }, []);

  const handleSaveGeneral = async () => {
    localStorage.setItem('business_name', businessName.trim());
    localStorage.setItem('business_phone', helpline.trim());
    localStorage.setItem('business_address', address.trim());
    localStorage.setItem('rate_cow', cowRate.trim());
    localStorage.setItem('rate_buffalo', buffaloRate.trim());
    localStorage.setItem('rate_mixed', mixedRate.trim());
    
    try {
      await updateAllCustomerRates(Number(cowRate), Number(buffaloRate), Number(mixedRate));
      toast.success('Settings saved and all existing customer rates updated globally!');
    } catch (err: any) {
      toast.error(err.message || 'Settings saved, but failed to update existing customers.');
    }
  };

  const handleSaveTemplates = () => {
    localStorage.setItem('whatsapp_greeting', whatsappGreeting.trim());
    localStorage.setItem('whatsapp_thankyou', whatsappThankyou.trim());
    localStorage.setItem('whatsapp_no_milk', whatsappNoMilk.trim());

    localStorage.setItem('whatsapp_greeting_mr', whatsappGreetingMr.trim());
    localStorage.setItem('whatsapp_thankyou_mr', whatsappThankyouMr.trim());
    localStorage.setItem('whatsapp_no_milk_mr', whatsappNoMilkMr.trim());

    localStorage.setItem('whatsapp_payment_thanks', whatsappPaymentThanks.trim());
    localStorage.setItem('whatsapp_payment_thanks_mr', whatsappPaymentThanksMr.trim());
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

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-2 pt-2">
                <p className="font-bold text-slate-750 dark:text-slate-200 mb-2">English Message Templates</p>
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
                <div className="grid grid-cols-1 gap-4 mt-3">
                  <Input 
                    label="No Milk Message" 
                    value={whatsappNoMilk}
                    onChange={(e) => setWhatsappNoMilk(e.target.value)}
                    placeholder="Message for when they haven't taken milk today"
                  />
                  <Input 
                    label="Payment Received Thanks Message (Use [Amount], [Date], [Method] for dynamic values)" 
                    value={whatsappPaymentThanks}
                    onChange={(e) => setWhatsappPaymentThanks(e.target.value)}
                    placeholder="e.g. Received payment of ₹[Amount] on [Date] via [Method]. Thank you!"
                  />
                </div>
              </div>

              <div className="border-t border-slate-150 dark:border-slate-800/85 my-2 pt-3">
                <p className="font-bold text-slate-750 dark:text-slate-200 mb-2">Marathi Message Templates (मराठी संदेश प्रारूप)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Greeting Prefix (मराठी नमस्कार)" 
                    value={whatsappGreetingMr}
                    onChange={(e) => setWhatsappGreetingMr(e.target.value)}
                    placeholder="उदा. नमस्कार"
                  />
                  <Input 
                    label="Ending Note (मराठी आभार टीप)" 
                    value={whatsappThankyouMr}
                    onChange={(e) => setWhatsappThankyouMr(e.target.value)}
                    placeholder="उदा. कृपया थकबाकी जमा करा. धन्यवाद!"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 mt-3">
                  <Input 
                    label="No Milk Message (दूध न घेतल्याचा संदेश)" 
                    value={whatsappNoMilkMr}
                    onChange={(e) => setWhatsappNoMilkMr(e.target.value)}
                    placeholder="उदा. तुम्ही आज दूध घेतले नाही."
                  />
                  <Input 
                    label="Payment Received Thanks Message (पेमेंट मिळाल्याबद्दल धन्यवाद संदेश) - (उदा. [Amount], [Date], [Method] वापरा)" 
                    value={whatsappPaymentThanksMr}
                    onChange={(e) => setWhatsappPaymentThanksMr(e.target.value)}
                    placeholder="उदा. आम्हाला तुमची ₹[Amount] ची देय रक्कम [Date] रोजी [Method] द्वारे प्राप्त झाली आहे."
                  />
                </div>
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

          {/* Account Danger Zone */}
          <Card title="Account Maintenance & Danger Zone" className="border-rose-100 dark:border-rose-950/30">
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-350 rounded-xl border border-rose-100 dark:border-rose-900/40 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Permanent Account Deletion</p>
                  <p className="mt-1 leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
                    Deleting your account will permanently remove all configuration settings, customers, milk delivery ledgers, expenses, and payment records from the database. 
                    <strong> This action is irreversible.</strong> After deletion, you can instantly register a fresh account using the same email address.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 dark:bg-rose-900/60 dark:hover:bg-rose-900/80 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete My Account & All Data
              </Button>
            </div>
          </Card>
        </div>

      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/25 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Delete Account & Data?</h3>
                <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wide">This action is irreversible</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you absolutely sure you want to delete your account <strong>({currentUser?.email})</strong> and wipe all dairy farm ledgers from the server?
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingAccount}
                className="px-4 py-2 text-xs font-semibold rounded-xl dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={async () => {
                  setIsDeletingAccount(true);
                  try {
                    await deleteUserAccount();
                    toast.success("Account deleted successfully.");
                    router.push('/register');
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete account. Make sure database RPC has been deployed.");
                  } finally {
                    setIsDeletingAccount(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={isDeletingAccount}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete Everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayoutShell>
  );
}
