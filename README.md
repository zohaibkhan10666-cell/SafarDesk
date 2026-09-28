You are a senior SaaS product architect, UX/UI designer, full-stack engineer, database architect, security engineer, QA engineer and DevOps engineer.

Build a professional, production-ready, scalable and user-friendly multi-tenant SaaS platform for Pakistani travel consultants and visa agencies.

PRODUCT NAME:
Use a professional temporary name such as “SafarDesk” throughout development. Keep branding configurable so the name, logo, colors and company details can be changed later.

PRODUCT CATEGORY:
Pakistan-focused Visa & Outbound Travel Consultant Management SaaS.

CORE PRODUCT PROMISE:
Manage the complete customer journey in one place:

Lead → Enquiry → Customer → Traveller → Documents → Visa Case → Quotation → Booking → Payment → Follow-up → Travel Completion

TARGET MARKET:
Small and medium travel agencies, visa consultants, ticketing agencies, tour operators and outbound travel consultants in Pakistan.

PRIMARY MARKET:
Pakistan.

UI LANGUAGE:
English for the initial release, but structure the application for future Urdu localization.

CURRENCY:
PKR as the default currency, with support for USD, SAR, AED, GBP, EUR and configurable currencies.

TIMEZONE:
Asia/Karachi by default.

IMPORTANT PRODUCT PRINCIPLE:
Do not build this as a generic ERP.
Build it as a focused travel-consultancy operating system centered around:

1. Leads and enquiries
2. WhatsApp-centric communication
3. Visa case management
4. Traveller documents
5. Quotations
6. Booking records
7. Payments and installments
8. Follow-ups
9. Supplier and commission tracking
10. Branch/team management

Do not initially attempt to become an airline or hotel marketplace.
External flight/hotel bookings must be recordable manually.
Design the architecture so official APIs/GDS integrations can be added later.

==================================================

1. MULTI-TENANT SAAS ARCHITECTURE
   ==================================================

Build the system as a true multi-tenant SaaS.

Each agency is a tenant/organization.

Every tenant must have isolated:

* users
* leads
* customers
* travellers
* visa cases
* documents
* quotations
* bookings
* suppliers
* payments
* expenses
* commissions
* branches
* settings
* reports

A user must NEVER be able to access data belonging to another organization.

Implement:

* organization ID on tenant-owned records
* role-based access control
* server-side authorization
* database-level protection where appropriate
* secure API authorization
* tenant-aware queries
* audit logging

Support:

* one agency
* multiple branches
* multiple users
* multiple roles

Design the database and API for horizontal scalability.

==================================================
2. USER ROLES
=============

Implement these roles:

SUPER ADMIN
Platform owner/admin.

AGENCY OWNER
Full access to one organization.

AGENCY MANAGER
Operational and team management access.

TRAVEL CONSULTANT / SALES AGENT
Leads, customers, quotations, follow-ups and bookings assigned to the user.

VISA OFFICER
Visa cases, documents, application status and related customer information.

ACCOUNTANT
Payments, expenses, supplier balances, commissions and finance reports.

OPERATIONS STAFF
Bookings, document verification, trip operations and task management.

BRANCH MANAGER
Access restricted to assigned branch.

SUB-AGENT
Restricted customer and booking workflow access.

Build granular permissions rather than relying only on role names.

==================================================
3. AUTHENTICATION & ONBOARDING
==============================

Create professional authentication:

* Sign up
* Sign in
* Forgot password
* Reset password
* Email verification
* Optional phone verification
* Organization creation
* Invite team members
* Role assignment
* Branch assignment
* Profile management
* Session management
* Secure logout

Agency onboarding wizard:

Step 1:
Agency name

Step 2:
Agency logo

Step 3:
Office/contact information

Step 4:
Default currency

Step 5:
Default timezone

Step 6:
Create first branch

Step 7:
Invite employees

Step 8:
Choose subscription plan

Step 9:
Import existing customer data

Make onboarding simple and visually polished.

**As built — sign-up is gated by Super Admin approval:**

* The public site's sign-up form collects owner name, agency, email, password (12+ chars) **and the subscription plan**; the onboarding wizard is the compact 2-step version (agency details → contact details → plan) so the first screen is reachable in one click.
* `POST /auth/register` creates the organization with status **`PENDING`** and returns `201 { pendingApproval:true, ruleId:'rule-org-approval', … }` **without a token**. The UI switches to a *Workspace pending approval* screen (what happens next, the chosen plan, the sign-in shortcut).
* Nobody can sign in until a Super Admin presses **Approve & activate** in the Platform Console: `POST /auth/login` then answers `403 rule-org-approval` with the org status until the org is `ACTIVE`, after which the owner signs in normally and lands on the dashboard.
* A live session is re-checked on every `/auth/me` call, so suspending (or un-approving) a workspace revokes access immediately.
* After sign-in the app loads the tenant's entitlements and shows only the modules that survive **role ∩ plan** — see §19.7 of the platform section.

==================================================
4. MAIN DASHBOARD
=================

Create an executive dashboard.

Show:

* New leads today
* Total active leads
* Quotes pending response
* Confirmed bookings
* Visa applications in progress
* Documents pending
* Payments due
* Overdue payments
* Follow-ups due today
* Upcoming departures
* Monthly revenue
* Monthly profit/margin
* Outstanding customer balance
* Supplier payable balance

Add quick actions:

* New Lead
* New Customer
* New Visa Case
* New Quotation
* New Booking
* Record Payment
* Add Follow-up

Dashboard must support:

* date filtering
* branch filtering
* consultant filtering
* destination filtering

Use useful charts but avoid decorative charts.

==================================================
5. LEAD & CRM MODULE
====================

This is one of the most important modules.

Lead sources:

* WhatsApp
* Phone Call
* Website
* Facebook
* Instagram
* Walk-in
* Referral
* Existing Customer
* Sub-agent
* Other

Lead fields:

* Lead ID
* Name
* Phone
* WhatsApp number
* Email
* City
* Source
* Destination
* Travel purpose
* Number of travellers
* Travel date
* Budget
* Required services
* Assigned consultant
* Branch
* Priority
* Tags
* Notes
* Next follow-up
* Created date
* Lead status

Lead pipeline:

New
→ Contacted
→ Qualified
→ Quote Preparing
→ Quote Sent
→ Follow-up
→ Negotiation
→ Confirmed
→ Lost
→ Completed

Build both:

* Kanban view
* Table view

Provide:

* search
* filters
* sorting
* bulk actions
* export
* assignment
* tags
* notes
* activities
* reminders

**As built — a won lead becomes a customer automatically:**

* The moment a lead's status becomes **Confirmed / Won**, the API upserts a customer record in the same tenant with `id = CUST-<leadId>` carrying the lead's name, phone, WhatsApp, email, city, destination, source, priority, budget and travellers, typed `customerType: "Won Lead"`.
* Conversion runs on lead **create**, **update** and **bulk replace**, and is idempotent — the deterministic id means replaying the same won lead never creates a duplicate.
* The lead is back-linked (`lead.customerId`) and every conversion is audited (`RECORD_CREATED`), so the CRM keeps a two-way trail.
* `totalBookings`, `lifetimeSpendPKR`, `outstandingBalancePKR`, `travellerCount` and `activeVisaCases` are stored on the record (0 until a booking exists), so the Customers module aggregates without special-casing.
* In the UI: moving a lead to `Confirmed / Won` shows a banner with an **Open customers** link, the lead drawer shows the saved customer card, and the Customers view marks the record `Won`, filters it under **Won from leads**, and shows the source lead id + won date.

==================================================
6. CUSTOMER MANAGEMENT
======================

Create a complete customer profile.

Customer data:

* full name
* phone
* WhatsApp
* email
* CNIC
* city
* address
* customer type
* preferred destinations
* notes
* source
* assigned consultant

Customer profile tabs:

Overview
Travellers
Visa Cases
Quotations
Bookings
Payments
Documents
Activities
Follow-ups
Notes

Show lifetime:

* total bookings
* total spending
* outstanding balance
* number of travellers
* active visa cases
* last contact
* next follow-up

==================================================
7. TRAVELLER / PASSENGER PROFILES
=================================

A customer may have multiple travellers.

Each traveller can contain:

* Full name
* Date of birth
* Gender
* Nationality
* Passport number
* Passport issue date
* Passport expiry date
* CNIC
* Phone
* Relationship
* Emergency contact
* Notes

Passport expiry warnings:

* 180 days
* 90 days
* 30 days

Make the warning thresholds configurable.

Never expose highly sensitive information unnecessarily.

Mask sensitive data where appropriate.

==================================================
8. VISA MANAGEMENT
==================

Create a dedicated visa case system.

Visa case fields:

* Case ID
* Customer
* Traveller(s)
* Destination country
* Visa type
* Travel purpose
* Application date
* Intended travel date
* Assigned visa officer
* Reference/application number
* External provider
* Visa fee
* Service fee
* Total customer price
* Supplier cost
* Expected margin
* Status
* Priority
* Notes

Visa pipeline:

New
→ Documents Required
→ Documents Received
→ Under Review
→ Ready to Submit
→ Submitted
→ Processing
→ Additional Information Required
→ Approved
→ Rejected
→ Cancelled
→ Completed

