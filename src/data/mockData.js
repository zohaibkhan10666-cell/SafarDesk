// Comprehensive realistic seed data for SafarDesk Travel ERP
// Pakistan-focused Travel & Visa Consultancy Operations

export const initialAgencyData = {
  name: "SafarDesk Global Travel & Visa",
  tagline: "Premier Outbound Travel & Visa Management Operating System",
  licenseNumber: "DTS-LHR-4921 / IATA-Accredited",
  headquarters: "Plaza 42, Main Boulevard, Gulberg III, Lahore, Pakistan",
  phone: "+92 42 3578 9200",
  whatsapp: "+92 300 8472910",
  email: "operations@safardesk.com",
  defaultCurrency: "PKR",
  defaultTimezone: "Asia/Karachi",
  branches: [
    { id: "b-lhr", name: "Lahore HQ (Gulberg III)", manager: "Bilal Ahmed", phone: "+92 42 3578 9200", activeLeads: 18, totalStaff: 9 },
    { id: "b-isb", name: "Islamabad Branch (Blue Area)", manager: "Hamza Tariq", phone: "+92 51 2891 400", activeLeads: 12, totalStaff: 5 },
    { id: "b-khi", name: "Karachi Branch (Clifton Block 4)", manager: "Zubair Siddiqui", phone: "+92 21 3582 7100", activeLeads: 14, totalStaff: 6 },
    { id: "b-grw", name: "Gujranwala Branch (Model Town)", manager: "Rana M. Ashraf", phone: "+92 55 3841 900", activeLeads: 9, totalStaff: 4 }
  ],
  currencies: [
    { code: "PKR", symbol: "₨", rateToPKR: 1.0, isDefault: true },
    { code: "USD", symbol: "$", rateToPKR: 279.5 },
    { code: "SAR", symbol: "﷼", rateToPKR: 74.5 },
    { code: "AED", symbol: "د.إ", rateToPKR: 76.1 },
    { code: "GBP", symbol: "£", rateToPKR: 355.2 },
    { code: "EUR", symbol: "€", rateToPKR: 304.8 }
  ]
};

export const initialUsers = [
  { id: "u-1", name: "Bilal Ahmed", email: "bilal@safardesk.com", role: "AGENCY_OWNER", branchId: "b-lhr", phone: "+92 300 8472910", avatar: "BA" },
  { id: "u-2", name: "Ayesha Khan", email: "ayesha.visa@safardesk.com", role: "VISA_OFFICER", branchId: "b-lhr", phone: "+92 321 4567890", avatar: "AK" },
  { id: "u-3", name: "Hamza Tariq", email: "hamza@safardesk.com", role: "TRAVEL_CONSULTANT", branchId: "b-isb", phone: "+92 333 5123456", avatar: "HT" },
  { id: "u-4", name: "Usman Ali", email: "usman.accounts@safardesk.com", role: "ACCOUNTANT", branchId: "b-lhr", phone: "+92 345 6789012", avatar: "UA" },
  { id: "u-5", name: "Fatima Noor", email: "fatima.ops@safardesk.com", role: "OPERATIONS_STAFF", branchId: "b-khi", phone: "+92 301 9876543", avatar: "FN" }
];

export const leadStages = [
  { id: "NEW", title: "New Lead", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "CONTACTED", title: "Contacted", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "QUALIFIED", title: "Qualified", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "QUOTE_PREPARING", title: "Quote Preparing", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "QUOTE_SENT", title: "Quote Sent", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "FOLLOW_UP", title: "Follow-up", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "NEGOTIATION", title: "Negotiation", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "CONFIRMED", title: "Confirmed / Won", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "LOST", title: "Lost", color: "bg-rose-50 text-rose-700 border-rose-200" }
];

export const initialLeads = [
  {
    id: "LEAD-1001",
    name: "Chaudhry Kamran Akram",
    phone: "+923004455667",
    whatsapp: "+923004455667",
    email: "kamran.akram@interloop.com.pk",
    city: "Lahore",
    source: "WhatsApp",
    destination: "Dubai, UAE",
    purpose: "Family Vacation (5 Days)",
    travellerCount: 4,
    budgetPKR: 850000,
    requiredServices: ["Visa", "Flight", "Hotel", "Transfers"],
    assignedTo: "Hamza Tariq",
    branchId: "b-lhr",
    stage: "QUOTE_SENT",
    priority: "HIGH",
    nextFollowUp: "2026-09-24 11:00 AM",
    notes: "Requires Atlantis The Palm 2 nights + Millennium Plaza 3 nights. Dubai visas for 2 adults + 2 children.",
    createdDate: "2026-09-20"
  },
  {
    id: "LEAD-1002",
    name: "Dr. Samina Pervez",
    phone: "+923334218900",
    whatsapp: "+923334218900",
    email: "samina.p@shaukatkhanum.org.pk",
    city: "Islamabad",
    source: "Referral",
    destination: "United Kingdom",
    purpose: "Medical Conference + Tourism",
    travellerCount: 1,
    budgetPKR: 620000,
    requiredServices: ["UK Visa Assistance", "Direct Flight", "Hotel London"],
    assignedTo: "Ayesha Khan",
    branchId: "b-isb",
    stage: "QUALIFIED",
    priority: "HIGH",
    nextFollowUp: "2026-09-23 03:00 PM",
    notes: "Needs complete UK Standard Visitor documentation audit. Bank statement and NHS conference invite ready.",
    createdDate: "2026-09-21"
  },
  {
    id: "LEAD-1003",
    name: "Haji M. Rasheed & Family",
    phone: "+923218765432",
    whatsapp: "+923218765432",
    email: "rasheed.textiles@gmail.com",
    city: "Gujranwala",
    source: "Walk-in",
    destination: "Saudi Arabia (Makkah & Madinah)",
    purpose: "Executive 14-Day Umrah Package",
    travellerCount: 6,
    budgetPKR: 2400000,
    requiredServices: ["Umrah Visas", "Clock Tower 5-Star Hotel", "Madinah Front Hotel", "GMC Yukon Private Transfers"],
    assignedTo: "Hamza Tariq",
    branchId: "b-grw",
    stage: "QUOTE_PREPARING",
    priority: "URGENT",
    nextFollowUp: "2026-09-23 10:30 AM",
    notes: "Wants Swissotel Makkah Kaaba view quad rooms + Pullman Zamzam Madinah. Cash deposit ready.",
    createdDate: "2026-09-22"
  },
  {
    id: "LEAD-1004",
    name: "Taimur Hassan",
    phone: "+923015551234",
    whatsapp: "+923015551234",
    email: "taimur@fintechlahore.io",
    city: "Karachi",
    source: "Facebook",
    destination: "Baku, Azerbaijan",
    purpose: "Bachelors Adventure Trip",
    travellerCount: 3,
    budgetPKR: 450000,
    requiredServices: ["ASAN eVisa", "Flight via FlyDubai", "4-Star Hotel Nizami St."],
    assignedTo: "Fatima Noor",
    branchId: "b-khi",
    stage: "NEW",
    priority: "MEDIUM",
    nextFollowUp: "2026-09-23 05:00 PM",
    notes: "Looking for late October departure. Needs fast eVisa processing within 3 hours.",
    createdDate: "2026-09-22"
  },
  {
    id: "LEAD-1005",
    name: "Zainab Farooq",
    phone: "+923452298711",
    whatsapp: "+923452298711",
    email: "zainab.farooq@engro.com",
    city: "Karachi",
    source: "Website",
    destination: "France & Switzerland (Schengen)",
    purpose: "Honeymoon Tour",
    travellerCount: 2,
    budgetPKR: 1600000,
    requiredServices: ["Schengen Visa Appointment", "Dummy Flight/Hotel", "EuroRail Passes"],
    assignedTo: "Ayesha Khan",
    branchId: "b-khi",
    stage: "FOLLOW_UP",
    priority: "HIGH",
    nextFollowUp: "2026-09-25 02:00 PM",
    notes: "Appointment at Gerry's French Embassy Karachi required for late November slot.",
    createdDate: "2026-09-18"
  }
];

export const initialCustomers = [
  {
    id: "CUST-301",
    name: "Chaudhry Kamran Akram",
    phone: "+92 300 4455667",
    whatsapp: "+92 300 4455667",
    email: "kamran.akram@interloop.com.pk",
    cnic: "35201-1234567-1",
    city: "Lahore",
    address: "House 18, Block G, DHA Phase 5, Lahore",
    customerType: "Corporate VIP",
    totalBookings: 4,
    lifetimeSpendPKR: 3150000,
    outstandingBalancePKR: 185000,
    travellerCount: 4,
    activeVisaCases: 1,
    assignedConsultant: "Hamza Tariq",
    branchId: "b-lhr",
    notes: "Director at Interloop. Highly valuable client, always books business class on long-haul.",
    travellers: [
      {
        id: "TRV-101",
        fullName: "Chaudhry Kamran Akram",
        relation: "Self (Primary)",
        dob: "1978-04-12",
        gender: "Male",
        cnic: "35201-1234567-1",
        passportNumber: "AL9821043",
        passportIssueDate: "2021-06-10",
        passportExpiryDate: "2031-06-09", // Valid
        daysUntilPassportExpiry: 1720,
        nationality: "Pakistani"
      },
      {
        id: "TRV-102",
        fullName: "Noreen Kamran",
        relation: "Spouse",
        dob: "1982-09-24",
        gender: "Female",
        cnic: "35201-7654321-2",
        passportNumber: "BN4521908",
        passportIssueDate: "2017-02-15",
        passportExpiryDate: "2027-02-14", // Valid
        daysUntilPassportExpiry: 145, // <180 Days Warning!
        nationality: "Pakistani"
      },
      {
        id: "TRV-103",
        fullName: "Daniyal Kamran",
        relation: "Child (Son)",
        dob: "2012-07-05",
        gender: "Male",
        cnic: "35201-9988112-9",
        passportNumber: "CP7712390",
        passportIssueDate: "2020-03-01",
        passportExpiryDate: "2025-02-28", // Expired or expiring soon
        daysUntilPassportExpiry: 28, // <30 Days Urgent Warning!
        nationality: "Pakistani"
      }
    ]
  },
  {
    id: "CUST-302",
    name: "Dr. Samina Pervez",
    phone: "+92 333 4218900",
    whatsapp: "+92 333 4218900",
    email: "samina.p@shaukatkhanum.org.pk",
    cnic: "61101-9876543-2",
    city: "Islamabad",
    address: "Apartment 4B, Silver Oaks, F-10, Islamabad",
    customerType: "Individual Professional",
    totalBookings: 2,
    lifetimeSpendPKR: 890000,
    outstandingBalancePKR: 0,
    travellerCount: 1,
    activeVisaCases: 1,
    assignedConsultant: "Ayesha Khan",
    branchId: "b-isb",
    notes: "Senior Consultant Oncologist. Frequent traveler to NHS London conferences.",
    travellers: [
      {
        id: "TRV-104",
        fullName: "Dr. Samina Pervez",
        relation: "Self (Primary)",
        dob: "1984-11-19",
        gender: "Female",
        cnic: "61101-9876543-2",
        passportNumber: "DK5512876",
        passportIssueDate: "2022-08-15",
        passportExpiryDate: "2032-08-14",
        daysUntilPassportExpiry: 2150,
        nationality: "Pakistani"
      }
    ]
  }
];

