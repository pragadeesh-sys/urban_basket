# UrbanBasket

UrbanBasket is a supermarket system for one store: customers shop online, staff run orders and stock, a supplier restocks what is low, and an accountant sees the money.

It is a portfolio project. The interesting part is the domain, not a long list of libraries. Stock is a ledger. An order can only move forward through a fixed set of states. A purchase request does not change the shelf until the supplier delivers it.

## What to show

1. Sign in as the customer and add a product. Checkout stays on the cart. Stock drops when the order is placed.
2. Sign in as staff. Confirm the order, then ship it. Cancel is refused after shipping.
3. After delivery, the customer requests a return. Staff approve it and stock comes back. A refund after that does not add the stock a second time.
4. On a low-stock product, staff send a purchase request to a supplier who has a login. The quantity stays the same until that supplier delivers it.
5. Open Swagger at `http://localhost:8080/swagger-ui.html` and show that an accountant cannot create a purchase.

## Roles

| Role | Email | Password | What they do |
| --- | --- | --- | --- |
| Admin | admin@urbanbasket.com | Admin@123 | Accounts, inventory, orders, finance |
| Staff | staff@urbanbasket.com | Staff@123 | Products, orders, returns, purchase requests, attendance |
| Accountant | accountant@urbanbasket.com | Accountant@123 | Sales, expenses, suppliers, purchases. View only on purchases |
| Supplier | supplier@urbanbasket.com | Supplier@123 | See requests for their company and deliver them |
| Customer | customer@urbanbasket.com | Customer@123 | Shop, cart, orders, returns, profile |

These users are created the first time the API starts. Passwords are for the local demo only.

## Rules worth explaining

**Orders.** `PENDING → CONFIRMED → SHIPPED → DELIVERED`. Cancel is allowed only from `PENDING` or `CONFIRMED`, and it puts the sold quantity back. A delivered order can be returned once. Approving the return sets the order to `RETURNED` and restores stock. Refund is a later step, from `RETURNED` to `REFUNDED`, and it does not touch stock again. Sales totals ignore `CANCELLED`, `RETURNED`, and `REFUNDED`.

**Purchases.** Staff or admin can request stock only when `stockQuantity <= minimumStockLevel`, and only from a supplier with an active login. The request is `REQUESTED` and the shelf does not change. The linked supplier delivers it, which writes an `IN_PURCHASE` movement, sets the purchase price, and marks the request `DELIVERED`. A second delivery is rejected.

**Security.** The API is stateless. Login returns a JWT. Passwords are stored with BCrypt. Routes are limited by role in `SecurityConfig`, and the browser sends the token on later calls. A 401 clears the session and returns the user to login.

## Stack

- API: Spring Boot 3.4.3, Java 21, Spring Security, Spring Data JPA, Bean Validation, springdoc OpenAPI
- Database: PostgreSQL. Hibernate updates the schema. A startup runner widens a few check constraints, because `ddl-auto=update` does not change existing checks
- Web: React 19, TypeScript, Vite, React Router, Axios

The customer shop is a separate layout from the staff desk. Both share one light and dark theme.

## Layout

```
UrbanBasket/
├── urbanbasket-backend/     Spring Boot API
│   └── src/main/java/com/urbanbasket/
│       ├── config/          security, seed data, constraint repair
│       ├── controller/
│       ├── service/         order, purchase, stock, returns, accounts
│       ├── entity/
│       └── repository/
└── urbanbasket-frontend/    React app
    └── src/
        ├── pages/
        ├── components/
        └── api/
```

Controllers stay thin. Services own the rules. Repositories own the queries. The UI never computes stock; it shows what the API returns.

## Run it

PostgreSQL must be running locally. Create the database:

```sql
CREATE DATABASE urbanbasket_db;
```

Set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` for the API, or put them in `urbanbasket-backend/src/main/resources/application.properties`. Do not commit a real password.

```bash
cd urbanbasket-backend
.\mvnw.cmd spring-boot:run
```

```bash
cd urbanbasket-frontend
npm install
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:8080/api
- Swagger: http://localhost:8080/swagger-ui.html

The frontend reads `VITE_API_URL` and falls back to `http://localhost:8080/api`. Copy `urbanbasket-frontend/.env.example` to `.env` if you need to point at another host.

## Tests

The tests cover the rules above without a database. They use Mockito.

```bash
cd urbanbasket-backend
.\mvnw.cmd test
```

`OrderServiceTest` checks that a shipped order cannot be cancelled, that a pending cancel restores stock once, and that staff cannot jump from pending to delivered. `PurchaseServiceTest` checks that a request for a healthy product does not write stock, and that delivery adds stock exactly once.