Allow custom statuses.

Create destination + visa-type templates.

Example:

Dubai Tourist Visa
Required documents:

* Passport
* Photo
* Travel information
* Configurable additional documents

Do not hard-code immigration rules as permanent truth.
Make requirements editable by authorized administrators.

==================================================
9. DOCUMENT MANAGEMENT
======================

Create a secure document vault.

Document categories:

Passport
CNIC
Photograph
Bank Document
Employment Document
Invitation Letter
Hotel Voucher
Flight Ticket
Visa
Insurance
Application Form
Other

Every document should include:

* name
* category
* owner/customer
* traveller
* visa case
* upload date
* uploaded by
* expiry date if applicable
* verification status
* notes

Statuses:
Uploaded
Under Review
Verified
Rejected
Expired

Features:

* drag and drop upload
* image preview
* PDF preview
* download
* replace file
* version history
* secure access
* document expiry reminders

Security requirements:

* private storage
* signed URLs
* controlled download permissions
* no public document URLs
* malware/content validation where practical
* audit log for sensitive document access

==================================================
10. DOCUMENT CHECKLIST
======================

Each visa type should support a checklist.

Example:

Dubai Tourist Visa

[ ] Passport
[ ] Photo
[ ] Travel details
[ ] Required additional document

Automatically calculate:

Documents:
3 / 4 complete
75%

Show missing documents clearly.

Allow staff to mark:

* received
* verified
* rejected
* requires replacement

==================================================
11. QUOTATION BUILDER
=====================

Build a professional quotation builder.

Quotation can contain:

Flight
Visa
Hotel
Transport
Travel Insurance
Tour Package
Guide
Excursions
Service Fee
Other Charges
Discount
Taxes
Markup

Allow:

* manual line items
* quantity
* unit cost
* customer price
* discount
* tax
* margin

Example:

Customer Price:
PKR 385,000

Supplier Cost:
PKR 340,000

Gross Margin:
PKR 45,000

Quotation statuses:

Draft
Sent
Viewed
Accepted
Rejected
Expired

Generate branded PDF quotations.

Quotation must include:

* agency logo
* agency name
* phone
* email
* address
* quotation number
* customer name
* destination
* travel dates
* traveller count
* services
* terms & conditions
* total amount
* validity date
* payment schedule
* notes

Provide:
Download PDF
Preview
Send via email
Send through supported WhatsApp workflow
Duplicate quotation

==================================================
12. PACKAGE BUILDER
===================

Allow agencies to create reusable travel packages.

Example:

Dubai 5 Days

* Round-trip flight
* Visa
* 4-star hotel
* Breakfast
* Airport transfer
* Insurance

Package fields:

* package name
* destination
* duration
* inclusions
* exclusions
* supplier
* base cost
* selling price
* margin
* validity
* images
* description

Package should be reusable in quotations.

==================================================
13. BOOKING MANAGEMENT
======================

Build a booking module.

Booking types:

Flight
Hotel
Transport
Visa
Tour
Insurance
Package
Other

Flight fields:

* airline
* flight number
* route
* departure date/time
* arrival date/time
* PNR
* ticket number
* supplier
* fare
* status

Hotel:

* hotel name
* room type
* check-in
* check-out
* guests
* confirmation number
* supplier
* cost
* selling price

Transport:

* pickup
* dropoff
* vehicle
* driver/provider
* date/time
* cost
* selling price

Allow attachments of:

* ticket PDFs
* hotel vouchers
* confirmation documents

==================================================
14. TRIP / ITINERARY MANAGEMENT
===============================

Every confirmed trip should have a trip workspace.

Trip overview:

Destination
Travel dates
Travellers
Visa status
Flight status
Hotel status
Transport
Payment status
Documents
Itinerary

Create day-by-day itinerary support:

Day 1:
Arrival
Airport transfer
Hotel check-in

Day 2:
City tour

Day 3:
Free day

etc.

Generate customer-friendly itinerary PDF.

==================================================
15. PAYMENT & INSTALLMENT MANAGEMENT
====================================

Create a proper payment module.

Support:

* total booking amount
* advance
* installment
* balance
* payment due date
* payment method
* payment reference
* receipt number
* notes

Payment methods:

Cash
Bank Transfer
Card
Digital Wallet
QR
Other

Payment status:

Paid
Partially Paid
Pending
Overdue
Refunded

Automatically calculate:
Total
Paid
Remaining

Provide payment receipt PDF.

Create overdue alerts.

Do not assume a payment was made just because a screenshot was uploaded.
Payment status must be manually verified or confirmed through an authorized payment integration.

==================================================
16. EXPENSE & PROFIT MANAGEMENT
===============================

Track agency expenses.

Categories:

* supplier payment
* salaries
* rent
* utilities
* marketing
* transport
* refunds
* miscellaneous

For each booking/case calculate:

Customer Revenue

* Supplier Cost
* Other Direct Costs
  = Gross Margin

Show:

* booking profit
* visa-case profit
* consultant performance
* branch performance
* monthly revenue
* monthly expenses
* monthly gross profit

==================================================
17. SUPPLIER MANAGEMENT
=======================

Create supplier profiles.

Supplier fields:

* name
* type
* phone
* email
* address
* payment terms
* currency
* notes

Supplier types:
Airline
Hotel
Visa Provider
Transport
Tour Operator
Insurance
Other

Track:

* purchases
* payable balance
* payments
* booking references
* commission
* notes

==================================================
18. COMMISSION MANAGEMENT
=========================

Support:

Consultant commission
Sub-agent commission
Supplier commission

Commission can be:

* fixed amount
* percentage
* configurable per product/service

Track:

* booking
* employee/sub-agent
* amount
* status
* payable date
* paid date

==================================================
19. TASKS & FOLLOW-UP MANAGEMENT
================================

Every lead/customer/case should support tasks.

Task:

* title
* due date
* priority
* assigned staff
* linked customer
* linked case
* notes
* status

Statuses:
To Do
In Progress
Completed
Cancelled

Create dashboard widgets:

Overdue
Today
Upcoming

==================================================
20. WHATSAPP-CENTRIC WORKFLOW
=============================

WhatsApp is a core customer communication channel.

Use official WhatsApp Business/Cloud API architecture.

Do NOT use unofficial WhatsApp automation or account scraping.

Build architecture to support:

Incoming enquiry
→ identify/create lead
→ assign consultant
→ save communication activity
→ create customer/case

Message templates:

Lead acknowledgement
Document request
Quotation sent
Payment reminder
Visa status
Booking confirmation
Departure reminder
Post-trip follow-up

Where platform/API rules require approved templates, structure the system around approved templates.

Maintain communication history and consent/opt-out information.

==================================================
21. CUSTOMER PORTAL
===================

Create an optional secure customer portal.

Customer receives a secure login/link.

Customer can see:

Profile
Traveller details
Visa status
Required documents
Quotation
Bookings
Trip itinerary
Payments
Receipts
Travel documents
Notifications

Customer should NOT see internal supplier costs, internal notes or employee commission.

==================================================
22. BRANCH MANAGEMENT
=====================

Support multiple branches.

Agency owner can create:

* Lahore branch
* Gujranwala branch
* Hafizabad branch
* Islamabad branch
  etc.

Each branch can have:

* manager
* employees
* leads
* customers
* cases
* bookings
* expenses
* reports

Allow branch-level reporting.

==================================================
23. REPORTING & ANALYTICS
=========================

Build useful reports, not decorative dashboards.

Reports:

Lead source report
Lead conversion report
Consultant performance
Destination demand
Visa success/status report
Booking revenue
Gross margin
Outstanding customer balances
Supplier payable
Monthly expenses
Branch performance
Follow-up performance
Customer acquisition
Top destinations
Top services

Allow:

* date filtering
* branch filtering
* staff filtering
* export CSV
* export PDF

==================================================
24. SEARCH & GLOBAL COMMAND SYSTEM
==================================

Implement fast global search.

Search:
Customer
Traveller
Lead
Visa Case
Quotation
Booking
Invoice/receipt
Passport number
Application/reference number
PNR
Phone number

Add keyboard-friendly quick actions where practical.

Example:
Press a shortcut → “Create Lead”

==================================================
25. NOTIFICATION SYSTEM
=======================

In-app notifications:

New lead
Assigned lead
Task due
Document missing
Document rejected
Passport expiring
Visa status changed
Payment due
Payment overdue
Upcoming trip
Quotation expiring

Optional:
Email notifications
WhatsApp notifications

Allow users to configure notification preferences.

==================================================
26. ADMIN SETTINGS
==================

Agency settings:

Agency information
Logo
Branches
Users
Roles
Permissions
Currencies
Tax settings
Quotation settings
Receipt settings
Document categories
Visa types
Visa checklists
Lead sources
Lead statuses
Booking statuses
Payment methods
Commission rules
Notification settings
WhatsApp settings

==================================================
27. SUBSCRIPTION & SaaS BILLING
===============================

The actual product is a SaaS.

Create platform-level subscription architecture.

Plans:

Starter
Business
Agency Pro

Allow configurable:

* number of users
* branches
* document storage
* monthly leads
* WhatsApp capabilities
* reports
* customer portal
* automation

