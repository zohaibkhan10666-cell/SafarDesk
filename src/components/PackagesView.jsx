import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Calendar, 
  MapPin, 
  Check, 
  X, 
  Share2, 
  MessageSquare, 
  Hotel, 
  Plane, 
  Users, 
  Star, 
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { initialPackages } from '../data/mockData';

export default function PackagesView({ onOpenWhatsApp }) {
  const [packages, setPackages] = useState(initialPackages);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePackage, setActivePackage] = useState(packages[0] || null);
  const [sharingType, setSharingType] = useState('quad'); // quad, triple, double, single
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // New Package form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Umrah');
  const [newDestination, setNewDestination] = useState('');
  const [newDuration, setNewDuration] = useState('10 Nights / 11 Days');
  const [newQuadPrice, setNewQuadPrice] = useState('285000');
  const [newDoublePrice, setNewDoublePrice] = useState('360000');
  const [newInclusions, setNewInclusions] = useState('Return Airfare, Visa with Insurance, 4-Star Hotel, Airport Transfers, Guided Tours');

  const categories = ['ALL', 'Umrah', 'Holiday'];

  const filteredPackages = packages.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.destination.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getPrice = (pkg, type) => {
    switch (type) {
      case 'single': return pkg.pricing.singlePKR;
      case 'double': return pkg.pricing.doublePKR;
      case 'triple': return pkg.pricing.triplePKR;
      case 'quad': 
      default: return pkg.pricing.quadPKR;
    }
  };

  const handleCreatePackage = (e) => {
    e.preventDefault();
    if (!newTitle || !newDestination) return;

    const newPkg = {
      id: `PKG-CUST-${Date.now()}`,
      title: newTitle,
      badge: 'Custom Package',
      category: newCategory,
      destination: newDestination,
      duration: newDuration,
      rating: 5.0,
      reviewsCount: 1,
      hotels: [
        { city: newDestination.split(',')[0], name: 'Verified 4-Star Hotel', distance: 'Prime Location', nights: 7 }
      ],
      pricing: {
        quadPKR: parseInt(newQuadPrice) || 280000,
        triplePKR: Math.round((parseInt(newQuadPrice) || 280000) * 1.12),
        doublePKR: parseInt(newDoublePrice) || 350000,
        singlePKR: Math.round((parseInt(newDoublePrice) || 350000) * 1.35)
      },
      flightSector: 'Direct Flights from Pakistan (PIA / Saudia / Emirates)',
      inclusions: newInclusions.split(',').map(s => s.trim()).filter(Boolean),
      exclusions: ['Lunch & personal shopping', 'Tips to guide & porter'],
      itinerary: [
        { day: 1, title: 'Arrival & Hotel Check-in', desc: 'Arrive at destination international airport, luxury private transfer to hotel.' },
        { day: 2, title: 'Guided City & Sightseeing Tour', desc: 'Full-day excursion to major landmarks and historical sites with guide.' },
        { day: 3, title: 'Free Day for Leisure & Shopping', desc: 'Explore local traditional bazaars and modern malls at your own pace.' },
        { day: 4, title: 'Departure Flight Home', desc: 'Hotel check-out and airport transfer for return flight back to Pakistan.' }
      ]
    };

    setPackages([newPkg, ...packages]);
    setActivePackage(newPkg);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDestination('');
  };

  const generateWhatsAppBrochure = (pkg) => {
    const text = `*${pkg.title.toUpperCase()}* ✈️🕋\n` +
      `*Destination:* ${pkg.destination}\n` +
      `*Duration:* ${pkg.duration}\n\n` +
      `💰 *Package Pricing (Per Person):*\n` +
      `• Quad Sharing: PKR ${pkg.pricing.quadPKR.toLocaleString()}\n` +
      `• Triple Sharing: PKR ${pkg.pricing.triplePKR.toLocaleString()}\n` +
      `• Double Sharing: PKR ${pkg.pricing.doublePKR.toLocaleString()}\n\n` +
      `✨ *Package Inclusions:*\n` +
      pkg.inclusions.map(inc => `✓ ${inc}`).join('\n') + `\n\n` +
      `📞 Contact SafarDesk Global Travel: +92 300 8472910\n` +
      `Official DTS Accredited Agency`;

    navigator.clipboard?.writeText(text);
    setCopiedId(pkg.id);
    setTimeout(() => setCopiedId(null), 3000);
    
    // Open in WhatsApp if requested
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              Package Builder & Tour Catalog
            </h1>
            <span className="badge-mint text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              README §12
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Pre-packaged Umrah programs, holiday group tours, room-sharing pricing matrix, and instant WhatsApp brochures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary-pill shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Package</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              {cat === 'ALL' ? 'All Packages' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Umrah, Dubai, Baku..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--line-2)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--mint)] transition-colors"
          />
        </div>
      </div>

      {/* Main Split Layout: Left Catalog Grid, Right Active Package Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Packages List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="space-y-3 max-h-[calc(100vh-15rem)] overflow-y-auto pr-1">
            {filteredPackages.map((pkg) => {
              const isSelected = activePackage?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setActivePackage(pkg)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-[var(--mint)] bg-[var(--surface-2)] shadow-md shadow-[rgba(0,0,0,0.3)]'
                      : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-2)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="mono-eyebrow text-[9px] text-[var(--mint)]">{pkg.category}</span>
                        {pkg.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.25)]">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-[var(--text)] font-display mt-1">
                        {pkg.title}
                      </h3>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-[var(--text-3)] transition-transform ${isSelected ? 'translate-x-1 text-[var(--mint)]' : ''}`} />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[var(--text-2)] font-body">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[var(--cyan)]" />
                      <span>{pkg.destination.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--amber)]" />
                      <span>{pkg.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--amber)] font-mono text-[11px]">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{pkg.rating} ({pkg.reviewsCount})</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-3)]">Quad Sharing From</span>
                    <span className="font-mono font-bold text-sm text-[var(--mint)]">
                      PKR {pkg.pricing.quadPKR.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Package Workspace (7 Cols) */}
        <div className="lg:col-span-7">
          {activePackage ? (
            <div className="sd-card p-6 space-y-6">
              {/* Package Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--line)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="mono-eyebrow text-[10px] text-[var(--mint)]">{activePackage.category}</span>
                    <span className="text-[11px] text-[var(--text-3)] font-mono">ID: {activePackage.id}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text)] font-display mt-1">
                    {activePackage.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-2)] mt-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--cyan)]" />
                      <span>{activePackage.destination}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--amber)]" />
                      <span>{activePackage.duration}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => generateWhatsAppBrochure(activePackage)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#25D366] text-black hover:bg-[#20ba59] transition-all shrink-0 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedId === activePackage.id ? 'Copied & Sent!' : 'Share WhatsApp Brochure'}</span>
                </button>
              </div>

              {/* Room Sharing Pricing Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="mono-eyebrow text-[10px]">Room Sharing Rates (PKR Per Pax)</h3>
                  <span className="text-[11px] text-[var(--text-3)] font-mono">Official Taxes Included</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'quad', label: 'Quad Sharing', price: activePackage.pricing.quadPKR, desc: '4 Persons / Room' },
                    { id: 'triple', label: 'Triple Sharing', price: activePackage.pricing.triplePKR, desc: '3 Persons / Room' },
                    { id: 'double', label: 'Double Sharing', price: activePackage.pricing.doublePKR, desc: '2 Persons / Room' },
                    { id: 'single', label: 'Single Room', price: activePackage.pricing.singlePKR, desc: 'Private Solo Room' }
                  ].map(tier => (
                    <div
                      key={tier.id}
                      onClick={() => setSharingType(tier.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        sharingType === tier.id
                          ? 'border-[var(--mint)] bg-[var(--mint-dim)] shadow-xs'
                          : 'border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-2)]'
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-[var(--text)]">{tier.label}</div>
                      <div className="text-base font-bold font-mono text-[var(--mint)] mt-1">
                        ₨{(tier.price / 1000).toFixed(0)}k
                      </div>
                      <div className="text-[10px] text-[var(--text-3)] mt-0.5">{tier.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hotels & Flight Sector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--cyan)]">
                    <Hotel className="w-4 h-4" />
                    <span>Included Accommodations</span>
                  </div>
                  <div className="space-y-2 text-xs text-[var(--text-2)]">
                    {activePackage.hotels?.map((h, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-[var(--line)] last:border-0">
                        <div>
                          <div className="font-medium text-[var(--text)]">{h.name}</div>
                          <div className="text-[10px] text-[var(--text-3)]">{h.city} · {h.distance}</div>
                        </div>
                        <span className="font-mono text-[11px] text-[var(--cyan)]">{h.nights} Nights</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--mint)]">
                    <Plane className="w-4 h-4" />
                    <span>Flight Routing & Airlines</span>
                  </div>
                  <div className="text-xs text-[var(--text-2)] space-y-2">
                    <div className="font-mono text-[11px] text-[var(--text)] bg-[var(--surface)] p-2 rounded border border-[var(--line)]">
                      {activePackage.flightSector}
                    </div>
                    <div className="text-[11px] text-[var(--text-3)]">
                      Includes 30kg check-in baggage + 7kg cabin carry per passenger.
                    </div>
                  </div>
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="space-y-3">
                <h3 className="mono-eyebrow text-[10px]">What is Included & Excluded</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    {activePackage.inclusions.map((inc, i) => (
                      <div key={i} className="flex items-start gap-2 text-[var(--text-2)]">
                        <Check className="w-3.5 h-3.5 text-[var(--mint)] shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {activePackage.exclusions?.map((exc, i) => (
                      <div key={i} className="flex items-start gap-2 text-[var(--text-3)]">
                        <X className="w-3.5 h-3.5 text-[var(--red)] shrink-0 mt-0.5" />
                        <span>{exc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day-by-Day Itinerary */}
              <div className="space-y-3">
                <h3 className="mono-eyebrow text-[10px]">Day-by-Day Journey Itinerary</h3>
                <div className="space-y-2 border-l border-[var(--line-2)] ml-3 pl-4">
                  {activePackage.itinerary?.map((item, i) => (
                    <div key={i} className="relative pb-3 last:pb-0">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--mint)] ring-4 ring-[var(--surface)]" />
                      <div className="text-xs font-semibold text-[var(--text)] font-display">
                        Day {item.day}: {item.title}
                      </div>
                      <p className="text-[11px] text-[var(--text-2)] font-body mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="sd-card p-12 text-center text-xs text-[var(--text-3)]">
              Select a package from the catalog to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Custom Package Modal */}
      {isCreateModalOpen && (
        <div 
          onClick={() => setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="sd-card max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)] font-display">Create Custom Tour Package</h2>
                <p className="text-xs text-[var(--text-3)] font-body">Add a new fixed departure or customized Umrah package to your agency catalog</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs font-body">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Package Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 12-Day Ramadan Special Umrah Group"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  >
                    <option value="Umrah">Umrah Group</option>
                    <option value="Holiday">Outbound Holiday</option>
                    <option value="Hajj">Hajj Executive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Destination</label>
                  <input
                    type="text"
                    required
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    placeholder="e.g. Makkah & Madinah, Saudi Arabia"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Duration</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="10 Nights / 11 Days"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Quad Price (PKR)</label>
                  <input
                    type="number"
                    value={newQuadPrice}
                    onChange={(e) => setNewQuadPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Double Price (PKR)</label>
                  <input
                    type="number"
                    value={newDoublePrice}
                    onChange={(e) => setNewDoublePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Inclusions (Comma separated)</label>
                <textarea
                  rows={3}
                  value={newInclusions}
                  onChange={(e) => setNewInclusions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-pill px-5 py-2 text-xs"
                >
                  Save & Publish to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
