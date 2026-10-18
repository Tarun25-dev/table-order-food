<h2 align="center">🍴 DineFlow — Modern Restaurant Management & Table Ordering System</h2>

DineFlow is a full-stack, responsive web application designed for modern dining establishments. It streamlines on-premise dining by allowing customers to explore digital menus, place table-specific orders, and request staff assistance, while providing restaurant operators with a secured, real-time administrative dashboard for kitchen and floor management.

---

## 📺 Project Demo
> [Watch DineFlow Demonstration (MP4)](https://drive.google.com/file/d/1tEfdHqvbfP6uj39V0qVmUNkkz5Of9ilz/view?usp=sharing)

> [Watch DineFlow Live](https://table-order-food.vercel.app/)

---

## ✨ Features
### 📱 Customer Facing
- **Digital Interactive Menu:** Categorized food and beverage listings with real-time availability and dynamic pricing.
- **Table-Specific Ordering:** Clean cart and checkout workflow tied to customer table identifiers.
- **Service & Assistance Calls:** Instant call-staff and bill-request alerts dispatched to the floor team.
### 🛡️ Administrative & Kitchen Dashboard
- **Live Order Management:** Real-time incoming order tracking, kitchen status dispatching, and settlement workflows.
- **Session-Based Authentication:** Protected administrative routes powered by JWT tokens.
- **Catalog & Inventory Control:** Real-time updates to menu item pricing, descriptions, and stock statuses.

---

## 🛠️ Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS, Lucide Icons, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas via Mongoose ODM
- **Real-Time Communication:** Socket.io
- **Deployment:** Vercel (Frontend), Cloud Web Service (Backend)

---

## 📁 Repository Structure

```text
table-order-food/
├── public/                 # Static assets (menu images, brand logos, background art)
├── server/                 # Express backend application
│   ├── src/
│   │   ├── config/         # Database and third-party configurations
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Mongoose schemas & data models
│   │   ├── routes/         # Express API route endpoints
│   │   └── server.ts       # Main server entry file
│   ├── .env                # Backend environment configuration
│   └── package.json
├── src/                    # React frontend application
│   ├── components/         # Reusable UI components & route guards
│   ├── context/            # React context providers (Auth, Cart, UI)
│   ├── pages/              # Routed views (Home, Menu, Admin Login, Dashboard)
│   ├── services/           # API and HTTP client abstractions
│   ├── types/              # Shared TypeScript interfaces & types
│   ├── App.tsx             # Route declarations
│   └── main.tsx            # Frontend bootstrap entry point
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ⚙️ Environment Variables Setup

### 1. Backend (`server/.env`)
Create a `.env` file directly inside the `server/` directory:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 2. Frontend (`.env` in Root)
Create a `.env` file in the project root:

```env
VITE_BACKEND_URL=https://your-backend-service-url.com
```
*(For local development, set `VITE_BACKEND_URL=http://localhost:4000`)*

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas cluster or local MongoDB instance

### 1. Clone Repository
```bash
git clone https://github.com/Tarun25-dev/table-order-food.git
cd table-order-food
```

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
```
The backend server will start on `http://localhost:4000`.

### 3. Frontend Setup
Open a new terminal window in the root directory:
```bash
npm install
npm run dev
```
The client application will start at `http://localhost:5173`.

---