Track:
Trial
Active
Past Due
Cancelled
Expired

Include:

* upgrade
* downgrade
* renewal
* invoices
* plan limits

For initial MVP, payment collection can be implemented as an admin-controlled/manual process if local gateway integration is not yet available.

Do not hard-code pricing.

==================================================
28. SUPER ADMIN PANEL
=====================

Platform owner needs:

Organizations
Users
Subscriptions
Plans
Revenue
Trials
Storage usage
System health
Support tickets
Feature flags
Audit logs

Super admin must NOT casually access customer confidential documents.
Implement controlled privileged access and audit trails for administrative access to tenant data.

==================================================
29. AUDIT LOG
=============

Audit sensitive actions.

Log:

* login
* logout
* record creation
* record update
* record deletion
* document upload
* document download
* status change
* payment change
* role change
* permission change
* admin access

Store:

* actor
* organization
* action
* object
* timestamp
* IP/device metadata where legally/operationally appropriate

==================================================
30. UX/UI REQUIREMENTS
======================

The UI must feel like a modern premium SaaS product.

Design principles:

* clean
* minimal
* professional
* fast
* responsive
* accessible
* low cognitive load

Desktop:
Sidebar navigation
Top bar
Global search
Notifications
Profile

Mobile:
Responsive navigation
Bottom navigation or compact sidebar
Large touch targets
Mobile-friendly forms

Use clear information hierarchy.

Do not overload screens.

Use:

* cards
* tables
* tabs
* modals/drawers where useful
* empty states
* skeleton loading
* toast notifications
* confirmation dialogs
* inline validation

Every important action should have clear feedback.

Use consistent:

* typography
* spacing
* buttons
* border radius
* icons
* forms
* status badges

Provide both:
Light theme
Dark theme

Accessibility:

* keyboard navigation
* readable contrast
* semantic HTML
* focus states
* proper labels
* accessible dialogs

==================================================
31. UX FLOWS
============

CRITICAL FLOW 1:
New WhatsApp enquiry

Lead created
→ assign consultant
→ consultant contacts customer
→ requirements recorded
→ quotation generated
→ quotation sent
→ follow-up scheduled

CRITICAL FLOW 2:
Visa case

Customer created
→ traveller added
→ visa type selected
→ checklist generated
→ documents uploaded
→ documents verified
→ application submitted
→ status updates
→ decision
→ customer notified

CRITICAL FLOW 3:
Booking

Quote accepted
→ booking created
→ supplier recorded
→ payment schedule created
→ customer payment recorded
→ supplier payable recorded
→ documents uploaded
→ trip confirmed

CRITICAL FLOW 4:
Outstanding payment

Balance exists
→ due date approaches
→ reminder
→ overdue
→ dashboard alert
→ payment recorded
→ receipt generated

==================================================
32. DATABASE DESIGN
===================

Create a normalized PostgreSQL schema.

Suggested core entities:

organizations
branches
users
roles
permissions
user_roles
leads
lead_activities
customers
travellers
customer_travellers
visa_types
visa_requirements
visa_cases
visa_case_requirements
documents
document_versions
quotations
quotation_items
packages
package_items
bookings
booking_items
trips
itinerary_days
payments
payment_schedules
expenses
suppliers
supplier_transactions
commissions
tasks
notifications
message_templates
communication_logs
subscriptions
plans
audit_logs

Use proper:

* primary keys
* foreign keys
* indexes
* timestamps
* soft deletion where appropriate
* unique constraints
* tenant scoping

Use UUIDs or another secure non-sequential identifier strategy where appropriate.

==================================================
33. API DESIGN
==============

Build clean versioned APIs.

Example:

/api/v1/auth
/api/v1/organizations
/api/v1/branches
/api/v1/users
/api/v1/leads
/api/v1/customers
/api/v1/travellers
/api/v1/visa-cases
/api/v1/documents
/api/v1/quotations
/api/v1/packages
/api/v1/bookings
/api/v1/trips
/api/v1/payments
/api/v1/expenses
/api/v1/suppliers
/api/v1/commissions
/api/v1/tasks
/api/v1/notifications
/api/v1/reports
/api/v1/subscriptions

Use validation for all input.

Never trust frontend authorization alone.

==================================================
34. SECURITY
============

Security is critical because the system handles passports, CNICs, financial records and customer data.

Implement:

* HTTPS
* secure authentication
* password hashing handled by trusted auth provider
* RBAC
* tenant isolation
* input validation
* rate limiting
* CSRF protection where applicable
* secure HTTP headers
* XSS prevention
* SQL injection protection
* secure file upload validation
* signed/private file access
* API authorization
* audit logging
* secrets via environment variables
* no secrets in source code
* encrypted transport
* encrypted storage where supported
* database backups
* recovery procedures

Minimize the storage of unnecessary sensitive information.

Never place passport or CNIC files in a publicly accessible bucket.

==================================================
35. PERFORMANCE
===============

The system should remain fast with:

* 10,000+ leads per tenant
* 50,000+ customer records
* large document volumes
* multiple branches
* multiple concurrent users

Implement:

* pagination
* indexed queries
* lazy loading
* optimized API responses
* caching where useful
* background jobs for heavy work
* image/document processing asynchronously

==================================================
36. DOCUMENT/PDF GENERATION
===========================

Generate professionally branded:

Quotation PDF
Payment receipt
Invoice
Travel itinerary
Booking confirmation
Customer travel summary

Use consistent branding.

PDFs must be printable and mobile-readable.

==================================================
37. IMPORT / EXPORT
===================

Import:

Customers
Leads
Travellers
Suppliers
Existing payment records

Support CSV import.

Create:

* sample CSV template
* validation
* preview before import
* duplicate detection
* error report

Export data according to user permissions.

==================================================
38. CUSTOMER SUPPORT
====================

Add optional support module:

Support tickets
Contact support
FAQ
Help articles
Issue status

==================================================
39. TESTING
===========

Do not consider the project complete simply because it runs.

Create:

Unit tests
Integration tests
API tests
Authorization tests
Tenant-isolation tests
Critical workflow tests
File-access tests
Payment calculation tests
Quotation calculation tests
Responsive UI tests

At minimum test these scenarios:

1. Tenant A cannot access Tenant B data.
2. Consultant cannot access restricted financial information.
3. Customer cannot access another customer's documents.
4. Document download requires authorization.
5. Quotation totals are mathematically correct.
6. Payment balance updates correctly.
7. Overdue status calculates correctly.
8. Role permissions are enforced on backend.
9. Deleted/archived records behave correctly.
10. Customer portal hides internal information.

==================================================
40. SEED DATA
=============

Create realistic demo data.

Destinations:
Dubai
Saudi Arabia
Turkey
Azerbaijan
Malaysia
Thailand
UK
Europe
Other

Services:
Visa
Flight
Hotel
Transport
Insurance
Tour Package

Demo agency:
Use fictional data.

Never use real people's sensitive information.

==================================================
41. DEVELOPMENT APPROACH
========================

Work in phases.

PHASE 1:
Architecture
Database
Authentication
Tenant isolation
RBAC
Base design system

PHASE 2:
CRM
Leads
Customers
Travellers
Tasks

PHASE 3:
Visa
Documents
Checklists

PHASE 4:
Quotation
Packages

PHASE 5:
Bookings
Trips
Itineraries

PHASE 6:
Payments
Expenses
Profit
Suppliers
Commissions

PHASE 7:
Notifications
WhatsApp integration architecture
Customer portal

PHASE 8:
Subscriptions
Super admin
Analytics

PHASE 9:
Testing
Security audit
Performance optimization

PHASE 10:
Production deployment
Monitoring
Backups
Documentation

==================================================
42. DEVELOPMENT QUALITY RULES
=============================

Use TypeScript throughout.

Use reusable components.

Do not duplicate business logic.

Keep business logic separate from presentation logic.

Use environment variables for secrets/configuration.

Write readable, maintainable code.

Use consistent naming conventions.

Document important architecture decisions.

Create a clean folder structure.

Avoid unnecessary dependencies.

Do not implement features merely for visual appearance.

Every screen must have:

* loading state
* empty state
* error state
* success feedback

Every destructive action must require confirmation.

Prevent accidental duplicate submissions.

Use optimistic updates only where safe.

==================================================
43. IMPORTANT PRODUCT BEHAVIOUR
===============================

The system should always prioritize operational clarity.

For every customer, the consultant should be able to answer within seconds:

Who is this customer?
What do they want?
What documents are missing?
What visa case do they have?
What quotation did we send?
What booking was made?
How much did they pay?
How much remains?
What is the next action?
When should I contact them?

For every visa case, the employee should be able to answer:

What destination?
What visa?
Who is applying?
What documents are missing?
Who owns this case?
What is the current status?
What is the application/reference number?
What action is required next?

For every booking:

What did the customer buy?
What did it cost us?
How much did the customer pay?
What is outstanding?
What supplier was used?
What documents are attached?
What is the expected profit?

==================================================
44. FUTURE-READY ARCHITECTURE
=============================

Do not implement all future features now, but ensure the architecture can later support:

