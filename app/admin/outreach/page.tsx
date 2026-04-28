// ============================================================
// FILE: page.tsx
// WHERE TO PUT THIS:
//   C:\Users\citys\Documents\yardshoppers\app\admin\outreach\page.tsx
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { OUTREACH_CATEGORIES, generateEmail } from '@/lib/outreach-templates';
import { getResearchPrompt } from '@/lib/research-prompts';
import * as XLSX from 'xlsx';

// ---- Types ----
interface SendHistory {
  sent_at: string;
  sent_by_email: string;
  category: string;
  email_subject: string;
  status: string;
  organization_name: string;
}

interface Contact {
  row: number;
  name: string;
  email: string;
  city: string;
  region: string;
  orgType: string;
  phone: string;
  notes: string;
  valid: boolean;
  reason?: string;
  history: SendHistory[];
  flagged: boolean;
  approved: boolean;
}

interface SendResult {
  email: string;
  name: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

type Step = 'category' | 'upload' | 'preview' | 'review' | 'sending' | 'complete';

// ---- Email validation ----
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

// ---- Parse uploaded .xlsx file ----
async function parseXlsx(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
}

// ---- Map spreadsheet columns ----
function mapColumns(rows: Record<string, string>[]): Contact[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const find = (keywords: string[]) =>
    headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || '';

  const nameCol = find(['organization name', 'hoa', 'org name', 'name']);
  const emailCol = find(['email']);
  const cityCol = find(['city']);
  const regionCol = find(['region']);
  const typeCol = find(['type']);
  const phoneCol = find(['phone']);
  const notesCol = find(['notes', 'address']);

  return rows.map((r, i) => {
    const email = (r[emailCol] || '').toString().trim();
    const name = (r[nameCol] || '').toString().trim();
    const valid = isValidEmail(email);
    let reason: string | undefined;
    if (!email) reason = 'No email';
    else if (!valid) reason = `Bad email: ${email}`;

    return {
      row: i + 2,
      name,
      email,
      city: (r[cityCol] || '').toString().trim(),
      region: (r[regionCol] || '').toString().trim(),
      orgType: (r[typeCol] || 'HOA').toString().trim(),
      phone: (r[phoneCol] || '').toString().trim(),
      notes: (r[notesCol] || '').toString().trim(),
      valid,
      reason,
      history: [],
      flagged: false,
      approved: false,
    };
  });
}

// ---- Format date nicely ----
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ---- Get category label ----
function getCategoryLabel(catId: string): string {
  return OUTREACH_CATEGORIES.find(c => c.id === catId)?.label || catId;
}

// ============================================================
// Page Component
// ============================================================
export default function OutreachPage() {
  const supabase = createClient();

  // Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  // Wizard
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [fileName, setFileName] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // History
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyModal, setHistoryModal] = useState<Contact | null>(null);

