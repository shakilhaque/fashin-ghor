# instructions.md
# Enterprise E-Commerce Platform Specification
> Build a modern fashion e-commerce platform inspired by the business workflow of https://stylemartbrand.com but with a completely original UI, UX, branding, color palette, components, and codebase.

## 1. Project Goal
Develop a production-ready e-commerce application.

### Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript
- Backend: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Cache: Redis
- Queue: BullMQ
- Storage: S3 compatible
- Auth: JWT + Refresh Token
- Payment: SSLCommerz, bKash, Nagad, Stripe
- Email: Resend
- SMS: SSL Wireless

## 2. Architecture
Frontend
- app/
- components/
- hooks/
- services/
- lib/
- types/

Backend
- auth
- users
- products
- brands
- categories
- inventory
- orders
- payments
- shipping
- coupons
- reviews
- blog
- dashboard
- notifications
- analytics
- settings

## 3. UI Design
Do NOT copy the reference website.

Theme:
- White
- Charcoal
- Emerald Accent

Design:
- Premium minimal
- Large photography
- Rounded cards
- Smooth animations
- Mobile first

## 4. Public Pages
- Home
- Shop
- Category
- Brand
- New Arrival
- Best Seller
- Flash Sale
- Search
- Product Details
- Cart
- Checkout
- Order Tracking
- Wishlist
- Compare
- Blog
- About
- Contact
- FAQ
- Privacy
- Terms

## 5. Authentication
Customer
Admin
Manager
Warehouse
Support

Features
- Login
- Register
- OTP
- Forgot Password
- Refresh Token
- Social Login (optional)

## 6. Product Module
Fields:
- SKU
- Barcode
- Name
- Slug
- Description
- Brand
- Category
- Gender
- Season
- Color
- Size
- Material
- Tags
- Cost
- Price
- Discount
- VAT
- Stock
- Images
- Videos
- SEO

Support:
- Variants
- Bundles
- Digital flags
- Featured

## 7. Inventory
- Warehouses
- Purchase
- Stock Transfer
- Adjustment
- Damage
- Low Stock Alert
- Serial/Lot optional

## 8. Orders
Lifecycle:
Pending
Confirmed
Packed
Shipped
Delivered
Cancelled
Returned
Refunded

## 9. Payments
Implement gateway abstraction.

## 10. Shipping
- Zones
- Rates
- Courier integration abstraction
- Tracking number

## 11. Coupons
- Fixed
- Percentage
- Buy X Get Y
- Free Shipping

## 12. Reviews
- Rating
- Verified Purchase
- Images
- Moderation

## 13. Blog CMS
CRUD
SEO
Categories
Tags

## 14. Admin Dashboard
Statistics:
Revenue
Orders
Customers
Products
Conversion
Top Selling

Management:
Products
Orders
Inventory
Users
Coupons
Blog
Settings
Roles
Audit Logs

## 15. RBAC
Super Admin
Admin
Manager
Warehouse
Support
Customer

## 16. Database (Core Tables)
users
roles
permissions
products
product_images
brands
categories
attributes
attribute_values
variants
warehouses
inventory
orders
order_items
payments
addresses
wishlists
carts
cart_items
reviews
blogs
coupons
coupon_usages
notifications
settings
audit_logs

## 17. API Standards
REST
/api/v1

Response
{
 success,
 message,
 data,
 meta
}

## 18. Security
Helmet
Rate limiting
CORS
Validation
Parameterized queries
JWT rotation
CSRF where applicable
Password hashing
Audit logs
Signed upload URLs

## 19. SEO
SSR
Metadata API
JSON-LD
Canonical
Sitemap
Robots
OpenGraph

## 20. Performance
Image optimization
Lazy loading
Redis cache
Pagination
CDN

## 21. Testing
Unit
Integration
E2E
Load testing

## 22. Deployment
Docker
GitHub Actions
Nginx
PM2
Monitoring
Backups

## 23. Coding Standards
SOLID
Clean Architecture
Repository Pattern
DTO validation
Strict TypeScript
ESLint
Prettier

## 24. Claude Implementation Rules

Claude must:
1. Build one module at a time.
2. Never generate placeholder code.
3. Every API must include DTO, validation, Swagger documentation, service, controller, repository, tests.
4. Every page must be responsive.
5. Use reusable UI components.
6. Use optimistic updates where appropriate.
7. Implement proper error handling.
8. Generate Prisma migrations.
9. Include seed data.
10. Follow enterprise folder structure.

## 25. Development Order
1. Authentication
2. Users
3. Categories
4. Brands
5. Products
6. Inventory
7. Cart
8. Checkout
9. Orders
10. Payments
11. Shipping
12. Reviews
13. Blog
14. Dashboard
15. Notifications
16. Analytics
17. SEO
18. Testing
19. Deployment

## Final Goal
The final system should be a scalable enterprise-grade fashion e-commerce platform with original branding and UX inspired only by the business requirements of the reference website, not its visual implementation.
