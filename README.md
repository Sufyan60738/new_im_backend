# Inventory Management Backend - Setup Guide

## 📋 Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🚀 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd Inventory-Management-Backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=inventory_management
DB_PORT=3306

JWT_SECRET=your-secret-key-here
MAX_FILE_SIZE=10485760
SWAGGER_ENABLED=true
```

### 4. Database Setup
Create the database:
```sql
CREATE DATABASE inventory_management;
```

Import the database schema (if you have a SQL file):
```bash
mysql -u root -p inventory_management < database.sql
```

### 5. Start the server
```bash
# Development
npm start

# Production
NODE_ENV=production npm start
```

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

## 🔐 Security Features

- ✅ Input validation with Joi
- ✅ Centralized error handling
- ✅ Environment variables for sensitive data
- ✅ Connection pooling for database
- ✅ File upload validation

## 📖 API Endpoints

### Banks
- `GET /api/bank` - Get all banks
- `GET /api/bank/:id` - Get bank by ID
- `POST /api/bank` - Create new bank
- `PUT /api/bank/:id` - Update bank
- `DELETE /api/bank/:id` - Delete bank

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/customer/:id` - Get customer payments
- `POST /api/payments` - Create new payment
- `PUT /api/payments/status/:id` - Update payment status
- `DELETE /api/payments/:id` - Delete payment

### Ledger
- `GET /api/ledger/customer/:customer_id` - Get customer ledger
- `GET /api/ledger/customers-summary` - Get all customers summary
- `POST /api/ledger/add-payment` - Add payment entry
- `GET /api/ledger/statistics` - Get ledger statistics

## 🛠️ Development

### Code Structure
```
src/
├── config/
│   ├── db.js           # Database configuration
│   └── swagger.js      # API documentation config
├── controllers/        # Business logic
├── middleware/         # Custom middleware
│   ├── errorHandler.js
│   ├── validation.js
│   └── validateRequest.js
├── routes/            # API routes
└── utils/             # Utility functions
```

### Best Practices
- All controllers use async/await
- Input validation on all POST/PUT endpoints
- Centralized error handling
- Connection pooling for database
- Environment-based configuration

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 📝 License

MIT

## 👥 Contributors

- Your Name

## 🐛 Issues

Report issues at: <repository-issues-url>
