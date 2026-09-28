import { z } from 'zod';

export const leadSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().min(1),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
  purpose: z.string().optional(),
  travellerCount: z.number().int().min(1).default(1),
  budgetPKR: z.number().int().min(0).default(0),
  requiredServices: z.array(z.string()).default([]),
  assignedTo: z.string().optional(),
  branchId: z.string().optional(),
  stage: z.string().default('NEW'),
  priority: z.string().default('MEDIUM'),
  nextFollowUp: z.string().optional(),
  notes: z.string().optional(),
  createdDate: z.string().optional(),
  customerId: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().min(1),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  cnic: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  customerType: z.string().optional(),
  preferredDestinations: z.array(z.string()).default([]),
  notes: z.string().optional(),
  source: z.string().optional(),
  assignedConsultant: z.string().optional(),
  branchId: z.string().optional(),
  totalBookings: z.number().int().min(0).default(0),
  lifetimeSpendPKR: z.number().int().min(0).default(0),
  outstandingBalancePKR: z.number().int().min(0).default(0),
  travellerCount: z.number().int().min(0).default(0),
  activeVisaCases: z.number().int().min(0).default(0),
  leadId: z.string().optional(),
  wonAt: z.string().optional(),
  travellers: z.array(z.object({
    id: z.string().optional(),
    fullName: z.string().min(1),
    relation: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    cnic: z.string().optional(),
    passportNumber: z.string().optional(),
    passportIssueDate: z.string().optional(),
    passportExpiryDate: z.string().optional(),
    daysUntilPassportExpiry: z.number().optional(),
    nationality: z.string().optional(),
    phone: z.string().optional(),
    emergencyContact: z.string().optional()
  })).default([])
});

export const visaCaseSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  destination: z.string().min(1),
  visaType: z.string().min(1),
  applicantCount: z.number().int().min(1).default(1),
  applicants: z.array(z.string()).default([]),
  assignedOfficer: z.string().optional(),
  referenceNumber: z.string().optional(),
  externalProvider: z.string().optional(),
  visaFeePKR: z.number().int().min(0).default(0),
  serviceFeePKR: z.number().int().min(0).default(0),
  totalCustomerPricePKR: z.number().int().min(0).default(0),
  supplierCostPKR: z.number().int().min(0).default(0),
  expectedMarginPKR: z.number().int().default(0),
  status: z.string().default('NEW'),
  priority: z.string().default('MEDIUM'),
  applicationDate: z.string().optional(),
  intendedTravelDate: z.string().optional(),
  branchId: z.string().optional(),
  customer: z.object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    cnic: z.string().optional(),
    passportNumber: z.string().optional(),
    passportExpiry: z.string().optional(),
    nationality: z.string().optional(),
    dateOfBirth: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
    notes: z.string().optional()
  }).optional(),
  documents: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    category: z.string().optional(),
    status: z.string().default('UPLOADED'),
    fileName: z.string().optional(),
    uploadedAt: z.string().optional(),
    notes: z.string().optional()
  })).default([]),
  checklists: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    status: z.string().default('PENDING'),
    required: z.boolean().default(true),
    notes: z.string().optional()
  })).default([])
});

export const quotationSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  destination: z.string().optional(),
  travelDates: z.string().optional(),
  travellerCount: z.number().int().min(1).default(1),
  quotationNumber: z.string().optional(),
  validUntil: z.string().optional(),
  status: z.string().default('DRAFT'),
  currency: z.string().default('PKR'),
  items: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1),
    category: z.string().optional(),
    qty: z.number().int().min(1).default(1),
    unitCost: z.number().int().min(0).default(0),
    customerPrice: z.number().int().min(0).default(0),
    discount: z.number().min(0).max(100).default(0),
    tax: z.number().min(0).max(100).default(0)
  })).default([]),
  terms: z.string().optional(),
  notes: z.string().optional(),
  subtotalPKR: z.number().int().default(0),
  discountTotalPKR: z.number().int().default(0),
  taxTotalPKR: z.number().int().default(0),
  totalPKR: z.number().int().default(0),
  supplierCostPKR: z.number().int().default(0),
  grossMarginPKR: z.number().int().default(0)
});

