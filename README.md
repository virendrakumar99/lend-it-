# 🔧 LendIt — Peer-to-Peer Lending & Service Platform

A full-stack app to **borrow tools**, **book home services**, **hire workers**, and **find maids nearby** — all with escrow payments in ₹ INR.

---

## 📁 Project Structure

```
lend it/
├── backend/        ← Node.js + Express + SQLite API (TypeScript)
└── website/        ← Plain HTML / CSS / JS frontend (no framework)
```

---

## 🚀 How to Run

### 1. Start the Backend (Terminal 1)
```bash
cd "c:\Users\ankit\Desktop\lend it\backend"
npx ts-node src/index.ts
```
- API runs at: **http://localhost:3000**
- SQLite DB (`lendit.db`) is auto-created and seeded on first run
- No Docker or PostgreSQL needed

### 2. Start the Website (Terminal 2)
```bash
cd "c:\Users\ankit\Desktop\lend it\website"
npx serve -l 3001 .
```
- Website runs at: **http://localhost:3001**
- Backend must be running for login, bookings, and map to work

---

## 🔐 Login Credentials

### Pre-seeded Users

| Role | Email | Password | Type |
|------|-------|----------|------|
| **Admin** | `admin@lendit.app` | `Admin@123` | Admin panel access |
| **Test User** | `user@lendit.app` | `User@1234` | Regular user (both roles) |

> 🛡️ Admin login is on the **Admin tab** on the login page (`login.html`).  
> Regular users cannot access `/admin.html` — role is verified server-side.

### Sign Up
- Register at `login.html` → choose role: **Borrower**, **Lender**, or **Both**
- Role determines which dashboard panels are shown

---

## 👤 Role-Based Dashboards

| Role | Dashboard Shows |
|------|----------------|
| **Borrower** | My Bookings (live from DB), Explore Services, quick service chips |
| **Lender** | Overview stats, My Listings, Earnings & bookings on their items |
| **Both** | All lender panels + My Borrows tab |

---

## 🛒 Booking Flow

1. Browse listings on **Discover** page or item detail page
2. Select start & end dates → click **Book Now**
3. Pay via UPI / Card / Wallet — payment is simulated but **booking is saved to DB**
4. Booking appears immediately on **Dashboard → My Bookings / My Borrows**

---

## 🗄️ Backend API

Base URL: `http://localhost:3000`

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Server status | None |
| POST | `/api/auth/register` | Sign up with `user_type` | None |
| POST | `/api/auth/login` | Login → returns JWT + user_type | None |
| GET | `/api/auth/me` | Get current user info | JWT |

### Items (Listings)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/items` | All listings (tools + services) | None |
| GET | `/api/items?radius=2&lat=19.076&lon=72.877` | Filter by location | None |
| POST | `/api/items` | Create new listing | JWT |
| PATCH | `/api/items/:id/status` | Update listing status | JWT |

### Bookings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bookings` | My bookings (auto-detects user from JWT) | JWT |
| GET | `/api/bookings/:userId` | Bookings by userId (admin/legacy) | None |
| POST | `/api/bookings` | Create booking | None |
| PATCH | `/api/bookings/:id/status` | Update booking status | None |

### Admin (requires admin JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform stats (users, listings, revenue, role breakdown) |
| GET | `/api/admin/users` | All users with roles, listings, rental count |
| PATCH | `/api/admin/users/:id/status` | Suspend / activate user |
| GET | `/api/admin/listings` | All listings with owner info |
| PATCH | `/api/admin/listings/:id/status` | Flag / approve listing |
| GET | `/api/admin/transactions` | Recent bookings/transactions |

### Payments & Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/escrow` | Mock escrow hold |
| POST | `/api/payments/capture` | Mock escrow release |
| GET | `/api/chat/conversations` | User's chat list |
| POST | `/api/chat/messages` | Send message |

---

## 🗂️ Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Landing page with hero, service categories, map |
| Discover | `discover.html` | Leaflet map + listings grid with filters |
| Item Detail | `item.html` | Item info, date picker, Book Now button |
| Dashboard | `dashboard.html` | Role-based user dashboard |
| Chat | `chat.html` | Real-time chat with lenders (Socket.IO) |
| List Tool | `list-tool.html` | Form to add a new listing |
| Login / Signup | `login.html` | Email+password auth, role selector |
| Admin Panel | `admin.html` | Full admin dashboard (admin role only) |

---

## 🏠 Service Categories

Beyond tools, LendIt supports:
- 🧹 **Find Maid** — book household maids
- 🏠 **Home Services** — plumbers, electricians, cleaners
- 👷 **Hire Worker** — daily labour for home/construction
- 👨‍🍳 **Home Cook** — find personal cooks
- 🔨 **Borrow Tools** — traditional peer-to-peer tool lending
- ➕ **Check More** — all categories on discover page

---

## 🛡️ Admin Panel Features

- 📊 **Overview** — total users, listings, active rentals, revenue, role breakdown (borrowers/lenders/both), escrow balance
- 👥 **Users** — full table with role badges, listing count, suspend/activate buttons, live search
- 📦 **Listings** — all items with approve/flag actions, filter by status
- 💳 **Transactions** — recent bookings from DB with status
- ⚠️ **Reports** — flagged items
- ⚖️ **Disputes** — escrow dispute resolution
- 💰 **Revenue** — platform fee analytics
- ⚙️ **Settings** — service fee, escrow hold period, UPI toggle

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom), Vanilla JS |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Maps | Leaflet.js + OpenStreetMap |
| Real-time | Socket.IO |
| Fonts | Google Fonts – Outfit |

---

## 📦 DB Schema (SQLite)

```sql
users       — user_id, name, email, password_hash, phone, role, user_type, rating_avg, is_verified, created_at
items       — item_id, title, icon, description, price_per_day, deposit_amount, category, service_type, status, owner_id, lat, lon, created_at
bookings    — booking_id, item_id, borrower_id, start_date, end_date, total_price, status, created_at
messages    — message_id, sender_id, receiver_id, content, created_at
```

---

## 🔑 JWT Payload

```json
{
  "userId": 1,
  "email": "user@lendit.app",
  "role": "user",
  "name": "Vishal",
  "user_type": "both"
}
```

---

*Built with ❤️ · All prices in ₹ INR · Mumbai, India*
