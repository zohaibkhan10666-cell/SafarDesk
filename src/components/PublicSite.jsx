import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, ChevronUp, FileText,
  Globe2, LockKeyhole, Menu, MessageCircle, Plane, ShieldCheck, Sparkles, Users,
  X, Zap, Star, Clock, CreditCard, Headphones, BookOpen, Briefcase, Building2,
  Calendar, Camera, ClipboardList, Globe, MapPin, Phone, Search, Send, Settings,
  Shield, Tag, Target, TrendingUp, Award, Heart, CheckCircle2, ArrowDown, Mail,
  MessageSquare, Sun, Moon
} from 'lucide-react';
import { api, setToken } from '../lib/api';
import { loadPublicPlans, readCachedPublicPlans, PUBLIC_PLANS_CACHE_KEY } from '../lib/publicPlans';
import { submitContactMessage } from '../lib/contactInbox';

/* ─── DATA ─── */

// Bundled fallback catalog — replaced at runtime by the Super Admin's plan catalog
// (live API → localStorage mirror) so home & pricing always show current pricing.
const defaultPlans = [
  { id: 'STARTER', name: 'Starter', price: '18,000', description: 'A focused workspace for a growing travel desk.', features: ['4 team roles', '1 branch', 'Leads, customers & quotations', 'Bookings & payment tracking', 'WhatsApp follow-ups', 'Basic reporting'] },
  { id: 'BUSINESS', name: 'Business', price: '42,000', description: 'The operating system for a busy multi-service agency.', popular: true, features: ['10 team roles', '3 branches', 'Visa & document workflows', 'WhatsApp hub & reports', 'Supplier management', 'Quotation PDF builder'] },
  { id: 'AGENCY_PRO', name: 'Agency Pro', price: '85,000', description: 'Full control for established and multi-branch agencies.', features: ['25 team roles', '10 branches', 'Finance, audit & supplier controls', 'API-ready platform', 'Commission tracking', 'Priority support & onboarding'] }
];

const navLinks = [
  { label: 'Platform', id: 'platform' },
  { label: 'Solutions', id: 'solutions' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing-section' },
  { label: 'FAQ', id: 'faq' },
];

// Stable id list so useScrollSpy subscribes once instead of on every render.
const NAV_SECTION_IDS = navLinks.map(link => link.id);

const capabilities = [
  { icon: MessageCircle, eyebrow: '01 / COMMUNICATE', title: 'Every enquiry has a next step.', text: 'Capture leads from WhatsApp, phone calls, walk-ins and social media. Assign ownership instantly and keep follow-ups visible until the journey is complete.' },
  { icon: FileText, eyebrow: '02 / OPERATE', title: 'Visa to voucher, one clear record.', text: 'Keep passport documents, visa checklists, quotations, bookings and travel notes connected to the customer — no scattered spreadsheets, no lost files.' },
  { icon: BarChart3, eyebrow: '03 / GROW', title: 'Know where your margin goes.', text: 'Track payments, supplier costs, outstanding balances and branch performance from one calm command center built for Pakistani agencies.' },
  { icon: Globe2, eyebrow: '04 / SCALE', title: 'From one desk to ten branches.', text: 'Start small, grow without limits. Role-based access, branch isolation and enterprise controls let you scale while keeping data secure.' },
];

const workflowSteps = [
  { num: '01', icon: MessageCircle, title: 'Capture enquiry', desc: 'WhatsApp, call or walk-in leads land in your pipeline automatically.' },
  { num: '02', icon: FileText, title: 'Build & quote', desc: 'Passport, visa checklist, quotation — one connected record per customer.' },
  { num: '03', icon: CreditCard, title: 'Confirm & pay', desc: 'Booking locked, payment schedule tracked, supplier settled on time.' },
  { num: '04', icon: Headphones, title: 'Travel & follow-up', desc: 'Trip managed, customer cared for, next journey awaited.' },
];

const solutions = [
  { title: 'Travel agencies', icon: Plane, text: 'Quotes, ticket records, hotel vouchers and follow-ups — the complete workflow for full-service travel consultancies.' },
  { title: 'Visa consultants', icon: FileText, text: 'Document vaults, application checklists and case ownership — track every visa from submission to stamp.' },
  { title: 'Umrah operators', icon: MessageCircle, text: 'Pilgrim groups, packages, suppliers and communication — manage Hajj & Umrah operations at scale.' },
  { title: 'Multi-branch teams', icon: BarChart3, text: 'Branch scope, permissions, audit trails and reporting — enterprise control without enterprise complexity.' },
];

const testimonials = [
  { name: 'Ahmed Raza', role: 'CEO, Al-Barakah Travels', text: 'SafarDesk replaced our WhatsApp chaos with a real system. Our visa approval rate jumped 40% because nothing falls through the cracks anymore.', rating: 5 },
  { name: 'Fatima Zahra', role: 'Operations Head, SkyWay Tours', text: 'We manage 200+ active cases across 3 branches. The dashboard gives me clarity in 10 seconds — who needs what, when, and where the money stands.', rating: 5 },
  { name: 'Usman Malik', role: 'Founder, Pak Voyager', text: 'The WhatsApp integration alone saved us 3 hours a day. Follow-ups are automated, quotations go out in minutes, and payments are always tracked.', rating: 5 },
];

const faqs = [
  ['Is SafarDesk made for Pakistani agencies?', 'Yes. PKR currency, Asia/Karachi timezone, Pakistani branch structures, WhatsApp-led sales and visa workflows are first-class parts of the product.'],
  ['Can I start with one branch and grow later?', 'Yes. Begin with a focused plan and upgrade roles, branches and features as your operation expands.'],
  ['Do you replace airline or hotel booking systems?', 'No. SafarDesk is the operating layer for your consultancy. External bookings can be recorded now, with GDS and API integrations ready for later.'],
  ['Can each staff member have a different role?', 'Yes. Owners can invite users, assign roles and branches, and restrict sensitive finance and platform controls with granular permissions.'],
  ['How long does onboarding take?', 'Most agencies are live within 24 hours. Our onboarding wizard walks you through agency setup, branch creation, team invites and plan activation.'],
  ['Is my customer data secure?', 'Absolutely. Every agency tenant is fully isolated. Documents are stored privately with signed URLs, and role-based access controls ensure staff only see what they should.'],
  ['Do you offer a free trial?', 'Yes. Every plan starts with a 14-day free trial — no credit card required. Explore the full platform before committing.'],
];

const stats = [
  { value: '500+', label: 'Travel agencies' },
  { value: '50K+', label: 'Visas processed' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '24/7', label: 'Support available' },
];

const trustedBy = ['Al-Barakah Travels', 'SkyWay Tours', 'Hajj & Umrah Co.', 'Pak Voyager', 'Global Visa Services', 'Darul Safeer', 'Rehman Travels'];

const bentoCards = [
  { large: true, eyebrow: 'COMMAND CENTER', title: 'Your agency, one view.', text: 'New leads today, quotes pending, payments due, upcoming departures — every metric your team needs, visible in 10 seconds.', gradient: 'from-[rgba(31,229,163,0.12)] to-transparent', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80' },
  { eyebrow: 'LEAD PIPELINE', title: 'Never lose a lead.', text: 'From WhatsApp enquiry to confirmed booking — track every stage with Kanban and table views.', gradient: 'from-[rgba(45,168,240,0.12)] to-transparent', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80' },
  { eyebrow: 'VISA WORKFLOWS', title: 'Visa cases, organized.', text: 'Checklists, document verification, status tracking — from submission to approval.', gradient: 'from-[rgba(229,176,74,0.12)] to-transparent', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80' },
  { eyebrow: 'QUOTATION BUILDER', title: 'Quotes in minutes.', text: 'Professional branded PDFs with flight, visa, hotel and service line items.', gradient: 'from-[rgba(31,229,163,0.10)] to-transparent', image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&q=80' },
  { eyebrow: 'PAYMENT TRACKING', title: 'Every rupee accounted.', text: 'Advance, installments, balances, overdue alerts — never chase payments again.', gradient: 'from-[rgba(45,168,240,0.10)] to-transparent', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80' },
  { eyebrow: 'WHATSAPP HUB', title: 'Conversations, captured.', text: 'Lead acknowledgement, document requests, payment reminders — template-driven workflows.', gradient: 'from-[rgba(155,107,240,0.12)] to-transparent', image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=600&q=80' },
];

const footerLinks = {
  Product: ['Platform Overview', 'CRM & Leads', 'Visa Management', 'Quotations', 'Bookings', 'Payments', 'Reports'],
  Solutions: ['Travel Agencies', 'Visa Consultants', 'Umrah Operators', 'Multi-Branch Teams', 'Sub-Agents'],
  Company: ['About SafarDesk', 'Careers', 'Blog', 'Press', 'Contact'],
};

/* ─── HOOKS ─── */

function useScrollAnimation(threshold = 0.1) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, isVisible];
}

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const handler = () => {
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 200) { setActive(id); break; }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [ids]);
  return active;
}

function useCountUp(end, duration = 2000, startOnVisible = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnVisible) { setStarted(true); return; }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return [ref, count];
}

/* ─── COMPONENTS ─── */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--mint)] to-[var(--cyan)]">
        <Plane className="h-4 w-4 rotate-[-45deg] text-[#051020]" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-[var(--text)]">
        SafarDesk<span className="text-[var(--mint)]">.</span>
      </span>
    </div>
  );
}

