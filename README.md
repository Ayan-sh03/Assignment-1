# AST User Eligibility System

A robust 3-tier rule engine application that determines user eligibility based on various attributes using Abstract Syntax Tree (AST) for dynamic rule management.

## Overview

This system consists of:

- Frontend UI for rule management and eligibility checks
- REST API backend for rule processing
- Database layer for rule persistence

The application uses AST (Abstract Syntax Tree) to represent and evaluate conditional rules, allowing for:

- Dynamic rule creation
- Rule combination
- Real-time rule modification
- Complex condition evaluation

## Requirements

### Backend

- Node.js (v16 or higher)
- npm (v8 or higher)
- PostgreSQL

### Frontend

- Node.js (v16 or higher)
- npm (v8 or higher)
- Modern web browser with JavaScript enabled

## Features

- Dynamic rule creation and modification
- Complex condition evaluation using AST
- User attribute validation:
  - Age verification
  - Department matching
  - Income evaluation
  - Experience assessment
- Real-time eligibility checking
- Rule combination capabilities
- Rule persistence and management

## Installation

### Backend Setup

1. Clone the repository:

2. Navigate to the backend directory:

```bash
cd AST-backend
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file with the following content:

```env
DATABASE_URL=postgres://username:@password:5432/postgres?sslmode=disable
```

5. Start the server:

```bash
npm start
```

The backend API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd AST-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the following content:

```env
VITE_BACKEND_URL=http://localhost:3000
```

4. Start the development server:

```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173`

#### Rules

- `GET /api/getRules` - Fetch all rules
- `POST /api/createRule` - Create new rule
- `POST /api/combineRule` - Combine rules
- `DELETE /rules/:id` - Delete rule

#### Eligibility

- `POST /api/eval` - Check user eligibility
