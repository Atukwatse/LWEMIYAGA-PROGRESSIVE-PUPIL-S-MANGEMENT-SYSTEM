# Lwemiyaga Progressive Pupils Management System

A comprehensive student management system for primary schools with features for student registration, performance trackings, fees management, and administrative reportings.

## Features

1. **Student Registration**
   - Register new students with personal and parent information
   - Assign students to classes

2. **Performance Tracking**
   - Record student performance by subject and term
   - Track grades and scores

3. **Fees Management**
   - Record school fees payments
   - Track balances owed by students

4. **Administrative Dashboard**
   - View class summaries
   - Monitor student performance across classes
   - Track fees collection

## Setup Instructions

1. Install Node.js (if not already installed)
2. Open a terminal in the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Default Login Credentials

- Admin: username: `admin`, password: `admin123`

## System Architecture

- Backend: Node.js with Express framework
- Database: SQLite (file-based, no separate installation required)
- Frontend: HTML, CSS, JavaScript

## API Endpoints

### Student Management
- POST `/api/students/register` - Register a new student
- GET `/api/students` - Get all students
- GET `/api/students/:id` - Get a specific student

### Performance Tracking
- POST `/api/performance/add` - Add student performance record
- GET `/api/performance/student/:studentId` - Get performance records for a student

### Fees Management
- POST `/api/fees/update` - Update student fees
- GET `/api/fees/student/:studentId` - Get fees record for a student
- GET `/api/fees/all` - Get all fees records

### Class Management
- GET `/api/classes` - Get all classes with student counts
- GET `/api/classes/:className/students` - Get students in a specific class
- GET `/api/classes/:className/performance` - Get performance records for a class

## Database Schema

The system uses SQLite with the following tables:
- `students` - Student information
- `teachers` - Teacher information
- `admins` - Administrator accounts
- `performance` - Student performance records
- `fees` - Student fees records