function Section({ children, className = '', id }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <section id={id} ref={ref} className={`${className} transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {children}
    </section>
  );
}

function Field({ label, type = 'text', placeholder, value, onChange, required = false }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]">{label}</span>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required} aria-label={label}
        className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--surface-2)] px-3.5 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-3)] focus:border-[var(--mint)] focus:ring-2 focus:ring-[rgba(31,229,163,0.10)]" />
    </label>
  );
}

/* Contact form used by the home & contact sections — every submission lands in the
   Super Admin console inbox (lib/contactInbox.js: local mirror + POST /public/contact). */
const EMPTY_CONTACT = { firstName: '', lastName: '', email: '', agency: '', message: '' };

function ContactForm({ source = 'contact' }) {
  const [values, setValues] = useState(EMPTY_CONTACT);
  const [status, setStatus] = useState({ busy: false, error: '', sent: false });
  const update = key => event => setValues(current => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async event => {
    event.preventDefault();
    if (status.busy) return;
    setStatus({ busy: true, error: '', sent: false });
    try {
      await submitContactMessage(values, source);
      setValues(EMPTY_CONTACT);
      setStatus({ busy: false, error: '', sent: true });
    } catch (error) {
      setStatus({ busy: false, error: error?.message || 'We could not send your message — please try again.', sent: false });
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" placeholder="Bilal" value={values.firstName} onChange={update('firstName')} required />
        <Field label="Last name" placeholder="Ahmed" value={values.lastName} onChange={update('lastName')} />
      </div>
      <Field label="Work email" type="email" placeholder="you@agency.com" value={values.email} onChange={update('email')} required />
      <Field label="Agency name" placeholder="Your agency name" value={values.agency} onChange={update('agency')} />
      <label className="space-y-1.5 block">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]">{source === 'home' ? 'How can we help?' : 'Message'}</span>
        <textarea
          placeholder={source === 'home' ? 'Tell us about your agency and what you need…' : 'How can we help?'}
          rows={4}
          required
          value={values.message}
          onChange={update('message')}
          className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--surface-2)] px-3.5 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-3)] focus:border-[var(--mint)] focus:ring-2 focus:ring-[rgba(31,229,163,0.10)]"
        />
      </label>
      {(status.sent || status.error) && (
        <p
          role={status.error ? 'alert' : 'status'}
          aria-live="polite"
          className={`rounded-xl border px-3.5 py-2.5 text-xs ${status.error ? 'border-[rgba(240,74,90,0.35)] bg-[var(--red-dim)] text-[var(--red)]' : 'border-[rgba(31,229,163,0.3)] bg-[var(--mint-dim)] text-[var(--mint)]'}`}
        >
          {status.error || 'Thanks — your message is with our team. We typically respond within 24 hours.'}
        </p>
      )}
      <button className="btn-primary-pill w-full" type="submit" disabled={status.busy}>
        {status.busy ? 'Sending…' : 'Send message'}<Send className="h-4 w-4" />
      </button>
    </form>
  );
}

function PlanField({ value, onChange, plans = defaultPlans }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]">Subscription plan</span>
      <select value={value} onChange={event => onChange(event.target.value)} aria-label="Subscription plan"
        className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--surface-2)] px-3.5 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 focus:border-[var(--mint)] focus:ring-2 focus:ring-[rgba(31,229,163,0.10)]">
        {plans.map(plan => (
          <option key={plan.id} value={plan.id}>{plan.name} — PKR {plan.price}/mo</option>
        ))}
      </select>
    </label>
  );
}

function CapabilityBadge({ icon: Icon, text }) {
  return (
    <li className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-2)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--text)]">
      <Icon className="h-3 w-3 text-[var(--mint)]" />
      <span>{text}</span>
    </li>
  );
}

function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-[var(--line)] bg-[var(--surface)]">
      <div className="py-5">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-3)] mb-5">Trusted by travel agencies across Pakistan</p>
        <div className="flex animate-marquee">
          {[...trustedBy, ...trustedBy].map((name, i) => (
            <span key={i} className="flex-shrink-0 mx-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-xs font-medium text-[var(--text-3)] transition-all duration-300 hover:border-[var(--line-2)] hover:text-[var(--text-2)] hover:shadow-md">{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCounter({ value, label }) {
  const numericPart = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const suffix = value.replace(/[0-9]/g, '');
  const [ref, count] = useCountUp(numericPart, 2000);
  return (
    <div ref={ref} className="text-center">
      <p className="font-mono text-3xl text-[var(--mint)] tabular-nums">{count}{suffix}</p>
      <span className="mt-2 block text-xs text-[var(--text-3)]">{label}</span>
    </div>
  );
}

/* ─── PAGES ─── */

function HomePage({ setView, beginAuth, selectedPlan, theme, plans = defaultPlans }) {
  const [faqOpen, setFaqOpen] = useState(0);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden hero-bg-home">
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute right-[15%] top-[20%] h-72 w-72 animate-float rounded-full bg-[var(--mint)]/8 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[10%] h-60 w-60 animate-float-delayed rounded-full bg-[var(--cyan)]/8 blur-[80px]" />
        <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-32">
          <div>
            <span className="mono-eyebrow text-[var(--mint)]">PAKISTAN'S TRAVEL OPERATING SYSTEM</span>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Your agency's next chapter, <span className="text-gradient-mint">already organized.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[var(--text-2)] sm:text-lg">
              SafarDesk brings leads, visas, quotations, bookings, payments and WhatsApp follow-up into one composed workspace for modern travel agencies.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setView('pricing')} className="btn-primary-pill">
                Explore plans<ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => beginAuth('signup')} className="btn-secondary-pill">
                Start free trial
              </button>
            </div>
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Platform capabilities">
              {[
                [ShieldCheck, 'Role-aware access'],
                [Globe2, 'PKR-native'],
                [Zap, 'Built for speed'],
                [LockKeyhole, 'Tenant-isolated'],
              ].map(([Icon, text]) => <CapabilityBadge key={text} icon={Icon} text={text} />)}
            </ul>
          </div>

          {/* Dashboard preview */}
          <div className="relative">
            <div className="rounded-3xl border border-[var(--line-2)] bg-[var(--surface)] p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-2 pb-4">
                <div>
                  <span className="mono-eyebrow">COMMAND CENTER</span>
                  <p className="mt-1 text-sm font-medium">Good morning, Bilal</p>
                </div>
                <span className="rounded-full bg-[var(--mint-dim)] px-2.5 py-1 text-[10px] font-mono text-[var(--mint)]">LIVE</span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-2 pt-4">
                <div className="rounded-2xl bg-[var(--surface-2)] p-4">
                  <Users className="h-4 w-4 text-[var(--cyan)]" />
                  <p className="mt-5 text-2xl font-semibold">128</p>
                  <span className="text-[11px] text-[var(--text-3)]">active customers</span>
                </div>
                <div className="rounded-2xl bg-[var(--surface-2)] p-4">
                  <FileText className="h-4 w-4 text-[var(--mint)]" />
                  <p className="mt-5 text-2xl font-semibold">24</p>
                  <span className="text-[11px] text-[var(--text-3)]">quotes pending</span>
                </div>
                <div className="col-span-2 rounded-2xl border border-[var(--line)] p-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-2)]">Monthly revenue</span>
                    <span className="text-[var(--mint)]">+18.4%</span>
                  </div>
                  <p className="mt-3 font-mono text-2xl">PKR 4.82M</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[var(--cyan)] to-[var(--mint)]" />
                  </div>
                </div>
              </div>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-5 hidden rounded-2xl border border-[var(--line-2)] bg-[var(--surface)] p-4 shadow-xl sm:block">
              <span className="mono-eyebrow text-[var(--amber)]">NEXT FOLLOW-UP</span>
              <p className="mt-2 text-xs font-medium">Chaudhry Kamran · 11:00 AM</p>
              <p className="mt-1 text-[11px] text-[var(--text-3)]">WhatsApp · Dubai family trip</p>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* STATS */}
      <Section id="stats" className="border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:grid-cols-4 sm:px-8">
          {stats.map(({ value, label }) => (
            <StatCounter key={label} value={value} label={label} />
          ))}
        </div>
      </Section>

      {/* PLATFORM — BENTO GRID */}
      <Section id="platform" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <span className="mono-eyebrow text-[var(--cyan)]">ONE WORKSPACE / MANY MOMENTS</span>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">The operational calm your team feels every day.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">Everything from first enquiry to final payment — connected, searchable, secure.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bentoCards.map((card, idx) => (
              <article key={idx} className={`group relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] transition-all duration-500 hover:border-[var(--cyan)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] ${card.large ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[400px]' : 'min-h-[280px]'}`}>
                {/* Background Image */}
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${card.image})` }} />
                {/* Dark overlay — stronger in light mode */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1f] via-[#0a0f1f]/85 to-[#0a0f1f]/40 opacity-90 group-hover:opacity-95 transition-opacity duration-500 light-overlay" />
                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                {/* Content */}
                <div className={`relative flex flex-col justify-end ${card.large ? 'p-8' : 'p-6'} h-full`}>
                  <span className="mono-eyebrow text-[var(--cyan)]" style={{ color: '#2DA8F0' }}>{card.eyebrow}</span>
                  <h3 className={`mt-3 font-display font-semibold text-white ${card.large ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>{card.title}</h3>
                  <p className={`mt-2 text-sm leading-6 text-white/80 ${card.large ? 'max-w-md' : ''}`}>{card.text}</p>
                  {card.large && (
                    <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm">
                      <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10">
                        <Users className="h-4 w-4 text-[#2DA8F0]" />
                        <p className="mt-3 text-lg font-semibold text-white">128</p>
                        <span className="text-[10px] text-white/60">active customers</span>
                      </div>
                      <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10">
                        <FileText className="h-4 w-4 text-[#1FE5A3]" />
                        <p className="mt-3 text-lg font-semibold text-white">24</p>
                        <span className="text-[10px] text-white/60">quotes pending</span>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      {/* CAPABILITIES */}
      <Section className="border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid gap-4 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, eyebrow, title, text }, idx) => (
              <article key={eyebrow} className="group relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-500 hover:border-[var(--cyan)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]">
                <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-[50px] transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${idx % 3 === 0 ? 'bg-[var(--mint)]/10' : idx % 3 === 1 ? 'bg-[var(--cyan)]/10' : 'bg-[var(--amber)]/10'}`} />
                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint-dim)] transition-colors group-hover:bg-[rgba(31,229,163,0.22)]">
                    <Icon className="h-5 w-5 text-[var(--mint)]" />
                  </span>
                  <span className="mono-eyebrow mt-6 block">{eyebrow}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how-it-works" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center">
            <span className="mono-eyebrow text-[var(--cyan)]">HOW IT WORKS</span>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">From enquiry to travel, in four steps.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">The complete customer journey, managed from one workspace.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map(({ num, icon: Icon, title, desc }, idx) => (
              <div key={num} className="relative rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-500 hover:border-[var(--cyan)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]">
                {idx < workflowSteps.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden h-px w-8 -translate-y-1/2 translate-x-full bg-gradient-to-r from-[var(--line-2)] to-transparent lg:block" />
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-4xl font-bold text-[var(--line-2)]">{num}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint-dim)]">
                    <Icon className="h-5 w-5 text-[var(--mint)]" />
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--text-3)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* SOLUTIONS */}
      <Section id="solutions" className="border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:py-28">
          <div>
            <span className="mono-eyebrow text-[var(--amber)]">FIND YOUR FIT</span>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Built around how your agency actually works.</h2>
            <p className="mt-5 text-sm leading-6 text-[var(--text-2)]">Start with the workflows you use most. Add branches, roles and capability as your business earns its next level.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {solutions.map(({ title, icon: Icon, text }) => (
              <div key={title} className="group relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-500 hover:border-[var(--cyan)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--cyan)]/5 blur-[60px] transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cyan-dim)] transition-colors group-hover:bg-[rgba(45,168,240,0.22)]">
                    <Icon className="h-5 w-5 text-[var(--cyan)]" />
                  </span>
                  <h3 className="mt-6 font-medium">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-3)]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center">
            <span className="mono-eyebrow text-[var(--cyan)]">WHAT AGENCIES SAY</span>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Trusted by travel professionals.</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {testimonials.map(({ name, role, text, rating }) => (
              <article key={name} className="group rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-500 hover:border-[var(--cyan)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--mint)] to-[var(--cyan)] text-[11px] font-bold text-[#051020]">
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-[11px] text-[var(--text-3)]">{role}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[var(--amber)] text-[var(--amber)]" />)}
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">"{text}"</p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      {/* PRICING PREVIEW */}
      <Section id="pricing-section" className="relative border-y border-[var(--line)]">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, var(--surface) 0%, var(--navy) 50%, var(--surface) 100%)' }} />
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="text-center">
            <span className="mono-eyebrow text-[var(--cyan)]">PLANS THAT GROW WITH YOU</span>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Choose the operating rhythm for your agency.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">Every plan starts with a 14-day free trial. Upgrade when your team needs more.</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className={`relative rounded-3xl border p-8 transition-all duration-500 hover:-translate-y-2 ${plan.popular ? 'border-[var(--cyan)]/60 bg-[var(--surface)] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4),0_0_80px_-20px_rgba(45,168,240,0.15)]' : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--cyan)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35),0_0_60px_-15px_rgba(45,168,240,0.1)]'}`}>
                {plan.popular && <span className="absolute right-5 top-5 rounded-full bg-[var(--cyan-dim)] px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider text-[var(--cyan)]">MOST POPULAR</span>}
                <span className="mono-eyebrow">{plan.id}</span>
                <h3 className="mt-5 font-display text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-5 text-[var(--text-2)]">{plan.description}</p>
                <div className="mt-7">
                  <span className="font-mono text-3xl font-semibold">PKR {plan.price}</span>
                  <span className="ml-2 text-xs text-[var(--text-3)]">/ month</span>
                </div>
                <div className="my-7 h-px bg-[var(--line)]" />
                <ul className="space-y-3">{plan.features.map(feature => <li key={feature} className="flex gap-2 text-sm text-[var(--text-2)]">
                  <Check className="h-4 w-4 shrink-0 text-[var(--cyan)]" />{feature}</li>)}</ul>
                <button onClick={() => beginAuth('signup', plan.id)} className={`mt-8 w-full ${plan.popular ? 'btn-primary-pill' : 'btn-secondary-pill'}`}>Choose {plan.name}<ArrowRight className="h-4 w-4" /></button>
              </article>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <span className="mono-eyebrow text-[var(--cyan)]">QUESTIONS, ANSWERED</span>
            <h2 className="mt-4 font-display text-3xl font-semibold">Make the move with clarity.</h2>
          </div>
          <div className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {faqs.map(([question, answer], index) => (
              <div key={question}>
                <button onClick={() => setFaqOpen(faqOpen === index ? -1 : index)} className="flex w-full items-center justify-between py-5 text-left text-sm font-medium transition-colors hover:text-[var(--mint)]" aria-expanded={faqOpen === index}>
                  {question}
                  {faqOpen === index ? <ChevronUp className="h-4 w-4 shrink-0 text-[var(--mint)]" /> : <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-3)]" />}
                </button>
                {faqOpen === index && <p className="max-w-2xl pb-5 text-sm leading-6 text-[var(--text-2)]">{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl relative overflow-hidden rounded-3xl border border-[var(--mint)]/20 px-6 py-16 sm:px-12" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #EDE9E3 0%, #F5F3EF 100%)' : 'linear-gradient(135deg, var(--surface-2), #102d48)' }}>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--mint)]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[var(--cyan)]/5 blur-3xl" />
          <div className="relative text-center">
            <Sparkles className="mx-auto h-6 w-6 text-[var(--mint)]/40" />
            <span className="mono-eyebrow mt-5 block text-[var(--mint)]">READY WHEN YOU ARE</span>
            <h2 className="mt-4 mx-auto max-w-xl font-display text-3xl font-semibold">Give your team a clearer way to move.</h2>
            <p className="mt-4 mx-auto max-w-lg text-sm text-[var(--text-2)]">Start your 14-day free trial today. No credit card required. Cancel anytime.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button onClick={() => beginAuth('signup')} className="btn-primary-pill">Start free trial<ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => setView('pricing')} className="btn-secondary-pill">Compare plans</button>
            </div>
          </div>
        </div>
      </Section>

      {/* CONTACT SECTION ON HOME */}
      <Section id="home-contact" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <span className="mono-eyebrow text-[var(--mint)]">GET IN TOUCH</span>
              <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Let's talk about your agency.</h2>
              <p className="mt-5 text-sm leading-6 text-[var(--text-2)]">Whether you're a solo consultant or a multi-branch operation, we'll help you find the right plan and get you set up quickly.</p>
              <div className="mt-10 space-y-5">
                {[
                  [Mail, 'Email', 'marketing.otechsolutions@gmail.com'],
                  [Phone, 'Phone', '+92 328 7113785'],
                  [MapPin, 'Office', 'Faisalabad'],
                  [Clock, 'Hours', 'Mon – Sat, 9:00 AM – 6:00 PM'],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint-dim)]">
                      <Icon className="h-5 w-5 text-[var(--mint)]" />
                    </span>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)]">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8">
              <h3 className="font-display text-lg font-semibold">Send us a message</h3>
              <p className="mt-1 text-xs text-[var(--text-3)]">We typically respond within 24 hours.</p>
              <ContactForm source="home" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function FeaturesPage({ setView, beginAuth, theme }) {
  const features = [
    { icon: MessageCircle, title: 'WhatsApp-Centric CRM', desc: 'Capture enquiries from WhatsApp, assign consultants instantly, and keep every conversation linked to the customer record. Template-driven follow-ups ensure nothing falls through the cracks.', color: 'mint' },
    { icon: FileText, title: 'Visa Case Management', desc: 'From document checklist to approval — track every visa case with pipeline stages, document verification, status updates and customer notifications.', color: 'cyan' },
    { icon: ClipboardList, title: 'Quotation Builder', desc: 'Build professional branded PDF quotations with flight, visa, hotel, transport and service line items. Send via WhatsApp or email in minutes.', color: 'amber' },
    { icon: CreditCard, title: 'Payment & Installments', desc: 'Track advance payments, installment schedules, overdue balances and generate receipts. Never chase a payment manually again.', color: 'mint' },
    { icon: Calendar, title: 'Task & Follow-up Engine', desc: 'Every lead, customer and case supports tasks with due dates, priorities and assignments. Dashboard widgets show overdue, today and upcoming.', color: 'cyan' },
    { icon: BarChart3, title: 'Reports & Analytics', desc: 'Lead source reports, conversion rates, consultant performance, destination demand, visa success rates, branch performance and financial summaries.', color: 'amber' },
    { icon: Building2, title: 'Multi-Branch Management', desc: 'Create branches across cities. Each branch gets its own managers, employees, leads, customers, cases, bookings and expenses.', color: 'mint' },
    { icon: Shield, title: 'Role-Based Access Control', desc: '10+ roles with granular permissions. Owner, manager, consultant, visa officer, accountant — each sees only what they should.', color: 'cyan' },
    { icon: Users, title: 'Sub-Agent Network', desc: 'Manage sub-agents with restricted access. Track their customers, bookings, commissions and performance independently.', color: 'amber' },
  ];

  return (
    <div className="hero-bg-features">
      <div className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mono-eyebrow text-[var(--mint)]">PLATFORM FEATURES</span>
            <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Everything your agency needs.</h1>
            <p className="mt-5 text-sm leading-6 text-[var(--text-2)]">From first enquiry to travel completion — every tool your team needs, connected in one workspace.</p>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <article key={title} className="group rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-500 hover:border-[var(--cyan)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--${color}-dim)]`}>
                  <Icon className={`h-5 w-5 text-[var(--${color})]`} />
                </span>
                <h3 className="mt-6 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">{desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-16 text-center">
            <button onClick={() => beginAuth('signup')} className="btn-primary-pill">Start free trial<ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingPage({ beginAuth, theme, plans = defaultPlans }) {
  return (
    <div className="hero-bg-pricing">
      <div className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mono-eyebrow text-[var(--cyan)]">TRANSPARENT PRICING</span>
            <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Choose the plan that fits.</h1>
            <p className="mt-5 text-sm leading-6 text-[var(--text-2)]">Every plan starts with a 14-day free trial. No credit card required. Upgrade or downgrade anytime.</p>
          </div>
          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className={`relative rounded-3xl border p-8 transition-all duration-500 hover:-translate-y-2 ${plan.popular ? 'border-[var(--cyan)]/60 bg-[var(--surface)] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4),0_0_80px_-20px_rgba(45,168,240,0.15)]' : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--cyan)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35),0_0_60px_-15px_rgba(45,168,240,0.1)]'}`}>
                {plan.popular && <span className="absolute right-5 top-5 rounded-full bg-[var(--cyan-dim)] px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider text-[var(--cyan)]">MOST POPULAR</span>}
                <span className="mono-eyebrow">{plan.id}</span>
                <h2 className="mt-5 font-display text-2xl font-semibold">{plan.name}</h2>
                <p className="mt-3 min-h-12 text-sm leading-5 text-[var(--text-2)]">{plan.description}</p>
                <div className="mt-7">
                  <span className="font-mono text-3xl font-semibold">PKR {plan.price}</span>
                  <span className="ml-2 text-xs text-[var(--text-3)]">/ month</span>
                </div>
                <div className="my-7 h-px bg-[var(--line)]" />
                <ul className="space-y-3">{plan.features.map(feature => <li key={feature} className="flex gap-2 text-sm text-[var(--text-2)]">
                  <Check className="h-4 w-4 shrink-0 text-[var(--cyan)]" />{feature}</li>)}</ul>
                <button onClick={() => beginAuth('signup', plan.id)} className={`mt-8 w-full ${plan.popular ? 'btn-primary-pill' : 'btn-secondary-pill'}`}>Choose {plan.name}<ArrowRight className="h-4 w-4" /></button>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-8 text-center">
            <p className="text-sm text-[var(--text-2)]">Need a custom plan for a large operation?</p>
            <button onClick={() => beginAuth('signup')} className="btn-secondary-pill mt-4">Contact sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutPage({ theme }) {
  return (
    <div className="hero-bg-about">
      <div className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mono-eyebrow text-[var(--mint)]">ABOUT SAFARDESK</span>
            <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Built for Pakistani travel agencies.</h1>
            <p className="mt-5 text-sm leading-6 text-[var(--text-2)]">We understand the unique challenges of running a travel consultancy in Pakistan — from WhatsApp-led sales to PKR settlements, from visa workflows to multi-branch operations.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Target, title: 'Our Mission', text: 'To give every Pakistani travel agency the operational clarity and technology backbone that was previously only available to large enterprises.' },
              { icon: Award, title: 'Our Story', text: 'Founded by travel industry veterans who spent years watching agencies struggle with scattered tools, missed follow-ups and manual processes.' },
              { icon: Heart, title: 'Our Values', text: 'Simplicity over complexity. Clarity over noise. Security over speed. Built to last, not just to demo.' },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-500 hover:border-[var(--cyan)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint-dim)]">
                  <Icon className="h-5 w-5 text-[var(--mint)]" />
                </span>
                <h3 className="mt-6 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-mono text-3xl text-[var(--mint)]">{value}</p>
                <span className="mt-2 block text-xs text-[var(--text-3)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPage({ theme }) {
  return (
    <div className="hero-bg-contact">
      <div className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <span className="mono-eyebrow text-[var(--mint)]">GET IN TOUCH</span>
              <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Let's talk about your agency.</h1>
              <p className="mt-5 text-sm leading-6 text-[var(--text-2)]">Whether you're a solo consultant or a multi-branch operation, we'll help you find the right plan and get you set up quickly.</p>
              <div className="mt-10 space-y-6">
                {[
                  [Mail, 'Email', 'marketing.otechsolutions@gmail.com'],
                  [Phone, 'Phone', '+92 328 7113785'],
                  [MapPin, 'Office', 'Faisalabad'],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint-dim)]">
                      <Icon className="h-5 w-5 text-[var(--mint)]" />
                    </span>
                    <div>
                      <p className="text-xs text-[var(--text-3)]">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8">
              <h3 className="font-display text-lg font-semibold">Send us a message</h3>
              <ContactForm source="contact" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionsPage({ beginAuth, theme }) {
  const solutions = [
    {
      icon: Building2,
      title: 'For Multi-Branch Agencies',
      desc: 'Running offices across Karachi, Lahore, and Islamabad? SafarDesk gives you a single dashboard to see all branches — leads, revenue, staff performance, and cash flow — in real time.',
      features: ['Branch-level P&L', 'Centralized lead pool', 'City-wise performance', 'Unified brand control'],
      color: 'mint',
    },
    {
      icon: Users,
      title: 'For Sub-Agent Networks',
      desc: 'Manage a network of sub-agents without the chaos. Each sub-agent gets a restricted portal with their own leads, customers, bookings, and commission tracking.',
      features: ['Sub-agent dashboards', 'Commission auto-calc', 'Lead isolation', 'Performance leaderboards'],
      color: 'cyan',
    },
    {
      icon: Briefcase,
      title: 'For Visa Consultancies',
      desc: 'Visa processing is a document-heavy, deadline-driven workflow. SafarDesk turns it into a clean pipeline — from document collection to approval, with automated reminders at every step.',
      features: ['Pipeline automation', 'Document verification', 'Status notifications', 'Deadline alerts'],
      color: 'amber',
    },
    {
      icon: Globe2,
      title: 'For Tour Operators',
      desc: 'Design packages, manage group departures, handle bookings and collect payments — all from one place. Real-time inventory and pricing keep your ops tight.',
      features: ['Package builder', 'Group departure tracker', 'Inventory management', 'Revenue forecasting'],
      color: 'mint',
    },
    {
      icon: Zap,
      title: 'For Solo Consultants',
      desc: 'You don\'t need a team to use SafarDesk. Solo consultants use it as a personal command center — enquiries, follow-ups, quotations, payments, all in one clean workspace.',
      features: ['Personal dashboard', 'Quick quotation builder', 'WhatsApp integration', 'Payment reminders'],
      color: 'cyan',
    },
    {
      icon: Headphones,
      title: 'For Support Teams',
      desc: 'Post-sale support, reissue handling, refund tracking — SafarDesk gives your support team a ticketing system built for travel operations, not generic helpdesks.',
      features: ['Support ticketing', 'Reissue workflows', 'Refund tracking', 'SLA monitoring'],
      color: 'amber',
    },
  ];

  return (
    <div className="hero-bg-solutions">
      <div className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mono-eyebrow text-[var(--mint)]">SOLUTIONS</span>
            <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Built for every type of travel business.</h1>
            <p className="mt-5 text-sm leading-6 text-[var(--text-2)]">Whether you're a one-person consultancy or a 50-branch operation, SafarDesk adapts to the way you work.</p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map(({ icon: Icon, title, desc, features, color }) => (
              <article key={title} className="group relative rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--cyan)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--${color}-dim)]`}>
                  <Icon className={`h-5 w-5 text-[var(--${color})]`} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">{desc}</p>
                <ul className="mt-4 space-y-2">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--mint)]" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => beginAuth('signup')} className="mt-5 flex items-center gap-1.5 text-xs font-medium text-[var(--mint)] transition-colors hover:text-[var(--cyan)]">
                  Start with this solution<ArrowRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>

          {/* Comparison */}
          <div className="mt-20 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 sm:p-10 transition-all duration-500 hover:border-[var(--cyan)]/30">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="mono-eyebrow text-[var(--mint)]">WHY SAFARDESK</span>
                <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">Not just software — a travel operating system.</h2>
                <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">Most agencies cobble together WhatsApp, spreadsheets, Trello, and a POS. SafarDesk replaces all of that with a single, purpose-built workspace designed for the way Pakistani travel agencies actually work.</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    ['vs. Spreadsheets', 'Live dashboards, not stale files'],
                    ['vs. Generic CRMs', 'Built for travel workflows, not sales funnels'],
                    ['vs. WhatsApp alone', 'Automated follow-ups, templates, and audit trails'],
                    ['vs. Multiple tools', 'One login, one system, one source of truth'],
                  ].map(([label, desc]) => (
                    <div key={label} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                      <p className="text-xs font-medium text-[var(--text)]">{label}</p>
                      <p className="mt-1 text-[11px] text-[var(--text-3)]">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                {[
                  { value: '14', unit: 'days', label: 'Free trial — no card needed' },
                  { value: '10', unit: '+', label: 'Roles with granular permissions' },
                  { value: '24', unit: 'hr', label: 'Dedicated onboarding support' },
                  { value: '99.9', unit: '%', label: 'Uptime SLA on all paid plans' },
                ].map(({ value, unit, label }) => (
                  <div key={label} className="flex items-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                    <span className="font-mono text-2xl text-[var(--mint)]">{value}<span className="text-sm text-[var(--text-3)]">{unit}</span></span>
                    <span className="text-xs text-[var(--text-2)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-[var(--text-2)]">Not sure which solution fits? Let's talk.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => beginAuth('signup')} className="btn-primary-pill">Start free trial<ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => beginAuth('signup')} className="btn-secondary-pill">Talk to sales</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN EXPORT ─── */

export default function PublicSite({ onAuthenticated, notice = '' }) {
  const [page, setPage] = useState('home');
  const [view, setView] = useState('home');
  const [authMode, setAuthMode] = useState('signin');
  const [selectedPlan, setSelectedPlan] = useState('BUSINESS');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [theme, setTheme] = useState('dark');
  // Live subscription catalog — Super Admin plan changes reach the public home &
  // pricing sections (see lib/publicPlans.js for the resolution order).
  const [sitePlans, setSitePlans] = useState(defaultPlans);

  useEffect(() => {
    let alive = true;
    loadPublicPlans().then(list => {
      if (alive && Array.isArray(list) && list.length) setSitePlans(list);
    });
    return () => { alive = false; };
  }, []);

  // Same-browser Super Admin edits (another tab) refresh the catalog immediately.
  useEffect(() => {
    const onStorage = event => {
      if (event.key && event.key !== PUBLIC_PLANS_CACHE_KEY) return;
      const cached = readCachedPublicPlans();
      if (cached.length) setSitePlans(cached);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Keep the pre-selected plan valid when the catalog changes or a plan is retired.
  useEffect(() => {
    if (sitePlans.length && !sitePlans.some(plan => plan.id === selectedPlan)) {
      setSelectedPlan((sitePlans.find(plan => plan.popular) || sitePlans[0]).id);
    }
  }, [sitePlans, selectedPlan]);

  const [form, setForm] = useState({ name: '', agency: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const update = key => event => setForm({ ...form, [key]: event.target.value });
  const beginAuth = (mode, plan = selectedPlan) => { setAuthMode(mode); setSelectedPlan(plan); setView('auth'); setAuthError(''); setMobileMenu(false); };
  const activeSection = useScrollSpy(NAV_SECTION_IDS);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  // Client-side page navigation for the public site (header / footer links).
  const navigate = id => {
    setPage(id);
    setView('home');
    setMobileMenu(false);
    window.scrollTo({ top: 0, left: 0 });
  };

  // Sign in — POST /auth/login issues the session token (README §3 · §19.7).
  const handleSignIn = async event => {
    event.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      const session = await api.login(form.email.trim(), form.password);
      setToken(session.token);
      setForm({ name: '', agency: '', email: '', password: '' });
      await onAuthenticated(session);
    } catch (error) {
      setAuthError(error.message || 'Sign-in failed');
    } finally {
      setAuthBusy(false);
    }
  };

  // Sign up — creates a PENDING workspace that only Super Admin approval unlocks.
  const handleRegister = async event => {
    event.preventDefault();
    setAuthError('');
    if ((form.password || '').length < 12) {
      setAuthError('Password must be at least 12 characters (platform password policy).');
      return;
    }
    setAuthBusy(true);
    try {
      const account = await api.register({
        name: form.name.trim(),
        agency: form.agency.trim(),
        email: form.email.trim(),
        password: form.password,
        plan: selectedPlan
      });
      setPending(account);
      setForm({ name: '', agency: '', email: '', password: '' });
      setView('pending');
    } catch (error) {
      setAuthError(error.message || 'Could not create the account');
    } finally {
      setAuthBusy(false);
    }
  };

  // Auth / Onboarding / Pending approval
  if (view === 'pending') {
    const planName = sitePlans.find(plan => plan.id === selectedPlan)?.name || selectedPlan;
    return (
      <div className={`min-h-screen text-[var(--text)] ${theme === 'light' ? 'light' : ''}`} style={{ backgroundColor: 'var(--navy)' }}>
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <button onClick={() => { setView('home'); setPage('home'); }} aria-label="Back to homepage"><Logo /></button>
            <button onClick={() => { setView('home'); setPage('home'); }} className="flex items-center gap-2 text-xs text-[var(--text-2)] transition-colors hover:text-[var(--mint)]">
              <X className="h-4 w-4" /> Back to site
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(229,176,74,0.3)] bg-[var(--amber-dim)]">
                <Clock className="h-7 w-7 text-[var(--amber)]" />
              </div>
              <span className="mono-eyebrow mt-6 block text-[var(--amber)]">AWAITING APPROVAL</span>
              <h1 className="mt-3 font-display text-2xl font-semibold">Your workspace is almost ready</h1>
              <p className="mt-3 text-sm leading-6 text-[var(--text-2)]" role="status" aria-live="polite">
                {pending?.message || 'Your account was created and is awaiting Super Admin approval.'}
              </p>
              <dl className="mx-auto mt-6 grid max-w-sm gap-3 text-left text-xs">
                <div className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3">
                  <dt className="text-[var(--text-3)]">Workspace</dt>
                  <dd className="font-medium">{pending?.organization?.name || form.agency}</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3">
                  <dt className="text-[var(--text-3)]">Plan</dt>
                  <dd className="font-medium">{planName}</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3">
                  <dt className="text-[var(--text-3)]">Status</dt>
                  <dd className="font-medium text-[var(--amber)]">PENDING</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3">
                  <dt className="text-[var(--text-3)]">Email</dt>
                  <dd className="font-medium">{pending?.user?.email}</dd>
                </div>
              </dl>
              <p className="mt-6 text-xs leading-5 text-[var(--text-3)]">
                Sign-in stays locked (rule-org-approval) until the platform owner approves this workspace from the Super Admin console.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); setView('auth'); }} className="btn-primary-pill">Try signing in<ArrowRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => { setView('home'); setPage('home'); }} className="btn-secondary-pill">Back to site</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'auth' || view === 'onboarding') {
    const onboarding = view === 'onboarding';
    return (
      <div className={`min-h-screen text-[var(--text)] ${theme === 'light' ? 'light' : ''}`} style={{ backgroundColor: 'var(--navy)' }}>
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <button onClick={() => { setView('home'); setPage('home'); }} aria-label="Back to homepage"><Logo /></button>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="rounded-lg border border-[var(--line-2)] p-2 transition-colors hover:bg-[var(--surface-2)]" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={() => { setView('home'); setPage('home'); }} className="flex items-center gap-2 text-xs text-[var(--text-2)] transition-colors hover:text-[var(--mint)]">
                <X className="h-4 w-4" /> Back to site
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl lg:grid-cols-[.85fr_1.15fr]">
              <aside className="hidden flex-col justify-between bg-gradient-to-br from-[var(--surface-2)] to-[#102d48] p-8 lg:flex">
                <div>
                  <span className="mono-eyebrow text-[var(--mint)]">{onboarding ? 'YOUR AGENCY, READY' : 'YOUR OPERATING SYSTEM'}</span>
                  <h1 className="mt-5 font-display text-3xl font-semibold leading-tight">{onboarding ? 'A better first day for your team.' : 'Bring the whole journey into focus.'}</h1>
                  <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">{onboarding ? 'Set up your agency profile and open the command center with the right tools for your plan.' : 'From first enquiry to travel completion, SafarDesk keeps your agency moving with clarity.'}</p>
                </div>
                <div className="space-y-3 text-xs text-[var(--text-2)]">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--mint)]" /> Tenant-isolated workspace</div>
                  <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[var(--cyan)]" /> Role-aware access controls</div>
                </div>
              </aside>
              <div className="p-6 sm:p-10">
                {onboarding ? (
                  <>
                    <span className="mono-eyebrow text-[var(--mint)]">STEP 2 OF 2</span>
                    <h2 className="mt-3 font-display text-2xl font-semibold">Set up your agency</h2>
                    <p className="mt-2 text-sm text-[var(--text-2)]">A few details are enough to prepare your workspace. We keep it pending until the platform owner approves it.</p>
                    <form onSubmit={handleRegister} className="mt-7 space-y-4">
                      <Field label="Agency name" placeholder="SafarDesk Global Travel" value={form.agency} onChange={update('agency')} required />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Primary city" placeholder="Lahore" />
                        <Field label="Default currency" value="PKR" onChange={() => {}} />
                      </div>
                      <PlanField value={selectedPlan} onChange={setSelectedPlan} plans={sitePlans} />
                      {authError && (
                        <p role="alert" className="rounded-xl border border-[rgba(240,74,90,0.35)] bg-[var(--red-dim)] px-3.5 py-2.5 text-xs text-[var(--red)]">{authError}</p>
                      )}
                      <button className="btn-primary-pill mt-2 w-full" type="submit" disabled={authBusy}>
                        {authBusy ? 'Creating workspace…' : 'Launch my workspace'}<ArrowRight className="h-4 w-4" />
                      </button>
                    </form>
                    <button type="button" onClick={() => { setView('auth'); setAuthError(''); }} className="mt-6 w-full text-xs text-[var(--text-2)] transition-colors hover:text-[var(--mint)]">
                      Back to sign in details
                    </button>
                  </>
                ) : (
                  <>
                    <span className="mono-eyebrow text-[var(--cyan)]">{authMode === 'signin' ? 'WELCOME BACK' : 'START YOUR WORKSPACE'}</span>
                    <h2 className="mt-3 font-display text-2xl font-semibold">{authMode === 'signin' ? 'Sign in to SafarDesk' : 'Create your agency account'}</h2>
                    <p className="mt-2 text-sm text-[var(--text-2)]">{authMode === 'signin' ? 'Use your agency credentials to continue.' : `Selected plan: ${sitePlans.find(plan => plan.id === selectedPlan)?.name}. Sign-up stays locked until Super Admin approval.`}</p>
                    {(notice || authError) && (
                      <p role="status" aria-live="polite" className={`mt-4 rounded-xl border px-3.5 py-2.5 text-xs ${authError ? 'border-[rgba(240,74,90,0.35)] bg-[var(--red-dim)] text-[var(--red)]' : 'border-[rgba(229,176,74,0.35)] bg-[var(--amber-dim)] text-[var(--amber)]'}`}>
                        {authError || notice}
                      </p>
                    )}
                    <form onSubmit={authMode === 'signin' ? handleSignIn : event => { event.preventDefault(); setAuthError(''); if ((form.password || '').length < 12) { setAuthError('Password must be at least 12 characters (platform password policy).'); return; } setView('onboarding'); }} className="mt-7 space-y-4">
                      {authMode === 'signup' && <Field label="Your name" placeholder="Bilal Ahmed" value={form.name} onChange={update('name')} required />}
                      <Field label="Work email" type="email" placeholder="you@agency.com" value={form.email} onChange={update('email')} required />
                      <Field label="Password" type="password" placeholder={authMode === 'signin' ? 'Your password' : 'At least 12 characters'} value={form.password} onChange={update('password')} required />
                      {authMode === 'signup' && <PlanField value={selectedPlan} onChange={setSelectedPlan} plans={sitePlans} />}
                      <button className="btn-primary-pill mt-2 w-full" type="submit" disabled={authBusy}>
                        {authBusy ? 'Signing in…' : authMode === 'signin' ? 'Sign in' : 'Continue'}<ArrowRight className="h-4 w-4" />
                      </button>
                    </form>
                    <button onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(''); }} className="mt-6 w-full text-xs text-[var(--text-2)] transition-colors hover:text-[var(--mint)]">
                      {authMode === 'signin' ? 'New to SafarDesk? Create an account' : 'Already have an account? Sign in'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pricing standalone page
  if (view === 'pricing') {
    return (
      <div className={`min-h-screen text-[var(--text)] ${theme === 'light' ? 'light' : ''}`} style={{ backgroundColor: 'var(--navy)' }}>
        <PublicHeader page={page} navigate={navigate} setView={setView} view={view} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} beginAuth={beginAuth} activeSection={activeSection} theme={theme} toggleTheme={toggleTheme} />
        <div className="pt-[68px]">
          <PricingPage beginAuth={beginAuth} plans={sitePlans} />
        </div>
        <PublicFooter page={page} navigate={navigate} beginAuth={beginAuth} theme={theme} />
      </div>
    );
  }

  // Main site pages
  const PageComponent = { home: HomePage, features: FeaturesPage, pricing: PricingPage, about: AboutPage, contact: ContactPage, solutions: SolutionsPage }[page] || HomePage;

  return (
    <div className={`min-h-screen overflow-hidden text-[var(--text)] ${theme === 'light' ? 'light' : ''}`} style={{ backgroundColor: 'var(--navy)' }}>
      <PublicHeader page={page} navigate={navigate} setView={setView} view={view} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} beginAuth={beginAuth} activeSection={activeSection} theme={theme} toggleTheme={toggleTheme} />
      <main className="pt-[68px]">
        <PageComponent setView={setView} beginAuth={beginAuth} selectedPlan={selectedPlan} theme={theme} plans={sitePlans} />
      </main>
      <PublicFooter page={page} navigate={navigate} beginAuth={beginAuth} theme={theme} />
      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="whatsapp-float">
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.054 9.374L1.054 31.25l6.118-1.974A15.91 15.91 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.314 22.594c-.39 1.1-1.932 2.014-3.16 2.28-.84.18-1.936.322-5.628-1.21-4.726-1.964-7.762-6.76-8-7.076-.226-.316-1.896-2.524-1.896-4.814s1.2-3.41 1.63-3.88c.39-.428.922-.56 1.228-.56.304 0 .608.002.874.016.28.014.654-.106 1.016.774.39.96 1.332 3.24 1.448 3.476.116.236.22.484.06.78-.14.296-.28.48-.52.74-.24.26-.46.456-.7.72-.22.24-.46.496-.18.92.26.424 1.18 1.944 2.53 3.15 1.74 1.554 3.14 2.036 3.66 2.256.42.18.66.14.9-.08.28-.28.62-.72.98-1.16.26-.32.58-.36.98-.24.4.12 2.54 1.2 2.98 1.416.44.216.74.326.84.506.1.18.1 1.04-.29 2.14z"/></svg>
      </a>
    </div>
  );
}

/* ─── HEADER ─── */

function PublicHeader({ page, navigate, setView, mobileMenu, setMobileMenu, beginAuth, theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`glassy-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <button onClick={() => navigate('home')} aria-label="SafarDesk homepage"><Logo /></button>
        <nav className="hidden items-center gap-1 text-[13px] lg:flex" aria-label="Main navigation">
          {[['home', 'Home'], ['features', 'Platform'], ['solutions', 'Solutions'], ['pricing', 'Pricing'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => (
            <button key={id} onClick={() => navigate(id)}
              className={`nav-link rounded-lg px-3 py-2 transition-all duration-300 ${
                page === id ? 'active text-[var(--cyan)] font-semibold' : ''
              }`}>{label}</button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <button onClick={toggleTheme} className="rounded-full border border-[var(--line-2)] p-2 transition-all duration-300 hover:border-[var(--cyan)] hover:text-[var(--cyan)]" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={() => beginAuth('signin')} className="nav-link rounded-lg px-3 py-2 text-[13px] transition-all duration-300">Sign in</button>
          <button onClick={() => beginAuth('signup')} className="btn-primary-pill">Start free trial<ArrowRight className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={toggleTheme} className="rounded-full border border-[var(--line-2)] p-2 transition-all duration-300 hover:border-[var(--cyan)]" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg border border-[var(--line-2)] p-2" aria-label={mobileMenu ? 'Close menu' : 'Open menu'}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileMenu && (
        <div className="border-t border-[var(--line)] px-5 py-4 lg:hidden" style={{ backgroundColor: theme === 'light' ? 'rgba(245,243,239,0.97)' : 'rgba(11,18,50,0.97)' }}>
          <div className="flex flex-col gap-1 text-sm">
            {[['home', 'Home'], ['features', 'Platform'], ['solutions', 'Solutions'], ['pricing', 'Pricing'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => (
              <button key={id} onClick={() => { navigate(id); setMobileMenu(false); }}
                className={`nav-link rounded-lg px-3 py-2.5 text-left font-medium transition-all duration-300 ${
                  page === id ? 'active text-[var(--cyan)] bg-[var(--cyan-dim)]' : ''
                }`}>{label}</button>
            ))}
            <div className="my-2 h-px bg-[var(--line)]" />
            <button onClick={() => { beginAuth('signin'); setMobileMenu(false); }} className="nav-link rounded-lg px-3 py-2.5 text-left font-medium transition-all duration-300">Sign in</button>
            <button onClick={() => { beginAuth('signup'); setMobileMenu(false); }} className="btn-primary-pill mt-1">Start free trial<ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── FOOTER ─── */

function PublicFooter({ page, navigate, theme, beginAuth }) {
  return (
    <footer className="border-t border-[var(--line)]">
      {/* CTA WRAP-UP */}
      <div className="relative overflow-hidden" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #EDE9E3 0%, #F5F3EF 50%, #FFFFFF 100%)' : 'linear-gradient(135deg, var(--surface) 0%, var(--navy) 100%)' }}>
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[var(--cyan)]/5 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[var(--mint)]/5 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <span className="mono-eyebrow text-[var(--cyan)]">READY TO MOVE?</span>
          <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">Start building your agency's operating system today.</h2>
          <p className="mt-3 mx-auto max-w-lg text-sm leading-6 text-[var(--text-2)]">14-day free trial. No credit card. Cancel anytime. Your team could be live tomorrow.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => beginAuth('signup')} className="btn-primary-pill">Start free trial<ArrowRight className="h-4 w-4" /></button>
            <button onClick={() => navigate('contact')} className="btn-secondary-pill">Talk to sales</button>
          </div>
        </div>
      </div>

      {/* ALL FOOTER SECTIONS — SINGLE ROW */}
      <div style={{ backgroundColor: theme === 'light' ? '#EDE9E3' : 'var(--surface)' }}>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            {/* Brand */}
            <div className="shrink-0 lg:max-w-[280px]">
              <Logo />
              <p className="mt-2.5 max-w-xs text-xs leading-5 text-[var(--text-3)]">Pakistan's travel operating system. From first enquiry to travel completion.</p>
              <div className="mt-4 flex gap-2">
                {[
                  ['WhatsApp', MessageCircle],
                  ['Email', Mail],
                  ['LinkedIn', Globe2],
                ].map(([label, Icon]) => (
                  <span key={label} className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--text-3)] transition-all duration-300 hover:border-[var(--cyan)] hover:text-[var(--cyan)] cursor-pointer">
                    <Icon className="h-3 w-3" />{label}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[var(--line)] p-3" style={{ backgroundColor: theme === 'light' ? 'var(--surface)' : 'var(--surface-2)' }}>
                <p className="text-[10px] font-medium uppercase tracking-[0.10em] text-[var(--text-3)]">Office</p>
                <p className="mt-0.5 text-xs text-[var(--text-2)]">Lahore, Pakistan</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-3)]">Mon – Sat, 9:00 AM – 6:00 PM</p>
              </div>
            </div>

            {/* Link columns — all inline */}
            <div className="flex flex-wrap gap-x-12 gap-y-6 lg:flex-nowrap">
              {Object.entries(footerLinks).map(([heading, links]) => (
                <div key={heading} className="min-w-[140px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">{heading}</p>
                  <ul className="mt-3 space-y-2">
                    {links.map(link => <li key={link}><span className="text-[11px] text-[var(--text-3)] transition-colors duration-300 hover:text-[var(--cyan)] cursor-pointer font-medium">{link}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--line)] pt-6 sm:flex-row">
            <p className="text-[10px] text-[var(--text-3)]">&copy; {new Date().getFullYear()} SafarDesk. All rights reserved.</p>
            <div className="flex gap-4 text-[10px] text-[var(--text-3)]">
              <span className="cursor-pointer transition-colors duration-300 hover:text-[var(--cyan)] font-medium">Privacy</span>
              <span className="cursor-pointer transition-colors duration-300 hover:text-[var(--cyan)] font-medium">Terms</span>
              <span className="cursor-pointer transition-colors duration-300 hover:text-[var(--cyan)] font-medium">Cookies</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
