# Qik Accounts Ledger Service

Servicio de cuentas y libro contable con backend NestJS GraphQL y app móvil Expo.

## Autor

Alexander Batista

## Estructura del proyecto

- `Backend`: API NestJS con GraphQL, Swagger, TypeORM, PostgreSQL y Redis.
- `Mobile`: app Expo/React Native que consume la API GraphQL con Apollo Client.
- `Docs`: especificaciones, tareas y notas de diseño del proyecto.

## Requisitos

- Node.js 20
- Docker y Docker Compose
- Expo CLI mediante `npx expo` o los scripts de `npm`

## Configuración del backend

Desde la carpeta del backend, copia las variables de entorno, instala dependencias y levanta el servidor en modo desarrollo:

```bash
cd Backend
cp .env.example .env
npm install
npm run start:dev
```

En PowerShell puedes copiar el archivo de entorno con:

```powershell
cd Backend
Copy-Item .env.example .env
```

GraphQL queda disponible en `http://localhost:3000/graphql`.

Swagger queda disponible en `http://localhost:3000/docs`.

## Docker del backend

Desde `Backend`, levanta la pila completa con:

```bash
docker compose up --build
```

La pila de Docker Compose inicia:

- API en el puerto `3000`
- PostgreSQL en el puerto `5432`
- Redis en el puerto `6379`

## Migraciones de base de datos

Las migraciones usan el data source de TypeORM ubicado en `src/infrastructure/database/typeorm.config.ts`.

Antes de ejecutar las migraciones, inicia PostgreSQL:

```bash
cd Backend
docker compose up -d postgres
```

Ejecuta las migraciones pendientes:

```bash
npm run migration:run
```

De ser necesario revertir, revierte la migración más reciente usando:

```bash
npm run migration:revert
```

Los comandos de migración leen la configuración de base de datos desde `.env`. Para Docker local, los valores por defecto de `.env.example` apuntan a `localhost:5432`.

Para crear un usuario y una cuenta local de prueba:

```bash
npm run seed
```

Los valores del seed se pueden cambiar con las variables `SEED_*` en `.env`.

## Variables de entorno del backend

Revisa `Backend/.env.example` para ver todas las variables requeridas. Los valores locales por defecto son:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=qik_accounts_ledger
DB_SYNCHRONIZE=false
DB_LOGGING=false

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=1h

SEED_USER_EMAIL=seed.user@example.com
SEED_USER_PASSWORD=Password123!
SEED_USER_NAME=Alexander
SEED_USER_LAST_NAME=Batista
SEED_ACCOUNT_NUMBER=QIK-SEED-0001
SEED_ACCOUNT_CURRENCY=DOP
SEED_ACCOUNT_BALANCE=100000.0000
```

## Verificación del backend

Desde `Backend`, ejecuta:

```bash
npm run build
npm run lint
npm test
```

## Configuración del frontend móvil

Desde la carpeta móvil, instala dependencias y configura la URL del backend:

```bash
cd Mobile
npm install
```

Crea `Mobile/.env` con la URL GraphQL que usará Expo:

```env
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
```

Si no defines `EXPO_PUBLIC_GRAPHQL_URL`, la app usa `http://localhost:3000/graphql` por defecto. En un dispositivo físico, usa la IP local de tu máquina en lugar de `localhost`; por ejemplo:

```env
EXPO_PUBLIC_GRAPHQL_URL=http://192.168.1.10:3000/graphql
```

Levanta la app Expo:

```bash
npm run start
```

También puedes abrir un destino específico:

```bash
npm run android
npm run ios
npm run web
```

## Verificación del frontend móvil

Desde `Mobile`, ejecuta:

```bash
npm run lint
npm run typecheck
npm test
```

Para revisar formato:

```bash
npm run format:check
```

Para aplicar formato:

```bash
npm run format
```

## Flujo local recomendado