export const initialVisaCases = [
  {
    id: "VISA-901",
    customerName: "Chaudhry Kamran Akram",
    customerId: "CUST-301",
    destination: "United Arab Emirates",
    visaType: "Dubai 30-Days Tourist eVisa",
    applicantCount: 3,
    applicants: ["Chaudhry Kamran Akram", "Noreen Kamran", "Daniyal Kamran"],
    assignedOfficer: "Ayesha Khan",
    referenceNumber: "GDRFA-DXB-2026-8819",
    externalProvider: "Rayna Tours Overseas",
    visaFeePKR: 85500, // 28,500 x 3
    serviceFeePKR: 24000, // 8,000 x 3
    totalCustomerPricePKR: 109500,
    supplierCostPKR: 72000,
    expectedMarginPKR: 37500,
    status: "UNDER_REVIEW",
    priority: "HIGH",
    applicationDate: "2026-09-21",
    intendedTravelDate: "2026-10-15",
    branchId: "b-lhr",
    customer: {
      phone: "+92 300 4455667",
      whatsapp: "+92 300 4455667",
      email: "kamran.akram@interloop.com.pk",
      cnic: "35201-1234567-1",
      passportNumber: "AL9821043",
      passportExpiry: "2031-06-09",
      nationality: "Pakistani",
      dateOfBirth: "1978-04-12",
      city: "Lahore",
      address: "House 18, Block G, DHA Phase 5, Lahore",
      occupation: "Director, Interloop",
      notes: "Primary applicant. Family of 3 travelling - spouse passport expires 2027-02-14 (under 180 days)."
    },
    documents: [
      { id: "doc-901-1", name: "Passport Scans (Family)", category: "Identity", status: "VERIFIED", fileName: "kamran-family-passports.pdf", uploadedAt: "2026-09-21", notes: "Colour scans, all pages." },
      { id: "doc-901-2", name: "Bank Statement (6 Months)", category: "Financial", status: "VERIFIED", fileName: "hbl-statement-jul-sep.pdf", uploadedAt: "2026-09-21", notes: "Closing balance PKR 4.2M." },
      { id: "doc-901-3", name: "Return Flight Itinerary", category: "Travel", status: "UPLOADED", fileName: "emirates-pnr-7QK2LM.pdf", uploadedAt: "2026-09-22", notes: "Emirates EK-617 / EK-618." },
      { id: "doc-901-4", name: "Hotel Booking Confirmation", category: "Accommodation", status: "PENDING", fileName: "", uploadedAt: "", notes: "Awaiting Marriott Downtown confirmation." }
    ],
    checklists: [
      { id: "chk-1", name: "Passports First Page Scans", status: "VERIFIED", required: true, notes: "Clear 300 DPI color scans received." },
      { id: "chk-2", name: "White Background Photographs (Passport Size)", status: "VERIFIED", required: true, notes: "Compliant with UAE ICA specs." },
      { id: "chk-3", name: "Confirmed Return Flight Ticket PNR", status: "UPLOADED", required: true, notes: "Emirates PNR attached." },
      { id: "chk-4", name: "Child B-Form / Nadra Birth Certificate", status: "PENDING", required: true, notes: "Awaiting Daniyal Nadra Birth Certificate." }
    ],
    get completionPercentage() {
      const verified = this.checklists.filter(c => c.status === "VERIFIED" || c.status === "UPLOADED").length;
      return Math.round((verified / this.checklists.length) * 100);
    }
  },
  {
    id: "VISA-902",
    customerName: "Dr. Samina Pervez",
    customerId: "CUST-302",
    destination: "United Kingdom",
    visaType: "UK Standard Visitor Visa (6 Months)",
    applicantCount: 1,
    applicants: ["Dr. Samina Pervez"],
    assignedOfficer: "Ayesha Khan",
    referenceNumber: "GWF-078912344",
    externalProvider: "UK Visas and Immigration (UKVI / VFS)",
    visaFeePKR: 48500,
    serviceFeePKR: 35000,
    totalCustomerPricePKR: 83500,
    supplierCostPKR: 48500,
    expectedMarginPKR: 35000,
    status: "DOCUMENTS_RECEIVED",
    priority: "HIGH",
    applicationDate: "2026-09-22",
    intendedTravelDate: "2026-11-04",
    branchId: "b-isb",
    customer: {
      phone: "+92 333 4218900",
      whatsapp: "+92 333 4218900",
      email: "samina.p@shaukatkhanum.org.pk",
      cnic: "61101-9876543-2",
      passportNumber: "DK5512876",
      passportExpiry: "2032-08-14",
      nationality: "Pakistani",
      dateOfBirth: "1984-11-19",
      city: "Islamabad",
      address: "Apartment 4B, Silver Oaks, F-10, Islamabad",
      occupation: "Senior Consultant Oncologist",
      notes: "Solo traveller. NHS London conference invitation attached with the file."
    },
    documents: [
      { id: "doc-902-1", name: "Current & Previous Passports", category: "Identity", status: "VERIFIED", fileName: "pervez-passports.pdf", uploadedAt: "2026-09-22", notes: "US 10-year visa + previous UK stamp." },
      { id: "doc-902-2", name: "Bank Statement with Maintenance Letter", category: "Financial", status: "VERIFIED", fileName: "meezan-6-months.pdf", uploadedAt: "2026-09-22", notes: "Closing balance PKR 4.8M." },
      { id: "doc-902-3", name: "Employment Letter / NOC", category: "Employment", status: "UPLOADED", fileName: "skm-noc-signed.pdf", uploadedAt: "2026-09-23", notes: "Signed by HR Director." },
      { id: "doc-902-4", name: "Conference Invitation Letter", category: "Purpose", status: "VERIFIED", fileName: "nhs-excel-invite.pdf", uploadedAt: "2026-09-23", notes: "London ExCeL registration confirmed." },
      { id: "doc-902-5", name: "Tax Returns (FBR Profile)", category: "Financial", status: "UPLOADED", fileName: "fbr-tax-2025.pdf", uploadedAt: "2026-09-23", notes: "Active taxpayer acknowledgment slip." }
    ],
    checklists: [
      { id: "chk-201", name: "Current Passport & Previous Passports", status: "VERIFIED", required: true, notes: "Has US 10-year visa + previous UK stamp." },
      { id: "chk-202", name: "6-Months Bank Statement with Account Maintenance Letter", status: "VERIFIED", required: true, notes: "Closing balance ₨4.8 Million, verified stamp." },
      { id: "chk-203", name: "Employment Letter / NOC from Shaukat Khanum", status: "VERIFIED", required: true, notes: "Signed by HR Director." },
      { id: "chk-204", name: "NHS Oncology Conference Invitation Letter", status: "VERIFIED", required: true, notes: "London ExCeL registration confirmed." },
      { id: "chk-205", name: "Tax Returns (FBR Active Taxpayer Profile)", status: "UPLOADED", required: true, notes: "FBR tax year 2025 acknowledgment slip." },
      { id: "chk-206", name: "Hotel Booking & Travel Itinerary Draft", status: "UPLOADED", required: true, notes: "London Marriott Kensington reservation." }
    ],
    get completionPercentage() {
      const verified = this.checklists.filter(c => c.status === "VERIFIED" || c.status === "UPLOADED").length;
      return Math.round((verified / this.checklists.length) * 100);
    }
  },
  {
    id: "VISA-903",
    customerName: "Haji M. Rasheed",
    customerId: "CUST-303",
    destination: "Saudi Arabia",
    visaType: "Umrah Electronic Visa (1-Year Multiple)",
    applicantCount: 4,
    applicants: ["M. Rasheed", "Kausar Parveen", "Bilal Rasheed", "Amina Rasheed"],
    assignedOfficer: "Ayesha Khan",
    referenceNumber: "MOFA-KSA-994123",
    externalProvider: "Bab-ul-Umrah Facilitators",
    visaFeePKR: 168000,
    serviceFeePKR: 32000,
    totalCustomerPricePKR: 200000,
    supplierCostPKR: 156000,
    expectedMarginPKR: 44000,
    status: "READY_TO_SUBMIT",
    priority: "URGENT",
    applicationDate: "2026-09-22",
    intendedTravelDate: "2026-10-02",
    branchId: "b-grw",
    customer: {
      phone: "+92 300 7788990",
      whatsapp: "+92 300 7788990",
      email: "haji.rasheed@alnoortraders.pk",
      cnic: "34101-5566778-9",
      passportNumber: "BR2210445",
      passportExpiry: "2029-11-30",
      nationality: "Pakistani",
      dateOfBirth: "1961-02-08",
      city: "Gujranwala",
      address: "Street 7, Model Town, Gujranwala",
      occupation: "Trader, Al-Noor Traders",
      notes: "Group of 4 (self, wife, son, daughter). Prefers WhatsApp updates after Asar."
    },
    documents: [
      { id: "doc-903-1", name: "Passports (4 Family Members)", category: "Identity", status: "VERIFIED", fileName: "rasheed-family-passports.pdf", uploadedAt: "2026-09-22", notes: "All valid beyond 6 months." },
      { id: "doc-903-2", name: "Vaccination Cards (Polio / Meningitis)", category: "Medical", status: "VERIFIED", fileName: "vaccination-cards.pdf", uploadedAt: "2026-09-22", notes: "Hospital stamps verified." },
      { id: "doc-903-3", name: "Mahram Relation Affidavit", category: "Affidavit", status: "UPLOADED", fileName: "mahram-affidavit-notary.pdf", uploadedAt: "2026-09-23", notes: "Notarised copy for Amina Rasheed." },
      { id: "doc-903-4", name: "Return Flight Tickets (LHR-JED)", category: "Travel", status: "VERIFIED", fileName: "saudia-sv4421.pdf", uploadedAt: "2026-09-23", notes: "SV-4421 / SV-4422 issued." }
    ],
    checklists: [
      { id: "chk-301", name: "Passports (Min 6 months validity)", status: "VERIFIED", required: true, notes: "All passports cleared." },
      { id: "chk-302", name: "Digital Photographs (2x2 White)", status: "VERIFIED", required: true, notes: "ICA compliant." },
      { id: "chk-303", name: "Polio / Meningitis Vaccine Cards", status: "VERIFIED", required: true, notes: "Hospital stamps checked." }
    ],
    get completionPercentage() {
      const verified = this.checklists.filter(c => c.status === "VERIFIED" || c.status === "UPLOADED").length;
      return Math.round((verified / this.checklists.length) * 100);
    }
  }
];