* GDS/flight APIs
* hotel APIs
* payment gateway integrations
* official WhatsApp Business API
* AI lead qualification
* AI quotation generation
* AI itinerary generation
* OCR for document extraction
* automated reminders
* Umrah management
* study-abroad workflow
* work-abroad workflow
* partner/sub-agent portal
* reseller/white-label mode
* mobile application
* public package website
* customer booking portal
* advanced financial accounting

Future modules must not require rewriting the entire system.

==================================================
45. FINAL DELIVERABLES
======================

Deliver:

1. Fully working production-ready application
2. Frontend
3. Backend
4. PostgreSQL database schema
5. Authentication
6. RBAC
7. Multi-tenancy
8. API documentation
9. Database migration files
10. Seed/demo data
11. Automated tests
12. Environment configuration example
13. Deployment instructions
14. Admin documentation
15. User documentation
16. Security documentation
17. Backup/recovery documentation

Also provide:

* architecture diagram
* ER diagram
* API endpoint documentation
* permission matrix
* database schema documentation
* deployment architecture
* test report

==================================================
46. DEFINITION OF DONE
======================

Do NOT declare the project finished merely because all pages exist.

The product is complete only when:

* authentication works
* tenant isolation works
* RBAC works
* CRM works
* visa workflow works
* documents work securely
* quotations calculate correctly
* bookings work
* payment balances calculate correctly
* reports work
* responsive UI works
* errors are handled
* critical workflows are tested
* no major console/API errors remain
* sensitive documents are protected
* deployment succeeds
* production environment variables are documented
* database backups are configured
* the application is usable by a real Pakistani travel consultant without developer assistance

Before final delivery, perform a complete end-to-end test using realistic demo data.

Do not sacrifice security, data integrity or maintainability for speed.

The application should look and feel like a polished commercial SaaS product, not a college project or CRUD dashboard.

The architecture I would use:
                    ┌──────────────────────┐
                    │      CUSTOMER        │
                    │ WhatsApp / Portal    │
                    └──────────┬───────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│                  NEXT.JS / REACT FRONTEND                │
│                                                          │
│ Dashboard | CRM | Visa | Documents | Quotes | Bookings │
│ Payments  | Trips | Suppliers | Reports | Settings     │
└──────────────────────────┬───────────────────────────────┘
                           │ REST API
                           ▼
┌──────────────────────────────────────────────────────────┐
│                 NODE.JS BACKEND                          │
│                                                          │
│ Auth | RBAC | CRM | Visa | Booking | Finance | Reports │
│ Notifications | Documents | Subscription | Audit       │
└───────────────┬──────────────────────┬───────────────────┘
                │                      │
                ▼                      ▼
       ┌─────────────────┐      ┌─────────────────┐
       │ PostgreSQL      │      │ Secure Storage  │
       │ / Supabase      │      │ Documents/PDFs  │
       └─────────────────┘      └─────────────────┘
                │
                ▼
       ┌──────────────────────┐
       │ Background Jobs      │
       │ Redis + Queue        │
       └──────────┬───────────┘
                  │
       ┌──────────┼─────────────┐
       ▼          ▼             ▼
   WhatsApp     Email       Notifications


   Absolutely. For **SafarDesk** (or your final brand name), I would structure the SaaS around **one central customer/travel case**, with different roles seeing only the functions they need.

# 1. Complete SaaS Architecture

```text
                                  ┌─────────────────────────┐
                                  │        CUSTOMER         │
                                  │ WhatsApp / Web Portal   │
                                  └────────────┬────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION / FRONTEND                           │
│                         Next.js + React                              │
│                                                                      │
│  Dashboard │ CRM │ Visa │ Documents │ Quotations │ Bookings         │
│  Trips │ Payments │ Suppliers │ Tasks │ Reports │ Settings          │
│                                                                      │
│       Role-based UI + Responsive Web + Customer Portal              │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                              REST / API
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         BACKEND / API                                │
│                    Node.js + TypeScript                              │
│                                                                      │
│ Auth │ RBAC │ Tenant │ CRM │ Visa │ Documents │ Quotes │ Bookings   │
│ Trips │ Payments │ Finance │ Suppliers │ Commissions │ Reports     │
│ Notifications │ WhatsApp │ Subscription │ Audit │ Search            │
└──────────────┬──────────────────────┬──────────────────────┬─────────┘
               │                      │                      │
               ▼                      ▼                      ▼
       ┌────────────────┐    ┌──────────────────┐   ┌─────────────────┐
       │ PostgreSQL     │    │ Secure Storage   │   │ Redis / Queue   │
       │ / Supabase     │    │                  │   │                 │
       │                │    │ Passports        │   │ Reminders       │
       │ Users          │    │ CNICs            │   │ Notifications   │
       │ Customers      │    │ Visas            │   │ PDF Generation  │
       │ Leads          │    │ Tickets          │   │ Background Jobs │
       │ Cases          │    │ Quotations       │   │                 │
       │ Bookings       │    │ Receipts         │   │                 │
       │ Payments       │    │                  │   │                 │
       └────────────────┘    └──────────────────┘   └────────┬────────┘
                                                              │
                            ┌─────────────────────────────────┼──────────┐
                            │                                 │          │
                            ▼                                 ▼          ▼
                    ┌──────────────┐                    ┌─────────┐  ┌────────────┐
                    │ WhatsApp API │                    │ Email   │  │ Push/In-App│
                    └──────────────┘                    └─────────┘  │ Alerts     │
                                                                    └────────────┘
```

---

# 2. Core Business Flow

The most important concept is the **Travel Case**.

```text
                    NEW ENQUIRY
                         │
               WhatsApp / Call / Walk-in
                         │
                         ▼
                   ┌───────────┐
                   │    LEAD   │
                   └─────┬─────┘
                         │
                   Qualify Customer
                         │
                         ▼
                 ┌───────────────┐
                 │   CUSTOMER    │
                 └───────┬───────┘
                         │
                    Add Traveller(s)
                         │
                         ▼
                 ┌───────────────┐
                 │  TRAVEL CASE  │
                 └───────┬───────┘
                         │
          ┌──────────────┼───────────────┐
          ▼              ▼               ▼
      DOCUMENTS        VISA           QUOTE
          │              │               │
          └──────────────┼───────────────┘
                         │
                         ▼
                     ACCEPTED
                         │
                         ▼
                    BOOKING
                         │
               ┌─────────┼─────────┐
               ▼         ▼         ▼
            FLIGHT      HOTEL   TRANSPORT
                         │
                         ▼
                      PAYMENT
                         │
                         ▼
                    CONFIRMED
                         │
                         ▼
                   TRIP / ITINERARY
                         │
                         ▼
                  TRAVEL COMPLETED
                         │
                         ▼
                  FOLLOW-UP / CRM
```

This structure is important because every employee can work on **the same case**, while permissions decide what each person can see or change. As built, the LEAD → CUSTOMER hand-off is automatic: moving a lead to **Confirmed / Won** saves the customer record in the same tenant (Lead & CRM module, above), and the same rule engine gates who may reach the workspace at all (§19.7).

---

# 3. Super Admin Flow

The **Super Admin** manages your SaaS itself, not the travel agency's daily business.

```text
SUPER ADMIN
     │
     ├── Organizations
     ├── Users
     ├── Subscriptions
     ├── Plans
     ├── Usage
     ├── System Health
     ├── Support
     ├── Feature Flags
     └── Audit / Platform Logs
```

### Functions

**Organizations**

* Create/suspend agency
* View agency details
* Manage plan
* Usage monitoring

**Subscription**

* Trial management
* Plans
* Billing status
* Expiry
* Upgrade/downgrade

**Platform analytics**

* Total agencies
* Active users
* MRR
* New registrations
* Storage usage
* Active leads/cases

**Security**

* Platform audit logs
* Controlled admin access
* System settings

---

# 4. Agency Owner Flow

The owner gets the complete picture of the business.

```text
                AGENCY OWNER
                      │
     ┌────────────────┼─────────────────┐
     ▼                ▼                 ▼
 TEAM & BRANCH      BUSINESS          FINANCE
                    OPERATIONS
     │                │                 │
     ├ Users          ├ Leads           ├ Revenue
     ├ Roles          ├ Visa            ├ Expenses
     ├ Permissions    ├ Quotes          ├ Payments
     └ Branches       ├ Bookings        ├ Profit
                      └ Customers       └ Commissions
```

### Main dashboard

```text
┌────────────────────────────────────────────┐
│ Revenue       PKR 2.4M                     │
│ Outstanding   PKR 680K                     │
│ Active Leads  148                           │
│ Visa Cases    62                            │
│ Bookings      37                            │
└────────────────────────────────────────────┘

Today's Tasks
├── 12 Follow-ups
├── 8 Missing Documents
├── 5 Payment Due
└── 4 Visa Updates
```

### Owner functions

* Manage branches
* Manage employees
* Assign roles
* View all customers
* View all cases
* View revenue/profit
* Monitor consultant performance
* Manage suppliers
* Manage commissions
* Agency settings
* Subscription

---

# 5. Agency Manager Flow

The manager controls daily operations.

