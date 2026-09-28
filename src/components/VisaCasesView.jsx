import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  FileCheck,
  Check,
  X,
  ExternalLink,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trash2,
  Pencil,
  Globe,
  Briefcase,
  MessageCircle,
  Hash,
  AlertTriangle
} from 'lucide-react';

/* ─── MODULE CONSTANTS ─── */

const ModalOverlay = ({ children, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}
  >
    <div onClick={e => e.stopPropagation()} style={{ width: '100%' }}>
      {children}
    </div>
  </div>
);

const VISA_STATUSES = [
  'NEW',
  'DOCUMENTS_REQUIRED',
  'DOCUMENTS_RECEIVED',
  'UNDER_REVIEW',
  'READY_TO_SUBMIT',
  'SUBMITTED',
  'PROCESSING',
  'APPROVED',
  'REJECTED',
  'COMPLETED'
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const DOC_CATEGORIES = ['Identity', 'Financial', 'Employment', 'Travel', 'Accommodation', 'Medical', 'Purpose', 'Affidavit', 'Other'];

const DOC_STATUS_STYLES = {
  VERIFIED: { chip: 'bg-emerald-100 text-emerald-800', Icon: Check },
  UPLOADED: { chip: 'bg-blue-100 text-blue-800', Icon: Clock },
  PENDING: { chip: 'bg-amber-100 text-amber-800', Icon: AlertCircle },
  REJECTED: { chip: 'bg-red-100 text-red-800', Icon: X }
};

// Embassy checklist created with every new case (README §8).
const DEFAULT_CHECKLIST = [
  'Passport first page (colour scan)',
  'Passport-size photographs (white background)',
  'CNIC / National ID copy',
  'Bank statement (last 6 months)',
  'Employment letter / business proof',
  'Return flight itinerary',
  'Hotel booking confirmation'
];

// Customer detail fields — shared by the add/edit form and the monitor card.
const CUSTOMER_FIELDS = [
  { key: 'phone', label: 'Phone', type: 'tel', icon: Phone, placeholder: '+92 300 1234567', autoComplete: 'tel' },
  { key: 'whatsapp', label: 'WhatsApp', type: 'tel', icon: MessageCircle, placeholder: '+92 300 1234567', autoComplete: 'tel' },
  { key: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'name@example.com', autoComplete: 'email' },
  { key: 'cnic', label: 'CNIC', type: 'text', icon: Hash, placeholder: '35201-1234567-1' },
  { key: 'passportNumber', label: 'Passport No.', type: 'text', icon: FileText, placeholder: 'AL9821043' },
  { key: 'passportExpiry', label: 'Passport Expiry', type: 'date', icon: Calendar },
  { key: 'nationality', label: 'Nationality', type: 'text', icon: Globe, placeholder: 'Pakistani' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', icon: Calendar },
  { key: 'city', label: 'City', type: 'text', icon: MapPin, placeholder: 'Lahore' },
  { key: 'occupation', label: 'Occupation', type: 'text', icon: Briefcase, placeholder: 'Business owner' }
];

const todayISO = () => new Date().toISOString().split('T')[0];

const toNum = (value) => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
};

const daysUntil = (dateString) => {
  if (!dateString) return null;
  const target = new Date(`${dateString}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86400000);
};

const blankForm = () => ({
  id: '',
  customerName: '',
  destination: '',
  visaType: '',
  applicantCount: 1,
  assignedOfficer: '',
  referenceNumber: '',
  externalProvider: '',
  visaFeePKR: '',
  serviceFeePKR: '',
  totalCustomerPricePKR: '',
  supplierCostPKR: '',
  status: 'NEW',
  priority: 'MEDIUM',
  applicationDate: todayISO(),
  intendedTravelDate: '',
  branchId: 'b-lhr',
  customer: {
    phone: '', whatsapp: '', email: '', cnic: '', passportNumber: '',
    passportExpiry: '', nationality: 'Pakistani', dateOfBirth: '',
    city: '', address: '', occupation: '', notes: ''
  }
});

const formFromCase = (vc) => ({
  ...blankForm(),
  ...vc,
  applicantCount: vc.applicantCount ?? 1,
  visaFeePKR: vc.visaFeePKR ?? '',
  serviceFeePKR: vc.serviceFeePKR ?? '',
  totalCustomerPricePKR: vc.totalCustomerPricePKR ?? '',
  supplierCostPKR: vc.supplierCostPKR ?? '',
  customer: { ...blankForm().customer, ...(vc.customer || {}) }
});

export default function VisaCasesView({ visaCases = [], setVisaCases, onNavigate, customers = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');

  const [notice, setNotice] = useState(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docDraft, setDocDraft] = useState({ name: '', category: 'Identity', fileName: '', notes: '' });
  const [docError, setDocError] = useState('');

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(current => (current === message ? null : current)), 6000);
  };

  const list = visaCases.filter(Boolean);
  const filteredCases = list.filter(v => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (v.customerName || '').toLowerCase().includes(q)
      || (v.destination || '').toLowerCase().includes(q)
      || (v.visaType || '').toLowerCase().includes(q)
      || (v.referenceNumber || '').toLowerCase().includes(q);
  });

  const selectedCase = list.find(v => v.id === selectedId) || list[0] || null;
  const selectedDocs = selectedCase?.documents || [];
  const selectedChecklist = selectedCase?.checklists || [];
  const linkedCustomer = selectedCase?.customerId
    ? customers.find(c => c && c.id === selectedCase.customerId) || null
    : null;

  const checklistStats = (vc) => {
    const items = vc?.checklists || [];
    const verified = items.filter(c => c && c.status === 'VERIFIED').length;
    const total = items.length;
    return { total, verified, percent: total ? Math.round((verified / total) * 100) : 0 };
  };

  const updateCase = (id, patch) => {
    const next = list.map(vc => (vc.id === id ? { ...vc, ...patch } : vc));
    setVisaCases(next);
  };

  const toggleChecklistStatus = (caseId, checkId, nextStatus) => {
    const vc = list.find(item => item.id === caseId);
    if (!vc) return;
    const checklists = (vc.checklists || []).map(chk =>
      chk.id === checkId ? { ...chk, status: nextStatus } : chk
    );
    updateCase(caseId, { checklists });
  };

  const updateCaseStatus = (caseId, newStatus) => {
    updateCase(caseId, { status: newStatus });
    flash(`Status updated to ${newStatus.replace(/_/g, ' ').toLowerCase()}.`);
  };

  const openAdd = () => {
    setForm(blankForm());
    setFormMode('add');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEdit = (vc) => {
    setForm(formFromCase(vc));
    setFormMode('edit');
    setFormError('');
    setIsFormOpen(true);
  };

  const submitForm = (event) => {
    event.preventDefault();
    const name = form.customerName.trim();
    const destination = form.destination.trim();
    const visaType = form.visaType.trim();
    if (!name || !destination || !visaType) {
      setFormError('Customer name, destination and visa type are required.');
      return;
    }

    const visaFeePKR = toNum(form.visaFeePKR);
    const serviceFeePKR = toNum(form.serviceFeePKR);
    const totalCustomerPricePKR = toNum(form.totalCustomerPricePKR) || visaFeePKR + serviceFeePKR;
    const supplierCostPKR = toNum(form.supplierCostPKR);
    const editing = formMode === 'edit' && form.id;
    const previous = editing ? list.find(vc => vc.id === form.id) : null;

    const record = {
      ...(previous || {}),
      id: editing ? form.id : `VISA-${String(Date.now()).slice(-6)}`,
      customerName: name,
      customerId: previous?.customerId,
      destination,
      visaType,
      applicantCount: Math.max(1, Number(form.applicantCount) || 1),
      applicants: previous?.applicants?.length ? previous.applicants : [name],
      assignedOfficer: form.assignedOfficer.trim(),
      referenceNumber: form.referenceNumber.trim(),
      externalProvider: form.externalProvider.trim(),
      visaFeePKR,
      serviceFeePKR,
      totalCustomerPricePKR,
      supplierCostPKR,
      expectedMarginPKR: Math.max(0, totalCustomerPricePKR - supplierCostPKR),
      status: form.status,
      priority: form.priority,
      applicationDate: form.applicationDate,
      intendedTravelDate: form.intendedTravelDate,
      branchId: form.branchId || 'b-lhr',
      customer: { ...form.customer },
      documents: previous?.documents || [],
      checklists: previous?.checklists?.length
        ? previous.checklists
        : DEFAULT_CHECKLIST.map((docName, index) => ({
            id: `chk-${Date.now()}-${index}`,
            name: docName,
            status: 'PENDING',
            required: true,
            notes: 'Required before submission.'
          }))
    };

    if (editing) {
      setVisaCases(list.map(vc => (vc.id === record.id ? record : vc)));
      flash('Visa case and customer details saved.');
    } else {
      setVisaCases([record, ...list]);
      setSelectedId(record.id);
      flash('Visa case created with customer details and document checklist.');
    }
    setIsFormOpen(false);
  };

  const addDocument = () => {
    const name = docDraft.name.trim();
    if (!selectedCase) return;
    if (!name) {
      setDocError('Document name is required.');
      return;
    }
    const documents = [
      ...(selectedCase.documents || []),
      {
        id: `doc-${Date.now()}`,
        name,
        category: docDraft.category || 'Other',
        status: 'UPLOADED',
        fileName: docDraft.fileName.trim() || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
        uploadedAt: todayISO(),
        notes: docDraft.notes.trim()
      }
    ];
    updateCase(selectedCase.id, { documents });
    setDocDraft({ name: '', category: 'Identity', fileName: '', notes: '' });
    setDocError('');
    setShowDocForm(false);
    flash('Document added to the case file.');
  };

  const setDocumentStatus = (docId, status) => {
    if (!selectedCase) return;
    const documents = (selectedCase.documents || []).map(doc =>
      doc.id === docId ? { ...doc, status } : doc
    );
    updateCase(selectedCase.id, { documents });
  };

  const removeDocument = (docId) => {
    if (!selectedCase) return;
    const doc = (selectedCase.documents || []).find(d => d.id === docId);
    if (!doc) return;
    if (!window.confirm(`Remove "${doc.name}" from this case file?`)) return;
    updateCase(selectedCase.id, { documents: (selectedCase.documents || []).filter(d => d.id !== docId) });
    flash('Document removed from the case file.');
  };

  const setField = (key) => (event) => setForm(current => ({ ...current, [key]: event.target.value }));
  const setCustomerField = (key) => (event) =>
    setForm(current => ({ ...current, customer: { ...current.customer, [key]: event.target.value } }));

  const labelClass = 'block text-[10px] font-semibold uppercase tracking-[0.10em] text-[var(--color-mute)] mb-1.5';
  const valueClass = 'text-xs text-[var(--color-ink)] break-words';
  const passportDays = selectedCase ? daysUntil(selectedCase.customer?.passportExpiry) : null;

  const docsUploaded = selectedDocs.filter(d => d && (d.status === 'UPLOADED' || d.status === 'VERIFIED')).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Visa Case Management & Checklists
          </h1>
          <p className="text-xs text-[var(--color-body)]">
            Embassy document verification, GDRFA & UKVI tracking, and automated completion percentage calculations.
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary-pill self-start sm:self-auto">
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Visa Case</span>
        </button>
      </div>

      {notice && (
        <p role="status" aria-live="polite" className="rounded-xl border border-[rgba(31,229,163,0.30)] bg-[var(--color-canvas-elevated)] px-3.5 py-2.5 text-xs text-[var(--color-ink)]">
          {notice}
        </p>
      )}

      {list.length === 0 ? (
        <div className="hairline-card p-12 text-center space-y-3">
          <FileCheck className="w-8 h-8 mx-auto text-[var(--color-link)]" aria-hidden="true" />
          <p className="text-sm font-semibold text-[var(--color-ink)]">No visa cases yet</p>
          <p className="text-xs text-[var(--color-mute)]">
            Create the first case to capture customer details, the embassy checklist and every supporting document.
          </p>
          <button type="button" onClick={openAdd} className="btn-primary-pill mx-auto">
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>New Visa Case</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cases List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--color-mute)] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, destination, application ref…"
                aria-label="Search visa cases"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] rounded-md text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>

            <div className="space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 overscroll-contain">
              {filteredCases.length === 0 && (
                <p className="text-xs text-[var(--color-mute)] p-3 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)]">
                  No visa case matches “{searchQuery}”.
                </p>
              )}
              {filteredCases.map((vc) => {
                const isSelected = selectedCase?.id === vc.id;
                const { total, verified, percent } = checklistStats(vc);

                return (
                  <div
                    key={vc.id}
                    onClick={() => setSelectedId(vc.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-[var(--color-ink)] bg-[var(--color-canvas-elevated)] shadow-xs'
                        : 'border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] hover:border-[var(--color-mute)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="mono-eyebrow text-[9px]">{vc.id}</span>
                        <h4 className="font-semibold text-xs text-[var(--color-ink)] mt-0.5 truncate">{vc.customerName}</h4>
                      </div>
                      <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {vc.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--color-body)]">
                      <div><strong>{vc.visaType}</strong> ({vc.destination})</div>
                      <div className="text-[10px] text-[var(--color-mute)] font-mono mt-0.5 truncate">
                        Ref: {vc.referenceNumber || '—'} · Provider: {vc.externalProvider || '—'}
                      </div>
                    </div>

                    {/* Document Checklist Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[var(--color-mute)]">Document Verification</span>
                        <span className="font-mono font-medium text-[var(--color-ink)]">
                          {verified} / {total} verified ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-hairline-soft)] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${percent === 100 ? 'bg-emerald-500' : 'bg-[var(--color-link)]'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Case Details & Checklist Verification Workspace (7 cols) */}
          {selectedCase ? (
            <div className="lg:col-span-7 space-y-4">
              <div className="hairline-card p-6 space-y-6">
                {/* Case Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-hairline)]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono-eyebrow text-[10px]">{selectedCase.id}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-50 text-purple-700">
                        {selectedCase.destination}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                        selectedCase.priority === 'URGENT' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedCase.priority || 'MEDIUM'}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-[var(--color-ink)] mt-0.5">
                      {selectedCase.visaType}
                    </h2>
                    <div className="text-xs text-[var(--color-mute)] font-mono mt-0.5">
                      Applicant: <strong className="text-[var(--color-ink)]">{selectedCase.customerName}</strong> ({selectedCase.applicantCount} Pax)
                    </div>
                  </div>

                  <div className="flex items-end gap-2 shrink-0">
                    {/* Status Selector */}
                    <div className="space-y-1">
                      <label htmlFor="visa-status" className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-mute)]">Application Status</label>
                      <select
                        id="visa-status"
                        value={selectedCase.status}
                        onChange={(e) => updateCaseStatus(selectedCase.id, e.target.value)}
                        className="p-1.5 text-xs rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] font-medium"
                      >
                        {VISA_STATUSES.map(st => (
                          <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(selectedCase)}
                      className="btn-app-sm"
                      title="Edit case and customer details"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {/* Financial Margin Overview */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-xs">
                  <div>
                    <div className="text-[10px] text-[var(--color-mute)]">Customer Price</div>
                    <div className="font-mono font-semibold text-[var(--color-ink)]">
                      ₨{(selectedCase.totalCustomerPricePKR || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--color-mute)]">Supplier Cost</div>
                    <div className="font-mono text-[var(--color-body)]">
                      ₨{(selectedCase.supplierCostPKR || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--color-mute)]">Gross Margin</div>
                    <div className="font-mono font-semibold text-emerald-600">
                      +₨{(selectedCase.expectedMarginPKR || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Checklist Verification Engine */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[var(--color-link)]" aria-hidden="true" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                        Mandatory Embassy Document Checklist
                      </h3>
                    </div>
                    <span className="mono-eyebrow text-[10px]">
                      Audit Trail Enforced
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--color-hairline)] border border-[var(--color-hairline)] rounded-xl bg-[var(--color-canvas)] overflow-hidden">
                    {selectedChecklist.length === 0 && (
                      <p className="p-3.5 text-[11px] text-[var(--color-mute)]">
                        No checklist items yet — edit the case to generate the embassy checklist.
                      </p>
                    )}
                    {selectedChecklist.map((chk) => {
                      const isVerified = chk.status === 'VERIFIED';
                      const isUploaded = chk.status === 'UPLOADED';
                      const isPending = chk.status === 'PENDING';
                      const isRejected = chk.status === 'REJECTED';

                      return (
                        <div key={chk.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-hairline-soft)] transition-colors">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[var(--color-ink)]">{chk.name}</span>
                              {chk.required && (
                                <span className="text-[9px] font-mono text-red-500 font-bold">*REQUIRED</span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--color-mute)] leading-relaxed break-words">{chk.notes}</p>
                          </div>

                          {/* Verification Status Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isVerified && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" aria-hidden="true" />
                                Verified
                              </span>
                            )}

                            {isUploaded && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-800">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                Uploaded
                              </span>
                            )}

                            {isPending && (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-800">
                                Missing / Pending
                              </span>
                            )}

                            {isRejected && (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-800">
                                Rejected
                              </span>
                            )}

                            {/* Officer Action Buttons */}
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                title="Mark Verified"
                                aria-label={`Mark ${chk.name} verified`}
                                onClick={() => toggleChecklistStatus(selectedCase.id, chk.id, 'VERIFIED')}
                                className="p-1 rounded hover:bg-emerald-100 text-emerald-600 border border-[var(--color-hairline)]"
                              >
                                <Check className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                title="Reject Document"
                                aria-label={`Reject ${chk.name}`}
                                onClick={() => toggleChecklistStatus(selectedCase.id, chk.id, 'REJECTED')}
                                className="p-1 rounded hover:bg-red-100 text-red-600 border border-[var(--color-hairline)]"
                              >
                                <X className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-4 border-t border-[var(--color-hairline)] flex flex-wrap justify-between items-center gap-2 text-xs">
                  <span className="text-[var(--color-mute)]">Officer: <strong>{selectedCase.assignedOfficer || 'Unassigned'}</strong></span>
                  <button
                    type="button"
                    onClick={() => updateCaseStatus(selectedCase.id, 'READY_TO_SUBMIT')}
                    className="btn-app-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mark Ready to Submit</span>
                  </button>
                </div>
              </div>

              {/* CUSTOMER INFORMATION */}
              <div className="hairline-card p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--color-link)]" aria-hidden="true" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                      Customer Details & Information
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {linkedCustomer && (
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('customers')}
                        className="btn-app-sm"
                        title="Open the linked customer record"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Customer Record</span>
                      </button>
                    )}
                    <button type="button" onClick={() => openEdit(selectedCase)} className="btn-app-sm">
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Edit Details</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
                  <div className="sm:col-span-2">
                    <div className={labelClass}>Full Name</div>
                    <div className={valueClass}>
                      <span className="font-semibold">{selectedCase.customerName}</span>
                      {linkedCustomer && (
                        <span className="ml-2 text-[10px] font-mono text-[var(--color-mute)]">
                          Linked · {linkedCustomer.id}
                        </span>
                      )}
                    </div>
                  </div>

                  {CUSTOMER_FIELDS.map(({ key, label, icon: Icon }) => {
                    const value = selectedCase.customer?.[key];
                    const isExpiry = key === 'passportExpiry';
                    return (
                      <div key={key}>
                        <div className={labelClass}>
                          <span className="inline-flex items-center gap-1.5">
                            <Icon className="w-3 h-3" aria-hidden="true" />
                            {label}
                          </span>
                        </div>
                        <div className={valueClass}>
                          {value ? value : <span className="text-[var(--color-mute)]">—</span>}
                          {isExpiry && passportDays !== null && passportDays < 180 && (
                            <span className={`ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              passportDays < 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                              {passportDays < 0 ? 'Expired' : `Expires in ${passportDays} days`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="sm:col-span-2">
                    <div className={labelClass}>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        Address
                      </span>
                    </div>
                    <div className={valueClass}>
                      {selectedCase.customer?.address ? selectedCase.customer.address : <span className="text-[var(--color-mute)]">—</span>}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className={labelClass}>
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="w-3 h-3" aria-hidden="true" />
                        Notes
                      </span>
                    </div>
                    <div className={valueClass}>
                      {selectedCase.customer?.notes ? selectedCase.customer.notes : <span className="text-[var(--color-mute)]">—</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* DOCUMENTS DETAIL */}
              <div className="hairline-card p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[var(--color-link)]" aria-hidden="true" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                      Documents Detail
                    </h3>
                    <span className="mono-eyebrow text-[10px]">
                      {docsUploaded} / {selectedDocs.length} uploaded
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowDocForm(current => !current); setDocError(''); }}
                    className="btn-app-sm"
                    aria-expanded={showDocForm}
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Document</span>
                  </button>
                </div>

                {showDocForm && (
                  <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="doc-name" className={labelClass}>Document Name *</label>
                        <input
                          id="doc-name"
                          className="sd-input"
                          value={docDraft.name}
                          onChange={e => setDocDraft({ ...docDraft, name: e.target.value })}
                          placeholder="Bank statement (6 months)…"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label htmlFor="doc-category" className={labelClass}>Category</label>
                        <select
                          id="doc-category"
                          className="sd-select"
                          value={docDraft.category}
                          onChange={e => setDocDraft({ ...docDraft, category: e.target.value })}
                        >
                          {DOC_CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="doc-file" className={labelClass}>File Name</label>
                        <input
                          id="doc-file"
                          className="sd-input"
                          value={docDraft.fileName}
                          onChange={e => setDocDraft({ ...docDraft, fileName: e.target.value })}
                          placeholder="passport-scan.pdf…"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                      <div>
                        <label htmlFor="doc-notes" className={labelClass}>Notes</label>
                        <input
                          id="doc-notes"
                          className="sd-input"
                          value={docDraft.notes}
                          onChange={e => setDocDraft({ ...docDraft, notes: e.target.value })}
                          placeholder="Received over WhatsApp…"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    {docError && (
                      <p role="alert" className="text-[11px] text-red-500">{docError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowDocForm(false); setDocError(''); setDocDraft({ name: '', category: 'Identity', fileName: '', notes: '' }); }}
                        className="btn-app-sm"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Cancel</span>
                      </button>
                      <button type="button" onClick={addDocument} className="btn-app-sm">
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Add to File</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-[var(--color-hairline)] border border-[var(--color-hairline)] rounded-xl bg-[var(--color-canvas)] overflow-hidden">
                  {selectedDocs.length === 0 && !showDocForm && (
                    <p className="p-3.5 text-[11px] text-[var(--color-mute)]">
                      No documents on file yet — use “Add Document” to attach the customer's supporting documents.
                    </p>
                  )}
                  {selectedDocs.map((doc) => {
                    const style = DOC_STATUS_STYLES[doc.status] || DOC_STATUS_STYLES.UPLOADED;
                    const StatusIcon = style.Icon;
                    return (
                      <div key={doc.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-hairline-soft)] transition-colors">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-[var(--color-mute)]" aria-hidden="true" />
                            <span className="text-xs font-medium text-[var(--color-ink)] break-words">{doc.name}</span>
                            <span className="px-1.5 py-0.5 text-[9px] font-mono rounded border border-[var(--color-hairline)] text-[var(--color-mute)]">
                              {doc.category || 'Other'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${style.chip}`}>
                              <StatusIcon className="w-3 h-3" aria-hidden="true" />
                              {(doc.status || 'UPLOADED').replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--color-mute)] break-words">
                            {doc.fileName || '—'} · {doc.uploadedAt ? `Added ${doc.uploadedAt}` : 'No date'}
                            {doc.notes ? ` · ${doc.notes}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            title="Mark Verified"
                            aria-label={`Mark ${doc.name} verified`}
                            onClick={() => setDocumentStatus(doc.id, 'VERIFIED')}
                            className="p-1 rounded hover:bg-emerald-100 text-emerald-600 border border-[var(--color-hairline)]"
                          >
                            <Check className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            title="Reject Document"
                            aria-label={`Reject ${doc.name}`}
                            onClick={() => setDocumentStatus(doc.id, 'REJECTED')}
                            className="p-1 rounded hover:bg-red-100 text-red-600 border border-[var(--color-hairline)]"
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            title="Remove Document"
                            aria-label={`Remove ${doc.name}`}
                            onClick={() => removeDocument(doc.id)}
                            className="p-1 rounded hover:bg-red-100 text-red-500 border border-[var(--color-hairline)]"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 hairline-card p-12 text-center text-xs text-[var(--color-mute)]">
              Select a visa case to review document checklists and embassy status.
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT CASE MODAL */}
      {isFormOpen && (
        <ModalOverlay onClose={() => setIsFormOpen(false)}>
          <div className="w-full max-w-3xl mx-auto rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] max-h-[88vh] overflow-y-auto overscroll-contain p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-[var(--color-hairline)]">
              <div>
                <span className="mono-eyebrow text-[var(--color-link)]">
                  {formMode === 'edit' ? 'EDIT CASE' : 'NEW VISA CASE'}
                </span>
                <h2 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                  {formMode === 'edit' ? 'Edit case & customer details' : 'Add visa case with customer details'}
                </h2>
                <p className="mt-1 text-xs text-[var(--color-mute)]">
                  Customer information, case facts and the embassy checklist are saved on one record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close dialog"
                className="shrink-0 w-8 h-8 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-body)] flex items-center justify-center hover:text-[var(--color-ink)]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-6">
              {formError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {formError}
                </p>
              )}

              {/* Customer details */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">Customer Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="vc-customer-name" className={labelClass}>Customer Full Name *</label>
                    <input
                      id="vc-customer-name"
                      className="sd-input"
                      required
                      autoFocus
                      value={form.customerName}
                      onChange={setField('customerName')}
                      placeholder="Chaudhry Kamran Akram…"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-city" className={labelClass}>City</label>
                    <input
                      id="vc-city"
                      className="sd-input"
                      value={form.customer.city}
                      onChange={setCustomerField('city')}
                      placeholder="Lahore…"
                      autoComplete="address-level2"
                    />
                  </div>
                  {CUSTOMER_FIELDS.filter(f => f.key !== 'city').map(field => (
                    <div key={field.key}>
                      <label htmlFor={`vc-${field.key}`} className={labelClass}>{field.label}</label>
                      <input
                        id={`vc-${field.key}`}
                        className="sd-input"
                        type={field.type}
                        value={form.customer[field.key] || ''}
                        onChange={setCustomerField(field.key)}
                        placeholder={field.placeholder}
                        autoComplete={field.autoComplete || 'off'}
                        spellCheck={field.type === 'email' ? false : undefined}
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label htmlFor="vc-address" className={labelClass}>Address</label>
                    <input
                      id="vc-address"
                      className="sd-input"
                      value={form.customer.address}
                      onChange={setCustomerField('address')}
                      placeholder="House 18, Block G, DHA Phase 5…"
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="vc-customer-notes" className={labelClass}>Customer Notes</label>
                    <input
                      id="vc-customer-notes"
                      className="sd-input"
                      value={form.customer.notes}
                      onChange={setCustomerField('notes')}
                      placeholder="Family of 3 travelling — spouse passport expires soon…"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </section>

              {/* Case facts */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">Visa Case</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="vc-destination" className={labelClass}>Destination *</label>
                    <input
                      id="vc-destination"
                      className="sd-input"
                      required
                      value={form.destination}
                      onChange={setField('destination')}
                      placeholder="United Arab Emirates…"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-visa-type" className={labelClass}>Visa Type *</label>
                    <input
                      id="vc-visa-type"
                      className="sd-input"
                      required
                      value={form.visaType}
                      onChange={setField('visaType')}
                      placeholder="Dubai 30-Days Tourist eVisa…"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-applicants" className={labelClass}>Applicant Count</label>
                    <input
                      id="vc-applicants"
                      className="sd-input"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={form.applicantCount}
                      onChange={setField('applicantCount')}
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-officer" className={labelClass}>Assigned Officer</label>
                    <input
                      id="vc-officer"
                      className="sd-input"
                      value={form.assignedOfficer}
                      onChange={setField('assignedOfficer')}
                      placeholder="Ayesha Khan…"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-reference" className={labelClass}>Reference Number</label>
                    <input
                      id="vc-reference"
                      className="sd-input"
                      value={form.referenceNumber}
                      onChange={setField('referenceNumber')}
                      placeholder="GDRFA-DXB-2026-8819…"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-provider" className={labelClass}>External Provider</label>
                    <input
                      id="vc-provider"
                      className="sd-input"
                      value={form.externalProvider}
                      onChange={setField('externalProvider')}
                      placeholder="Rayna Tours Overseas…"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-status" className={labelClass}>Status</label>
                    <select id="vc-status" className="sd-select" value={form.status} onChange={setField('status')}>
                      {VISA_STATUSES.map(st => (
                        <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vc-priority" className={labelClass}>Priority</label>
                    <select id="vc-priority" className="sd-select" value={form.priority} onChange={setField('priority')}>
                      {PRIORITIES.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vc-application-date" className={labelClass}>Application Date</label>
                    <input
                      id="vc-application-date"
                      className="sd-input"
                      type="date"
                      value={form.applicationDate}
                      onChange={setField('applicationDate')}
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-travel-date" className={labelClass}>Intended Travel Date</label>
                    <input
                      id="vc-travel-date"
                      className="sd-input"
                      type="date"
                      value={form.intendedTravelDate}
                      onChange={setField('intendedTravelDate')}
                    />
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">Pricing (PKR)</h3>
                  <span className="text-[11px] font-mono text-[var(--color-mute)]">
                    Expected margin: ₨{Math.max(0, toNum(form.totalCustomerPricePKR) - toNum(form.supplierCostPKR)).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="vc-visa-fee" className={labelClass}>Visa Fee</label>
                    <input id="vc-visa-fee" className="sd-input" type="number" min="0" inputMode="numeric" value={form.visaFeePKR} onChange={setField('visaFeePKR')} />
                  </div>
                  <div>
                    <label htmlFor="vc-service-fee" className={labelClass}>Service Fee</label>
                    <input id="vc-service-fee" className="sd-input" type="number" min="0" inputMode="numeric" value={form.serviceFeePKR} onChange={setField('serviceFeePKR')} />
                  </div>
                  <div>
                    <label htmlFor="vc-total-price" className={labelClass}>Customer Price</label>
                    <input id="vc-total-price" className="sd-input" type="number" min="0" inputMode="numeric" value={form.totalCustomerPricePKR} onChange={setField('totalCustomerPricePKR')} />
                  </div>
                  <div>
                    <label htmlFor="vc-supplier-cost" className={labelClass}>Supplier Cost</label>
                    <input id="vc-supplier-cost" className="sd-input" type="number" min="0" inputMode="numeric" value={form.supplierCostPKR} onChange={setField('supplierCostPKR')} />
                  </div>
                </div>
                {formMode === 'add' && (
                  <p className="text-[11px] text-[var(--color-mute)]">
                    A {DEFAULT_CHECKLIST.length}-item embassy checklist is generated with the new case (all pending until verified).
                  </p>
                )}
              </section>

              <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-[var(--color-hairline)]">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-app-sm">
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Cancel</span>
                </button>
                <button type="submit" className="btn-primary-pill">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>{formMode === 'edit' ? 'Save Changes' : 'Create Visa Case'}</span>
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