export const initialQuotations = [
  {
    id: "QUO-8021",
    customerName: "Chaudhry Kamran Akram",
    customerId: "CUST-301",
    destination: "Dubai 5-Day Luxury Family Experience",
    travelDates: "Oct 15, 2026 – Oct 20, 2026",
    travellerCount: 4,
    quotationNumber: "SFD-QUO-2026-0821",
    validUntil: "2026-09-28",
    status: "ACCEPTED",
    currency: "PKR",
    items: [
      { id: "item-1", description: "Emirates Airline Economy Class (LHR-DXB-LHR)", category: "Flight", qty: 4, unitCost: 115000, customerPrice: 135000 },
      { id: "item-2", description: "Dubai 30-Days Tourist eVisa with Insurance", category: "Visa", qty: 4, unitCost: 24000, customerPrice: 32000 },
      { id: "item-3", description: "Millennium Plaza Downtown Hotel Sheikh Zayed Rd (2 Deluxe Rooms, 5 Nights, Breakfast)", category: "Hotel", qty: 1, unitCost: 280000, customerPrice: 340000 },
      { id: "item-4", description: "Private Luxury Airport Transfers (Toyota HiAce VIP)", category: "Transport", qty: 2, unitCost: 15000, customerPrice: 24000 },
      { id: "item-5", description: "Desert Safari VIP Majlis + Burj Khalifa Level 124 Tickets", category: "Tours", qty: 4, unitCost: 18000, customerPrice: 28000 }
    ],
    terms: "50% advance upon quote acceptance. Balance 50% payable 7 days prior to departure. Visa fees are non-refundable as per GDRFA rules.",
    notes: "Rates subject to airline ticket issuance deadline."
  },
  {
    id: "QUO-8022",
    customerName: "Dr. Samina Pervez",
    customerId: "CUST-302",
    destination: "London 7-Day Conference & Leisure",
    travelDates: "Nov 04, 2026 – Nov 11, 2026",
    travellerCount: 1,
    quotationNumber: "SFD-QUO-2026-0822",
    validUntil: "2026-09-30",
    status: "SENT",
    currency: "PKR",
    items: [
      { id: "item-11", description: "British Airways Direct Flight (ISB-LHR-ISB)", category: "Flight", qty: 1, unitCost: 245000, customerPrice: 285000 },
      { id: "item-12", description: "UK Standard Visitor Visa Filing & Document Legalization", category: "Visa", qty: 1, unitCost: 48500, customerPrice: 85000 },
      { id: "item-13", description: "London Marriott Kensington (7 Nights with English Breakfast)", category: "Hotel", qty: 1, unitCost: 310000, customerPrice: 380000 },
      { id: "item-14", description: "Heathrow Express Business Transfer + London Underground Oyster", category: "Transport", qty: 1, unitCost: 25000, customerPrice: 35000 }
    ],
    terms: "Visa processing timeline is approximately 15 working days. Hotel cancellation is free up to 72 hours prior.",
    notes: "Special medical conference rate applied."
  }
];

export const initialBookings = [
  {
    id: "BKG-501",
    bookingCode: "SFD-BKG-9921",
    customerName: "Chaudhry Kamran Akram",
    customerId: "CUST-301",
    type: "Comprehensive Package",
    destination: "Dubai, UAE",
    status: "CONFIRMED",
    travelDates: "Oct 15, 2026 – Oct 20, 2026",
    totalAmountPKR: 1160000,
    paidAmountPKR: 975000,
    balanceAmountPKR: 185000,
    paymentStatus: "PARTIALLY_PAID",
    branchId: "b-lhr",
    flightDetails: {
      airline: "Emirates Airlines",
      pnr: "EK-8942-LHR",
      ticketNumber: "176-2910481230-33",
      route: "LHR (Allama Iqbal Intl) → DXB (Dubai Intl Terminal 3)",
      departureTime: "2026-10-15 03:20 AM",
      arrivalTime: "2026-10-15 05:55 AM",
      returnRoute: "DXB → LHR",
      returnDepartureTime: "2026-10-20 22:15 PM",
      status: "TICKETED"
    },
    hotelDetails: {
      name: "Millennium Plaza Downtown Dubai",
      roomType: "2x Executive Family Connecting Rooms",
      checkIn: "2026-10-15",
      checkOut: "2026-10-20",
      confirmationNumber: "MIL-DXB-99812",
      voucherStatus: "ISSUED"
    },
    itineraryDays: [
      { day: 1, date: "Oct 15", title: "Arrival & Marina Dinner Cruise", details: "Private HiAce pickup at Terminal 3, transfer to Millennium Plaza. Evening VIP Marina Dhow Cruise with dinner." },
      { day: 2, date: "Oct 16", title: "Modern Dubai & Burj Khalifa", details: "Private guided tour of Dubai Frame, Museum of the Future photo stop, fast-track entry to Burj Khalifa Level 124." },
      { day: 3, date: "Oct 17", title: "VIP Red Dunes Desert Safari", details: "4x4 Land Cruiser dune bashing, quad biking, sunset photography, VIP Arabic BBQ dinner with live shows." },
      { day: 4, date: "Oct 18", title: "Free Shopping Day & Gold Souk", details: "Leisure day for Dubai Mall & Gold Souk shopping with dedicated on-call driver." },
      { day: 5, date: "Oct 19", title: "Atlantis Aquaventure & The Palm", details: "Full day pass to Aquaventure Waterpark & Lost Chambers Aquarium at Atlantis The Palm." },
      { day: 6, date: "Oct 20", title: "Hotel Checkout & Flight Departure", details: "Late checkout at 18:00. Airport transfer to DXB Terminal 3 for EK-624 flight back to Lahore." }
    ]
  },
  {
    id: "BKG-502",
    bookingCode: "SFD-BKG-9922",
    customerName: "Haji M. Rasheed",
    customerId: "CUST-303",
    type: "Umrah Package",
    destination: "Saudi Arabia",
    status: "CONFIRMED",
    travelDates: "Oct 02, 2026 – Oct 16, 2026",
    totalAmountPKR: 2150000,
    paidAmountPKR: 2150000,
    balanceAmountPKR: 0,
    paymentStatus: "PAID",
    branchId: "b-grw",
    flightDetails: {
      airline: "Saudia (Saudi Arabian Airlines)",
      pnr: "SV-4421-JED",
      ticketNumber: "065-9812736120-23",
      route: "LHR → JED (King Abdulaziz Intl) / Return MED → LHR",
      departureTime: "2026-10-02 08:30 AM",
      status: "TICKETED"
    },
    hotelDetails: {
      name: "Swissotel Al Maqam Makkah & Pullman Zamzam Madinah",
      roomType: "Quad Haram View Rooms",
      checkIn: "2026-10-02",
      checkOut: "2026-10-16",
      confirmationNumber: "SWS-MKH-7712",
      voucherStatus: "ISSUED"
    },
    itineraryDays: [
      { day: 1, date: "Oct 02", title: "Arrival Jeddah & Umrah Performance", details: "Private Yukon transfer from Jeddah airport to Swissotel Makkah. Perform Umrah with licensed guide." },
      { day: 2, date: "Oct 03", title: "Ibadah in Haram", details: "Dedicated worship day in Masjid al-Haram." },
      { day: 7, date: "Oct 08", title: "Transfer Makkah to Madinah via Haramain Bullet Train", details: "High-speed Haramain VIP rail tickets to Madinah Munawwarah, check-in at Pullman Zamzam." }
    ]
  }
];