1. Levanta PostgreSQL y Redis con Docker Compose desde `Backend`.
2. Ejecuta las migraciones.
3. Ejecuta el seed para crear un usuario y una cuenta.
4. Levanta el backend con `npm run start:dev`.
5. Configura `Mobile/.env` con la URL correcta de GraphQL.
6. Levanta la app móvil con `npm run start`.

```bash
cd Backend
docker compose up -d postgres redis
npm run migration:run
npm run seed
npm run start:dev
```

## Autenticación GraphQL

La mutación `login` no requiere token. Las demás operaciones de usuario, cuentas y transacciones requieren un header `Authorization` con el token JWT:

```http
Authorization: Bearer <accessToken>
```

Ejemplo de login:

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    user {
      id
      email
      name
      lastName
    }
  }
}
```

Variables:

```json
{
  "input": {
    "email": "seed.user@example.com",
    "password": "Password123!"
  }
}
```

## Ejemplos de queries GraphQL

Consulta del usuario autenticado:

```graphql
query Me {
  me {
    id
    email
    name
    lastName
  }
}
```

Consulta de cuentas:

```graphql
query Accounts {
  accounts {
    id
    accountNumber
    currency
    balance
    status
    createdAt
    updatedAt
  }
}
```

Consulta de una cuenta:

```graphql
query Account($id: ID!) {
  account(id: $id) {
    id
    accountNumber
    currency
    balance
    status
  }
}
```

Variables:

```json
{
  "id": "00000000-0000-4000-8000-000000000000"
}
```

Consulta de balance:

```graphql
query Balance($accountId: ID!) {
  balance(accountId: $accountId)
}
```

Consulta de resumen de balance:

```graphql
query BalanceSummary($accountId: ID!) {
  balanceSummary(accountId: $accountId) {
    accountId
    currentBalance
    totalCredits
    totalDebits
  }
}
```

Consulta de historial de transacciones:

```graphql
query Transactions($input: TransactionHistoryInput) {
  transactions(input: $input) {
    id
    accountId
    type
    amount
    description
    createdAt
  }
}
```

Variables:

```json
{
  "input": {
    "accountId": "00000000-0000-4000-8000-000000000000",
    "type": "Credit",
    "limit": 25,
    "offset": 0
  }
}
```

Consulta de salud:

```graphql
query Health {
  health
}
```

## Ejemplos de mutations GraphQL

Crear una cuenta:

```graphql
mutation CreateAccount($input: CreateAccountInput!) {
  createAccount(input: $input) {
    id
    accountNumber
    currency
    balance
    status
  }
}
```

Variables:

```json
{
  "input": {
    "currency": "DOP"
  }
}
```

Acreditar una cuenta:

```graphql
mutation CreditAccount($input: TransactionInput!) {
  creditAccount(input: $input) {
    id
    accountId
    type
    amount
    description
    createdAt
  }
}
```

Variables:

```json
{
  "input": {
    "accountId": "00000000-0000-4000-8000-000000000000",
    "amount": "1500.00",
    "description": "Initial deposit"
  }
}
```

Debitar una cuenta:

```graphql
mutation DebitAccount($input: TransactionInput!) {
  debitAccount(input: $input) {
    id
    accountId
    type
    amount
    description
    createdAt
  }
}
```

Variables:

```json
{
  "input": {
    "accountId": "00000000-0000-4000-8000-000000000000",
    "amount": "250.00",
    "description": "ATM withdrawal"
  }
}
```

Congelar una cuenta:

```graphql
mutation FreezeAccount($id: ID!) {
  freezeAccount(id: $id) {
    id
    status
  }
}
```

Descongelar una cuenta:

```graphql
mutation UnfreezeAccount($id: ID!) {
  unfreezeAccount(id: $id) {
    id
    status
  }
}
```

Cancelar una cuenta:

```graphql
mutation CancelAccount($id: ID!) {
  cancelAccount(id: $id) {
    id
    status
  }
}
```

Variables para las operaciones por `id`:

```json
{
  "id": "00000000-0000-4000-8000-000000000000"
}
```
