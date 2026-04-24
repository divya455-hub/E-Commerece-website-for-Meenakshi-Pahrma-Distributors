# E-Pharmacy Backend API

Meenakshi Pharma Distributors — Node.js/Express/MongoDB backend.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Or start production server
npm start
```

Server runs on `http://localhost:5000`. Requires MongoDB running on `mongodb://localhost:27017/epharmacy`.

---

## Project Structure

```
backend/
├── server.js                     # Entry point
├── config/db.js                  # MongoDB connection
├── models/                       # Mongoose schemas (11 models)
├── middleware/
│   ├── auth.js                   # JWT authentication
│   └── roleCheck.js              # Role-based access
├── utils/
│   ├── generateToken.js          # JWT token generation
│   ├── generateOrderNumber.js    # Unique order numbers
│   └── invoiceGenerator.js       # PDF invoices (PDFKit)
├── routes/                       # Customer-facing routes
│   ├── auth.js, users.js, categories.js, products.js
│   ├── inventory.js, cart.js, orders.js, prescriptions.js
│   ├── payments.js, invoices.js, notifications.js
│   └── admin/                    # Admin-only routes
│       ├── dashboard.js, products.js, orders.js
│       ├── prescriptions.js, inventory.js
└── uploads/                      # File storage
    ├── prescriptions/
    └── invoices/
```

---

## API Testing with Curl

### Prerequisites

1. MongoDB running locally
2. Server running: `npm run dev`
3. Save tokens from responses into shell variables for reuse

---

### 1. Health Check

```bash
curl -s http://localhost:5000/api/health | python3 -m json.tool
```

---

### 2. Authentication

#### Register Customer

```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@test.com",
    "password": "password123",
    "phone": "9876543210",
    "dateOfBirth": "1995-05-15",
    "gender": "male"
  }' | python3 -m json.tool
```

Save the `access_token` from the response:

```bash
CUST_TOKEN="<paste access_token here>"
```

#### Login

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@test.com", "password": "password123"}' | python3 -m json.tool
```

#### Test Invalid Login

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@test.com", "password": "wrongpassword"}' | python3 -m json.tool
# Expected: 401 "Incorrect email or password"
```

#### Refresh Token

```bash
curl -s -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<paste refresh_token here>"}' | python3 -m json.tool
```

---

### 3. Setup Admin User

Register an admin, then promote via mongosh:

```bash
# Register
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Super",
    "lastName": "Admin",
    "email": "mpdsalem@gmail.com",
    "password": "admin12345",
    "phone": "9999999999"
  }' > /dev/null

# Promote to admin role
mongosh epharmacy --quiet --eval 'db.users.updateOne({email:"mpdsalem@gmail.com"},{$set:{role:"admin"}})'

# Login as admin
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mpdsalem@gmail.com", "password": "admin12345"}' | python3 -m json.tool
```

Save the admin token:

```bash
ADMIN_TOKEN="<paste access_token here>"
```

---

### 4. User Profile & Addresses

#### Get Profile

```bash
curl -s http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Update Profile

```bash
curl -s -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Johnny", "phone": "9876500000"}' | python3 -m json.tool
```

#### Add Address

```bash
curl -s -X POST http://localhost:5000/api/users/addresses \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "home",
    "addressLine1": "123 Main Street",
    "addressLine2": "Apt 4",
    "city": "Salem",
    "state": "Tamil Nadu",
    "zipCode": "636001",
    "country": "India",
    "isDefault": true
  }' | python3 -m json.tool
```

Save the address `_id`:

```bash
ADDR_ID="<paste _id here>"
```

#### List Addresses

```bash
curl -s http://localhost:5000/api/users/addresses \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Update Address

```bash
curl -s -X PUT "http://localhost:5000/api/users/addresses/$ADDR_ID" \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"city": "Chennai"}' | python3 -m json.tool
```

#### Delete Address