export const initialPayments = [
  {
    id: "PAY-701",
    receiptNumber: "SFD-REC-2026-0412",
    bookingId: "BKG-501",
    customerName: "Chaudhry Kamran Akram",
    amountPKR: 580000,
    paymentMethod: "Bank Transfer (Meezan Bank Raast)",
    reference: "RAAST-TXN-99812401",
    paymentDate: "2026-09-15",
    type: "Advance Deposit",
    status: "VERIFIED",
    verifiedBy: "Usman Ali",
    notes: "Advance 50% deposit received in Meezan Corporate Account."
  },
  {
    id: "PAY-702",
    receiptNumber: "SFD-REC-2026-0419",
    bookingId: "BKG-501",
    customerName: "Chaudhry Kamran Akram",
    amountPKR: 395000,
    paymentMethod: "Online Banking",
    reference: "HBL-TRF-3419082",
    paymentDate: "2026-09-20",
    type: "Second Installment",
    status: "VERIFIED",
    verifiedBy: "Usman Ali",
    notes: "Received before ticket issuance."
  },
  {
    id: "PAY-703",
    receiptNumber: "SFD-REC-2026-0428",
    bookingId: "BKG-502",
    customerName: "Haji M. Rasheed",
    amountPKR: 2150000,
    paymentMethod: "Bank Pay Order / Cash",
    reference: "PO-MCB-GRW-88120",
    paymentDate: "2026-09-21",
    type: "Full Payment",
    status: "VERIFIED",
    verifiedBy: "Usman Ali",
    notes: "Full settlement received at Gujranwala branch."
  }
];

export const initialSuppliers = [
  { 
    id: "sup-1", 
    name: "Emirates Airlines Consolidator (Travelport GDS)", 
    type: "Airline GDS", 
    payableBalancePKR: 460000, 
    creditLimitPKR: 1500000,
    contact: "Rashid Mahmood (+92 42 3571 8800)", 
    email: "gds.lahore@travelport.com",
    currency: "PKR",
    accountNumber: "TP-PAK-99120"
  },
  { 
    id: "sup-2", 
    name: "Rayna Tours UAE DMC", 
    type: "DMC & Visa Provider", 
    payableBalancePKR: 195000, 
    creditLimitPKR: 800000,
    contact: "Kashif Sheikh (+971 4 208 7777)", 
    email: "dubai.ops@raynatours.com",
    currency: "AED",
    accountNumber: "RAYNA-AE-4819"
  },
  { 
    id: "sup-3", 
    name: "Al-Haramain Umrah Services Makkah & Jeddah", 
    type: "Umrah Facilitator", 
    payableBalancePKR: 320000, 
    creditLimitPKR: 2000000,
    contact: "Sheikh Tariq Mansoor (+966 12 574 9900)", 
    email: "groups@alharamain-sa.com",
    currency: "SAR",
    accountNumber: "HARM-SA-1029"
  },
  { 
    id: "sup-4", 
    name: "Hotelbeds Global Wholesaler", 
    type: "Hotel Aggregator", 
    payableBalancePKR: 145000, 
    creditLimitPKR: 600000,
    contact: "support@hotelbeds.com", 
    email: "accounts.apac@hotelbeds.com",
    currency: "USD",
    accountNumber: "HBEDS-GL-771"
  },
  {
    id: "sup-5",
    name: "Gerry's Visa Dropbox Pakistan",
    type: "Visa Application Centre",
    payableBalancePKR: 85000,
    creditLimitPKR: 300000,
    contact: "Liaquat Plaza (+92 51 111 711 711)",
    email: "corporate@gerrys.com.pk",
    currency: "PKR",
    accountNumber: "GER-ISB-2091"
  }
];

export const initialSupplierLedger = [
  { id: "LED-101", supplierId: "sup-1", date: "2026-09-16", ref: "TKT-EK-8942", description: "4x LHR-DXB-LHR Ticket Issuance (Kamran Akram)", debit: 460000, credit: 0, balance: 460000, currency: "PKR" },
  { id: "LED-102", supplierId: "sup-1", date: "2026-09-12", ref: "REC-TP-9081", description: "Direct Raast settlement to Travelport corporate", debit: 0, credit: 500000, balance: 0, currency: "PKR" },
  { id: "LED-103", supplierId: "sup-2", date: "2026-09-18", ref: "DXB-VIS-412", description: "4x Dubai 30-Day Tourism e-Visas GDRFA", debit: 110000, credit: 0, balance: 195000, currency: "PKR" },
  { id: "LED-104", supplierId: "sup-2", date: "2026-09-17", ref: "DXB-HTL-881", description: "Millennium Plaza 3 Nights 2 Rooms booking", debit: 85000, credit: 0, balance: 85000, currency: "PKR" },
  { id: "LED-105", supplierId: "sup-3", date: "2026-09-19", ref: "UMR-MAK-901", description: "Swissotel Makkah 7 Nights Quad Suite block", debit: 980000, credit: 0, balance: 320000, currency: "PKR" },
  { id: "LED-106", supplierId: "sup-3", date: "2026-09-20", ref: "PAY-SA-7712", description: "Bank Albilad wire transfer settlement", debit: 0, credit: 660000, balance: 320000, currency: "PKR" },
  { id: "LED-107", supplierId: "sup-5", date: "2026-09-21", ref: "GER-UK-301", description: "UK Standard Visitor Visa appointment fees (Dr. Samina)", debit: 85000, credit: 0, balance: 85000, currency: "PKR" }
];

export const initialPackages = [
  {
    id: "PKG-UMR-01",
    title: "15-Day Executive VIP Umrah Package",
    badge: "Bestseller",
    category: "Umrah",
    destination: "Makkah & Madinah, Saudi Arabia",
    duration: "14 Nights / 15 Days",
    rating: 4.9,
    reviewsCount: 38,
    featuredImage: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80",
    hotels: [
      { city: "Makkah", name: "Swissôtel Al Maqam (Clock Tower)", distance: "0m (Kaaba View)", nights: 7 },
      { city: "Madinah", name: "Pullman Zamzam Madinah", distance: "150m from Haram", nights: 7 }
    ],
    pricing: {
      quadPKR: 385000,
      triplePKR: 425000,
      doublePKR: 495000,
      singlePKR: 680000
    },
    flightSector: "LHR-JED / MED-LHR (Direct Saudia / PIA)",
    inclusions: [
      "Saudi Umrah e-Visa with full health insurance",
      "Return Direct Flight Ticket",
      "5-Star Clock Tower Makkah Accommodation with Breakfast",
      "5-Star Pullman Madinah Accommodation with Breakfast",
      "Private GMC Yukon / VIP Coach Transfers (JED-MAK-MED-AIRPORT)",
      "Guided Makkah & Madinah Historical Ziyarat",
      "24/7 SafarDesk On-Ground Assistance in Makkah"
    ],
    exclusions: [
      "Lunch and dinner expenses",
      "Excess baggage charges",
      "Personal tips and laundry"
    ],
    itinerary: [
      { day: 1, title: "Arrival at Jeddah & Transfer to Makkah", desc: "Private VIP transfer from King Abdulaziz International Airport to Swissôtel Makkah. Check-in and assistance for initial Umrah rituals." },
      { day: 2, title: "Ibadah in Masjid Al-Haram", desc: "Free day dedicated to personal prayer and Tawaf at the Holy Kaaba." },
      { day: 3, title: "Makkah Mukarramah Historical Ziyarat", desc: "Guided tour to Jabal Al-Noor (Cave Hira), Jabal Thawr, Mina, Muzdalifah, and Arafat with knowledgeable guide." },
      { day: 4, title: "Spiritual Reflection & Lecture", desc: "Interactive group discussion on Seerah and spiritual etiquette of Umrah." },
      { day: 5, title: "Second Umrah Opportunity", desc: "Optional transport to Masjid Aisha (Taneem) for pilgrims wishing to perform second Umrah." },
      { day: 8, title: "High-Speed Haramain Train to Madinah", desc: "Board the luxury Haramain High-Speed Train from Makkah to Madinah Munawwarah in 2 hours 20 mins." },
      { day: 9, title: "Ziyarat at Masjid An-Nabawi & Rawdah", desc: "Scheduled permits via Nusuk app for Rawdah Ash-Sharifah prayer and salam to the Prophet (PBUH)." },
      { day: 11, title: "Madinah Munawwarah Ziyarat", desc: "Visit to Masjid Quba, Mount Uhud, Seven Mosques, and Date Farms of Madinah." },
      { day: 15, title: "Departure from Madinah Airport", desc: "Check-out and transfer to Prince Mohammad Bin Abdulaziz International Airport for direct flight back to Pakistan." }
    ]
  },
  {
    id: "PKG-UMR-02",
    title: "10-Day Economy Super-Saver Umrah",
    badge: "Value Choice",
    category: "Umrah",
    destination: "Makkah & Madinah, Saudi Arabia",
    duration: "9 Nights / 10 Days",
    rating: 4.7,
    reviewsCount: 52,
    hotels: [
      { city: "Makkah", name: "Al-Kiswah Towers (Shuttle 24/7)", distance: "800m (5-min shuttle)", nights: 5 },
      { city: "Madinah", name: "Waqf Al-Safi Hotel", distance: "350m from Haram", nights: 4 }
    ],
    pricing: {
      quadPKR: 245000,
      triplePKR: 275000,
      doublePKR: 315000,
      singlePKR: 420000
    },
    flightSector: "KHI/LHR-JED / MED-KHI/LHR (Airblue / Fly Jinnah / Saudia)",
    inclusions: [
      "Saudi Umrah 90-Day Multiple Visa",
      "Return Airfare (Economy Class)",
      "Clean 3-Star AC Accommodation",
      "AC Bus Transfers between Airport, Makkah & Madinah",
      "Complete Group Ziyarat in both holy cities",
      "Free 5L Zamzam Can Included"
    ],
    exclusions: [
      "Daily meals",
      "Private vehicle upgrades"
    ],
    itinerary: [
      { day: 1, title: "Arrival at Jeddah Terminal 1", desc: "Meet & greet by SafarDesk ground representative, bus transfer to Al-Kiswah Towers Makkah." },
      { day: 2, title: "Umrah Performance", desc: "Guidance for Umrah rituals under supervision of senior team leader." },
      { day: 6, title: "AC Coach Transfer to Madinah", desc: "Scenic coach journey through Hijaz mountains to Madinah Al-Munawwarah." },
      { day: 10, title: "Return to Pakistan", desc: "Transfer to airport and flight departure back home." }
    ]
  },
  {
    id: "PKG-DXB-01",
    title: "5-Day Dubai Winter Vacation & Desert Safari",
    badge: "Family Favorite",
    category: "Holiday",
    destination: "Dubai, United Arab Emirates",
    duration: "4 Nights / 5 Days",
    rating: 4.8,
    reviewsCount: 29,
    hotels: [
      { city: "Dubai", name: "Millennium Plaza Downtown Hotel Sheikh Zayed Rd", distance: "Next to Metro", nights: 4 }
    ],
    pricing: {
      quadPKR: 215000,
      triplePKR: 235000,
      doublePKR: 265000,
      singlePKR: 355000
    },
    flightSector: "LHR/ISB/KHI - DXB Return (Emirates / Flydubai)",
    inclusions: [
      "30-Day UAE Tourist Visa with Insurance",
      "Return Flights from Pakistan",
      "4-Star Luxury Hotel on Sheikh Zayed Road with Daily Buffet Breakfast",
      "Return Airport Transfers in AC Private Vehicle",
      "Red Dune Desert Safari with BBQ Dinner, Dune Bashing & Tanoura Show",
      "Burj Khalifa 124th Floor At the Top Ticket & Dubai Mall Musical Fountain",
      "Marina Luxury Dhow Cruise with International 5-Star Buffet"
    ],
    exclusions: [
      "Dubai Tourism Dirham Fee (AED 15/room/night)",
      "Lunch & personal shopping"
    ],
    itinerary: [
      { day: 1, title: "Arrival in Dubai & Private Transfer", desc: "Arrival at DXB Airport, welcome by representative, luxury transfer to hotel. Evening at leisure on Sheikh Zayed Road." },
      { day: 2, title: "Dubai City Tour & Burj Khalifa Observation Deck", desc: "Visit Dubai Frame, Palm Jumeirah, and evening ascent to 124th floor of Burj Khalifa followed by Dubai Mall fountain show." },
      { day: 3, title: "Premium Red Dune Desert Safari", desc: "Afternoon 4x4 Land Cruiser pickup for dune bashing in Lahbab Desert, camel riding, sandboarding, and gala BBQ buffet dinner." },
      { day: 4, title: "Dubai Marina Dhow Cruise Dinner", desc: "Morning free for shopping at Meena Bazaar or Mall of the Emirates. Evening romantic glass-enclosed Dhow cruise with live entertainment." },
      { day: 5, title: "Departure Transfer to DXB", desc: "Breakfast, check-out, and private transfer to Dubai International Airport for departure." }
    ]
  },
  {
    id: "PKG-BAK-01",
    title: "4-Day Baku Panoramic Tour & Gabala Mountains",
    badge: "Trending",
    category: "Holiday",
    destination: "Baku & Gabala, Azerbaijan",
    duration: "3 Nights / 4 Days",
    rating: 4.9,
    reviewsCount: 24,
    hotels: [
      { city: "Baku", name: "Courtyard by Marriott Baku", distance: "City Center", nights: 3 }
    ],
    pricing: {
      quadPKR: 185000,
      triplePKR: 198000,
      doublePKR: 220000,
      singlePKR: 295000
    },
    flightSector: "LHR/ISB - GYD Return (Azerbaijan Airlines / PIA)",
    inclusions: [
      "Azerbaijan ASAN Official e-Visa (3-hour fast track)",
      "Return International Flights",
      "4-Star Marriott Hotel in central Baku with Breakfast",
      "Full Day Baku Old City (Icherisheher), Maiden Tower & Flame Towers tour",
      "Full Day Excursion to Gabala Mountains with Tufandag Cable Car",
      "Visit to Ateshgah Fire Temple & Yanardag Burning Mountain",
      "English/Urdu speaking professional tour guide"
    ],
    exclusions: [
      "Shooting club tickets in Gabala",
      "Lunch and dinner"
    ],
    itinerary: [
      { day: 1, title: "Arrival in Baku & Boulevard Walk", desc: "Arrive at Heydar Aliyev Airport, transfer to hotel. Evening stroll along Baku Caspian Boulevard and Nizami Street." },
      { day: 2, title: "Old City & Flame Towers Tour", desc: "Explore 12th-century Maiden Tower, Shirvanshahs Palace, Highland Park panoramic view, and Heydar Aliyev Center." },
      { day: 3, title: "Scenic Gabala Nature Excursion", desc: "Scenic drive to Caucasus mountain region of Gabala, ride Tufandag cable car to alpine summit, visit Nohur Lake." },
      { day: 4, title: "Fire Temple & Departure", desc: "Check-out, visit Ateshgah Zoroastrian Fire Temple and Yanardag eternal fire, then transfer to GYD airport." }
    ]
  }
];