export const bookingSchema = z.object({
  id: z.string().optional(),
  bookingCode: z.string().optional(),
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  type: z.string().default('Package'),
  destination: z.string().optional(),
  status: z.string().default('PENDING'),
  travelDates: z.string().optional(),
  totalAmountPKR: z.number().int().min(0).default(0),
  paidAmountPKR: z.number().int().min(0).default(0),
  balanceAmountPKR: z.number().int().default(0),
  paymentStatus: z.string().default('PENDING'),
  branchId: z.string().optional(),
  flightDetails: z.object({
    airline: z.string().optional(),
    flightNumber: z.string().optional(),
    route: z.string().optional(),
    departureDateTime: z.string().optional(),
    arrivalDateTime: z.string().optional(),
    pnr: z.string().optional(),
    ticketNumber: z.string().optional(),
    supplier: z.string().optional(),
    fare: z.number().int().default(0),
    status: z.string().optional()
  }).optional(),
  hotelDetails: z.object({
    name: z.string().optional(),
    roomType: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.number().int().default(1),
    confirmationNumber: z.string().optional(),
    supplier: z.string().optional(),
    cost: z.number().int().default(0),
    sellingPrice: z.number().int().default(0),
    voucherStatus: z.string().optional()
  }).optional(),
  transportDetails: z.object({
    pickup: z.string().optional(),
    dropoff: z.string().optional(),
    vehicle: z.string().optional(),
    driver: z.string().optional(),
    dateTime: z.string().optional(),
    cost: z.number().int().default(0),
    sellingPrice: z.number().int().default(0)
  }).optional(),
  visaDetails: z.object({
    visaType: z.string().optional(),
    referenceNumber: z.string().optional(),
    status: z.string().optional()
  }).optional(),
  itineraryDays: z.array(z.object({
    day: z.number().int(),
    date: z.string().optional(),
    title: z.string().optional(),
    details: z.string().optional()
  })).default([])
});

export const paymentSchema = z.object({
  id: z.string().optional(),
  receiptNumber: z.string().optional(),
  bookingId: z.string().optional(),
  customerName: z.string().min(1),
  amountPKR: z.number().int().min(1),
  paymentMethod: z.string().default('Cash'),
  reference: z.string().optional(),
  paymentDate: z.string().optional(),
  type: z.string().default('Advance'),
  status: z.string().default('PENDING'),
  verifiedBy: z.string().optional(),
  notes: z.string().optional()
});

export const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  customerName: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().default('MEDIUM'),
  status: z.string().default('PENDING'),
  assignedTo: z.string().optional(),
  branchId: z.string().optional(),
  relatedRef: z.string().optional(),
  notes: z.string().optional(),
  linkedCustomer: z.string().optional(),
  linkedCase: z.string().optional()
});

export const packageSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  badge: z.string().optional(),
  category: z.string().optional(),
  destination: z.string().optional(),
  duration: z.string().optional(),
  rating: z.number().min(0).max(5).default(0),
  reviewsCount: z.number().int().default(0),
  featuredImage: z.string().optional(),
  hotels: z.array(z.object({
    city: z.string(),
    name: z.string(),
    distance: z.string().optional(),
    nights: z.number().int().default(1)
  })).default([]),
  pricing: z.object({
    quadPKR: z.number().int().default(0),
    triplePKR: z.number().int().default(0),
    doublePKR: z.number().int().default(0),
    singlePKR: z.number().int().default(0)
  }).default({ quadPKR: 0, triplePKR: 0, doublePKR: 0, singlePKR: 0 }),
  flightSector: z.string().optional(),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  itinerary: z.array(z.object({
    day: z.number().int(),
    title: z.string(),
    desc: z.string().optional()
  })).default([])
});

export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  currency: z.string().default('PKR'),
  notes: z.string().optional(),
  payableBalancePKR: z.number().int().default(0),
  creditLimitPKR: z.number().int().default(0),
  contact: z.string().optional(),
  accountNumber: z.string().optional()
});