  // Sending
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<SendResult[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Campaign
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Research prompt
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin check
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmails = [
        'levistocks93@gmail.com',
        'admin@yardshoppers.com',
        'erwin-levi@outlook.com',
        'gary.w.erwin@gmail.com',
      ];
      setIsAdmin(adminEmails.includes(user?.email || ''));
      setAdminEmail(user?.email || '');
      setAuthLoading(false);
    })();
  }, [supabase]);

  // ---- Check send history for uploaded contacts ----
  const checkHistory = useCallback(async (parsedContacts: Contact[]) => {
    setHistoryLoading(true);
    const validEmails = parsedContacts
      .filter(c => c.valid)
      .map(c => c.email.toLowerCase());

    if (validEmails.length === 0) {
      setHistoryLoading(false);
      return parsedContacts;
    }

    // Query outreach_logs for all matching emails
    const { data: logs } = await supabase
      .from('outreach_logs')
      .select('email_to, sent_by_email, category, email_subject, status, organization_name, sent_at')
      .in('email_to', validEmails)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false });

    // Build a map of email -> history records
    const historyMap: Record<string, SendHistory[]> = {};
    if (logs) {
      for (const log of logs) {
        const email = log.email_to.toLowerCase();
        if (!historyMap[email]) historyMap[email] = [];
        historyMap[email].push({
          sent_at: log.sent_at || log.created_at,
          sent_by_email: log.sent_by_email || 'Unknown admin',
          category: log.category || 'Unknown',
          email_subject: log.email_subject || 'No subject',
          status: log.status,
          organization_name: log.organization_name || '',
        });
      }
    }

    // Attach history to contacts and flag duplicates
    const updatedContacts = parsedContacts.map(c => {
      const emailHistory = historyMap[c.email.toLowerCase()] || [];
      return {
        ...c,
        history: emailHistory,
        flagged: emailHistory.length > 0,
        approved: false,
      };
    });

    // Sort: valid + no history first, valid + flagged last
    updatedContacts.sort((a, b) => {
      if (!a.valid && b.valid) return 1;
      if (a.valid && !b.valid) return -1;
      if (a.flagged && !b.flagged) return 1;
      if (!a.flagged && b.flagged) return -1;
      return 0;
    });

    setHistoryLoading(false);
    return updatedContacts;
  }, [supabase]);

  // ---- File upload handler ----
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const rows = await parseXlsx(file);
      const mapped = mapColumns(rows);
      const withHistory = await checkHistory(mapped);
      setContacts(withHistory);
      setPreviewIndex(0);
      // If there are flagged contacts, go to review step first
      const hasFlagged = withHistory.some(c => c.valid && c.flagged);
      setStep(hasFlagged ? 'review' : 'preview');
    } catch (err) {
      console.error('Parse error:', err);
      alert('Failed to parse spreadsheet. Make sure it\'s a valid .xlsx file.');
    }
  }, [checkHistory]);

  // ---- Drag & drop ----
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      alert('Please upload an .xlsx file');
      return;
    }
    setFileName(file.name);
    try {
      const rows = await parseXlsx(file);
      const mapped = mapColumns(rows);
      const withHistory = await checkHistory(mapped);
      setContacts(withHistory);
      setPreviewIndex(0);
      const hasFlagged = withHistory.some(c => c.valid && c.flagged);
      setStep(hasFlagged ? 'review' : 'preview');
    } catch (err) {
      console.error('Parse error:', err);
      alert('Failed to parse spreadsheet.');
    }
  }, [checkHistory]);

  // ---- Toggle approval for flagged contact ----
  const toggleApproval = (index: number) => {
    setContacts(prev => prev.map((c, i) => {
      if (i === index) return { ...c, approved: !c.approved };
      return c;
    }));
  };

  // ---- Approve all flagged ----
  const approveAll = () => {
    setContacts(prev => prev.map(c => c.flagged ? { ...c, approved: true } : c));
  };

  // ---- Reject all flagged ----
  const rejectAll = () => {
    setContacts(prev => prev.map(c => c.flagged ? { ...c, approved: false } : c));
  };

  // ---- Send emails ----
  const sendAllEmails = useCallback(async () => {
    // Build send list: valid + not flagged first, then valid + flagged + approved
    const newContacts = contacts.filter(c => c.valid && !c.flagged);
    const approvedContacts = contacts.filter(c => c.valid && c.flagged && c.approved);
    const skippedContacts = contacts.filter(c => c.valid && c.flagged && !c.approved);
    const sendList = [...newContacts, ...approvedContacts];

    if (sendList.length === 0) return;

    setIsSending(true);
    setStep('sending');
    setSendProgress({ current: 0, total: sendList.length });
    setResults([]);

    // Create campaign in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const { data: campaign } = await supabase.from('outreach_campaigns').insert({
      category: selectedCategory,
      file_name: fileName,
      total_contacts: sendList.length,
      status: 'sending',
      created_by: user?.id,
    }).select().single();

    if (campaign) setCampaignId(campaign.id);

    // Insert all contacts into outreach_contacts
    if (campaign) {
      await supabase.from('outreach_contacts').insert(
        sendList.map(c => ({
          campaign_id: campaign.id,
          organization_name: c.name,
          email: c.email,
          city: c.city,
          region: c.region,
          org_type: c.orgType,
          phone: c.phone,
          notes: c.notes,
          status: 'pending',
        }))
      );
    }

    // Pre-populate skipped results
    const allResults: SendResult[] = skippedContacts.map(c => ({
      email: c.email,
      name: c.name,
      status: 'skipped' as const,
    }));

    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < sendList.length; i++) {
      const c = sendList[i];
      const { subject, body } = generateEmail(selectedCategory, c.name, c.city, c.orgType);

      try {
        const res = await fetch('/api/admin/outreach/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: c.email,
            subject,
            emailBody: body,
            category: selectedCategory,
            organizationName: c.name,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Send failed');
        }

        sentCount++;
        allResults.push({ email: c.email, name: c.name, status: 'sent' });

        // Log to outreach_logs with full history data
        if (campaign) {
          await supabase.from('outreach_contacts')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('campaign_id', campaign.id)
            .eq('email', c.email);

          await supabase.from('outreach_logs').insert({
            campaign_id: campaign.id,
            email_to: c.email,
            email_subject: subject,
            status: 'sent',
            sent_by_email: adminEmail,
            category: selectedCategory,
            organization_name: c.name,
            sent_at: new Date().toISOString(),
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        failCount++;
        allResults.push({ email: c.email, name: c.name, status: 'failed', error: message });

        if (campaign) {
          await supabase.from('outreach_contacts')
            .update({ status: 'failed', error_message: message })
            .eq('campaign_id', campaign.id)
            .eq('email', c.email);

          await supabase.from('outreach_logs').insert({
            campaign_id: campaign.id,
            email_to: c.email,
            email_subject: subject,
            status: 'failed',
            error_message: message,
            sent_by_email: adminEmail,
            category: selectedCategory,
            organization_name: c.name,
            sent_at: new Date().toISOString(),
          });
        }
      }

      setSendProgress({ current: i + 1, total: sendList.length });
      setResults([...allResults]);

      // 45-second delay between emails (skip after last)
      if (i < sendList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 45000));
      }
    }

    // Update campaign
    if (campaign) {
      await supabase.from('outreach_campaigns').update({
        sent_count: sentCount,
        failed_count: failCount,
        status: 'completed',
        updated_at: new Date().toISOString(),
      }).eq('id', campaign.id);
    }

    setIsSending(false);
    setStep('complete');
  }, [contacts, selectedCategory, fileName, supabase, adminEmail]);

  // ---- Computed ----
  const validContacts = contacts.filter(c => c.valid);
  const invalidContacts = contacts.filter(c => !c.valid);
  const flaggedContacts = contacts.filter(c => c.valid && c.flagged);
  const newContacts = contacts.filter(c => c.valid && !c.flagged);
  const approvedFlagged = contacts.filter(c => c.valid && c.flagged && c.approved);
  const totalToSend = newContacts.length + approvedFlagged.length;

  const previewContact = validContacts[previewIndex] || validContacts[0];
  const previewEmail = previewContact
    ? generateEmail(selectedCategory, previewContact.name, previewContact.city, previewContact.orgType)
    : null;

  // ---- Auth gate ----
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6A4F]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B4332]">📧 Outreach Email System</h1>
          <p className="text-gray-500 mt-1">Upload a spreadsheet, preview personalized emails, and send — all from here.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(['category', 'upload', 'review', 'preview', 'sending', 'complete'] as Step[]).map((s, i) => {
            const labels = ['Category', 'Upload', 'Review', 'Preview & Send', 'Sending', 'Done'];
            const icons = ['📋', '📂', '🔍', '👁️', '📤', '✅'];
            const stepOrder = ['category', 'upload', 'review', 'preview', 'sending', 'complete'];
            const isCurrent = step === s;
            const isPast = stepOrder.indexOf(step) > i;

            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isPast ? 'bg-[#2D6A4F] text-white'
                    : isCurrent ? 'bg-[#40916C] text-white ring-4 ring-green-200'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {isPast ? '✓' : icons[i]}
                </div>
                <span className={`text-sm hidden sm:inline ${isCurrent ? 'font-semibold text-[#1B4332]' : 'text-gray-400'}`}>
                  {labels[i]}
                </span>
                {i < 5 && <div className={`flex-1 h-0.5 ${isPast ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* ========== STEP 1: SELECT CATEGORY ========== */}
        {step === 'category' && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Select Outreach Category</h2>
            <p className="text-gray-500 text-sm mb-6">Choose the type of organization you are reaching out to. Each category uses a tailored email template.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {OUTREACH_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setStep('upload'); }}
                  className={`p-5 rounded-xl border-2 text-left transition hover:shadow-md hover:border-[#40916C] ${
                    selectedCategory === cat.id ? 'border-[#2D6A4F] bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="font-semibold text-[#1B4332]">{cat.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{cat.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========== STEP 2: UPLOAD EXCEL ========== */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('category')} className="text-gray-400 hover:text-gray-700 text-lg">←</button>
              <div>
                <h2 className="text-xl font-semibold text-[#1B4332]">
                  Upload {OUTREACH_CATEGORIES.find(c => c.id === selectedCategory)?.label} Spreadsheet
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Required columns: Organization Name, Email, City. Optional: Region, Type, Phone, Notes/Address.
                </p>
              </div>
            </div>

            <label
              className="block border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#40916C] hover:bg-green-50 transition"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input type="file" accept=".xlsx" onChange={handleFile} className="hidden" />
              <div className="text-4xl mb-3">📂</div>
              {historyLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2D6A4F]" />
                  <p className="text-gray-600 font-medium">Checking send history...</p>
                </div>
              ) : fileName ? (
                <p className="font-medium text-[#2D6A4F]">{fileName} — {contacts.length} contacts parsed</p>
              ) : (
                <>
                  <p className="text-gray-600 font-medium">Drag & drop your .xlsx file here</p>
                  <p className="text-gray-400 text-sm mt-1">or click to browse</p>
                </>
              )}
            </label>

            {/* Research Prompt Section */}
            <div className="mt-6 border border-blue-200 rounded-xl bg-blue-50 overflow-hidden">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-blue-100 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🤖</span>
                  <div>
                    <div className="font-semibold text-[#1B4332] text-sm">Need to gather contacts? Use this Copilot script</div>
                    <div className="text-xs text-gray-500 mt-0.5">Copy this prompt into Copilot Chat to find emails for {OUTREACH_CATEGORIES.find(c => c.id === selectedCategory)?.label}</div>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">{showPrompt ? '▲' : '▼'}</span>
              </button>

              {showPrompt && (
                <div className="px-5 pb-5">
                  <div className="bg-white rounded-lg border p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed text-gray-700">
                    {getResearchPrompt(selectedCategory)}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getResearchPrompt(selectedCategory));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-4 py-2 bg-[#2D6A4F] text-white text-sm font-semibold rounded-lg hover:bg-[#1B4332] transition flex items-center gap-2"
                    >
                      {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
                    </button>
                    <span className="text-xs text-gray-500">Paste this into Copilot Chat, replace [TYPE YOUR CITY HERE] and [STATE], then upload the Excel file it gives you</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== STEP 3: REVIEW FLAGGED CONTACTS ========== */}
        {step === 'review' && (
          <div className="space-y-6">
            {/* Summary Banner */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">⚠️</div>
                <div>
                  <h2 className="text-xl font-bold text-amber-800">Previously Contacted Emails Detected</h2>
                  <p className="text-amber-700 mt-1">
                    {flaggedContacts.length} of {validContacts.length} contacts have been emailed before.
                    Review them below and decide which ones to send again. New contacts ({newContacts.length}) will be sent first automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                <div className="text-3xl font-bold text-[#1B4332]">{contacts.length}</div>
                <div className="text-sm text-gray-500 mt-1">Total Contacts</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-green-700">{newContacts.length}</div>
                <div className="text-sm text-green-600 mt-1">New (Never Contacted)</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-amber-700">{flaggedContacts.length}</div>
                <div className="text-sm text-amber-600 mt-1">Previously Contacted</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-red-700">{invalidContacts.length}</div>
                <div className="text-sm text-red-600 mt-1">Invalid / Skipped</div>
              </div>
            </div>

            {/* Flagged Contacts Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 border-b flex items-center justify-between">
                <h3 className="font-semibold text-amber-800">⚠️ Review Previously Contacted ({flaggedContacts.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={approveAll}
                    className="px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition"
                  >
                    ✅ Approve All
                  </button>
                  <button
                    onClick={rejectAll}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition"
                  >
                    ❌ Skip All
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Action</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Organization</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Last Sent</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Sent By</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Category</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedContacts.map((c, i) => {
                      const originalIdx = contacts.indexOf(c);
                      const lastSend = c.history[0];
                      return (
                        <tr key={i} className={`border-t ${c.approved ? 'bg-green-50' : 'bg-amber-50/30'}`}>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => toggleApproval(originalIdx)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                c.approved
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              {c.approved ? '✅ Approved' : 'Skip'}
                            </button>
                          </td>
                          <td className="px-3 py-2 font-medium">{c.name}</td>
                          <td className="px-3 py-2 text-gray-600">{c.email}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">
                            {lastSend ? formatDate(lastSend.sent_at) : '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs">
                            {lastSend?.sent_by_email || '—'}
                          </td>
                          <td className="px-3 py-2">
                            {lastSend && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {getCategoryLabel(lastSend.category)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => setHistoryModal(c)}
                              className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                            >
                              📄 {c.history.length} send{c.history.length > 1 ? 's' : ''}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-5">
              <button
                onClick={() => { setStep('upload'); setContacts([]); setFileName(''); }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                ← Back to Upload
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {totalToSend} emails ready to send ({approvedFlagged.length} re-sends)
                </span>
                <button
                  onClick={() => setStep('preview')}
                  className="px-6 py-2.5 bg-[#2D6A4F] text-white rounded-lg font-semibold hover:bg-[#1B4332] transition"
                >
                  Continue to Preview →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== HISTORY SNAPSHOT MODAL ========== */}
        {historyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#1B4332]">📜 Send History</h3>
                  <p className="text-sm text-gray-500">{historyModal.name} — {historyModal.email}</p>
                </div>
                <button
                  onClick={() => setHistoryModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="overflow-auto max-h-96 p-6">
                {historyModal.history.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No send history found.</p>
                ) : (
                  <div className="space-y-4">
                    {historyModal.history.map((h, i) => (
                      <div key={i} className="border rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            h.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                          }`}>
                            {h.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(h.sent_at)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Sent by:</span>{' '}
                            <span className="font-medium">{h.sent_by_email}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Category:</span>{' '}
                            <span className="font-medium">{getCategoryLabel(h.category)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Subject:</span>{' '}
                            <span className="font-medium">{h.email_subject}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t text-right">
                <button
                  onClick={() => setHistoryModal(null)}
                  className="px-5 py-2 bg-[#2D6A4F] text-white rounded-lg text-sm font-semibold hover:bg-[#1B4332] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== STEP 4: PREVIEW & SEND ========== */}
        {step === 'preview' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                <div className="text-3xl font-bold text-[#1B4332]">{contacts.length}</div>
                <div className="text-sm text-gray-500 mt-1">Total Contacts</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-green-700">{newContacts.length}</div>
                <div className="text-sm text-green-600 mt-1">New Contacts</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-amber-700">{approvedFlagged.length}</div>
                <div className="text-sm text-amber-600 mt-1">Re-sends (Approved)</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-red-700">{invalidContacts.length}</div>
                <div className="text-sm text-red-600 mt-1">Skipped</div>
              </div>
            </div>

            {/* Contact list */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                <h3 className="font-semibold text-[#1B4332]">Sending Queue ({totalToSend})</h3>
                <span className="text-sm text-gray-500">
                  {OUTREACH_CATEGORIES.find(c => c.id === selectedCategory)?.icon}{' '}
                  {OUTREACH_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </span>
              </div>
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">#</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Organization</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">City</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validContacts.filter(c => !c.flagged || c.approved).map((c, i) => (
                      <tr
                        key={i}
                        className={`border-t cursor-pointer transition ${
                          previewIndex === i ? 'bg-green-50' : c.flagged ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setPreviewIndex(i)}
                      >
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{c.name}</td>
                        <td className="px-3 py-2 text-gray-600">{c.email}</td>
                        <td className="px-3 py-2">{c.city}</td>
                        <td className="px-3 py-2">
                          {c.flagged ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              ⚠️ Re-send
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              ✨ New
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Skipped contacts */}
            {invalidContacts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b">
                  <h3 className="font-semibold text-red-700">Skipped Contacts ({invalidContacts.length})</h3>
                </div>
                <div className="overflow-auto max-h-40">
                  <table className="w-full text-sm">
                    <tbody>
                      {invalidContacts.map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 text-gray-400">Row {c.row}</td>
                          <td className="px-3 py-2">{c.name}</td>
                          <td className="px-3 py-2 text-red-600">{c.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Email preview */}
            {previewEmail && previewContact && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-[#1B4332]">📧 Email Preview</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                      disabled={previewIndex === 0}
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
                    >← Prev</button>
                    <span className="text-sm text-gray-500">{previewIndex + 1} of {validContacts.length}</span>
                    <button
                      onClick={() => setPreviewIndex(Math.min(validContacts.length - 1, previewIndex + 1))}
                      disabled={previewIndex === validContacts.length - 1}
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
                    >Next →</button>
                  </div>
                </div>
                <div className="p-5">
                  {previewContact.flagged && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
                      ⚠️ This contact was previously emailed on {formatDate(previewContact.history[0]?.sent_at)} by {previewContact.history[0]?.sent_by_email}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mb-1"><strong>To:</strong> {previewContact.email}</div>
                  <div className="text-sm text-gray-500 mb-1"><strong>From:</strong> Levi & Gary Erwin — YardShoppers &lt;admin@yardshoppers.com&gt;</div>
                  <div className="text-sm font-medium mb-3"><strong>Subject:</strong> {previewEmail.subject}</div>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed border">
                    {previewEmail.body}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-5">
              <button
                onClick={() => {
                  const hasFlagged = contacts.some(c => c.valid && c.flagged);
                  setStep(hasFlagged ? 'review' : 'upload');
                  if (!hasFlagged) { setContacts([]); setFileName(''); }
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  ~{Math.round((totalToSend * 45) / 60)} min estimated send time
                </span>
                <button
                  onClick={sendAllEmails}
                  disabled={totalToSend === 0}
                  className={`px-8 py-3 rounded-lg font-semibold text-white transition flex items-center gap-2 ${
                    totalToSend > 0
                      ? 'bg-[#2D6A4F] hover:bg-[#1B4332]'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  📤 Send {totalToSend} Emails
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== STEP 5: SENDING ========== */}
        {step === 'sending' && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-[#1B4332] mb-6">Sending Emails...</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-[#2D6A4F] h-4 rounded-full transition-all duration-300"
                style={{ width: `${sendProgress.total > 0 ? (sendProgress.current / sendProgress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-6">
              <span>{sendProgress.current} of {sendProgress.total}</span>
              <span className="text-green-600">{results.filter(r => r.status === 'sent').length} sent</span>
              {results.filter(r => r.status === 'failed').length > 0 && (
                <span className="text-red-600">{results.filter(r => r.status === 'failed').length} failed</span>
              )}
              {results.filter(r => r.status === 'skipped').length > 0 && (
                <span className="text-amber-600">{results.filter(r => r.status === 'skipped').length} skipped (not approved)</span>
              )}
            </div>

            <div className="max-h-72 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-gray-600">{r.email}</td>
                      <td className="px-3 py-2">
                        {r.status === 'sent' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">SENT</span>
                        ) : r.status === 'skipped' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">SKIPPED</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">FAILED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              ⏱️ Each email is spaced 45 seconds apart to protect deliverability. Do not close this page.
            </p>
          </div>
        )}

        {/* ========== STEP 6: COMPLETE ========== */}
        {step === 'complete' && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[#1B4332] mb-2">Outreach Complete!</h2>
            <div className="flex justify-center gap-8 my-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{results.filter(r => r.status === 'sent').length}</div>
                <div className="text-sm text-gray-500">Emails Sent</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">{results.filter(r => r.status === 'skipped').length}</div>
                <div className="text-sm text-gray-500">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{results.filter(r => r.status === 'failed').length}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
            </div>

            {results.filter(r => r.status === 'failed').length > 0 && (
              <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-h-48 overflow-auto text-sm text-red-700">
                <div className="font-semibold mb-2">Failed Emails:</div>
                {results.filter(r => r.status === 'failed').map((r, i) => (
                  <div key={i}>{r.name} ({r.email}): {r.error}</div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setStep('category');
                setContacts([]);
                setFileName('');
                setResults([]);
                setSendProgress({ current: 0, total: 0 });
                setCampaignId(null);
              }}
              className="bg-[#2D6A4F] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1B4332] transition"
            >
              Start New Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