export const initialCommissions = [
  {
    id: "COM-101",
    agentName: "Hamza Tariq",
    type: "In-House Consultant",
    bookingRef: "BKG-501",
    customerName: "Chaudhry Kamran Akram",
    destination: "Dubai, UAE",
    salesAmountPKR: 1160000,
    commissionRate: "2.5%",
    commissionAmountPKR: 29000,
    status: "PAID",
    payoutDate: "2026-09-22",
    branch: "Islamabad (Blue Area)"
  },
  {
    id: "COM-102",
    agentName: "Ayesha Khan",
    type: "In-House Consultant",
    bookingRef: "BKG-502",
    customerName: "Haji M. Rasheed",
    destination: "Saudi Arabia (Umrah)",
    salesAmountPKR: 2150000,
    commissionRate: "2.0%",
    commissionAmountPKR: 43000,
    status: "PENDING_APPROVAL",
    payoutDate: "2026-09-30",
    branch: "Lahore HQ"
  },
  {
    id: "COM-103",
    agentName: "Al-Makkah Sub-Agency Faisalabad",
    type: "External Sub-Agent",
    bookingRef: "BKG-503",
    customerName: "Malik Shahbaz & Group",
    destination: "Baku, Azerbaijan",
    salesAmountPKR: 880000,
    commissionRate: "4.0%",
    commissionAmountPKR: 35200,
    status: "APPROVED_PAYABLE",
    payoutDate: "2026-09-28",
    branch: "Gujranwala Branch"
  }
];

export const initialTasks = [
  {
    id: "TSK-201",
    title: "Call Chaudhry Kamran for final PKR 185k installment payment",
    customerName: "Chaudhry Kamran Akram",
    phone: "+923004455667",
    category: "Payment Follow-up",
    dueDate: "Today, 11:30 AM",
    priority: "HIGH",
    status: "PENDING",
    assignedTo: "Usman Ali",
    branchId: "b-lhr",
    relatedRef: "BKG-501"
  },
  {
    id: "TSK-202",
    title: "Verify Daniyal Kamran Nadra B-Form child translation with embassy specs",
    customerName: "Daniyal Kamran",
    phone: "+923004455667",
    category: "Document Verification",
    dueDate: "Today, 02:00 PM",
    priority: "URGENT",
    status: "PENDING",
    assignedTo: "Ayesha Khan",
    branchId: "b-lhr",
    relatedRef: "VISA-401"
  },
  {
    id: "TSK-203",
    title: "Follow up with Dr. Samina Pervez regarding UK Visitor Visa appointment slot",
    customerName: "Dr. Samina Pervez",
    phone: "+923334218900",
    category: "Visa Consultation",
    dueDate: "Today, 04:30 PM",
    priority: "MEDIUM",
    status: "PENDING",
    assignedTo: "Ayesha Khan",
    branchId: "b-isb",
    relatedRef: "VISA-402"
  },
  {
    id: "TSK-204",
    title: "Request revised quad room rates from Al-Haramain DMC for Haji Rasheed",
    customerName: "Haji M. Rasheed",
    phone: "+923218765432",
    category: "Supplier Coordination",
    dueDate: "Yesterday (Overdue)",
    priority: "URGENT",
    status: "OVERDUE",
    assignedTo: "Hamza Tariq",
    branchId: "b-grw",
    relatedRef: "LEAD-1003"
  },
  {
    id: "TSK-205",
    title: "Confirm Swissôtel Makkah breakfast voucher codes with DMC",
    customerName: "Haji M. Rasheed",
    phone: "+923218765432",
    category: "Voucher Issuance",
    dueDate: "2026-09-20",
    priority: "MEDIUM",
    status: "COMPLETED",
    assignedTo: "Fatima Noor",
    branchId: "b-khi",
    relatedRef: "BKG-502"
  }
];

export const initialAuditLogs = [
  {
    id: "LOG-9001",
    timestamp: "2026-09-23 18:42:10",
    actor: "Usman Ali",
    role: "ACCOUNTANT",
    action: "PAYMENT_RECORDED",
    target: "SFD-REC-2026-0428",
    details: "Recorded PKR 2,150,000 full payment deposit for Haji M. Rasheed via MCB Pay Order.",
    branch: "Lahore HQ",
    ip: "182.185.142.10"
  },
  {
    id: "LOG-9002",
    timestamp: "2026-09-23 16:15:02",
    actor: "Ayesha Khan",
    role: "VISA_OFFICER",
    action: "DOCUMENT_VERIFIED",
    target: "DOC-103",
    details: "Marked Bank_Statement_Shaukat_Khanum_Dr_Samina.pdf as VERIFIED with stamp check.",
    branch: "Islamabad Branch",
    ip: "119.160.119.4"
  },
  {
    id: "LOG-9003",
    timestamp: "2026-09-23 14:05:44",
    actor: "Hamza Tariq",
    role: "TRAVEL_CONSULTANT",
    action: "QUOTATION_UPDATED",
    target: "QT-2026-089",
    details: "Added 4x Desert Safari VIP tickets to Chaudhry Kamran quotation. Total updated to PKR 1,160,000.",
    branch: "Lahore HQ",
    ip: "182.185.142.12"
  },
  {
    id: "LOG-9004",
    timestamp: "2026-09-23 11:30:19",
    actor: "Bilal Ahmed",
    role: "AGENCY_OWNER",
    action: "BRANCH_CONFIG_UPDATED",
    target: "b-grw",
    details: "Assigned Rana M. Ashraf as Branch Manager for Gujranwala Model Town office.",
    branch: "Lahore HQ",
    ip: "182.185.142.1"
  },
  {
    id: "LOG-9005",
    timestamp: "2026-09-22 09:20:00",
    actor: "Fatima Noor",
    role: "OPERATIONS_STAFF",
    action: "TICKET_ISSUED",
    target: "BKG-501",
    details: "Entered confirmed Emirates PNR EK-8942-LHR and attached e-ticket PDF to traveller vault.",
    branch: "Karachi Branch",
    ip: "202.163.72.88"
  }
];