```bash
curl -s -X DELETE "http://localhost:5000/api/users/addresses/$ADDR_ID" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

---

### 5. Categories (Admin CRUD + Public Read)

#### Create Category (Admin)

```bash
curl -s -X POST http://localhost:5000/api/admin/products/categories \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pain Relief", "description": "Medications for pain management"}' | python3 -m json.tool
```

Save the category `_id`:

```bash
CAT_ID="<paste _id here>"
```

#### List Categories (Public)

```bash
curl -s http://localhost:5000/api/categories | python3 -m json.tool
```

#### Update Category (Admin)

```bash
curl -s -X PUT "http://localhost:5000/api/admin/products/categories/$CAT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}' | python3 -m json.tool
```

#### Delete Category (Admin)

```bash
curl -s -X DELETE "http://localhost:5000/api/admin/products/categories/$CAT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
# Fails if products are linked to this category
```

---

### 6. Products (Admin CRUD + Public Read)

#### Create Product (Admin)

```bash
# OTC product (no prescription)
curl -s -X POST http://localhost:5000/api/admin/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Paracetamol 500mg\",
    \"description\": \"Pain reliever and fever reducer\",
    \"sku\": \"PARA500\",
    \"category\": \"$CAT_ID\",
    \"manufacturer\": \"GSK Pharma\",
    \"requiresPrescription\": false,
    \"hsnCode\": 3004.90,
    \"gstRate\": 12,
    \"price\": 45.00,
    \"costPrice\": 30.00
  }" | python3 -m json.tool
```

```bash
# Prescription product
curl -s -X POST http://localhost:5000/api/admin/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Amoxicillin 500mg\",
    \"description\": \"Broad spectrum antibiotic\",
    \"sku\": \"AMOX500\",
    \"category\": \"$CAT_ID\",
    \"manufacturer\": \"Cipla\",
    \"requiresPrescription\": true,
    \"hsnCode\": 3004.20,
    \"gstRate\": 12,
    \"price\": 150.00,
    \"costPrice\": 100.00
  }" | python3 -m json.tool
```

Save product IDs:

```bash
PROD1_ID="<OTC product _id>"
PROD2_ID="<Rx product _id>"
```

#### List Products (Public — with stock info)

```bash
curl -s "http://localhost:5000/api/products" | python3 -m json.tool
```

#### Search Products

```bash
curl -s "http://localhost:5000/api/products?search=paracetamol" | python3 -m json.tool
```

#### Filter by Category / Price

```bash
curl -s "http://localhost:5000/api/products?category=$CAT_ID&minPrice=10&maxPrice=100" | python3 -m json.tool
```

#### Get Product Detail (with batches)

```bash
curl -s "http://localhost:5000/api/products/$PROD1_ID" | python3 -m json.tool
```

#### Update Product (Admin)

```bash
curl -s -X PUT "http://localhost:5000/api/admin/products/$PROD1_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": 50, "isFeatured": true}' | python3 -m json.tool
```

#### Deactivate Product (Admin — soft delete)

```bash
curl -s -X DELETE "http://localhost:5000/api/admin/products/$PROD1_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

---

### 7. Inventory (Admin)

#### Add Inventory Batch

```bash
curl -s -X POST http://localhost:5000/api/admin/inventory \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"product\": \"$PROD1_ID\",
    \"batchNumber\": \"BATCH-001\",
    \"quantityInStock\": 100,
    \"lowStockThreshold\": 10,
    \"expiryDate\": \"2027-06-15\",
    \"costPrice\": 30,
    \"sellingPrice\": 45
  }" | python3 -m json.tool
```

#### Get Inventory for a Product (Public)

```bash
curl -s "http://localhost:5000/api/inventory/$PROD1_ID" | python3 -m json.tool
```

#### Inventory Summary (Admin)

```bash
curl -s http://localhost:5000/api/admin/inventory/summary \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

#### Filter: Low Stock / Expiring Soon (Admin)

```bash
curl -s "http://localhost:5000/api/admin/inventory?lowStock=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

curl -s "http://localhost:5000/api/admin/inventory?expiring=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

---

### 8. Cart

#### Add to Cart

```bash
curl -s -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\": \"$PROD1_ID\", \"quantity\": 3}" | python3 -m json.tool
```

#### Get Cart (with stock info)

```bash
curl -s http://localhost:5000/api/cart \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Cart Summary

```bash
curl -s http://localhost:5000/api/cart/summary \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Update Cart Item Quantity

```bash
ITEM_ID="<paste cart item _id here>"
curl -s -X PUT "http://localhost:5000/api/cart/$ITEM_ID" \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}' | python3 -m json.tool
```

