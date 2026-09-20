# ShopMart Backend

A secure and scalable Node.js + Express.js backend for the **ShopMart Flutter E-commerce Application**. It provides REST APIs for user authentication, product management, order processing, admin dashboard, and email-based password reset.

---

## Features

### User APIs

- User Registration
- User Login (JWT Authentication)
- Forgot Password (OTP via Brevo)
- Reset Password
- User Profile
- Product Listing
- Product Details
- Categories
- Banners
- Wishlist Support
- Cart & Checkout
- Place Orders
- My Orders

---

### Admin APIs

- Admin Dashboard
- Revenue Statistics
- User Management
- Product Management
  - Add Product
  - Edit Product
  - Delete Product
- Category Management
  - Add Category
  - Edit Category
  - Delete Category
- Banner Management
  - Add Banner
  - Edit Banner
  - Delete Banner
- Order Management
- Update Order Status
- Low Stock Monitoring

---

## Tech Stack

- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcrypt
- Brevo Email Service
- Railway Deployment

---

## Project Structure

```
ecommerce-backend/
│
├── middleware/
│   ├── auth.js
│   └── admin.js
│
├── index.js
├── package.json
├── package-lock.json
└── .gitignore
```

---

## Environment Variables

Create a `.env` file with the following variables:

```env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

EMAIL_USER=
EMAIL_PASS=
```



## Installation

```bash
git clone https://github.com/Naima-Nasir/ecommerce-backend.git

cd ecommerce-backend

npm install

npm start
```

For development:

```bash
npm run dev
```



## Main API Modules

- Authentication
- Products
- Categories
- Banners
- Orders
- Users
- Admin Dashboard
- Order Status
- Password Reset (OTP)



## Authentication

Protected routes use **JWT (JSON Web Token)**.

After successful login, a JWT token is generated and must be included in the request header:

```
Authorization: Bearer <your_token>
```


## Deployment

- Backend Hosted on Railway
- MySQL Database Hosted Online
- Email OTP powered by Brevo



## Connected Frontend

Flutter Repository:

https://github.com/Naima-Nasir/shopmart-flutter



## Author

**Naima Nasir**

Software Engineering Student



## Future Improvements

- Payment Gateway Integration (JazzCash / Easypaisa)
- Push Notifications
- Product Reviews
- Ratings
- Coupons & Discounts
- Sales Reports
- Inventory Analytics