export const initialOrganizations = [
  {
    id: "org-1",
    name: "SafarDesk Global Travel & Visa",
    slug: "safardesk-global",
    ownerName: "Bilal Ahmed",
    email: "bilal@safardesk.com",
    phone: "+92 300 8472910",
    headquarters: "Lahore, Punjab",
    plan: "AGENCY_PRO",
    status: "ACTIVE",
    branchesCount: 4,
    usersCount: 9,
    activeCasesCount: 62,
    mrrPKR: 85000,
    renewalDate: "2026-10-15",
    storageUsedMB: 4200,
    dtsLicense: "DTS-LHR-4921",
    createdDate: "2025-11-10"
  },
  {
    id: "org-2",
    name: "Karakoram Express Travel & Tours",
    slug: "karakoram-express",
    ownerName: "Junaid Abbasi",
    email: "junaid@karakoramexpress.pk",
    phone: "+92 333 5599100",
    headquarters: "Blue Area, Islamabad",
    plan: "BUSINESS",
    status: "ACTIVE",
    branchesCount: 2,
    usersCount: 6,
    activeCasesCount: 38,
    mrrPKR: 42000,
    renewalDate: "2026-10-02",
    storageUsedMB: 2850,
    dtsLicense: "DTS-ISB-2109",
    createdDate: "2026-01-14"
  },
  {
    id: "org-3",
    name: "Indus Horizon Travels & Hajj",
    slug: "indus-horizon",
    ownerName: "Tariq Siddiqui",
    email: "tariq@indushorizon.com",
    phone: "+92 321 8299400",
    headquarters: "Clifton, Karachi",
    plan: "STARTER",
    status: "ACTIVE",
    branchesCount: 1,
    usersCount: 3,
    activeCasesCount: 19,
    mrrPKR: 18000,
    renewalDate: "2026-09-30",
    storageUsedMB: 980,
    dtsLicense: "DTS-KHI-3391",
    createdDate: "2026-04-20"
  },
  {
    id: "org-4",
    name: "Al-Buraq Executive Umrah Services",
    slug: "alburaq-umrah",
    ownerName: "Hafiz Noman Ch.",
    email: "noman@alburaqumrah.com",
    phone: "+92 345 6112233",
    headquarters: "Jaranwala Rd, Faisalabad",
    plan: "BUSINESS",
    status: "SUSPENDED",
    branchesCount: 2,
    usersCount: 5,
    activeCasesCount: 12,
    mrrPKR: 42000,
    renewalDate: "2026-09-10 (Past Due)",
    storageUsedMB: 1600,
    dtsLicense: "DTS-FSD-1092",
    createdDate: "2026-02-01"
  }
];

export const initialTravelCases = [
  {
    id: "TRV-2026-00125",
    title: "Chaudhry Kamran & Family — Dubai 5-Day Luxury Holiday",
    customerId: "CUST-301",
    customerName: "Chaudhry Kamran Akram",
    phone: "+923004455667",
    email: "kamran.akram@interloop.com.pk",
    destination: "Dubai, UAE",
    branchId: "b-lhr",
    assignedConsultant: "Hamza Tariq",
    visaOfficer: "Ayesha Khan",
    operationsStaff: "Fatima Noor",
    status: "BOOKED_PROCESSING",
    stageIndex: 4, // 0: Lead, 1: Quote, 2: Docs, 3: Visa, 4: Booking, 5: Travel, 6: Completed
    travellers: [
      { name: "Chaudhry Kamran Akram", age: 44, type: "Adult (Primary)", passport: "AL391043", expiry: "2029-08-14" },
      { name: "Noreen Kamran", age: 39, type: "Adult (Spouse)", passport: "AL992019", expiry: "2028-11-20" },
      { name: "Daniyal Kamran", age: 11, type: "Child", passport: "BM102941", expiry: "2026-10-21 (Expiring Soon!)" },
      { name: "Zoya Kamran", age: 7, type: "Child", passport: "BM449201", expiry: "2030-02-15" }
    ],
    visa: {
      caseId: "VISA-401",
      destination: "Dubai, UAE",
      type: "30-Day Tourist Multiple Entry",
      referenceNumber: "UAE-DXB-991204",
      status: "PROCESSING",
      submissionDate: "2026-09-22",
      targetApproval: "2026-09-25",
      checklistsCompleted: 4,
      checklistsTotal: 5
    },
    documents: [
      { name: "Passport_Kamran_Akram.pdf", type: "Passport", status: "VERIFIED" },
      { name: "Passport_Noreen_Kamran.pdf", type: "Passport", status: "VERIFIED" },
      { name: "Child_Daniyal_BForm.jpg", type: "CNIC / B-Form", status: "UNDER_REVIEW" },
      { name: "Emirates_Ticket_Confirmed.pdf", type: "Flight Ticket", status: "VERIFIED" }
    ],
    quote: {
      quoteId: "QT-2026-089",
      totalAmountPKR: 1160000,
      supplierCostPKR: 995000,
      grossProfitPKR: 165000,
      marginPct: "14.2%"
    },
    booking: {
      bookingId: "BKG-501",
      bookingCode: "SFD-BKG-501",
      airline: "Emirates Airlines",
      pnr: "EK-8942-LHR",
      travelDates: "Oct 15, 2026 - Oct 20, 2026",
      hotel: "Millennium Plaza Downtown Dubai (4 Nights)",
      transfer: "Private GMC Yukon Airport & Desert Safari"
    },
    payment: {
      totalPKR: 1160000,
      paidPKR: 975000,
      balancePKR: 185000,
      status: "PARTIALLY_PAID",
      lastReceipt: "SFD-REC-2026-0419"
    },
    nextTask: {
      id: "TSK-201",
      title: "Call Chaudhry Kamran for final PKR 185k installment payment",
      due: "Today, 11:30 AM",
      priority: "HIGH"
    },
    timeline: [
      { time: "2026-09-20 10:15 AM", text: "Lead generated via WhatsApp. Assigned to Hamza Tariq." },
      { time: "2026-09-20 02:30 PM", text: "Custom Quotation QT-2026-089 generated & sent to client." },
      { time: "2026-09-21 11:00 AM", text: "Client accepted quotation. Advance PKR 580,000 received via Meezan Raast." },
      { time: "2026-09-21 04:00 PM", text: "Booking BKG-501 created. Emirates flight PNR EK-8942-LHR ticketed." },
      { time: "2026-09-22 09:30 AM", text: "Second installment PKR 395,000 verified by Accountant Usman Ali." },
      { time: "2026-09-22 03:45 PM", text: "Visa case VISA-401 submitted to GDRFA immigration by Visa Officer Ayesha Khan." }
    ]
  },
  {
    id: "TRV-2026-00126",
    title: "Haji M. Rasheed & Family — 15-Day Executive Umrah",
    customerId: "CUST-302",
    customerName: "Haji M. Rasheed",
    phone: "+923218765432",
    email: "rasheed.textiles@gmail.com",
    destination: "Saudi Arabia (Makkah & Madinah)",
    branchId: "b-grw",
    assignedConsultant: "Hamza Tariq",
    visaOfficer: "Ayesha Khan",
    operationsStaff: "Fatima Noor",
    status: "VISA_APPLIED",
    stageIndex: 3,
    travellers: [
      { name: "Haji M. Rasheed", age: 58, type: "Adult (Primary)", passport: "PK994012", expiry: "2031-04-10" },
      { name: "Begum Rasheed", age: 52, type: "Adult", passport: "PK994013", expiry: "2031-04-10" },
      { name: "Muhammad Usman Rasheed", age: 26, type: "Adult", passport: "PK881920", expiry: "2029-01-19" },
      { name: "Hafiz Bilal Rasheed", age: 22, type: "Adult", passport: "PK771924", expiry: "2029-07-22" }
    ],
    visa: {
      caseId: "VISA-403",
      destination: "Saudi Arabia",
      type: "Umrah e-Visa (Nusuk Platform)",
      referenceNumber: "KSA-UMR-881902",
      status: "SUBMITTED",
      submissionDate: "2026-09-22",
      targetApproval: "2026-09-24",
      checklistsCompleted: 4,
      checklistsTotal: 4
    },
    documents: [
      { name: "Passports_Rasheed_Group.pdf", type: "Passport", status: "VERIFIED" },
      { name: "Polio_Meningitis_Vaccine_Certs.pdf", type: "Health Cert", status: "VERIFIED" }
    ],
    quote: {
      quoteId: "QT-2026-091",
      totalAmountPKR: 2150000,
      supplierCostPKR: 1840000,
      grossProfitPKR: 310000,
      marginPct: "14.4%"
    },
    booking: {
      bookingId: "BKG-502",
      bookingCode: "SFD-BKG-502",
      airline: "Saudia Direct (SV 739)",
      pnr: "SV-4421-JED",
      travelDates: "Oct 02, 2026 - Oct 17, 2026",
      hotel: "Swissôtel Al Maqam Makkah + Pullman Zamzam Madinah",
      transfer: "Private Luxury VIP Bus Transfer"
    },
    payment: {
      totalPKR: 2150000,
      paidPKR: 2150000,
      balancePKR: 0,
      status: "FULLY_PAID",
      lastReceipt: "SFD-REC-2026-0428"
    },
    nextTask: {
      id: "TSK-205",
      title: "Confirm Swissôtel Makkah breakfast voucher codes with DMC",
      due: "2026-09-20",
      priority: "MEDIUM"
    },
    timeline: [
      { time: "2026-09-21 09:00 AM", text: "Walk-in enquiry at Gujranwala branch." },
      { time: "2026-09-21 02:00 PM", text: "Full settlement PKR 2,150,000 received via MCB Pay Order." },
      { time: "2026-09-22 10:00 AM", text: "Umrah visa applications lodged on Nusuk portal." }
    ]
  },
  {
    id: "TRV-2026-00127",
    title: "Dr. Samina Pervez — UK Standard Visitor & NHS Conference",
    customerId: "CUST-303",
    customerName: "Dr. Samina Pervez",
    phone: "+923334218900",
    email: "samina.p@shaukatkhanum.org.pk",
    destination: "United Kingdom",
    branchId: "b-isb",
    assignedConsultant: "Ayesha Khan",
    visaOfficer: "Ayesha Khan",
    operationsStaff: "Hamza Tariq",
    status: "DOCUMENTS_AUDIT",
    stageIndex: 2,
    travellers: [
      { name: "Dr. Samina Pervez", age: 38, type: "Solo Traveller", passport: "PK551280", expiry: "2032-11-09" }
    ],
    visa: {
      caseId: "VISA-402",
      destination: "United Kingdom",
      type: "Standard Visitor 6-Month Visa",
      referenceNumber: "UKVI-GWF-9912048",
      status: "UNDER_REVIEW",
      submissionDate: "Pending Appointment",
      targetApproval: "Oct 10, 2026",
      checklistsCompleted: 4,
      checklistsTotal: 6
    },
    documents: [
      { name: "Bank_Statement_Shaukat_Khanum.pdf", type: "Bank Statement", status: "VERIFIED" },
      { name: "NHS_Conference_Invitation_Letter.pdf", type: "Conference Invite", status: "VERIFIED" },
      { name: "Hospital_NOC_Leave_Approval.pdf", type: "Employment / NOC", status: "UNDER_REVIEW" }
    ],
    quote: {
      quoteId: "QT-2026-093",
      totalAmountPKR: 620000,
      supplierCostPKR: 520000,
      grossProfitPKR: 100000,
      marginPct: "16.1%"
    },
    booking: null,
    payment: {
      totalPKR: 620000,
      paidPKR: 120000,
      balancePKR: 500000,
      status: "ADVANCE_RECEIVED",
      lastReceipt: "SFD-REC-2026-0435"
    },
    nextTask: {
      id: "TSK-203",
      title: "Follow up with Dr. Samina regarding UK Visitor Visa appointment slot",
      due: "Today, 04:30 PM",
      priority: "MEDIUM"
    },
    timeline: [
      { time: "2026-09-21 11:30 AM", text: "Referral enquiry received for UK conference." },
      { time: "2026-09-22 03:00 PM", text: "Advance consultation & Gerry's appointment fee PKR 120,000 paid." }
    ]
  }
];