```text
                MANAGER
                  │
       ┌──────────┼───────────┐
       ▼          ▼           ▼
     SALES      VISA       OPERATIONS
       │          │           │
     Leads      Cases       Bookings
     Quotes     Documents   Trips
     Followups  Officers    Tasks
```

### Functions

* Assign leads
* Reassign cases
* Monitor pending work
* Check staff workload
* Monitor visa pipeline
* Monitor quotations
* Monitor bookings
* Review payments
* Track overdue tasks
* Generate operational reports

The manager should see **performance + workload**, but sensitive financial controls can remain with the owner/accountant.

---

# 6. Travel Consultant / Sales Agent

This is one of your most important roles.

Their UI should be extremely simple.

```text
              CONSULTANT
                  │
                  ▼
             NEW LEAD
                  │
                  ▼
         CUSTOMER REQUIREMENTS
                  │
                  ▼
              QUOTATION
                  │
                  ▼
            FOLLOW-UP
                  │
          ┌───────┴───────┐
          ▼               ▼
       ACCEPTED          LOST
          │
          ▼
       BOOKING
```

### Consultant dashboard

```text
My Leads:             37
Quotes Pending:       12
Follow-ups Today:      8
Confirmed Bookings:    6
Documents Pending:     9
```

### Functions

* Create/edit leads
* Add customer
* Add travellers
* Record requirements
* Create quotations
* Send quotation
* Schedule follow-up
* Manage assigned customers
* View visa status
* Request documents
* Record booking information
* View customer payments relevant to their cases
* Communicate through approved WhatsApp workflows

### Consultant should NOT automatically see:

* Other consultants' private leads
* Supplier internal costs
* Other employee commissions
* Agency-wide accounting
* Super-admin functions

---

# 7. Visa Officer Flow

The visa officer works almost entirely inside the **Visa Case**.

```text
             VISA OFFICER
                   │
                   ▼
             ASSIGNED CASE
                   │
                   ▼
         CHECK DOCUMENTS
                   │
          ┌────────┴────────┐
          ▼                 ▼
      INCOMPLETE          COMPLETE
          │                 │
          ▼                 ▼
      REQUEST DOCS       SUBMIT
                            │
                            ▼
                       PROCESSING
                            │
                 ┌──────────┼───────────┐
                 ▼          ▼           ▼
             APPROVED    ADDITIONAL   REJECTED
                           INFO
```

### Functions

* View assigned visa cases
* Check checklist
* Verify documents
* Reject/approve submitted documents
* Request missing documents
* Update visa status
* Add application/reference number
* Add processing notes
* Upload visa result
* Notify consultant/customer
* Track expiry/deadlines

### As built

* Each **Visa Case** carries a **Customer Details & Information** card — phone/WhatsApp/email, CNIC, passport number + expiry (with an expiry warning chip), nationality, date of birth, city, address, occupation and notes — editable through the Add/Edit dialog and linked to the customer record when one exists.
* A **Documents Detail** card lists every document with its category and status (`UPLOADED → VERIFIED` / `PENDING`), uploaded file name/date, and lets the officer verify, reject, remove or add documents inline; the header shows `n of m uploaded`.
* **Add / Edit Visa Case** dialog captures customer details, visa case fields (destination, type, dates, officer, provider, reference) and pricing (visa fee, service fee, supplier cost, margin) and can generate the standard embassy checklist on creation.
* Covered by `cd server && npm run smoke:auth` section `[7]` (replace → read back → edit → read back).

---

# 8. Accountant Flow

```text
                 ACCOUNTANT
                     │
       ┌─────────────┼──────────────┐
       ▼             ▼              ▼
    CUSTOMER       SUPPLIER       EXPENSE
    PAYMENTS       PAYMENTS       MANAGEMENT
       │             │              │
       ▼             ▼              ▼
    Receipts       Payables       Expenses
       │             │              │
       └─────────────┼──────────────┘
                     ▼
               PROFIT / LOSS
```

### Functions

* Record customer payment
* Installments
* Outstanding balances
* Generate receipts
* Refunds
* Supplier payments
* Expenses
* Commissions
* Revenue reports
* Profit reports
* Branch financial reports

### Critical rule

A consultant can **see** relevant payment status, but only authorized finance users should be able to **verify/modify financial records**.

---

# 9. Operations Staff

Operations ensures the confirmed trip actually runs correctly.

```text
              OPERATIONS
                  │
                  ▼
             CONFIRMED CASE
                  │
          ┌───────┼────────┐
          ▼       ▼        ▼
       FLIGHT    HOTEL   TRANSPORT
          │       │        │
          └───────┼────────┘
                  ▼
            TRIP READY
                  │
                  ▼
             TRAVEL DATE
```

### Functions

* Manage booking records
* Verify PNR
* Hotel confirmation
* Transport
* Upload vouchers/tickets
* Prepare final travel documents
* Manage itinerary
* Upcoming departure list
* Trip status

---

# 10. Branch Manager

The branch manager is essentially a **restricted agency manager**.

```text
                 BRANCH
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
      SALES       VISA       OPS
        │          │          │
     Employees   Cases      Bookings
     Leads       Documents  Trips
```

They only see data belonging to their branch unless the owner grants additional access.

---

# 11. Sub-Agent

This is a potentially valuable future revenue feature.

```text
                SUB-AGENT
                    │
                    ▼
              Submit Customer
                    │
                    ▼
             Request Service
                    │
                    ▼
              Agency Team
                    │
                    ▼
               Processing
                    │
                    ▼
            Booking / Visa
                    │
                    ▼
              Commission
```

### Functions

* Submit lead/customer
* Request visa
* Request quotation
* Submit booking request
* View assigned cases
* View payment balance
* Download authorized documents
* View commission

### Should NOT see

* Agency internal costs
* Other customers
* Employee salaries
* Internal notes
* Other sub-agents
* Complete financial reports

---

# 12. Customer Flow

The customer should have a very simple experience.

```text
                  CUSTOMER
                     │
             WhatsApp / Portal
                     │
                     ▼
                  ENQUIRY
                     │
                     ▼
              RECEIVE QUOTE
                     │
                     ▼
             UPLOAD DOCUMENTS
                     │
                     ▼
              VISA / BOOKING
                     │
                     ▼
                MAKE PAYMENT
                     │
                     ▼
             TRACK APPLICATION
                     │
                     ▼
             RECEIVE DOCUMENTS
                     │
                     ▼
                   TRAVEL
```

### Customer Portal

```text
┌─────────────────────────────────────────┐
│             MY TRIP                     │
├─────────────────────────────────────────┤
│ Dubai • 15 Oct - 20 Oct                 │
│                                         │
│ Visa             ✓ Approved             │
│ Documents        4/4 Complete           │
│ Flight           ✓ Confirmed            │
│ Hotel            ✓ Confirmed            │
│ Payment          PKR 50,000 Remaining   │
│                                         │
│ [View Itinerary] [Documents] [Receipt] │
└─────────────────────────────────────────┘
```

Customer must never see:

**supplier cost, internal margin, consultant commission, internal notes, private staff comments.**

---

# 13. Cross-Role Communication Flow

One of the best aspects of this architecture is that everyone works on the same case.

```text
CUSTOMER
   │
   ▼
CONSULTANT
   │
   ├──────────────► VISA OFFICER
   │                    │
   │                    ▼
   │               DOCUMENTS
   │                    │
   ├──────────────► ACCOUNTANT
   │                    │
   │                    ▼
   │                  PAYMENT
   │
   └──────────────► OPERATIONS
                        │
                        ▼
                  FLIGHT / HOTEL
                        │
                        ▼
                     CUSTOMER
```

This eliminates the traditional problem:

```text
WhatsApp
   +
Excel
   +
Notebook
   +
Google Drive
   +
PDF
   +
Separate Accounting
```

Everything becomes connected.

---

# 14. Role Permission Architecture

Think of permissions in four levels:

```text
                    SUPER ADMIN
                         │
              ┌──────────┴───────────┐
              │                      │
         AGENCY OWNER          PLATFORM LEVEL
              │
       ┌──────┼─────────┐
       ▼      ▼         ▼
    MANAGER  ACCOUNTANT  BRANCH
       │                 MANAGER
   ┌───┼────┐
   ▼   ▼    ▼
SALES VISA  OPS
AGENT OFFICER STAFF
       │
       ▼
    SUB-AGENT

                    CUSTOMER
                       │
                       ▼
                 OWN DATA ONLY
```

---

# 15. What Each Role Sees

| Module      | Owner | Manager     | Consultant | Visa Officer | Accountant | Operations | Branch Mgr | Sub-Agent | Customer |
| ----------- | ----- | ----------- | ---------- | ------------ | ---------- | ---------- | ---------- | --------- | -------- |
| Dashboard   | Full  | Branch/Team | Personal   | Visa         | Finance    | Operations | Branch     | Personal  | Trip     |
| Leads       | All   | Team        | Assigned   | Limited      | Limited    | Limited    | Branch     | Own       | —        |
| Customers   | All   | Team        | Assigned   | Related      | Related    | Related    | Branch     | Own       | Own      |
| Visa        | All   | All         | Assigned   | Full         | Payment    | Status     | Branch     | Submitted | Own      |
| Documents   | All   | All         | Related    | Full         | Limited    | Related    | Branch     | Own       | Own      |
| Quotes      | All   | Team        | Full       | View         | View       | View       | Branch     | Request   | Own      |
| Bookings    | All   | Team        | Assigned   | View         | Finance    | Full       | Branch     | Own       | Own      |
| Payments    | Full  | View        | Limited    | View         | Full       | Limited    | Branch     | Own       | Own      |
| Suppliers   | Full  | View        | Limited    | Limited      | Full       | Related    | Branch     | —         | —        |
| Commissions | Full  | View        | Own        | —            | Full       | —          | Branch     | Own       | —        |
| Reports     | Full  | Team        | Personal   | Visa         | Finance    | Ops        | Branch     | Own       | —        |
| Settings    | Full  | Limited     | —          | —            | Finance    | —          | Branch     | —         | —        |

