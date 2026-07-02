# TASKS.md

# Accounts & Ledger Service

> Goal: Finish the MVP in **3 days**.
>
> Check every item before moving to the next.
>
> Legend:
>
> - [ ] Not Started
> - [x] Done
> - [~] In Progress

---

# Day 1 — Backend Foundation

## Project Setup

### Backend

- [x] Create NestJS project
- [x] Configure TypeScript
- [x] Configure ESLint
- [x] Configure Prettier
- [x] Configure environment variables
- [x] Configure Docker
- [x] Configure PostgreSQL
- [x] Configure TypeORM
- [x] Configure GraphQL
- [x] Configure Redis connection
- [x] Configure Swagger
- [x] Configure Jest

### Verify

- [x] Backend boots
- [x] Docker starts successfully
- [x] Database connects
- [x] GraphQL Playground works

---

## Database

### User Entity

- [x] Create User entity
- [x] Create migration
- [x] Test migration

### Account Entity

- [x] Create Account entity
- [x] Create migration
- [x] Add foreign key to User

### Transaction Entity

- [x] Create Transaction entity
- [x] Create migration
- [x] Add foreign key to Account

### Constraints

- [x] Positive amount validation
- [x] Ownership constraints
- [x] Index ownerId
- [x] Index accountId
- [x] Index createdAt

### Verify

- [x] Migrations run successfully

---

## Authentication

### User Module

- [x] User repository
- [x] User service

### JWT

- [x] JWT Strategy
- [x] JWT Guard
- [x] CurrentUser decorator

### Passwords

- [x] Password hashing
- [x] Password verification

### GraphQL

- [x] Login mutation

### Tests

- [x] Login success
- [x] Login failure
- [x] Protected endpoint

### Verify

- [x] JWT returned
- [x] Protected endpoints secured

---

# Day 2 — Core Business Logic

## Accounts Module

### Repository

- [x] Create repository

### Service

- [x] Create service

### DTOs

- [x] Create DTOs
- [x] Validation

### Resolver

- [x] Create GraphQL resolver

### Queries

- [x] Create Account
- [x] List Accounts
- [x] Get Account
- [x] Get Balance

### Authorization

- [x] Only owner can access account

### Tests

- [x] Create account
- [x] Get account
- [x] Get balance
- [x] Authorization

### Verify

- [x] CRUD working

---

## Transactions Module

### Repository

- [x] Create repository

### Service

- [x] Create service

### Resolver

- [x] Create resolver

### Business Rules

- [x] Credit
- [x] Debit
- [x] Amount > 0
- [x] Reject insufficient funds
- [x] Atomic transaction

### Transaction History

- [x] Pagination
- [x] Filter by account
- [x] Filter by type
- [x] Filter by date
- [x] Sort newest first

### Tests

- [x] Credit
- [x] Debit
- [x] Rollback
- [x] Insufficient balance

### Verify

- [x] Ledger updates balances correctly

---

## Balance Summary

- [x] Current balance
- [x] Total credits
- [x] Total debits

Optional

- [ ] Historical balance

### Tests

- [x] Summary calculations

---

## Redis

- [x] Cache balance
- [x] Cache account
- [x] Cache invalidation

### Verify

- [x] Cache hit
- [x] Cache invalidates correctly

---

# Day 3 — Mobile + Polish

## React Native Setup

- [x] Create project
- [x] Configure TypeScript
- [x] Configure ESLint
- [x] Configure Prettier
- [x] Configure Navigation
- [x] Configure GraphQL client
- [x] Configure testing

---

## Authentication

- [x] Login screen
- [x] Store JWT
- [x] Logout
- [x] Protected navigation

---

## Accounts

- [x] Account list
- [x] Account details
- [x] Balance card
- [x] Loading states
- [x] Error states

---

## Transactions

- [x] Transaction list
- [x] Filters
- [x] Pagination
- [x] Credit form
- [x] Debit form
- [x] Validation

---

## Balance Summary

- [x] Summary screen

Optional

- [ ] Charts

---

## Testing

Backend

- [ ] Unit tests
- [ ] Integration tests

Frontend

- [x] Component tests
- [ ] Hook tests

---

## Documentation

- [ ] README
- [ ] Setup instructions
- [ ] Docker instructions
- [ ] Environment variables
- [ ] Architecture overview
- [ ] GraphQL examples

---

# Final Acceptance Checklist

## Functional

- [ ] User can login
- [ ] User receives JWT
- [ ] User creates account
- [ ] User lists accounts
- [ ] User views account
- [ ] User credits account
- [ ] User debits account
- [ ] User cannot overdraft
- [ ] User views transaction history
- [ ] User views balance summary

---

## Security

- [ ] Protected endpoints require JWT
- [ ] Users cannot access another user's accounts

---

## Quality

- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Tests passing
- [ ] Docker works
- [ ] README complete

---

# Stretch Goals (Only if Ahead of Schedule)

- [ ] Offline support
- [ ] Animated UI
- [ ] Balance history
- [ ] React Query cache
- [ ] Structured logging
- [ ] Atomic Design refactor

---

# Progress

Backend

- [x] Setup
- [x] Database
- [x] Authentication
- [x] Accounts
- [x] Transactions
- [x] Summary
- [x] Redis

Frontend

- [x] Setup
- [x] Authentication
- [x] Accounts
- [x] Transactions
- [x] Summary

Project

- [ ] Testing
- [ ] Documentation
- [ ] MVP Complete
