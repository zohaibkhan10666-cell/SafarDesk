import React, { useState } from 'react';
import { 
  PlaneTakeoff, 
  Search, 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  Hotel, 
  Car, 
  CheckCircle2, 
  FileText, 
  ChevronRight,
  Compass
  ,X
} from 'lucide-react';

export default function BookingsView({ bookings, setBookings }) {
  const [selectedBooking, setSelectedBooking] = useState(bookings[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDraft, setBookingDraft] = useState(null);

  const openBookingEditor = (booking = null) => {
    setBookingDraft(booking ? { ...booking, flightDetails: { ...(booking.flightDetails || {}) } } : {
      id: `BKG-${Date.now()}`, bookingCode: `SFD-BKG-${String(Date.now()).slice(-4)}`,
      customerName: '', customerId: '', type: 'Comprehensive Package', destination: '', status: 'DRAFT',
      travelDates: '', totalAmountPKR: 0, paidAmountPKR: 0, balanceAmountPKR: 0, paymentStatus: 'UNPAID',
      flightDetails: { airline: '', pnr: '', ticketNumber: '', route: '', departureTime: '', status: 'PENDING' }, hotelDetails: null, itineraryDays: []
    });
    setShowBookingModal(true);
  };

  const updateBookingDraft = (key, value) => setBookingDraft(current => {
    const next = { ...current, [key]: value };
    if (key === 'totalAmountPKR' || key === 'paidAmountPKR') next.balanceAmountPKR = Math.max(0, Number(next.totalAmountPKR) - Number(next.paidAmountPKR));
    return next;
  });

  const saveBooking = (event) => {
    event.preventDefault();
    if (!bookingDraft.customerName || !bookingDraft.destination) return;
    const exists = bookings.some(b => b.id === bookingDraft.id);
    setBookings(exists ? bookings.map(b => b.id === bookingDraft.id ? bookingDraft : b) : [bookingDraft, ...bookings]);
    setSelectedBooking(bookingDraft);
    setShowBookingModal(false);
  };

  const filteredBookings = bookings.filter(b => 
    b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.flightDetails?.pnr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Bookings & Trip Itinerary Architect
          </h1>
          <p className="text-xs text-[var(--color-body)]">
            Flight PNR ticket status, hotel vouchers, and day-by-day traveler itinerary timelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openBookingEditor()} className="btn-secondary-pill"><Plus className="w-4 h-4" /><span>New Customer Trip</span></button>
          {selectedBooking && <button onClick={() => openBookingEditor(selectedBooking)} className="btn-primary-pill"><FileText className="w-4 h-4" /><span>Edit Booking & Trip</span></button>}
        </div>
      </div>

      {/* Main Split: Bookings List on Left, Active Booking & Itinerary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Bookings List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--color-mute)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PNR, customer, booking code..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] rounded-md text-[var(--color-ink)] focus:outline-none"
            />
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {filteredBookings.map((b) => {
              const isSelected = selectedBooking?.id === b.id;

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-[var(--color-ink)] bg-[var(--color-canvas-elevated)] shadow-xs'
                      : 'border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] hover:border-[var(--color-mute)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="mono-eyebrow text-[9px]">{b.bookingCode}</span>
                      <h4 className="font-semibold text-xs text-[var(--color-ink)] mt-0.5">{b.customerName}</h4>
                    </div>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {b.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--color-body)]">
                    <div>{b.destination} ({b.type})</div>
                    <div className="text-[10px] text-[var(--color-mute)] font-mono mt-0.5">
                      PNR: <strong className="text-[var(--color-link)]">{b.flightDetails?.pnr}</strong> · {b.flightDetails?.airline}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--color-hairline)] font-mono">
                    <span className="text-[var(--color-mute)]">{b.travelDates}</span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      PKR {b.totalAmountPKR?.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Trip Itinerary & Flight Workspace (8 cols) */}
        {selectedBooking ? (
          <div className="lg:col-span-8 hairline-card p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-hairline)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="mono-eyebrow text-[10px]">{selectedBooking.bookingCode}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 text-blue-700">
                    {selectedBooking.destination}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-[var(--color-ink)] mt-0.5">
                  Trip Master Record — {selectedBooking.customerName}
                </h2>
                <div className="text-xs text-[var(--color-mute)] font-mono">
                  Travel Dates: {selectedBooking.travelDates}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-[var(--color-mute)] uppercase font-mono">Booking Value</div>
                <div className="text-base font-semibold font-mono text-[var(--color-ink)]">
                  PKR {selectedBooking.totalAmountPKR?.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  Paid: PKR {selectedBooking.paidAmountPKR?.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Flight & Hotel Master Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Flight PNR Card */}
              {selectedBooking.flightDetails && (
                <div className="p-4 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink)]">
                    <div className="flex items-center gap-2">
                      <PlaneTakeoff className="w-4 h-4 text-[var(--color-link)]" />
                      <span>{selectedBooking.flightDetails.airline}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 font-bold">
                      {selectedBooking.flightDetails.pnr}
                    </span>
                  </div>
                  
                  <div className="text-xs text-[var(--color-body)] space-y-1">
                    <div>Route: <strong>{selectedBooking.flightDetails.route}</strong></div>
                    <div className="text-[11px] text-[var(--color-mute)]">
                      Departure: <span className="font-mono text-[var(--color-ink)]">{selectedBooking.flightDetails.departureTime}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--color-mute)]">
                      Ticket No: {selectedBooking.flightDetails.ticketNumber}
                    </div>
                  </div>
                </div>
              )}

              {/* Hotel Voucher Card */}
              {selectedBooking.hotelDetails && (
                <div className="p-4 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink)]">
                    <div className="flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-purple-600" />
                      <span>Hotel Voucher</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700">
                      {selectedBooking.hotelDetails.voucherStatus}
                    </span>
                  </div>
                  
                  <div className="text-xs text-[var(--color-body)] space-y-1">
                    <div className="font-medium text-[var(--color-ink)]">{selectedBooking.hotelDetails.name}</div>
                    <div className="text-[11px] text-[var(--color-mute)]">{selectedBooking.hotelDetails.roomType}</div>
                    <div className="text-[10px] font-mono text-[var(--color-mute)]">
                      Confirm: {selectedBooking.hotelDetails.confirmationNumber}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Day-by-Day Interactive Itinerary Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[var(--color-link)]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                    Day-by-Day Trip Schedule & Itinerary
                  </h3>
                </div>
                <span className="text-[11px] text-[var(--color-mute)]">
                  {selectedBooking.itineraryDays?.length || 0} Scheduled Days
                </span>
              </div>

              <div className="relative pl-6 border-l-2 border-[var(--color-hairline)] space-y-6">
                {selectedBooking.itineraryDays?.map((day) => (
                  <div key={day.day} className="relative group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-ink)] bg-white" />
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="mono-eyebrow text-[10px] text-[var(--color-link)]">Day {day.day} · {day.date}</span>
                        <h4 className="font-semibold text-xs text-[var(--color-ink)]">{day.title}</h4>
                      </div>
                      <p className="text-xs text-[var(--color-body)] leading-relaxed">
                        {day.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 hairline-card p-12 text-center text-xs text-[var(--color-mute)]">
            Select a booking to view PNR flight details and customer itinerary timeline.
          </div>
        )}
      </div>

      {showBookingModal && bookingDraft && (
        <div onClick={() => setShowBookingModal(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <form onSubmit={saveBooking} onClick={e => e.stopPropagation()} className="w-full max-w-3xl sd-card p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]"><div><h2 className="text-base font-semibold text-[var(--text)]">{bookings.some(b => b.id === bookingDraft.id) ? 'Edit Booking & Trip' : 'Create Customer Booking'}</h2><p className="text-xs text-[var(--text-3)]">Maintain the customer, traveler, trip, payment, and supplier reference in one record.</p></div><button type="button" onClick={() => setShowBookingModal(false)} className="p-1.5 text-[var(--text-2)]"><X className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[['customerName','Customer / traveler name'],['customerId','Customer ID'],['destination','Destination'],['travelDates','Travel dates'],['bookingCode','Booking code']].map(([key, label]) => <label key={key} className="space-y-1"><span className="text-[var(--text-2)]">{label}</span><input required={['customerName','destination'].includes(key)} value={bookingDraft[key]} onChange={e => updateBookingDraft(key, e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" /></label>)}
              <label className="space-y-1"><span className="text-[var(--text-2)]">Booking status</span><select value={bookingDraft.status} onChange={e => updateBookingDraft('status', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]"><option>DRAFT</option><option>CONFIRMED</option><option>ON_HOLD</option><option>CANCELLED</option></select></label>
              {[['totalAmountPKR','Total amount (PKR)'],['paidAmountPKR','Paid amount (PKR)']].map(([key, label]) => <label key={key} className="space-y-1"><span className="text-[var(--text-2)]">{label}</span><input type="number" min="0" value={bookingDraft[key]} onChange={e => updateBookingDraft(key, Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" /></label>)}
            </div>
            <div className="pt-3 border-t border-[var(--line)]"><span className="mono-eyebrow">Flight / PNR reference</span><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-xs">{[['airline','Airline'],['pnr','PNR'],['ticketNumber','Ticket number'],['route','Route'],['departureTime','Departure'],['status','Ticket status']].map(([key, label]) => <label key={key} className="space-y-1"><span className="text-[var(--text-2)]">{label}</span><input value={bookingDraft.flightDetails?.[key] || ''} onChange={e => setBookingDraft({ ...bookingDraft, flightDetails: { ...bookingDraft.flightDetails, [key]: e.target.value } })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" /></label>)}</div></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowBookingModal(false)} className="btn-secondary-pill">Cancel</button><button type="submit" className="btn-primary-pill"><CheckCircle2 className="w-4 h-4" /> Save booking</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
