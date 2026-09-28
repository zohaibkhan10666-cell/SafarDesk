import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download, 
  Upload, 
  Plane, 
  Hotel, 
  ShieldCheck, 
  CreditCard, 
  MessageSquare, 
  Check, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { initialBookings, initialVisaCases, initialCustomers } from '../data/mockData';

export default function CustomerPortalView() {
  const [trackingQuery, setTrackingQuery] = useState('SFD-BKG-501');
  const [activeTab, setActiveTab] = useState('overview'); // overview, itinerary, visa, payments, documents
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Active tracked records
  const sampleBooking = initialBookings[0];
  const sampleVisa = initialVisaCases[0];

  const visaSteps = [
    { title: 'Documents Received', date: '2026-09-20', status: 'completed', desc: 'Passports & photos received at Lahore HQ' },
    { title: 'Application Review', date: '2026-09-21', status: 'completed', desc: 'Case audited by Senior Visa Officer Ayesha Khan' },
    { title: 'Embassy Submission', date: '2026-09-22', status: 'completed', desc: 'Submitted to GDRFA Dubai immigration portal' },
    { title: 'Under Processing', date: 'In Progress', status: 'current', desc: 'Awaiting electronic visa grant approval' },
    { title: 'Visa Stamped / Issued', date: 'Est. Sep 25', status: 'pending', desc: 'e-Visa PDF download & passport collection' }
  ];

  const handleSimulateUpload = (e) => {
    e.preventDefault();
    const mockFile = {
      id: `up-${Date.now()}`,
      name: 'Client_Updated_Tax_Return_2026.pdf',
      size: '2.4 MB',
      date: 'Just now',
      status: 'VERIFIED_HASH'
    };
    setUploadedFiles([mockFile, ...uploadedFiles]);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Explanation of Public Customer Portal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              Public Customer Tracking Portal
            </h1>
            <span className="badge-mint text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              README §21
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Simulates the client-facing tracking screen shared via WhatsApp link (e.g. <span className="font-mono text-[var(--mint)]">safardesk.com/track/{trackingQuery}</span>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-xs text-[var(--text-2)]">
            <Globe className="w-3.5 h-3.5 text-[var(--mint)]" />
            <span>Client View Active</span>
          </div>
        </div>
      </div>

      {/* Public Search Bar */}
      <div className="sd-card p-5 space-y-3 bg-gradient-to-r from-[var(--surface)] to-[var(--surface-2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] font-display">
              Track Your SafarDesk Travel & Visa File
            </h3>
            <p className="text-xs text-[var(--text-2)] font-body">
              Enter your 6-digit Booking Reference or Visa Application Code
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-96">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value)}
                placeholder="e.g. SFD-BKG-501 or VISA-401"
                className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--navy)] border border-[var(--line-2)] rounded-lg text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
              />
            </div>
            <button className="btn-primary-pill px-4 py-2 text-xs shrink-0">
              Track
            </button>
          </div>
        </div>
      </div>

      {/* Main Tracked File Card */}
      <div className="sd-card p-6 space-y-6">
        {/* Customer & Trip Overview Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]">
                CONFIRMED TRIP
              </span>
              <span className="font-mono text-xs text-[var(--text-3)]">Ref: {sampleBooking.bookingCode}</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text)] font-display">
              {sampleBooking.customerName}
            </h2>
            <div className="text-xs text-[var(--text-2)]">
              {sampleBooking.destination} · {sampleBooking.travelDates} · {sampleBooking.travellersCount} Passengers
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/923008472910?text=Hello%20SafarDesk,%20inquiry%20regarding%20booking%20${sampleBooking.bookingCode}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#25D366] text-black hover:bg-[#20ba59] transition-all shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Your Consultant</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs inside Customer Portal */}
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Trip Overview' },
            { id: 'visa', label: 'Visa Tracking (GDRFA)' },
            { id: 'itinerary', label: 'Flights & Hotels' },
            { id: 'payments', label: 'Payment Ledger' },
            { id: 'documents', label: 'Upload Missing Documents' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
                <span className="mono-eyebrow text-[9px] text-[var(--cyan)]">Airline Flight PNR</span>
                <div className="text-xl font-bold font-mono text-[var(--text)]">{sampleBooking.flightDetails.pnr}</div>
                <div className="text-[11px] text-[var(--text-3)]">{sampleBooking.flightDetails.airline} (Direct)</div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
                <span className="mono-eyebrow text-[9px] text-[var(--mint)]">Visa Case Status</span>
                <div className="text-xl font-bold font-mono text-[var(--mint)]">In Processing</div>
                <div className="text-[11px] text-[var(--text-3)]">GDRFA Dubai Submission</div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
                <span className="mono-eyebrow text-[9px] text-[var(--amber)]">Payment Status</span>
                <div className="text-xl font-bold font-mono text-[var(--amber)]">PKR 185,000 Due</div>
                <div className="text-[11px] text-[var(--mint)]">PKR 975,000 Verified Paid</div>
              </div>
            </div>

            {/* Visual 5-Step Visa Tracker */}
            <div className="space-y-3">
              <h3 className="mono-eyebrow text-[10px]">Real-time Visa Application Timeline</h3>
              <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
                  {visaSteps.map((step, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          step.status === 'completed' ? 'bg-[var(--mint)] text-black' :
                          step.status === 'current' ? 'bg-[var(--cyan)] text-black ring-4 ring-[var(--cyan-dim)] animate-pulse' :
                          'bg-[var(--surface-3)] text-[var(--text-3)]'
                        }`}>
                          {step.status === 'completed' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-3)]">{step.date}</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[var(--text)]">{step.title}</div>
                        <div className="text-[10px] text-[var(--text-3)] mt-0.5 leading-snug">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Visa Tracking */}
        {activeTab === 'visa' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <span className="mono-eyebrow text-[9px] text-[var(--cyan)]">Electronic Visa Application</span>
                  <h3 className="text-sm font-bold text-[var(--text)] mt-0.5">Dubai 30-Day Tourist Multiple Entry</h3>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.3)]">
                  Under Processing (GDRFA)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[var(--text-3)]">Application No</span>
                  <div className="font-mono font-semibold text-[var(--text)]">UAE-DXB-991204</div>
                </div>
                <div>
                  <span className="text-[var(--text-3)]">Submission Date</span>
                  <div className="font-mono font-semibold text-[var(--text)]">2026-09-22</div>
                </div>
                <div>
                  <span className="text-[var(--text-3)]">Target Approval</span>
                  <div className="font-mono font-semibold text-[var(--mint)]">Within 48 Hours</div>
                </div>
                <div>
                  <span className="text-[var(--text-3)]">Embassy Fees</span>
                  <div className="font-mono font-semibold text-[var(--text)]">Paid by Agency</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text-2)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--mint)] shrink-0" />
                <span>Original passports are safely lodged in SafarDesk Vault. You will receive an automated WhatsApp notification the moment your e-visa is approved.</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Itinerary */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--cyan)]">
                  <Plane className="w-4 h-4" />
                  <span>Confirmed Flight Ticket</span>
                </div>
                <span className="font-mono text-xs font-bold text-[var(--text)]">PNR: {sampleBooking.flightDetails.pnr}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                <div>
                  <span className="text-[var(--text-3)]">Departure Sector</span>
                  <div className="font-semibold text-[var(--text)]">LHR → DXB (EK 623)</div>
                  <div className="text-[10px] text-[var(--text-3)]">Allama Iqbal Intl Airport</div>
                </div>
                <div>
                  <span className="text-[var(--text-3)]">Return Sector</span>
                  <div className="font-semibold text-[var(--text)]">DXB → LHR (EK 624)</div>
                  <div className="text-[10px] text-[var(--text-3)]">Dubai Intl Terminal 3</div>
                </div>
                <div>
                  <span className="text-[var(--text-3)]">Baggage Allowance</span>
                  <div className="font-semibold text-[var(--mint)]">30kg + 7kg Cabin</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--amber)]">
                  <Hotel className="w-4 h-4" />
                  <span>Hotel Accommodation Voucher</span>
                </div>
                <span className="font-mono text-xs text-[var(--text-3)]">Voucher # {sampleBooking.hotelVoucher.voucherNumber}</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs space-y-1">
                <div className="font-bold text-sm text-[var(--text)]">{sampleBooking.hotelVoucher.hotelName}</div>
                <div className="text-[var(--text-2)]">{sampleBooking.hotelVoucher.roomCategory} · {sampleBooking.hotelVoucher.mealPlan}</div>
                <div className="text-[11px] text-[var(--text-3)] font-mono">Check-in: {sampleBooking.hotelVoucher.checkIn} · Check-out: {sampleBooking.hotelVoucher.checkOut}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text)]">
                Installment Schedule & Verified Receipts
              </h3>

              <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden text-xs">
                <div className="p-3 flex justify-between items-center bg-[var(--surface)]">
                  <div>
                    <div className="font-semibold text-[var(--text)]">Installment 1: Advance Deposit</div>
                    <div className="text-[10px] text-[var(--text-3)] font-mono">Paid on 2026-09-15 via Meezan Raast (SFD-REC-2026-0412)</div>
                  </div>
                  <span className="font-mono font-bold text-[var(--mint)]">PKR 580,000 Verified</span>
                </div>

                <div className="p-3 flex justify-between items-center bg-[var(--surface)]">
                  <div>
                    <div className="font-semibold text-[var(--text)]">Installment 2: Mid-term Payment</div>
                    <div className="text-[10px] text-[var(--text-3)] font-mono">Paid on 2026-09-20 via Online Banking (SFD-REC-2026-0419)</div>
                  </div>
                  <span className="font-mono font-bold text-[var(--mint)]">PKR 395,000 Verified</span>
                </div>

                <div className="p-3 flex justify-between items-center bg-[var(--surface)]">
                  <div>
                    <div className="font-semibold text-[var(--red)]">Installment 3: Final Balance</div>
                    <div className="text-[10px] text-[var(--red)] font-mono">Due before ticket dispatch (Past Due)</div>
                  </div>
                  <span className="font-mono font-bold text-[var(--red)]">PKR 185,000 Overdue</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => alert('Official verified receipt SFD-REC-2026-0412 downloaded.')}
                  className="btn-primary-pill px-4 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Latest Receipt (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Upload Missing Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl border border-dashed border-[var(--line-2)] bg-[var(--surface-2)] text-center space-y-3">
              <Upload className="w-8 h-8 text-[var(--mint)] mx-auto opacity-70" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--text)]">Upload Pending Documents</h4>
                <p className="text-xs text-[var(--text-3)] mt-0.5">
                  Upload PDF or JPG files (Passports, CNIC, Nadra B-Forms, Bank Statements)
                </p>
              </div>

              {uploadSuccess && (
                <div className="p-2.5 rounded-lg bg-[var(--mint-dim)] border border-[rgba(31,229,163,0.3)] text-xs text-[var(--mint)] font-medium">
                  File uploaded successfully! Encrypted with SHA-256 and sent to SafarDesk Visa Officer.
                </div>
              )}

              <form onSubmit={handleSimulateUpload} className="flex justify-center">
                <button
                  type="submit"
                  className="btn-primary-pill px-5 py-2 text-xs flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Simulate Client File Upload</span>
                </button>
              </form>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="mono-eyebrow text-[10px]">Your Uploaded Files</h4>
                <div className="space-y-1.5 text-xs">
                  {uploadedFiles.map(f => (
                    <div key={f.id} className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--cyan)]" />
                        <div>
                          <div className="font-medium text-[var(--text)]">{f.name}</div>
                          <div className="text-[10px] text-[var(--text-3)]">{f.size} · Uploaded {f.date}</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--mint)] bg-[var(--mint-dim)] px-2 py-0.5 rounded">
                        Encrypted In Vault
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
