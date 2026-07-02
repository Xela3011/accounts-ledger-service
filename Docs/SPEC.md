# Accounts & Ledger Service
## Functional Specification

Version: 1.0

---

# Goal

Build a Full Stack application that allows users to manage bank accounts and ledger transactions.

The system consists of:

- Backend
    - NestJS
    - GraphQL
    - PostgreSQL
    - Redis
    - JWT Authentication
    - Docker
- Mobile App
    - React Native
    - TypeScript

The project must follow Clean Architecture principles and include automated tests.

---

# Functional Requirements

## FR-1 Authentication

The system shall:

- Authenticate users using JWT.
- Protect all account endpoints.
- Associate every account with its owner.

---

## FR-2 Account Management

Users can:

- Create an account
- List all their accounts
- View account details
- View current balance

Each account contains:

- id
- ownerId
- accountNumber
- currency
- balance
- status
- createdAt
- updatedAt

---

## FR-3 Ledger Transactions

Supported transaction types:

- Credit
- Debit

Credit:

- increases account balance

Debit:

- decreases account balance

Rules:

- debit amount must be positive
- credit amount must be positive
- insufficient balance rejects transaction
- operations must be atomic
- every transaction must be stored permanently

Transaction fields:

- id
- accountId
- amount
- type
- description
- createdAt

---

## FR-4 Transaction History

Users can retrieve transactions using:

- account
- date range
- transaction type
- pagination

Sorting:

- newest first

---

## FR-5 Balance Summary

Return:

- current balance
- total credits
- total debits

Optional:

- historical balance

---

# Non Functional Requirements

## Architecture

Backend:

- Clean Architecture
- Modular
- Dependency Injection

Frontend:

- Feature-based architecture
- Reusable components
- Custom hooks

---

## Database

PostgreSQL

Redis for:

- caching
- optional session storage

---

## API

GraphQL only.

Must expose:

Account Queries

- accounts
- account(id)
- balance(accountId)

Transaction Queries

- transactions()

Mutations

- createAccount
- createCredit
- createDebit

---

## Security

JWT Authentication

Authorization:

Users cannot access another user's accounts.

---

## Validation

All inputs validated.

Examples:

amount > 0

required fields

valid UUID

---

## Error Handling

Return meaningful errors.

Examples:

Unauthorized

ValidationError

InsufficientFunds

AccountNotFound

---

## Logging

Structured logs.

---

## Testing

Backend

- unit tests
- integration tests

Frontend

- component tests
- hook tests
- integration tests

---

# Optional Features

- Offline cache
- Animated UI
- Atomic Design
- Redis query cache
- Balance history