#### Remove Cart Item

```bash
curl -s -X DELETE "http://localhost:5000/api/cart/$ITEM_ID" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Clear Cart

```bash
curl -s -X DELETE http://localhost:5000/api/cart \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

---

### 9. Orders

#### Place Order

```bash
curl -s -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"shippingAddressId\": \"$ADDR_ID\",
    \"paymentMethod\": \"card\",
    \"orderType\": \"delivery\"
  }" | python3 -m json.tool
```

Save the order `_id`:

```bash
ORDER_ID="<paste _id here>"
```

> **What happens on order placement:**
> - Stock deducted from inventory (FIFO by expiry)
> - GST tax calculated per HSN code
> - Shipping: ₹40 (free above ₹500)
> - Cart cleared
> - Payment record created
> - Notifications sent to customer + admin

#### List My Orders

```bash
curl -s http://localhost:5000/api/orders \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Filter by Status

```bash
curl -s "http://localhost:5000/api/orders?status=pending" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Get Order Detail (with payments)

```bash
curl -s "http://localhost:5000/api/orders/$ORDER_ID" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Cancel Order

```bash
curl -s -X POST "http://localhost:5000/api/orders/$ORDER_ID/cancel" \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Changed my mind"}' | python3 -m json.tool
# Restores inventory, creates refund (10% cancellation fee)
```

#### Order Stats

```bash
curl -s http://localhost:5000/api/orders/stats/me \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

---

### 10. Admin — Order Management

#### List All Orders

```bash
curl -s http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

#### Get Order Detail (Admin view)

```bash
curl -s "http://localhost:5000/api/admin/orders/$ORDER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

#### Update Order Status

Status pipeline: `pending → confirmed → processing → shipped → delivered`

```bash
# Ship
curl -s -X PUT "http://localhost:5000/api/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}' | python3 -m json.tool

# Deliver (auto-generates invoice PDF)
curl -s -X PUT "http://localhost:5000/api/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered"}' | python3 -m json.tool
```

---

### 11. Prescriptions

#### Upload Prescription (Customer)

```bash
curl -s -X POST http://localhost:5000/api/prescriptions/upload \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -F "prescription=@/path/to/prescription.jpg" \
  -F "productIds=$PROD2_ID" \
  -F "quantities=2" | python3 -m json.tool
```

Save the prescription `_id`:

```bash
RX_ID="<paste _id here>"
```

#### List My Prescriptions

```bash
curl -s http://localhost:5000/api/prescriptions \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Filter by Status

```bash
curl -s "http://localhost:5000/api/prescriptions?status=pending" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Admin — List All Prescriptions

```bash
curl -s http://localhost:5000/api/admin/prescriptions \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

#### Admin — Approve Prescription

```bash
curl -s -X PUT "http://localhost:5000/api/admin/prescriptions/$RX_ID/verify" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "verificationNotes": "Valid prescription from Dr. Smith"}' | python3 -m json.tool
```

#### Admin — Reject Prescription

```bash
curl -s -X PUT "http://localhost:5000/api/admin/prescriptions/$RX_ID/verify" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "rejected", "verificationNotes": "Prescription expired"}' | python3 -m json.tool
```

---

### 12. Payments

#### Get Payments for an Order

```bash
curl -s "http://localhost:5000/api/payments/order/$ORDER_ID" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Process Dummy Payment

```bash
curl -s -X POST http://localhost:5000/api/payments/process \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\": \"$ORDER_ID\", \"method\": \"upi\"}" | python3 -m json.tool
```

---

### 13. Invoices

#### Generate Invoice

```bash
curl -s -X POST "http://localhost:5000/api/invoices/generate/$ORDER_ID" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Get Invoice Info

```bash
curl -s "http://localhost:5000/api/invoices/$ORDER_ID" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Download Invoice PDF

```bash
curl -o invoice.pdf "http://localhost:5000/api/invoices/$ORDER_ID/download" \
  -H "Authorization: Bearer $CUST_TOKEN"
```

---

### 14. Notifications

#### List Notifications

```bash
curl -s http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Unread Only

```bash
curl -s "http://localhost:5000/api/notifications?unread=true" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Mark as Read