export const initialSubAgentCases = [
  {
    id: "SUB-CASE-101",
    subAgentId: "sub-faisalabad",
    subAgentName: "Al-Makkah Sub-Agency Faisalabad",
    customerName: "Malik Shahbaz & Group",
    destination: "Baku, Azerbaijan",
    pax: 6,
    salesPKR: 880000,
    commissionPKR: 35200,
    status: "PROCESSING",
    submissionDate: "2026-09-21",
    payoutStatus: "APPROVED_PAYABLE"
  },
  {
    id: "SUB-CASE-102",
    subAgentId: "sub-sialkot",
    subAgentName: "Chenab Travel Partners Sialkot",
    customerName: "Imran Sial & Spouse",
    destination: "Dubai, UAE",
    pax: 2,
    salesPKR: 440000,
    commissionPKR: 17600,
    status: "CONFIRMED",
    submissionDate: "2026-09-18",
    payoutStatus: "PAID"
  }
];

export const initialWhatsAppTemplates = [
  {
    id: "tpl-1",
    code: "LEAD_WELCOME",
    title: "New Lead Enquiry Welcome (Roman Urdu & English)",
    category: "CRM & Sales",
    template: `Assalam-o-Alaikum *{customerName}*,\n\nThank you for reaching out to *SafarDesk Global Travel*! 🌍✈️\n\nWe have received your enquiry for *{destination}* (Pax: *{pax}*).\nOur senior travel consultant, *{consultantName}*, is preparing the best flight itinerary, visa checklist, and hotel options suited to your budget.\n\nCould you please let us know your preferred travel dates so we can finalize the quotation?\n\nJazakAllah Khair,\n*SafarDesk Travel Operations*\n📞 {agencyPhone}`
  },
  {
    id: "tpl-2",
    code: "QUOTE_DELIVERY",
    title: "Official Quotation & Pricing Summary",
    category: "Quotations",
    template: `Assalam-o-Alaikum *{customerName}*,\n\nYour customized quotation for *{destination}* is ready! 📋\n\n🔹 *Quote Ref:* {quoteRef}\n🔹 *Package:* {services}\n🔹 *Total Amount:* PKR *{totalAmount}*\n🔹 *Validity:* 48 Hours\n\n✨ *Key Inclusions:*\n- Direct Flight Options\n- Visa processing assistance\n- Verified 4/5-Star Hotel Booking\n- Airport Transfers\n\nClick here to view your full official quotation PDF:\n🔗 https://safardesk.com/quote/{quoteRef}\n\nPlease let us know if you would like to proceed with seat booking.\n\nBest Regards,\n*{consultantName}* | SafarDesk`
  },
  {
    id: "tpl-3",
    code: "VISA_CHECKLIST",
    title: "Missing Visa Documents Checklist Request",
    category: "Visa & Vault",
    template: `Important: Visa Documentation for *{customerName}*\n*Case Ref:* {caseRef} | *Destination:* {destination} 🛂\n\nTo submit your visa file to the embassy on time, we kindly request the following pending documents:\n\n{missingDocsList}\n\n⚠️ *Note:* Passports must have at least 6 months validity from travel date.\n\nYou can upload documents directly to your secure client vault here:\n🔗 https://safardesk.com/vault/{caseRef}\n\nOr simply reply with clear scanned PDFs on this WhatsApp chat.\n\nRegards,\n*Visa Department | SafarDesk*`
  },
  {
    id: "tpl-4",
    code: "VISA_APPROVED",
    title: "Visa Approval & Collection Alert 🎉",
    category: "Visa & Vault",
    template: `Mubarak! 🎉 Your *{destination}* Visa is APPROVED!\n\nDear *{customerName}*,\n\nWe are pleased to inform you that your visa application has been granted by the immigration authorities.\n\n🔹 *Applicant:* {travellerName}\n🔹 *Visa Ref:* {visaRef}\n🔹 *Validity:* {validity}\n\nYour official visa grant letter is attached. You may also collect your original stamped passport from our *{branchName}* office during business hours (10:00 AM - 7:00 PM).\n\nHave a blessed and safe journey!\n*SafarDesk Global Travel*`
  },
  {
    id: "tpl-5",
    code: "PAYMENT_RECEIPT",
    title: "Payment Confirmation & Raast Receipt",
    category: "Finance",
    template: `Payment Acknowledgment: SafarDesk Travel 💳\n\nDear *{customerName}*,\n\nWe gratefully acknowledge receipt of your payment:\n\n🔹 *Receipt No:* {receiptNo}\n🔹 *Amount Received:* PKR *{amount}*\n🔹 *Method:* {paymentMethod}\n🔹 *Ref/TXN:* {reference}\n🔹 *Balance Remaining:* PKR *{balanceRemaining}*\n\nYour official payment receipt can be downloaded here:\n🔗 https://safardesk.com/receipt/{receiptNo}\n\nThank you for choosing SafarDesk!\n*Finance Department | SafarDesk*`
  },
  {
    id: "tpl-6",
    code: "DEPARTURE_REMINDER",
    title: "Pre-Departure Reminder & Airport Flight Guide",
    category: "Operations",
    template: `Safe Travels! ✈️ Upcoming Flight to *{destination}*\n\nDear *{customerName}*,\n\nYour flight departs on *{travelDate}*! Here is your pre-flight summary:\n\n🛫 *Flight:* {airline} ({pnr})\n🕒 *Reporting Time:* 4 Hours prior to departure (International Flights)\n🧳 *Baggage Allowance:* 30kg Checked + 7kg Hand Carry per pax\n📄 *Mandatory Checklist:*\n- Original Passport with valid visa\n- Printed e-ticket & hotel vouchers\n- Nadra CNIC / NICOP\n\nFor 24/7 airport emergency assistance, call our helpline: *{emergencyPhone}*.\n\n*Wishing you a wonderful journey! SafarDesk Team*`
  }
];



// ---------------------------------------------------------------------------
// PLATFORM LAYER (Super Admin / SaaS Owner)
// Configuration the Super Admin controls + telemetry used to monitor every
// plan buyer and every role. Additive seed data � existing exports above are
// untouched. See README �19.
// ---------------------------------------------------------------------------

