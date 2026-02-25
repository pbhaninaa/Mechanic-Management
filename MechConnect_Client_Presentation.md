# MechConnect
## Automotive Services Platform – Client Presentation

---

## Executive Summary

**MechConnect** is a unified web platform that connects vehicle owners with mechanic services and car wash providers. The system streamlines booking, payments, and service tracking across a single dashboard—improving convenience for clients and operational efficiency for mechanics and car wash operators.

**Target users:** Vehicle owners, mechanics, car wash operators, and administrators.

---

## The Problem We Solve

| Challenge | MechConnect Solution |
|-----------|----------------------|
| Scattered booking processes | One platform for mechanic requests and car wash bookings |
| Unclear payment flows | Integrated payment system with clear status tracking |
| Poor visibility into earnings | Dashboards and earnings reports for service providers |
| Manual status updates | Transparent status tracking from request to completion |
| Limited oversight | Admin tools for users, bookings, and payments |

---

## Platform Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MechConnect Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CLIENTS          MECHANICS         CAR WASHES        ADMIN     │
│   ───────          ─────────         ──────────        ─────     │
│   • Request        • View jobs      • Accept          • Users   │
│     mechanic       • Accept/          bookings       • Payments │
│   • Book car         decline       • Manage washes   • Reports  │
│     wash           • Track         • Track earnings   • Oversight│
│   • Pay & track      earnings                                     │
│     services                                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### For Clients

| Feature | Description |
|---------|-------------|
| **Mechanic Requests** | Submit requests (type, location, date). Mechanics accept or decline. Pay once accepted. |
| **Car Wash Booking** | Choose car type, services (Full Wash, Waxing, Detailing, etc.), location, and date. See pricing before booking. |
| **Service History** | View past mechanic requests and car wash bookings. |
| **My Washes** | Track car wash status (Pending → Accepted → Paid → In Progress → Completed). |
| **Payments** | Secure payment flow for mechanic and car wash services. |
| **Help** | Built-in support resources. |

### For Mechanics

| Feature | Description |
|---------|-------------|
| **Job Requests** | See incoming requests. Accept or decline. |
| **Earnings** | View earnings by job. |
| **Profile** | Manage contact details and availability. |

### For Car Wash Operators

| Feature | Description |
|---------|-------------|
| **Bookings** | Accept and manage car wash bookings from clients. |
| **Manage Washes** | Update status: Accepted → Paid → In Progress → Completed. |
| **Earnings** | Track earnings per booking. |

### For Administrators

| Feature | Description |
|---------|-------------|
| **User Management** | Create, view, and manage users and roles. |
| **Payments & Earnings** | Monitor payments and earnings across the platform. |
| **Request Management** | Oversee mechanic requests and car wash bookings. |
| **Reports & Dashboards** | Summary views and charts for platform activity. |

---

## Car Wash Services & Pricing

| Service Type | Examples | Base Price Range |
|--------------|----------|------------------|
| Full Wash | Complete exterior and interior | R50–R300+ |
| Exterior | Exterior wash only | |
| Interior | Interior cleaning | |
| Engine Wash | Engine bay cleaning | |
| Valet | Full valet service | |
| Waxing / Polish / Detailing | Premium treatments | |
| Leather Treatment | Interior leather care | |

**Car types supported:** Sedan, SUV, Hatchback, Bakkie, Van, Truck, Luxury, Electric, Hybrid, and more.

---

## Service Workflows

### Mechanic Service Flow

```
Client submits request  →  Mechanic sees request  →  Mechanic accepts/declines
         ↓                           ↓
   (Service type,              (Job Requests page)
    location, date)
         ↓
Client pays when accepted  →  Payment processed  →  Service completed
```

### Car Wash Flow

```
Client books wash  →  Car wash accepts  →  Client pays  →  Status updates
     ↓                     ↓                   ↓              ↓
(Car type,          (Bookings page)      (My Washes)    Paid → In Progress
 services,                                                    → Completed
 location, date)
```

---

## Location & Convenience

- **GPS-based:** “Use My Current Location” for quick booking.
- **Manual address:** Enter address if preferred.
- **Map view:** Directions to service locations for mechanics and car wash staff.

---

## Role-Based Dashboards

Each role has a dedicated dashboard with:

- Summary metrics (bookings, payments, earnings).
- Charts and analytics.
- Quick actions relevant to the role.

---

## Technical Overview

| Component | Technology |
|-----------|------------|
| **Frontend** | Vue 3, Vuetify 3, Vite |
| **Backend** | Java / Spring Boot, REST API |
| **Authentication** | JWT (secure login) |
| **Charts & Maps** | Chart.js, ECharts, Leaflet |
| **Currency** | South African Rand (R) |

---

## User Roles Summary

| Role | Primary Capabilities |
|------|----------------------|
| **CLIENT** | Request mechanic, book car wash, view history, pay, get help |
| **MECHANIC** | View jobs, accept/decline, track earnings |
| **CARWASH** | Accept bookings, manage washes, track earnings |
| **ADMIN** | User management, payments, reports, oversight |

---

## Benefits at a Glance

### For Clients
- One platform for mechanic and car wash needs
- Transparent pricing and status tracking
- Easy payment and service history
- Support via Help resources

### For Mechanics
- Direct access to clients
- Clear job flow
- Earnings visibility

### For Car Wash Operators
- Centralized booking management
- Status control (Paid → In Progress → Completed)
- Earnings overview

### For Your Business
- Centralized operations
- User and payment oversight
- Analytics and reporting
- Scalable, modern architecture

---

## Next Steps

1. **Demo** – Schedule a live walkthrough.
2. **Environment** – Confirm development, UAT, or production setup.
3. **Customization** – Branding, pricing, and feature adjustments.
4. **Training** – User guides for each role.
5. **Support** – Define support process and contacts.

---

## Contact & Support

For technical support, customization requests, or additional information about MechConnect, please reach out to your project team.

---

*MechConnect – Connecting clients with reliable automotive services.*

---

**Document Version:** 1.0  
**Last Updated:** February 2025