export const supplierLedgerSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1),
  date: z.string().min(1),
  ref: z.string().optional(),
  description: z.string().optional(),
  debit: z.number().int().default(0),
  credit: z.number().int().default(0),
  balance: z.number().int().default(0),
  currency: z.string().default('PKR')
});

export const commissionSchema = z.object({
  id: z.string().optional(),
  agentName: z.string().min(1),
  type: z.string().default('In-House Consultant'),
  bookingRef: z.string().optional(),
  customerName: z.string().optional(),
  destination: z.string().optional(),
  salesAmountPKR: z.number().int().min(0).default(0),
  commissionRate: z.string().optional(),
  commissionAmountPKR: z.number().int().default(0),
  status: z.string().default('PENDING'),
  payoutDate: z.string().optional(),
  branch: z.string().optional()
});

export const travelCaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  destination: z.string().optional(),
  branchId: z.string().optional(),
  assignedConsultant: z.string().optional(),
  visaOfficer: z.string().optional(),
  operationsStaff: z.string().optional(),
  status: z.string().default('LEAD'),
  stageIndex: z.number().int().default(0),
  travellers: z.array(z.object({
    name: z.string(),
    age: z.number().int().optional(),
    type: z.string().optional(),
    passport: z.string().optional(),
    expiry: z.string().optional()
  })).default([]),
  visa: z.object({
    caseId: z.string().optional(),
    destination: z.string().optional(),
    type: z.string().optional(),
    referenceNumber: z.string().optional(),
    status: z.string().optional(),
    submissionDate: z.string().optional(),
    targetApproval: z.string().optional(),
    checklistsCompleted: z.number().int().default(0),
    checklistsTotal: z.number().int().default(0)
  }).optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    status: z.string().default('UPLOADED')
  })).default([]),
  quote: z.object({
    quoteId: z.string().optional(),
    totalAmountPKR: z.number().int().default(0),
    supplierCostPKR: z.number().int().default(0),
    grossProfitPKR: z.number().int().default(0),
    marginPct: z.string().optional()
  }).optional(),
  booking: z.object({
    bookingId: z.string().optional(),
    bookingCode: z.string().optional(),
    airline: z.string().optional(),
    pnr: z.string().optional(),
    travelDates: z.string().optional(),
    hotel: z.string().optional(),
    transfer: z.string().optional()
  }).optional(),
  payment: z.object({
    totalPKR: z.number().int().default(0),
    paidPKR: z.number().int().default(0),
    balancePKR: z.number().int().default(0),
    status: z.string().default('PENDING'),
    lastReceipt: z.string().optional()
  }).optional(),
  nextTask: z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    due: z.string().optional(),
    priority: z.string().optional()
  }).optional(),
  timeline: z.array(z.object({
    time: z.string(),
    text: z.string()
  })).default([])
});

export const subAgentCaseSchema = z.object({
  id: z.string().optional(),
  subAgentId: z.string().min(1),
  subAgentName: z.string().optional(),
  customerName: z.string().optional(),
  destination: z.string().optional(),
  pax: z.number().int().default(1),
  salesPKR: z.number().int().default(0),
  commissionPKR: z.number().int().default(0),
  status: z.string().default('PROCESSING'),
  submissionDate: z.string().optional(),
  payoutStatus: z.string().default('PENDING')
});

export const whatsAppTemplateSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  title: z.string().min(1),
  category: z.string().optional(),
  template: z.string().min(1)
});

export const documentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  customer: z.string().optional(),
  traveller: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().default(0),
  storagePath: z.string().optional(),
  status: z.string().default('UPLOADED'),
  uploadedBy: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional()
});

export const schemas = {
  leads: leadSchema,
  customers: customerSchema,
  visaCases: visaCaseSchema,
  quotations: quotationSchema,
  bookings: bookingSchema,
  payments: paymentSchema,
  tasks: taskSchema,
  packages: packageSchema,
  suppliers: supplierSchema,
  supplierLedger: supplierLedgerSchema,
  commissions: commissionSchema,
  travelCases: travelCaseSchema,
  subAgentCases: subAgentCaseSchema,
  whatsappTemplates: whatsAppTemplateSchema,
  documents: documentSchema
};

export type CollectionName = keyof typeof schemas;