This table should eventually become your **RBAC permission matrix** in the backend.

---

# 16. Most Important Object: The Travel Case

I strongly recommend making this the central object of the entire SaaS.

```text
                         TRAVEL CASE
                              │
        ┌───────────────┬─────┼──────┬───────────────┐
        ▼               ▼     ▼      ▼               ▼
     CUSTOMER        TRAVELLERS   VISA          QUOTATION
        │                              │               │
        ▼                              ▼               ▼
    PROFILE                       DOCUMENTS          BOOKING
                                                       │
                                               ┌───────┼────────┐
                                               ▼       ▼        ▼
                                             FLIGHT   HOTEL   TRANSPORT
                                                       │
                                                       ▼
                                                   PAYMENTS
                                                       │
                                                       ▼
                                                     TRIP
                                                       │
                                                       ▼
                                                  COMPLETED
```

When an employee opens:

> **CASE #TRV-2026-00125**

they should immediately see:

**Customer → Travellers → Visa → Documents → Quote → Booking → Payment → Tasks → Timeline**

That gives the product a very strong operational UX.

---

# 17. Recommended Main Navigation

For **Agency Owner / Manager**:

```text
┌────────────────────────────┐
│ SAFARDESK                  │
├────────────────────────────┤
│ 🏠 Dashboard               │
│ 👥 CRM                     │
│ 🛂 Visa Cases              │
│ 📄 Documents               │
│ 💬 Communications          │
│ 💰 Quotations              │
│ ✈️ Bookings                │
│ 🧳 Trips                   │
│ 💳 Payments                │
│ 🏦 Suppliers               │
│ 📊 Reports                 │
│ ✅ Tasks                   │
│ 👨‍💼 Team                   │
│ 🏢 Branches               │
│ ⚙ Settings                │
└────────────────────────────┘
```

But for a **Consultant**, simplify it:

```text
┌────────────────────────────┐
│ 🏠 Dashboard               │
│ 👥 My Leads                │
│ 👤 My Customers            │
│ 🛂 Visa Cases              │
│ 💰 Quotations              │
│ ✈️ Bookings                │
│ ✅ Follow-ups              │
│ 📄 Documents               │
└────────────────────────────┘
```

And for a **Visa Officer**:

```text
┌────────────────────────────┐
│ 🏠 Dashboard               │
│ 🛂 My Visa Cases            │
│ 📄 Documents               │
│ ✅ Checklists              │
│ 🔔 Tasks                   │
│ 📊 Visa Reports            │
└────────────────────────────┘
```

This **role-specific navigation** is important. Don't show every module to every user.

---

# 18. Overall Information Flow

```text
                       EXTERNAL WORLD
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          WhatsApp           Calls           Walk-in
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                         ┌──────────┐
                         │   CRM    │
                         └────┬─────┘
                              ▼
                         CUSTOMER
                              │
                              ▼
                         TRAVEL CASE
                              │
             ┌────────────────┼─────────────────┐
             │                │                 │
             ▼                ▼                 ▼
           VISA           QUOTATION          BOOKING
             │                │                 │
             ▼                ▼                 ▼
        DOCUMENTS         PAYMENTS           TRIP
             │                │                 │
             └────────────────┼─────────────────┘
                              ▼
                         NOTIFICATIONS
                              │
                 ┌────────────┼─────────────┐
                 ▼            ▼             ▼
              WhatsApp       Email       Portal
                 │            │             │
                 └────────────┼─────────────┘
                              ▼
                           CUSTOMER
```

### The simplest way to understand your SaaS

**Front office:**
Lead + CRM + WhatsApp + Consultant

**Middle office:**
Visa + Documents + Quotations + Bookings + Operations

**Back office:**
Payments + Expenses + Suppliers + Commissions + Reports

**Customer side:**
Portal + Documents + Payment + Trip + Notifications

**Platform side:**
Subscription + Multi-tenancy + RBAC + Security + Super Admin

That structure gives you a clean foundation for building the MVP while keeping the architecture ready for later **Umrah, study-abroad, work-abroad, GDS, hotel APIs, AI automation and mobile apps**.


---

# 19. Super Admin / SaaS Owner — Configuration, Enforcement & Monitoring

The **Super Admin (SaaS Owner)** is not an agency role. This role **owns the whole SaaS**. It does not run day-to-day travel operations — it runs the platform itself: it defines the configuration, the system enforces that configuration everywhere, and the Super Admin watches what every plan buyer and every role is doing.

```text
                      SUPER ADMIN / SaaS OWNER
                     (owner of the whole SaaS)
                                │
        ┌──────────────┬────────┼────────┬───────────────┐
        ▼              ▼        ▼        ▼               ▼
  CONFIGURATION   ENFORCEMENT  PLANS   MONITORING    GOVERNANCE
  sets the rules  automatic    billing per buyer     per role
  (1 place)       (everywhere) quotas  (analytics)   (analytics)
```

### 19.1 Super Admin controls the configuration

One source of truth. Configuration is authored **once**, at platform level, and is never re-declared inside a tenant.

| # | Configuration domain | Scope | Examples of what Super Admin sets | Who it binds |
| --- | --- | --- | --- | --- |
| 1 | Subscription plan catalog | **Plan** | price (MRR), seats, branch quota, storage quota, included modules, **which of the 9 tenant roles the plan grants**, whether it accepts new buyers | every buyer on that plan |
| 2 | Organization policy | **Organization** | new sign-up approval (`PENDING` → `ACTIVE`), activation/suspension, DTS license required, renewal grace days, default currency & timezone | every tenant |
| 3 | User & seat policy | **User** | seat cap = plan seats, invite-only sign-up, owner MFA, session TTL, password rules | every user |
| 4 | Branch policy | **Branch** | branch cap = plan branches, manager must be assigned, branch code prefix | every branch |
| 5 | Role & permission policy (RBAC) | **Role** | which roles exist, module access per role, `workspace` / `finance` / `settings` / `platform` permissions | every role in every tenant |
| 6 | Feature flags | **Plan / Organization** | WhatsApp hub, audit exports, API access, advanced reports | rolled out per plan |

```text
RULE OF OWNERSHIP

  SUPER ADMIN ──writes──► PLATFORM CONFIG
                              │
                              ├──► Organization settings   (subset, never a superset)
                              ├──► User seats & sessions
                              ├──► Branch quotas
                              ├──► Role permission matrix
                              └──► Plan limits & features

  A tenant can only CONSUME the configuration.
  A tenant can never OUT-RANK it.
```

### 19.2 The system enforces those configurations automatically

No agency owner, manager, branch or role can bypass a platform rule by changing local settings. Enforcement happens in the engine, not by manual policing.

```text
 SUPER ADMIN SAVES CONFIGURATION
                │
                ▼
       PLATFORM POLICY ENGINE                      (server: platform routes)
                │
   ┌────────────┼────────────┬───────────────┬─────────────────┐
   ▼            ▼            ▼               ▼                 ▼
 ORGANIZATION  USER        BRANCH          ROLE        SUBSCRIPTION PLAN
 seat & case   seat cap,   branch cap,     module      price, quota,
 quotas,       MFA,        manager req,    access &    renewal,
 suspension    session TTL password rules  permission  upgrade/downgrade
   │            │            │             matrix          │
   └────────────┴────────────┴─────────────┴───────────────┘
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
        HARD BLOCK       SOFT WARN            OFF
        request rejected  allowed + flagged   only for owner
        with reason       in audit stream     (explicit, rare)
```

| Enforcement mode | Meaning | Typical use |
| --- | --- | --- |
| `HARD_BLOCK` | The system rejects the action immediately (over-quota seat, over-quota branch, suspended tenant, unknown role) | quota & security rules |
| `SOFT_WARN` | The action completes but is flagged on the platform audit stream for review | hygiene rules (missing DTS, stale branch) |
| `OFF` | Rule paused by the Super Admin | during migration / onboarding |

Guaranteed properties:

* **Automatic** — no manual follow-up needed; the check runs on every create/update request for organization, user, branch, role and plan.
* **Universal** — the same rule applies to every tenant, regardless of plan tier.
* **Audited** — every allow/deny decision lands in the platform activity & audit stream.
* **Reversible** — the Super Admin can change the mode or value and it applies platform-wide instantly.