```bash
NOTIF_ID="<notification _id>"
curl -s -X PUT "http://localhost:5000/api/notifications/$NOTIF_ID/read" \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

#### Mark All as Read

```bash
curl -s -X PUT http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool
```

---

### 15. Admin Dashboard

```bash
curl -s http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

Returns: `totalOrders`, `totalSales`, `totalCustomers`, `totalProducts`, `ordersByStatus`, `lowStockAlerts`, `expiryAlerts`, `recentOrders`, `unreadNotifications`.

---

## Full End-to-End Test Script

Run this to test the entire flow in one go:

```bash
#!/bin/bash
# E-Pharmacy Full API Test Script
BASE="http://localhost:5000"

echo "=== 1. Health Check ==="
curl -s $BASE/api/health | python3 -m json.tool

echo -e "\n=== 2. Register Customer ==="
CUST=$(curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@test.com","password":"test12345","phone":"1234567890"}')
echo "$CUST" | python3 -m json.tool
CUST_TOKEN=$(echo "$CUST" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

echo -e "\n=== 3. Register & Promote Admin ==="
curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"firstName":"Admin","lastName":"User","email":"admin@test.com","password":"admin12345","phone":"0000000000"}' > /dev/null
mongosh epharmacy --quiet --eval 'db.users.updateOne({email:"admin@test.com"},{$set:{role:"admin"}})'
ADM=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin12345"}')
ADMIN_TOKEN=$(echo "$ADM" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

echo -e "\n=== 4. Add Address ==="
ADDR=$(curl -s -X POST $BASE/api/users/addresses -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"addressLine1":"123 Test St","city":"Salem","state":"TN","zipCode":"636001","country":"India","isDefault":true}')
echo "$ADDR" | python3 -m json.tool
ADDR_ID=$(echo "$ADDR" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")

echo -e "\n=== 5. Create Category ==="
CAT=$(curl -s -X POST $BASE/api/admin/products/categories -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Test Category","description":"For testing"}')
echo "$CAT" | python3 -m json.tool
CAT_ID=$(echo "$CAT" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")

echo -e "\n=== 6. Create Product ==="
PROD=$(curl -s -X POST $BASE/api/admin/products -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Med\",\"sku\":\"TEST001\",\"category\":\"$CAT_ID\",\"manufacturer\":\"TestCo\",\"price\":100,\"costPrice\":70}")
echo "$PROD" | python3 -m json.tool
PROD_ID=$(echo "$PROD" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")

echo -e "\n=== 7. Add Inventory ==="
curl -s -X POST $BASE/api/admin/inventory -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product\":\"$PROD_ID\",\"batchNumber\":\"B001\",\"quantityInStock\":50,\"expiryDate\":\"2027-12-31\",\"costPrice\":70,\"sellingPrice\":100}" | python3 -m json.tool

echo -e "\n=== 8. Add to Cart ==="
curl -s -X POST $BASE/api/cart -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" -d "{\"productId\":\"$PROD_ID\",\"quantity\":2}" | python3 -m json.tool

echo -e "\n=== 9. Place Order ==="
ORD=$(curl -s -X POST $BASE/api/orders -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shippingAddressId\":\"$ADDR_ID\",\"paymentMethod\":\"card\"}")
echo "$ORD" | python3 -m json.tool
ORD_ID=$(echo "$ORD" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")

echo -e "\n=== 10. Admin: Ship → Deliver ==="
curl -s -X PUT "$BASE/api/admin/orders/$ORD_ID/status" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"shipped"}' | python3 -m json.tool
curl -s -X PUT "$BASE/api/admin/orders/$ORD_ID/status" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"delivered"}' | python3 -m json.tool

echo -e "\n=== 11. Notifications ==="
curl -s $BASE/api/notifications -H "Authorization: Bearer $CUST_TOKEN" | python3 -m json.tool

echo -e "\n=== 12. Dashboard ==="
curl -s $BASE/api/admin/dashboard -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

echo -e "\n✅ All tests completed!"
```

---

## Environment Variables (.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/epharmacy
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d
ADMIN_EMAIL=mpdsalem@gmail.com
```

## Reset Database

```bash
mongosh epharmacy --eval 'db.dropDatabase()'
```