export const initialPlatformConfigRules = [
  {
    id: "rule-plan-seats",
    scope: "PLAN",
    domain: "Subscription Plan Catalog",
    title: "Seat quota per plan",
    description: "Maximum users a tenant may invite. New seats above the quota are rejected.",
    value: "Starter 4 � Business 10 � Enterprise Pro 25",
    mode: "HARD_BLOCK",
    applies: "4 tenants"
  },
  {
    id: "rule-plan-branches",
    scope: "PLAN",
    domain: "Subscription Plan Catalog",
    title: "Branch quota per plan",
    description: "Maximum branches a tenant may provision.",
    value: "Starter 1 � Business 3 � Enterprise Pro 10",
    mode: "HARD_BLOCK",
    applies: "4 tenants"
  },
  {
    id: "rule-plan-storage",
    scope: "PLAN",
    domain: "Subscription Plan Catalog",
    title: "Vault storage quota",
    description: "Document vault ceiling per tenant. Uploads beyond quota are rejected.",
    value: "Starter 5 GB � Business 20 GB � Enterprise Pro 100 GB",
    mode: "HARD_BLOCK",
    applies: "4 tenants"
  },
  {
    id: "rule-plan-renewal",
    scope: "PLAN",
    domain: "Subscription Plan Catalog",
    title: "Renewal grace window",
    description: "Days a past-due tenant keeps read-only access before suspension.",
    value: "7 days grace, then automatic suspension",
    mode: "SOFT_WARN",
    applies: "4 tenants"
  },
  {
    id: "rule-org-suspension",
    scope: "ORGANIZATION",
    domain: "Organization Policy",
    title: "Suspended tenant lock",
    description: "A suspended organization loses all write access platform-wide.",
    value: "All writes blocked while status = SUSPENDED",
    mode: "HARD_BLOCK",
    applies: "4 tenants"
  },
  {
    id: "rule-org-dts",
    scope: "ORGANIZATION",
    domain: "Organization Policy",
    title: "DTS accreditation required",
    description: "Every agency tenant must carry a valid DTS licence on file.",
    value: "Mandatory before first provisioning",
    mode: "SOFT_WARN",
    applies: "4 tenants"
  },
  {
    id: "rule-org-defaults",
    scope: "ORGANIZATION",
    domain: "Organization Policy",
    title: "Platform currency & timezone defaults",
    description: "Tenants inherit PKR / Asia-Karachi unless the platform config changes it.",
    value: "PKR � Asia/Karachi � tenant override rejected",
    mode: "HARD_BLOCK",
    applies: "4 tenants"
  },
  {
    id: "rule-user-seat",
    scope: "USER",
    domain: "User & Seat Policy",
    title: "Seat cap equals plan seats",
    description: "User creation and invitations stop at the plan seat limit.",
    value: "Enforced on invite + register",
    mode: "HARD_BLOCK",
    applies: "23 users"
  },
  {
    id: "rule-user-mfa",
    scope: "USER",
    domain: "User & Seat Policy",
    title: "MFA for owner & finance roles",
    description: "Agency owners and accountants must complete second-factor sign-in.",
    value: "AGENCY_OWNER � ACCOUNTANT � SUPER_ADMIN",
    mode: "HARD_BLOCK",
    applies: "23 users"
  },
  {
    id: "rule-user-session",
    scope: "USER",
    domain: "User & Seat Policy",
    title: "Session TTL",
    description: "Platform session lifetime; expired tokens are rejected automatically.",
    value: "12 hours idle � 7 days absolute",
    mode: "HARD_BLOCK",
    applies: "23 users"
  },
  {
    id: "rule-user-password",
    scope: "USER",
    domain: "User & Seat Policy",
    title: "Password policy",
    description: "Minimum length and complexity for every role in every tenant.",
    value: "12 chars � upper + lower + number",
    mode: "HARD_BLOCK",
    applies: "23 users"
  },
  {
    id: "rule-branch-cap",
    scope: "BRANCH",
    domain: "Branch Policy",
    title: "Branch cap equals plan branches",
    description: "Creating a branch beyond the plan quota is rejected by the system.",
    value: "Checked on branch create",
    mode: "HARD_BLOCK",
    applies: "9 branches"
  },
  {
    id: "rule-branch-manager",
    scope: "BRANCH",
    domain: "Branch Policy",
    title: "Branch manager assignment",
    description: "Every branch must have an assigned manager before it accepts work.",
    value: "Manager required within 48h of creation",
    mode: "SOFT_WARN",
    applies: "9 branches"
  },
  {
    id: "rule-role-catalog",
    scope: "ROLE",
    domain: "Role & Permission Policy",
    title: "Fixed platform role catalog",
    description: "Tenants may only assign roles defined by the platform � no custom shadow roles.",
    value: "10 roles � SUPER_ADMIN � CUSTOMER",
    mode: "HARD_BLOCK",
    applies: "10 roles"
  },
  {
    id: "rule-role-modules",
    scope: "ROLE",
    domain: "Role & Permission Policy",
    title: "Module access matrix",
    description: "Each role sees only the modules README �15 allows, in every tenant.",
    value: "Dashboard � CRM � Visa � Finance � Reports � Settings",
    mode: "HARD_BLOCK",
    applies: "10 roles"
  },
  {
    id: "rule-role-finance",
    scope: "ROLE",
    domain: "Role & Permission Policy",
    title: "Finance write lock",
    description: "finance.write stays with ACCOUNTANT / AGENCY_OWNER / SUPER_ADMIN only.",
    value: "3 of 10 roles hold finance.write",
    mode: "HARD_BLOCK",
    applies: "10 roles"
  },
  {
    id: "rule-role-platform",
    scope: "ROLE",
    domain: "Role & Permission Policy",
    title: "Platform admin isolation",
    description: "platform.admin exists for SUPER_ADMIN only and cannot be granted inside a tenant.",
    value: "1 of 10 roles holds platform.admin",
    mode: "HARD_BLOCK",
    applies: "1 role"
  },
  {
    id: "rule-flags-entitlement",
    scope: "FEATURE",
    domain: "Feature Flags",
    title: "Plan feature entitlement",
    description: "Modules outside the buyer's plan stay locked regardless of tenant settings.",
    value: "Flag checked on every module request",
    mode: "HARD_BLOCK",
    applies: "4 tenants"
  }
];

export const initialFeatureFlags = [
  { id: "flag-whatsapp", label: "WhatsApp communication hub", description: "Broadcast + agency support inbox", plans: ["STARTER", "BUSINESS", "AGENCY_PRO"], enabled: true },
  { id: "flag-advanced-reports", label: "Advanced analytics & reports", description: "Finance, branch and consultant performance", plans: ["BUSINESS", "AGENCY_PRO"], enabled: true },
  { id: "flag-api-access", label: "Public API & webhooks", description: "Outbound integrations for GDS and CRM", plans: ["AGENCY_PRO"], enabled: true },
  { id: "flag-audit-export", label: "Audit log export (CSV)", description: "Platform audit stream export", plans: ["AGENCY_PRO"], enabled: true },
  { id: "flag-multi-branch", label: "Multi-branch workspace", description: "Branch switching and branch-scoped RBAC", plans: ["BUSINESS", "AGENCY_PRO"], enabled: true },
  { id: "flag-sandbox", label: "Sandbox / trial mode", description: "Full-feature evaluation tenant for prospects", plans: ["STARTER", "BUSINESS", "AGENCY_PRO"], enabled: false }
];

export const initialRoleActivity = [
  { role: "AGENCY_OWNER", label: "Agency Owner", users: 4, tenants: 4, actions30d: 386, logins30d: 148, denied30d: 0, topAction: "BRANCH_CONFIG_UPDATED", modules: "Dashboard � Finance � Settings", trend: "STABLE" },
  { role: "AGENCY_MANAGER", label: "Agency Manager", users: 3, tenants: 3, actions30d: 512, logins30d: 176, denied30d: 1, topAction: "TEAM_TASK_ASSIGNED", modules: "CRM � Tasks � Reports", trend: "UP" },
  { role: "TRAVEL_CONSULTANT", label: "Travel Consultant", users: 6, tenants: 4, actions30d: 1472, logins30d: 402, denied30d: 4, topAction: "QUOTATION_UPDATED", modules: "Leads � Quotations � Bookings", trend: "UP" },
  { role: "VISA_OFFICER", label: "Visa Officer", users: 4, tenants: 4, actions30d: 928, logins30d: 268, denied30d: 2, topAction: "DOCUMENT_VERIFIED", modules: "Visa � Document Vault", trend: "UP" },
  { role: "ACCOUNTANT", label: "Accountant", users: 3, tenants: 3, actions30d: 604, logins30d: 132, denied30d: 0, topAction: "PAYMENT_RECORDED", modules: "Finance � Suppliers", trend: "STABLE" },
  { role: "OPERATIONS_STAFF", label: "Operations Staff", users: 4, tenants: 4, actions30d: 738, logins30d: 214, denied30d: 3, topAction: "TICKET_ISSUED", modules: "Bookings � Packages � Vault", trend: "STABLE" },
  { role: "BRANCH_MANAGER", label: "Branch Manager", users: 3, tenants: 2, actions30d: 421, logins30d: 118, denied30d: 1, topAction: "BRANCH_REPORT_VIEWED", modules: "Dashboard � CRM � Reports", trend: "STABLE" },
  { role: "SUB_AGENT", label: "Sub-Agent", users: 0, tenants: 0, actions30d: 0, logins30d: 0, denied30d: 0, topAction: "�", modules: "Packages � Portal", trend: "QUIET" },
  { role: "CUSTOMER", label: "Customer", users: 3, tenants: 4, actions30d: 214, logins30d: 96, denied30d: 1, topAction: "DOCUMENT_DOWNLOADED", modules: "Own portal only", trend: "UP" },
  { role: "SUPER_ADMIN", label: "Super Admin", users: 2, tenants: 1, actions30d: 146, logins30d: 62, denied30d: 0, topAction: "PLATFORM_CONFIG_UPDATED", modules: "Platform Console", trend: "STABLE" }
];

export const initialBuyerActivity = {
  "org-1": { actions30d: 1284, logins30d: 312, denied30d: 1, lastActive: "2026-09-26 21:14", supportTickets: 1, health: 94, risk: "LOW" },
  "org-2": { actions30d: 946, logins30d: 244, denied30d: 0, lastActive: "2026-09-26 18:02", supportTickets: 0, health: 88, risk: "LOW" },
  "org-3": { actions30d: 402, logins30d: 108, denied30d: 2, lastActive: "2026-09-25 12:47", supportTickets: 0, health: 76, risk: "MEDIUM" },
  "org-4": { actions30d: 118, logins30d: 34, denied30d: 6, lastActive: "2026-09-18 09:31", supportTickets: 2, health: 41, risk: "HIGH" }
};