Plan-driven rules are part of the same engine: `rule-plan-role-access` (scope `PLAN`, mode `HARD_BLOCK`) denies any role that the buyer's plan does not grant — checked on platform **provisioning**, on an org's **plan change** (every user of that org is re-validated, so a downgrade can be refused), and on **role login** in a tenant. The 3 seeded plans grant `STARTER` 4 roles, `BUSINESS` 7 roles, `AGENCY_PRO` all 9; a plan with no explicit list is treated as granting all 9, and the Super Admin authors each plan's role allow-list — no role, `AGENCY_OWNER` included, is hard-required.

Two more rules of the same engine guard the session itself:

* **`rule-org-approval`** (scope `ORGANIZATION`, mode `HARD_BLOCK`) — *Super Admin approval gate*. A workspace created by `POST /auth/register` starts **`PENDING`**: the call returns `201 { pendingApproval:true, ruleId:'rule-org-approval' }` **without a token**, so nobody can use it yet. `POST /auth/login` (and the Supabase bridge) answers `403` with that rule id + the org status until a Super Admin sets the org to `ACTIVE`; `GET /auth/me` re-checks the same thing, so an already-issued token dies the moment the workspace leaves `ACTIVE`. Approval writes `PLATFORM_ORG_APPROVED` to the audit stream.
* **Module gating per plan** — every session carries its plan's module list, and the UI renders only the tabs that survive `role ∩ plan` (see §19.7).

### 19.3 Super Admin monitors & analyzes every plan buyer

Each organization that buys a plan is a **plan buyer**. The Super Admin can analyze every one of them individually and roll them up:

```text
PLAN BUYER ANALYTICS
 │
 ├── Identity     : owner, agency, DTS license, HQ, since-date
 ├── Commercial   : plan, MRR, renewal date, past-due flag, lifetime value
 ├── Quota usage  : seats / branches / storage / active cases  vs  plan limit
 ├── Health       : usage %, compliance status, churn & suspension risk
 └── Activity     : recent platform actions, audit events, support signals
```

Rollups the Super Admin reads at a glance: **total MRR, buyers per plan, quota saturation, renewals due, past-due buyers, compliance rate, blocked attempts.**

### 19.4 Super Admin monitors & analyzes every role

The same scrutiny is applied to **roles** — across all tenants at once, not inside a single agency:

```text
ROLE ACTIVITY ANALYTICS
 │
 ├── Load       : active users holding the role, actions in window
 ├── Behaviour  : login share, top action, modules touched
 ├── Risk       : permission-denied hits, finance/platform-level writes
 └── Trend      : rising / stable / quiet role, per-role comparison
```

Roles covered: `SUPER_ADMIN`, `AGENCY_OWNER`, `AGENCY_MANAGER`, `TRAVEL_CONSULTANT`, `VISA_OFFICER`, `ACCOUNTANT`, `OPERATIONS_STAFF`, `BRANCH_MANAGER`, `SUB_AGENT`, `CUSTOMER`.

### 19.5 Platform Console structure (as built)

`src/components/SuperAdminView.jsx` renders one console with six lenses — the original content is preserved, the new capability is added around it:

```text
┌──────────────────────────────────────────────────────────────┐
│ SafarDesk Platform Super Admin Console                       │
│ [Platform KPIs: MRR · Agencies · Cases · System Health]      │
├──────────────────────────────────────────────────────────────┤
│ TENANTS │ CONFIGURATION │ ENFORCEMENT │ BUYER ANALYTICS │    │
│         │               │             │ ROLE ACTIVITY   │    │
│         │               │             │ SUPABASE DB     │    │
├──────────────────────────────────────────────────────────────┤
│  ◦ Tenants      : agencies, plans, MRR, provision, suspend   │
│  ◦ Configuration: plan / org / user / branch / role / flags  │
│  ◦ Enforcement  : rule engine status + per-tenant compliance │
│  ◦ Buyers       : per-plan-buyer usage, health, MRR          │
│  ◦ Roles        : per-role activity across all tenants       │
│  ◦ Database     : Supabase connection, schema, mirror status │
├──────────────────────────────────────────────────────────────┤
│ Platform Activity & Audit Stream (allow / deny decisions)    │
└──────────────────────────────────────────────────────────────┘
```

Server side, the same rule set lives in `server/src/platformConfig.ts` (configuration + policy engine) and is applied automatically by the API:

```text
GET   /api/v1/platform/config           current platform configuration (rules, flags, quotas)
PATCH /api/v1/platform/config/rules/:id Super Admin changes mode/value  → audited
PATCH /api/v1/platform/config/flags/:id Super Admin flips a feature flag → audited
GET   /api/v1/platform/enforcement      live compliance report per plan buyer
GET   /api/v1/platform/organizations    plan buyers (seat/branch/storage/MRR/renewal usage)
POST  /api/v1/platform/organizations    provision a tenant (org + HQ branch + AGENCY_OWNER) → audited
PATCH /api/v1/platform/organizations/:id  plan/status change runs through the engine
GET   /api/v1/platform/plans            plan catalog (price, quotas, features, allowedRoles, buyers)
POST  /api/v1/platform/plans            create a plan      → 409 on duplicate code / unknown role / no AGENCY_OWNER
PATCH /api/v1/platform/plans/:id        edit plan          → price change re-prices buyers, role change re-validates
DELETE /api/v1/platform/plans/:id       delete a plan      → 409 while orgs still buy it
GET   /api/v1/platform/roles            per-role users, tenants, actions, logins, denied hits (10 roles)
GET   /api/v1/platform/audit            platform audit events (newest first, limit ≤ 200)
GET   /api/v1/entitlements              tenant view: plan, quotas, allowedRoles, role decision, flags, `modules` (role ∩ plan)
POST  /api/v1/entitlements/plan-request a tenant requests a plan change → PLAN_CHANGE_REQUESTED audit
POST  /api/v1/auth/register             sign-up → org created PENDING, 201 + pendingApproval, NO token (rule-org-approval)
POST  /api/v1/auth/login                sign-in → 403 + rule-org-approval while PENDING, 403 + rule-org-suspension when not ACTIVE
GET   /api/v1/auth/me                   live session → role, plan, org status; 403 on non-ACTIVE org (SUPER_ADMIN bypasses)
POST/PUT/PATCH/DELETE  workspace + documents   suspended-tenant write lock (403 + ruleId)
POST  /api/v1/documents                 vault storage quota (409 + ruleId when over plan)
```

Plan catalog writes are the only place a plan exists: `server/src/platformConfig.ts` caches the catalog (`refreshPlanCatalog()` on boot and after every write), `quotaFor()` reads plan quotas from it (with in-code fallbacks), and `POST /register` validates plan, role access, seats and branches with the same policy engine. Schema for the extra plan columns (`description`, `storageGB`, `allowedRoles`, `sortOrder`, `isActive`) ships in `server/supabase/migrations/0002_plan_catalog.sql`, applied idempotently by the Supabase console's SQL tab or by `POST /api/v1/platform/supabase/setup`.

Every allow/deny decision is written to the platform audit stream, so the console and the API tell the same story.

### 19.6 Boundary of this responsibility

* Super Admin **does not** see supplier cost, agency margin, consultant commission or customer data beyond platform-level metadata (usage, quota, billing, audit).
* Everything else — public site, agency dashboard, every role view, customer portal — stays exactly as designed in §4–§12 and §15.

That structure is what makes the platform **configurable once, enforced everywhere, and observable per buyer and per role**.

### 19.7 Sign-up → approval → plan-gated session (as built)

The two enforcement rules above are wired end to end, from the public site to the sidebar:

```text
 Public site                  API                              Super Admin
 ----------                   ---                              -----------
 choose plan + fill form  →  POST /auth/register
                              org created PENDING
                              201 { pendingApproval, … }  →   "Approve & activate"
                              NO token issued                    │
                                 │                          PATCH /platform/organizations/:id
 "Try signing in"          →  POST /auth/login                 status ACTIVE
                              403 rule-org-approval  ←──────  + audit PLATFORM_ORG_APPROVED
                                 │
                              POST /auth/login
                              200 { token }
                                 │
                              GET /auth/me   → role, plan, org status
                              GET /entitlements → quotas, allowedRoles, modules
                                 │
                              App boots: hydrate session → load entitlements →
                              activeTab = first tab allowed by role ∩ plan
                                 │
                              Sidebar renders every tab, but tabs outside
                              plan.modules are LOCKED (disabled + Lock icon)
                              Navbar → account menu → Sign out
```

* **Plan picker** lives on the public site (signup form and onboarding step 2); the chosen plan id is sent with `POST /auth/register`, so the workspace is provisioned already-billed against the right plan.
* **Access = role ∩ plan.** `src/lib/access.js` holds `PLAN_MODULES` (mirrored server-side by `modulesForPlan()` in `platformConfig.ts`): `STARTER` = core CRM modules, `BUSINESS` = + `visa, vault, finance, suppliers`, `AGENCY_PRO` = + `subagent`; `superadmin` is never a plan module, and the `SUPER_ADMIN` role bypasses plan gating entirely. A plan's role allow-list is chosen entirely by the Super Admin — no role, `AGENCY_OWNER` included, is mandatory — and sign-in, registration and plan changes enforce exactly the roles that plan grants.
* **Fail-open on unknown modules**: plan gating applies only when the session actually carries a module list or a known plan id, so a failed entitlements fetch degrades to role-only access instead of locking the owner out of their own dashboard.
* **Role simulation is Super Admin only**: the Navbar's *Simulate Role (RBAC)* control renders only when the signed-in session identity is `SUPER_ADMIN` — Agency Owner, General Manager and every other role never see it — while any role the plan grants stays selectable so the platform owner can test RBAC end to end and always switch back.
* **Seeded demo**: super admin `nina.v@example.com` / `SafarDesk@2026` (approves), tenant `junaid@karakoramexpress.pk` / `SafarDesk@2026` (owner of a `BUSINESS` org).
* Covered by `cd server && npm run smoke:auth` — 52 checks across register → blocked login → approve → session → entitlements → won-lead conversion → visa case customer/documents round-trip, then cleanup + Supabase reconcile.

