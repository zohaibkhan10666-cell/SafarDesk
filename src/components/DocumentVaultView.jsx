import React, { useState } from 'react';
import { 
  FolderLock, 
  Search, 
  Upload, 
  FileText, 
  Image, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Eye, 
  X,
  Filter
} from 'lucide-react';

export default function DocumentVaultView() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const categories = [
    'ALL',
    'Passport',
    'CNIC',
    'Photograph',
    'Bank Statement',
    'Employment / NOC',
    'Flight Ticket',
    'Hotel Voucher'
  ];

  const initialDocs = [
    {
      id: 'DOC-101',
      name: 'Passport_Kamran_Akram_FirstPage.pdf',
      category: 'Passport',
      customer: 'Chaudhry Kamran Akram',
      traveller: 'Chaudhry Kamran Akram',
      size: '1.8 MB',
      uploadDate: '2026-09-20',
      uploadedBy: 'Hamza Tariq',
      status: 'VERIFIED',
      vaultHash: 'sha256-88a910...priv'
    },
    {
      id: 'DOC-102',
      name: 'Passport_Noreen_Kamran.pdf',
      category: 'Passport',
      customer: 'Chaudhry Kamran Akram',
      traveller: 'Noreen Kamran',
      size: '2.1 MB',
      uploadDate: '2026-09-20',
      uploadedBy: 'Hamza Tariq',
      status: 'VERIFIED',
      vaultHash: 'sha256-43b719...priv'
    },
    {
      id: 'DOC-103',
      name: 'Bank_Statement_Shaukat_Khanum_Dr_Samina.pdf',
      category: 'Bank Statement',
      customer: 'Dr. Samina Pervez',
      traveller: 'Dr. Samina Pervez',
      size: '4.6 MB',
      uploadDate: '2026-09-22',
      uploadedBy: 'Ayesha Khan',
      status: 'VERIFIED',
      vaultHash: 'sha256-91e842...priv'
    },
    {
      id: 'DOC-104',
      name: 'Child_Daniyal_Nadra_BForm.jpg',
      category: 'CNIC',
      customer: 'Chaudhry Kamran Akram',
      traveller: 'Daniyal Kamran',
      size: '950 KB',
      uploadDate: '2026-09-21',
      uploadedBy: 'Ayesha Khan',
      status: 'UNDER_REVIEW',
      vaultHash: 'sha256-11f849...priv'
    },
    {
      id: 'DOC-105',
      name: 'Emirates_Ticket_Confirmed_LHR_DXB.pdf',
      category: 'Flight Ticket',
      customer: 'Chaudhry Kamran Akram',
      traveller: '4 Passengers',
      size: '340 KB',
      uploadDate: '2026-09-21',
      uploadedBy: 'Fatima Noor',
      status: 'VERIFIED',
      vaultHash: 'sha256-99c012...priv'
    }
  ];

  const filteredDocs = initialDocs.filter(d => {
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Secure Document Vault
          </h1>
          <p className="text-xs text-[var(--color-body)]">
            Encrypted passport & CNIC document repository with signed access URLs and automated verification audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-app-sm shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Categories & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] text-[var(--color-body)] hover:text-[var(--color-ink)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[var(--color-mute)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or clients..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] rounded-md text-[var(--color-ink)] focus:outline-none"
          />
        </div>
      </div>

      {/* Drag & Drop Simulation Dropzone */}
      <div className="p-6 rounded-xl border-2 border-dashed border-[var(--color-hairline)] bg-[var(--color-canvas)] text-center space-y-1 hover:border-[var(--color-mute)] transition-colors cursor-pointer">
        <div className="w-8 h-8 mx-auto rounded-full bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] flex items-center justify-center text-[var(--color-mute)]">
          <Upload className="w-4 h-4" />
        </div>
        <div className="text-xs font-medium text-[var(--color-ink)]">
          Drag and drop passport scans, bank statements or tickets here
        </div>
        <div className="text-[11px] text-[var(--color-mute)]">
          Supports PDF, JPG, PNG up to 25MB (Encrypted AES-256 upon upload)
        </div>
      </div>

      {/* Documents Table */}
      <div className="border border-[var(--color-hairline)] rounded-xl bg-[var(--color-canvas-elevated)] overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-mute)]">
              <th className="py-2.5 px-3 font-medium">Document Name</th>
              <th className="py-2.5 px-3 font-medium">Category</th>
              <th className="py-2.5 px-3 font-medium">Customer / Traveller</th>
              <th className="py-2.5 px-3 font-medium">File Size</th>
              <th className="py-2.5 px-3 font-medium">Upload Date</th>
              <th className="py-2.5 px-3 font-medium">Verification Status</th>
              <th className="py-2.5 px-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-hairline)]">
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="hover:bg-[var(--color-hairline-soft)] transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-link)] shrink-0" />
                    <span className="font-medium text-[var(--color-ink)]">{doc.name}</span>
                  </div>
                  <div className="text-[9px] font-mono text-[var(--color-mute)] mt-0.5">
                    Hash: {doc.vaultHash}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-hairline-soft)] font-medium">
                    {doc.category}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="text-[var(--color-ink)] font-medium">{doc.customer}</div>
                  <div className="text-[10px] text-[var(--color-mute)]">{doc.traveller}</div>
                </td>
                <td className="py-2.5 px-3 font-mono text-[var(--color-body)]">{doc.size}</td>
                <td className="py-2.5 px-3 font-mono text-[var(--color-mute)]">{doc.uploadDate}</td>
                <td className="py-2.5 px-3">
                  {doc.status === 'VERIFIED' ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Under Review
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1 rounded hover:bg-[var(--color-hairline-soft)] text-[var(--color-mute)] hover:text-[var(--color-ink)]"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-[var(--color-hairline-soft)] text-[var(--color-mute)] hover:text-[var(--color-ink)]"
                      title="Download Secure File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-hairline)]">
              <div>
                <span className="mono-eyebrow text-[10px]">Vault File Viewer</span>
                <h3 className="text-sm font-semibold text-[var(--color-ink)] mt-0.5">{previewDoc.name}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1 text-[var(--color-mute)] hover:bg-[var(--color-hairline-soft)] rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document preview canvas simulation */}
            <div className="h-64 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] flex flex-col items-center justify-center p-6 text-center space-y-2">
              <FileText className="w-12 h-12 text-[var(--color-link)] opacity-60" />
              <div className="text-xs font-semibold text-[var(--color-ink)]">
                Secure Preview for {previewDoc.name}
              </div>
              <div className="text-[11px] text-[var(--color-mute)] max-w-md">
                Attached to {previewDoc.customer}. Document scanned at 300 DPI, authentic watermark verified.
              </div>
              <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono border border-emerald-200">
                STATUS: {previewDoc.status} · ENCRYPTED BLOB
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[var(--color-hairline)] text-xs">
              <span className="text-[var(--color-mute)] font-mono text-[11px]">{previewDoc.vaultHash}</span>
              <button onClick={() => setPreviewDoc(null)} className="btn-app-sm">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
