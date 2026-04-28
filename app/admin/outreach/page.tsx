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
  customSubject: string;
  customBody: string;
}

interface SendResult {
  email: string;
  name: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

interface SavedDraft {
  id: string;
  category: string;
  file_name: string;
  total_contacts: number;
  notes: string;
  admin_email: string;
  created_at: string;
  updated_at: string;
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
      customSubject: '',
      customBody: '',
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

  // ---- NEW: Draft state ----
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);

  // ---- NEW: Inline editing state ----
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

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

  // ---- Load saved drafts on mount ----
  const loadSavedDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    const { data } = await supabase
      .from('outreach_campaigns')
      .select('id, category, file_name, total_contacts, notes, admin_email, created_at, updated_at')
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });
    setSavedDrafts((data as SavedDraft[]) || []);
    setLoadingDrafts(false);
  }, [supabase]);

  useEffect(() => {
    if (isAdmin) loadSavedDrafts();
  }, [isAdmin, loadSavedDrafts]);

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

    const { data: logs } = await supabase
      .from('outreach_logs')
      .select('email_to, sent_by_email, category, email_subject, status, organization_name, sent_at')
      .in('email_to', validEmails)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false });

    const historyMap: Record<string, SendHistory[]> = {};
    if (logs) {
      for (const log of logs) {
        const email = log.email_to.toLowerCase();
        if (!historyMap[email]) historyMap[email] = [];
        historyMap[email].push({
          sent_at: log.sent_at,
          sent_by_email: log.sent_by_email || 'Unknown admin',
          category: log.category || 'Unknown',
          email_subject: log.email_subject || 'No subject',
          status: log.status,
          organization_name: log.organization_name || '',
        });
      }
    }

    const updatedContacts = parsedContacts.map(c => {
      const emailHistory = historyMap[c.email.toLowerCase()] || [];
      return {
        ...c,
        history: emailHistory,
        flagged: emailHistory.length > 0,
        approved: false,
      };
    });

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
      setLoadedDraftId(null);
      const hasFlagged = withHistory.some(c => c.valid && c.flagged);
      setStep(hasFlagged ? 'review' : 'preview');
    } catch (err) {
      console.error('Parse error:', err);
      alert('Failed to parse spreadsheet. Make sure it is a valid .xlsx file.');
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
      setLoadedDraftId(null);
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

  const approveAll = () => {
    setContacts(prev => prev.map(c => c.flagged ? { ...c, approved: true } : c));
  };

  const rejectAll = () => {
    setContacts(prev => prev.map(c => c.flagged ? { ...c, approved: false } : c));
  };

  // ============================================================
  // SAVE DRAFT
  // ============================================================
  const saveDraft = useCallback(async () => {
    setSavingDraft(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (loadedDraftId) {
      // Update existing draft
      await supabase.from('outreach_campaigns').update({
        category: selectedCategory,
        file_name: fileName,
        total_contacts: contacts.filter(c => c.valid).length,
        notes: draftNotes,
        admin_email: user?.email || adminEmail,
        status: 'draft',
        updated_at: new Date().toISOString(),
      }).eq('id', loadedDraftId);

      // Delete old contacts and re-insert
      await supabase.from('outreach_contacts').delete().eq('campaign_id', loadedDraftId);

      const contactRows = contacts.filter(c => c.valid).map(c => ({
        campaign_id: loadedDraftId,
        organization_name: c.name,
        email: c.email,
        city: c.city,
        region: c.region,
        org_type: c.orgType,
        phone: c.phone,
        notes: c.notes,
        status: 'pending',
        custom_subject: c.customSubject || null,
        custom_body: c.customBody || null,
      }));

      if (contactRows.length > 0) {
        await supabase.from('outreach_contacts').insert(contactRows);
      }
    } else {
      // Create new draft
      const { data: campaign } = await supabase.from('outreach_campaigns').insert({
        category: selectedCategory,
        file_name: fileName,
        total_contacts: contacts.filter(c => c.valid).length,
        notes: draftNotes,
        admin_email: user?.email || adminEmail,
        status: 'draft',
      }).select().single();

      if (campaign) {
        setLoadedDraftId(campaign.id);

        const contactRows = contacts.filter(c => c.valid).map(c => ({
          campaign_id: campaign.id,
          organization_name: c.name,
          email: c.email,
          city: c.city,
          region: c.region,
          org_type: c.orgType,
          phone: c.phone,
          notes: c.notes,
          status: 'pending',
          custom_subject: c.customSubject || null,
          custom_body: c.customBody || null,
        }));

        if (contactRows.length > 0) {
          await supabase.from('outreach_contacts').insert(contactRows);
        }
      }
    }

    setSavingDraft(false);
    setDraftSaved(true);
    setShowSaveModal(false);
    setTimeout(() => setDraftSaved(false), 3000);
    await loadSavedDrafts();
  }, [supabase, selectedCategory, fileName, contacts, draftNotes, adminEmail, loadedDraftId, loadSavedDrafts]);

  // ============================================================
  // LOAD DRAFT
  // ============================================================
  const loadDraft = useCallback(async (draft: SavedDraft) => {
    setHistoryLoading(true);

    // Load contacts from DB
    const { data: dbContacts } = await supabase
      .from('outreach_contacts')
      .select('*')
      .eq('campaign_id', draft.id)
      .order('created_at', { ascending: true });

    if (!dbContacts || dbContacts.length === 0) {
      alert('No contacts found in this draft.');
      setHistoryLoading(false);
      return;
    }

    // Convert DB contacts to Contact type
    const parsedContacts: Contact[] = dbContacts.map((c, i) => ({
      row: i + 2,
      name: c.organization_name || '',
      email: c.email || '',
      city: c.city || '',
      region: c.region || '',
      orgType: c.org_type || 'HOA',
      phone: c.phone || '',
      notes: c.notes || '',
      valid: isValidEmail(c.email || ''),
      history: [],
      flagged: false,
      approved: false,
      customSubject: c.custom_subject || '',
      customBody: c.custom_body || '',
    }));

    // Re-check history
    const withHistory = await checkHistory(parsedContacts);

    setSelectedCategory(draft.category);
    setFileName(draft.file_name || 'Loaded from draft');
    setContacts(withHistory);
    setDraftNotes(draft.notes || '');
    setLoadedDraftId(draft.id);
    setPreviewIndex(0);
    setHistoryLoading(false);

    const hasFlagged = withHistory.some(c => c.valid && c.flagged);
    setStep(hasFlagged ? 'review' : 'preview');
  }, [supabase, checkHistory]);

  // ============================================================
  // DELETE DRAFT
  // ============================================================
  const deleteDraft = useCallback(async (draftId: string) => {
    if (!confirm('Delete this saved draft? This cannot be undone.')) return;
    await supabase.from('outreach_contacts').delete().eq('campaign_id', draftId);
    await supabase.from('outreach_campaigns').delete().eq('id', draftId);
    await loadSavedDrafts();
  }, [supabase, loadSavedDrafts]);

  // ============================================================
  // INLINE EDITING
  // ============================================================
  const startEditing = (index: number) => {
    const c = contacts[index];
    if (!c) return;
    const { subject, body } = generateEmail(selectedCategory, c.name, c.city, c.orgType);
    setEditSubject(c.customSubject || subject);
    setEditBody(c.customBody || body);
    setEditingIndex(index);
  };

  const saveEditing = () => {
    if (editingIndex === null) return;
    setContacts(prev => prev.map((c, i) => {
      if (i === editingIndex) {
        return { ...c, customSubject: editSubject, customBody: editBody };
      }
      return c;
    }));
    setEditingIndex(null);
    setEditSubject('');
    setEditBody('');
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditSubject('');
    setEditBody('');
  };

  const resetToDefault = () => {
    if (editingIndex === null) return;
    const c = contacts[editingIndex];
    const { subject, body } = generateEmail(selectedCategory, c.name, c.city, c.orgType);
    setEditSubject(subject);
    setEditBody(body);
    // Also clear custom fields so it uses the template
    setContacts(prev => prev.map((ct, i) => {
      if (i === editingIndex) {
        return { ...ct, customSubject: '', customBody: '' };
      }
      return ct;
    }));
  };

  // ============================================================
  // SEND EMAILS
  // ============================================================
  const sendAllEmails = useCallback(async () => {
    const newContacts = contacts.filter(c => c.valid && !c.flagged);
    const approvedContacts = contacts.filter(c => c.valid && c.flagged && c.approved);
    const skippedContacts = contacts.filter(c => c.valid && c.flagged && !c.approved);
    const sendList = [...newContacts, ...approvedContacts];

    if (sendList.length === 0) return;

    setIsSending(true);
    setStep('sending');
    setSendProgress({ current: 0, total: sendList.length });
    setResults([]);

    const { data: { user } } = await supabase.auth.getUser();

    // Create or update campaign
    let activeCampaignId = loadedDraftId;

    if (loadedDraftId) {
      await supabase.from('outreach_campaigns').update({
        total_contacts: sendList.length,
        status: 'sending',
        updated_at: new Date().toISOString(),
      }).eq('id', loadedDraftId);
    } else {
      const { data: campaign } = await supabase.from('outreach_campaigns').insert({
        category: selectedCategory,
        file_name: fileName,
        total_contacts: sendList.length,
        status: 'sending',
        created_by: user?.id,
        admin_email: adminEmail,
      }).select().single();

      if (campaign) {
        activeCampaignId = campaign.id;
        setCampaignId(campaign.id);

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
            custom_subject: c.customSubject || null,
            custom_body: c.customBody || null,
          }))
        );
      }
    }

    const allResults: SendResult[] = skippedContacts.map(c => ({
      email: c.email,
      name: c.name,
      status: 'skipped' as const,
    }));

    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < sendList.length; i++) {
      const c = sendList[i];
      const defaultEmail = generateEmail(selectedCategory, c.name, c.city, c.orgType);
      const subject = c.customSubject || defaultEmail.subject;
      const body = c.customBody || defaultEmail.body;

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

        if (activeCampaignId) {
          await supabase.from('outreach_contacts')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('campaign_id', activeCampaignId)
            .eq('email', c.email);

          await supabase.from('outreach_logs').insert({
            campaign_id: activeCampaignId,
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

        if (activeCampaignId) {
          await supabase.from('outreach_contacts')
            .update({ status: 'failed', error_message: message })
            .eq('campaign_id', activeCampaignId)
            .eq('email', c.email);

          await supabase.from('outreach_logs').insert({
            campaign_id: activeCampaignId,
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

      if (i < sendList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 45000));
      }
    }

    if (activeCampaignId) {
      await supabase.from('outreach_campaigns').update({
        sent_count: sentCount,
        failed_count: failCount,
        status: 'completed',
        updated_at: new Date().toISOString(),
      }).eq('id', activeCampaignId);
    }

    setIsSending(false);
    setStep('complete');
  }, [contacts, selectedCategory, fileName, supabase, adminEmail, loadedDraftId]);

  // ---- Computed ----
  const validContacts = contacts.filter(c => c.valid);
  const invalidContacts = contacts.filter(c => !c.valid);
  const flaggedContacts = contacts.filter(c => c.valid && c.flagged);
  const newContacts = contacts.filter(c => c.valid && !c.flagged);
  const approvedFlagged = contacts.filter(c => c.valid && c.flagged && c.approved);
  const totalToSend = newContacts.length + approvedFlagged.length;

  const previewContact = validContacts[previewIndex] || validContacts[0];
  const previewEmail = previewContact
    ? {
        subject: previewContact.customSubject || generateEmail(selectedCategory, previewContact.name, previewContact.city, previewContact.orgType).subject,
        body: previewContact.customBody || generateEmail(selectedCategory, previewContact.name, previewContact.city, previewContact.orgType).body,
      }
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

        {/* Draft saved toast */}
        {draftSaved && (
          <div className="fixed top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-bounce">
            ✅ Draft saved successfully!
          </div>
        )}

        {/* ========== STEP 1: SELECT CATEGORY ========== */}
        {step === 'category' && (
          <div className="space-y-8">
            {/* Saved Drafts Section */}
            {savedDrafts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 border-b">
                  <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    💾 Saved Drafts ({savedDrafts.length})
                  </h2>
                  <p className="text-sm text-blue-700 mt-1">Resume a previously saved outreach batch</p>
                </div>
                <div className="divide-y">
                  {savedDrafts.map(draft => (
                    <div key={draft.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{OUTREACH_CATEGORIES.find(c => c.id === draft.category)?.icon || '📋'}</span>
                          <div>
                            <div className="font-semibold text-[#1B4332]">
                              {getCategoryLabel(draft.category)}
                              <span className="text-gray-400 font-normal text-sm ml-2">({draft.total_contacts} contacts)</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Saved {formatDate(draft.updated_at)} by {draft.admin_email || 'Unknown'}
                              {draft.file_name && <span className="ml-2">• {draft.file_name}</span>}
                            </div>
                          </div>
                        </div>
                        {draft.notes && (
                          <div className="mt-2 ml-8 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            📝 {draft.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => loadDraft(draft)}
                          disabled={historyLoading}
                          className="px-4 py-2 bg-[#2D6A4F] text-white text-sm font-semibold rounded-lg hover:bg-[#1B4332] transition disabled:opacity-50"
                        >
                          {historyLoading ? 'Loading...' : '📂 Resume'}
                        </button>
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          className="px-3 py-2 text-red-500 text-sm hover:bg-red-50 rounded-lg transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadingDrafts && (
              <div className="flex items-center justify-center py-4 gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2D6A4F]" />
                Loading saved drafts...
              </div>
            )}

            {/* Category Grid */}
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

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 border-b flex items-center justify-between">
                <h3 className="font-semibold text-amber-800">⚠️ Review Previously Contacted ({flaggedContacts.length})</h3>
                <div className="flex gap-2">
                  <button onClick={approveAll} className="px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition">
                    ✅ Approve All
                  </button>
                  <button onClick={rejectAll} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition">
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
                          <td className="px-3 py-2 text-gray-500 text-xs">{lastSend ? formatDate(lastSend.sent_at) : '—'}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{lastSend?.sent_by_email || '—'}</td>
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

        {/* ========== STEP 4: PREVIEW & SEND ========== */}
        {step === 'preview' && (
          <div className="space-y-6">
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                <div className="text-3xl font-bold text-[#1B4332]">{contacts.length}</div>
                <div className="text-sm text-gray-500 mt-1">Total Contacts</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-green-700">{validContacts.length}</div>
                <div className="text-sm text-green-600 mt-1">Valid Emails</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-red-700">{invalidContacts.length}</div>
                <div className="text-sm text-red-600 mt-1">Skipped</div>
              </div>
            </div>

            {/* Contacts Table with Edit Button */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-3 bg-green-50 border-b flex items-center justify-between">
                <h3 className="font-semibold text-[#1B4332]">✅ Valid Contacts ({validContacts.length})</h3>
                <div className="text-xs text-gray-500">Click ✏️ Edit to customize any email before sending</div>
              </div>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Organization</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">City</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Type</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Edited</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validContacts.map((c, i) => {
                      const originalIdx = contacts.indexOf(c);
                      const hasCustom = !!(c.customSubject || c.customBody);
                      return (
                        <tr
                          key={i}
                          className={`border-t cursor-pointer transition ${
                            previewIndex === i ? 'bg-green-50' : 'hover:bg-gray-50'
                          } ${hasCustom ? 'border-l-4 border-l-blue-400' : ''}`}
                          onClick={() => setPreviewIndex(i)}
                        >
                          <td className="px-3 py-2 font-medium">{c.name}</td>
                          <td className="px-3 py-2 text-gray-600">{c.email}</td>
                          <td className="px-3 py-2 text-gray-500">{c.city}</td>
                          <td className="px-3 py-2 text-gray-500">{c.orgType}</td>
                          <td className="px-3 py-2">
                            {hasCustom && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                ✏️ Custom
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditing(originalIdx); }}
                              className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                            >
                              ✏️ Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Skipped Contacts */}
            {invalidContacts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b">
                  <h3 className="font-semibold text-red-800">❌ Skipped — Invalid or Missing Email ({invalidContacts.length})</h3>
                </div>
                <div className="overflow-auto max-h-40">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Row</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Organization</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invalidContacts.map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 text-gray-500">#{c.row}</td>
                          <td className="px-3 py-2">{c.name || '(empty)'}</td>
                          <td className="px-3 py-2 text-red-600">{c.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Email Preview */}
            {previewEmail && previewContact && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-[#1B4332]">📧 Email Preview</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                      disabled={previewIndex === 0}
                      className="px-2 py-1 text-sm rounded border hover:bg-gray-100 disabled:opacity-30"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-500">{previewIndex + 1} of {validContacts.length}</span>
                    <button
                      onClick={() => setPreviewIndex(Math.min(validContacts.length - 1, previewIndex + 1))}
                      disabled={previewIndex >= validContacts.length - 1}
                      className="px-2 py-1 text-sm rounded border hover:bg-gray-100 disabled:opacity-30"
                    >
                      Next →
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  {previewContact.customSubject || previewContact.customBody ? (
                    <div className="mb-3 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 inline-flex items-center gap-1">
                      ✏️ This email has been customized
                    </div>
                  ) : null}
                  <div className="space-y-1 text-sm mb-4">
                    <div><span className="text-gray-500 font-medium">To:</span> {previewContact.email}</div>
                    <div><span className="text-gray-500 font-medium">From:</span> Levi & Gary Erwin — YardShoppers &lt;admin@yardshoppers.com&gt;</div>
                    <div><span className="text-gray-500 font-medium">Subject:</span> {previewEmail.subject}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-5 text-sm whitespace-pre-wrap leading-relaxed border">
                    {previewEmail.body}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const hasFlagged = contacts.some(c => c.valid && c.flagged);
                    setStep(hasFlagged ? 'review' : 'upload');
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-5 py-2.5 border-2 border-blue-300 bg-blue-50 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-100 transition flex items-center gap-2"
                >
                  💾 Save for Later
                </button>
              </div>
              <button
                onClick={sendAllEmails}
                disabled={totalToSend === 0}
                className="px-8 py-3 bg-[#2D6A4F] text-white rounded-xl font-bold text-lg hover:bg-[#1B4332] transition shadow-md disabled:opacity-50"
              >
                📤 Send {totalToSend} Email{totalToSend !== 1 ? 's' : ''}
                <span className="block text-xs font-normal opacity-80">~{Math.ceil(totalToSend * 45 / 60)} min estimated</span>
              </button>
            </div>
          </div>
        )}

        {/* ========== INLINE EDIT MODAL ========== */}
        {editingIndex !== null && contacts[editingIndex] && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 bg-blue-50 border-b flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-[#1B4332]">✏️ Edit Email</h3>
                  <p className="text-sm text-gray-500">{contacts[editingIndex].name} — {contacts[editingIndex].email}</p>
                </div>
                <button
                  onClick={cancelEditing}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Body</label>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={18}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono leading-relaxed focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-y"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between shrink-0">
                <button
                  onClick={resetToDefault}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  🔄 Reset to Template
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditing}
                    className="px-6 py-2.5 bg-[#2D6A4F] text-white text-sm font-semibold rounded-lg hover:bg-[#1B4332] transition"
                  >
                    ✅ Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== SAVE DRAFT MODAL ========== */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b">
                <h3 className="font-bold text-lg text-[#1B4332]">💾 Save Draft for Later</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Save this batch of {validContacts.length} contacts so you or another admin can come back and send later.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Note <span className="font-normal text-gray-400">(what is this draft waiting for?)</span>
                  </label>
                  <textarea
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="e.g., Waiting for SPF/DKIM setup before sending. Or: Need to review emails for churches over 500 members."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
                  <div><span className="font-medium">Category:</span> {getCategoryLabel(selectedCategory)}</div>
                  <div><span className="font-medium">File:</span> {fileName}</div>
                  <div><span className="font-medium">Valid contacts:</span> {validContacts.length}</div>
                  <div><span className="font-medium">Custom edits:</span> {contacts.filter(c => c.customSubject || c.customBody).length} emails edited</div>
                  <div><span className="font-medium">Saved by:</span> {adminEmail}</div>
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDraft}
                  disabled={savingDraft}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {savingDraft ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    '💾 Save Draft'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== STEP 5: SENDING ========== */}
        {step === 'sending' && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-[#1B4332] mb-6 text-center">
              {isSending ? '📤 Sending Emails...' : '✅ Sending Complete'}
            </h2>

            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>{sendProgress.current} of {sendProgress.total}</span>
                <span>{Math.round((sendProgress.current / Math.max(sendProgress.total, 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-[#2D6A4F] h-full rounded-full transition-all duration-500"
                  style={{ width: `${(sendProgress.current / Math.max(sendProgress.total, 1)) * 100}%` }}
                />
              </div>
              {isSending && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  45-second delay between emails to protect deliverability. Please keep this tab open.
                </p>
              )}
            </div>

            {results.length > 0 && (
              <div className="overflow-auto max-h-64 rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Organization</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.status === 'sent' ? 'bg-green-100 text-green-800'
                              : r.status === 'skipped' ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {r.status === 'sent' ? '✅ Sent' : r.status === 'skipped' ? '⏭️ Skipped' : '❌ Failed'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-gray-600">{r.email}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{r.error || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========== STEP 6: COMPLETE ========== */}
        {step === 'complete' && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[#1B4332] mb-2">Outreach Complete!</h2>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto my-6">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-700">{results.filter(r => r.status === 'sent').length}</div>
                <div className="text-xs text-green-600 mt-1">Sent</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-700">{results.filter(r => r.status === 'failed').length}</div>
                <div className="text-xs text-red-600 mt-1">Failed</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-600">{results.filter(r => r.status === 'skipped').length}</div>
                <div className="text-xs text-gray-500 mt-1">Skipped</div>
              </div>
            </div>

            {results.length > 0 && (
              <div className="overflow-auto max-h-64 rounded-lg border mt-6 text-left">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Organization</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.status === 'sent' ? 'bg-green-100 text-green-800'
                              : r.status === 'skipped' ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {r.status === 'sent' ? '✅ Sent' : r.status === 'skipped' ? '⏭️ Skipped' : '❌ Failed'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-gray-600">{r.email}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{r.error || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={() => {
                setStep('category');
                setContacts([]);
                setFileName('');
                setResults([]);
                setPreviewIndex(0);
                setDraftNotes('');
                setLoadedDraftId(null);
                setCampaignId(null);
                loadSavedDrafts();
              }}
              className="mt-8 px-8 py-3 bg-[#2D6A4F] text-white rounded-xl font-semibold hover:bg-[#1B4332] transition"
            >
              ← Start New Outreach
            </button>
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
                            h.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {h.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(h.sent_at)}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div><span className="text-gray-500">Sent by:</span> <span className="font-medium">{h.sent_by_email}</span></div>
                          <div><span className="text-gray-500">Category:</span> <span className="font-medium">{getCategoryLabel(h.category)}</span></div>
                          <div><span className="text-gray-500">Subject:</span> <span className="font-medium">{h.email_subject}</span></div>
                          {h.organization_name && (
                            <div><span className="text-gray-500">Organization:</span> <span className="font-medium">{h.organization_name}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setHistoryModal(null)}
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