# 20. Supabase Data Plane (backend + frontend integration)

The app talks to Supabase as a **real, wired data layer**: credentials live in env files only, the API reads and writes Supabase with the service-role (secret) key through `@supabase/server`, and the browser holds nothing but the publishable key. Local SQLite/Prisma stays the **primary store** (no route rewrites, no regression) while `src/lib/db.js` holds a live Postgres connection to Supabase, every row is **mirrored** there, and a background mirror keeps the copy current.

## 20.1 Credentials (env files, never committed)

| Variable | Where | Purpose |
| --- | --- | --- |
| `SQLITE_URL` | `server/.env` | Local primary store, read by Prisma (`sqlite` provider) |
| `DATABASE_URL` | `server/.env` | Supabase Postgres DSN, read by `server/src/lib/db.js` (mirror writes + schema DDL) |
| `SUPABASE_DB_URL` *(optional)* | `server/.env` | Overrides `DATABASE_URL` for the schema channel if set |
| `SUPABASE_URL` | `server/.env` | Project URL used by `@supabase/server` |
| `SUPABASE_PUBLISHABLE_KEY` | `server/.env` | Browser-safe key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | `server/.env` | Service-role key, server only, bypasses RLS |
| `SUPABASE_JWKS_URL` | `server/.env` | JWKS endpoint for Supabase Auth token verification |
| `SUPABASE_ACCESS_TOKEN` *(optional)* | `server/.env` | Management API PAT (`sbp_...`) as an alternative DDL channel |
| `VITE_SUPABASE_URL` | root `.env` | Browser client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | root `.env` | Browser client |
| `VITE_SUPABASE_JWKS_URL` | root `.env` | Browser reference only |

`.env`, `server/.env` and `*.local` are git-ignored; `.env.example` files carry placeholders only.

### Connection host: pooler, not the direct host

`db.<project-ref>.supabase.co:5432` resolves to an **IPv6-only** record, so it is unreachable from an IPv4-only machine (this development box has no global IPv6 address). The shared pooler is used instead:

```text
# as configured in server/.env (password URL-encoded: @ → %40)
postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

* port `5432` = Supavisor **session** mode (supports prepared statements, fine for migrations) - this project connects to `aws-0-ap-south-1.pooler.supabase.com`
* port `6543` = **transaction** mode (use `prepare:false`, no DDL/migrations)
* pooler usernames carry the ref: `postgres.<project-ref>`, not `postgres`
* an IPv4 add-on on the project would make the direct `db.` host resolve to an A record instead

## 20.2 Data flow

```text
Browser (react)                API (express)                         Supabase
--------------                 -------------                         --------
supabaseClient.js  --publishable-->  health check (auth/v1/health)
api.platform.*     --Bearer JWT-->   platformSupabase routes --secret--> PostgREST (probe/counts/preview)
                                         |                               ^
                                         +-- lib/db.js (postgres) -------+  DDL + row reads over PostgREST-free TCP
                                         +-- supabaseMirror.syncAll() ---+  upsert per table (400/batch)
                                         +-- startBackgroundMirror() ------  every 60s once schema exists
                                         +-- verifySupabaseJwt() <-- JWKS   POST /auth/supabase bridge
```

1. **Write (local → Supabase)**: `server/src/lib/db.js` exports the `postgres` client bound to `DATABASE_URL`; `server/src/lib/supabaseMirror.ts` upserts every Prisma model into Supabase in batches of 400 (`TenantRecord` keyed on `organizationId,collection,id`), and `startBackgroundMirror()` in `server/src/index.ts` re-runs that every 60 seconds so new local rows appear without a manual sync.
2. **Read (Supabase → app)**: `GET /api/v1/platform/supabase/preview` reads real rows back through the service-role client; the status endpoint returns per-table remote counts next to **local** row counts, rendered by the **Supabase Database** console lens as a parity matrix.
3. **Auth**: `POST /api/v1/auth/supabase` verifies a Supabase access token with `verifyAuth()` (JWKS), maps the email to a local user, issues the app token and audits `LOGIN`.

## 20.3 Applying the schema (done once)

API keys **cannot** run DDL, so the app ships two idempotent migrations under `server/supabase/migrations/` — `0001_init.sql` (generated from `server/supabase/schema.prisma` with `prisma migrate diff --from-empty`, plus appended `ENABLE ROW LEVEL SECURITY` on all 8 tables) and `0002_plan_catalog.sql` (the plan-catalog columns `description`, `storageGB`, `allowedRoles`, `sortOrder`, `isActive`) — and offers three channels:

* **`DATABASE_URL` (active on this project)** - `POST /api/v1/platform/supabase/setup` runs both migrations through `src/lib/db.js`: `0001` only when the tables are missing, `0002` only when `Plan.storageGB` is missing. It is idempotent (an existing schema reports "already present" instead of failing).
* **SQL Editor (no secrets)** - Platform Console, *Supabase Database*, *Open SQL Editor (schema prefilled)* opens `https://supabase.com/dashboard/project/<ref>/sql/new?content=<urlencoded SQL>`; press Run. *Copy SQL* is the paste fallback.
* **`SUPABASE_ACCESS_TOKEN`** - same endpoint via the Management API query endpoint.

A successful `setup` immediately runs a full sync. Both actions are audited (`PLATFORM_SUPABASE_SETUP`, `PLATFORM_SUPABASE_SYNC`).

## 20.4 API surface (all behind `requireAuth` + `platform.admin`)

```text
GET  /api/v1/platform/supabase          env + probe + local counts + setup info (host, DSN var, mirror interval)
GET  /api/v1/platform/supabase/sql      raw migration SQL (text/plain)
GET  /api/v1/platform/supabase/preview  read N rows back out of a table (400 on unknown table)
POST /api/v1/platform/supabase/setup    apply schema (idempotent) -> then sync
POST /api/v1/platform/supabase/sync     mirror all tables -> per-table counts/errors
POST /api/v1/auth/supabase              Supabase Auth JWT -> app token
```

## 20.5 Security boundaries

* Secret key never reaches the browser; the browser client (`src/lib/supabaseClient.js`) is built from the publishable key only, with `persistSession:false`.
* All 8 tables have RLS enabled and no policies, so only the service-role client (server) can read or write; `anon`/`authenticated` get nothing by default.
* The Postgres password lives only in `server/.env` (git-ignored) and is URL-encoded inside the DSN.
* Platform endpoints are guarded by the same `platform.admin` (SUPER_ADMIN only) permission as the rest of §19.
* Health from the browser: `GET {SUPABASE_URL}/auth/v1/health` with the publishable key, surfaced as the **Browser** tile in the console.

## 20.6 Verification

```bash
cd server && npx tsc --noEmit     # 0 errors (production build: npm run build → node dist/index.js)
cd server && npm test             # tenant isolation (Prisma on SQLITE_URL)
npm run build                     # frontend builds with the console lens
```

Endpoint smoke (login, status, sql, idempotent setup, sync, preview, auth bridge, auth guard) passes **8/8**, and a 70-second observation confirms the background mirror closes the local-vs-Supabase row gap on its own (all 8 tables at parity). The full suite currently reads: `smoke:plans` **55/55**, `smoke:auth` **41/41**, `smoke:supabase` **8/8**, `npm test` pass, `npx tsc --noEmit` **0**, `npm run build` pass — with Organization 4/4, Branch 4/4, User 7/7, AuditLog and Plan at parity after every reconcile.

## 20.7 Ops scripts (smoke + parity repair)

```bash
cd server
npm run smoke:plans      # 55 checks: plan CRUD, quotas, role access, provisioning, entitlements
npm run smoke:auth       # 52 checks: sign-up PENDING → approval → session → role/plan modules → won-lead conversion → visa case customer/documents
npm run smoke:supabase   # 8 checks: Supabase setup/sync/preview + auth bridge + admin guard
npm run db:reconcile     # dry run: rows that exist only locally or only in Supabase
npm run db:reconcile -- --apply   # push local rows, then delete remote-only leftovers
npm run db:cleanup-smoke # remove tenants provisioned by the smoke suites (cascades)
```

`smoke:plans` and `smoke:auth` each provision a real tenant to exercise the platform routes, so on success they remove that tenant locally and run `db:reconcile --apply` — parity (Organization/Branch/User/AuditLog/Plan, local vs Supabase) holds after every run. The mirror upserts, which is why deletes need the reconcile step.
