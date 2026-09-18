CourierX — Courier Management System

Academic DBMS Project
A full-stack Courier and Parcel Management System built around Oracle Database, with a React frontend and Spring Boot REST backend.

📌 Project Overview

CourierX is a database-driven courier management application designed to model the complete lifecycle of courier operations—from customers and orders to parcels, delivery attempts, payments, couriers, branches, staff, vehicles, and tracking events.

The project combines:

Oracle Database for relational data storage, constraints, sequences, views, PL/SQL procedures/functions, and transaction logic

Spring Boot for REST APIs and database integration

React + Vite for the interactive web interface

EER visualization for understanding and demonstrating the database design

SQL and PL/SQL demonstration modules for academic DBMS concepts

The system is designed not only as a CRUD application, but also as a practical demonstration of important Database Management System concepts.

🎯 Objectives

Design a realistic relational database for a courier company.

Model entities and relationships using an Enhanced Entity-Relationship (EER) design.

Implement primary keys, foreign keys, referential integrity, composite keys, and cascading actions.

Demonstrate strong entities, weak entities, and specialization/subtype relationships.

Implement database operations through SQL and PL/SQL.

Provide REST APIs for application-to-database communication.

Provide a modern frontend for managing and visualizing courier data.

Demonstrate database persistence through real create, read, update, and delete operations.

Expose academic demonstrations such as joins, aggregation, views, procedures, functions, cursors, exception handling, and transactions.

🏗️ System Architecture

flowchart TB
    U[User / Browser]
    F[React + Vite Frontend]
    B[Spring Boot REST Backend]
    J[Spring JDBC / JdbcTemplate]
    O[(Oracle Database - FREEPDB1)]
    P[PL/SQL Procedures & Functions]
    V[Oracle Views]
    C[Constraints / Keys / Sequences]

    U --> F
    F --> B
    B --> J
    J --> O
    O --> P
    O --> V
    O --> C

High-Level Flow

React Frontend
      │
      │ HTTP / REST
      ▼
Spring Boot Backend
      │
      │ JDBC
      ▼
Oracle FREEPDB1
      │
      ├── Relational Tables
      ├── Constraints
      ├── Sequences
      ├── Views
      └── PL/SQL Procedures / Functions

🛠️ Technology Stack

Layer

Technology

Frontend

React

Frontend Build Tool

Vite

Backend

Spring Boot

Language

Java 17

Database Connectivity

Spring JDBC / JdbcTemplate

Oracle Driver

Oracle ojdbc17

Database

Oracle Database Free / FREEPDB1

Database Programming

SQL + PL/SQL

API Style

REST

Version Control

Git + GitHub

✨ Core Features

Dashboard

Central overview with navigation to:

Customers

Couriers

Branches

Staff

Courier Services

Orders

Payments

Parcels

Tracking Events

Delivery Attempts

Vehicles

Staff/courier specializations

SQL Console

SQL Query Catalog

PL/SQL Operations

Database Schema

Full EER Diagram

Real CRUD Operations

The system supports database-backed:

Create → Read → Update → Delete → Search

Successful changes are persisted in Oracle and remain available after a browser refresh.

Interactive EER Diagram

The application includes a 20-entity EER visualization with:

Entity and relationship inspection

Primary-key / foreign-key identification

Weak-entity identification

Subtype / ISA visualization

Cardinality display

Drag-and-drop entity positioning

Zoom

Fit-to-screen

Layout reset

Relationship highlighting

🗃️ Database Design

The Oracle schema contains 20 tables.

Core Entities

#

Table

Purpose

1

CUSTOMER

Customer details

2

COURIER

Courier/delivery personnel

3

BRANCH

Branch locations

4

STAFF

Staff information

5

COURIER_SERVICE

Courier services and charges

6

ORDERS

Shipment/order bookings

7

PAYMENT

Payment records

8

PARCEL

Parcel information

9

VEHICLE

Vehicle information

10

TRACKING_EVENT

Parcel tracking history

11

DELIVERY_ATTEMPT

Delivery-attempt information

Specialization / Subtype Tables

Table

Represents

MANAGER

Manager specialization

CUSTOMER_SUPPORT

Customer support specialization

ACCOUNTANT

Accountant specialization

DELIVERY_BOY

Delivery-boy specialization

BRANCH_STAFF

Branch-staff specialization

DRIVER

Driver specialization

CASH_MODE

Cash payment specialization

CARD_MODE

Card payment specialization

ONLINE_MODE

Online payment specialization

🔑 Database Concepts Demonstrated

Primary Keys

Examples:

CUSTOMER(customer_id)
COURIER(courier_id)
BRANCH(branch_id)
STAFF(staff_id)
ORDERS(order_id)
PAYMENT(payment_id)
PARCEL(parcel_id)

Foreign Keys

Major relationships include:

STAFF → BRANCH
ORDERS → CUSTOMER
ORDERS → COURIER_SERVICE
PAYMENT → CUSTOMER
PAYMENT → ORDERS
PARCEL → ORDERS
PARCEL → COURIER
PARCEL → STAFF
TRACKING_EVENT → PARCEL

Referential Integrity

The schema demonstrates:

ON DELETE CASCADE
ON DELETE SET NULL

Composite Key / Weak Entity

DELIVERY_ATTEMPT uses:

PRIMARY KEY (branch_id, attempt_no)

and is modeled in the EER interface as a weak/dependent entity.

Specialization / ISA

STAFF
 ├── MANAGER
 ├── CUSTOMER_SUPPORT
 └── ACCOUNTANT

COURIER
 ├── DELIVERY_BOY
 ├── BRANCH_STAFF
 └── DRIVER

PAYMENT
 ├── CASH_MODE
 ├── CARD_MODE
 └── ONLINE_MODE

🔢 Oracle Sequences

The project uses database-side sequences including:

CUSTOMER_SEQ
COURIER_SEQ
BRANCH_SEQ
STAFF_SEQ
SERVICE_SEQ
ORDER_SEQ
PAYMENT_SEQ
PARCEL_SEQ
TRACKING_SEQ

👁️ Database Views

VW_CUSTOMER_ORDER_SUMMARY

Shows:

Customer identity

Total number of orders

Total amount spent

Latest order date

VW_ACTIVE_PARCEL_TRACKING

Combines parcel, order, customer, courier, and latest tracking-event information.

VW_BRANCH_PERFORMANCE

Shows:

Branch

City

Total staff

Services offered

⚙️ PL/SQL Demonstrations

The project includes these database-side procedures/functions:

Routine

Demonstrates

GET_CUSTOMER_ORDER_COUNT

Procedure + output parameter

UPDATE_PARCEL_STATUS

DML + audit tracking + transaction control

CALCULATE_DELIVERY_CHARGE

Database-side business logic

CALCULATE_DISCOUNT

Conditional PL/SQL logic

PROCESS_DELIVERY_ATTEMPT

Procedure + generated attempt number

RECORD_PAYMENT_TXN

Multi-step transaction + COMMIT/ROLLBACK

DEMO_EXCEPTION_HANDLING

NO_DATA_FOUND, user-defined exception, OTHERS

GENERATE_BRANCH_REPORT

Explicit cursor + loop + exception handling

🧮 SQL Demonstration Module

The application provides an SQL catalog/console for:

SELECT

INSERT

UPDATE

DELETE

Filtering

Sorting

GROUP BY

HAVING

Aggregate functions

JOIN operations

Multi-table joins

Subqueries

Tracking/reporting queries

Example relationship:

CUSTOMER
   ↓
ORDERS
   ↓
PARCEL
   ↓
COURIER

🔌 REST API

Major API resource groups are:

/api/customers
/api/couriers
/api/branches
/api/staff
/api/courier-services
/api/orders
/api/payments
/api/parcels
/api/tracking-events
/api/delivery-attempts
/api/vehicles
/api/managers
/api/customer-support
/api/accountants
/api/delivery-boys
/api/branch-staff
/api/drivers
/api/cash-modes
/api/card-modes
/api/online-modes

Database-oriented APIs also cover:

/api/dashboard
/api/sql
/api/plsql

📁 Project Structure

CourierManagement/
│
├── courier-backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/courier/
│   │       │   ├── config/
│   │       │   ├── controller/
│   │       │   ├── model/
│   │       │   ├── repository/
│   │       │   └── service/
│   │       │
│   │       └── resources/
│   │           ├── schema.sql
│   │           ├── data.sql
│   │           ├── plsql_procedures.sql
│   │           └── application.properties
│   │
│   ├── pom.xml
│   ├── test-apis.sh
│   └── test-crud.sh
│
├── courier_frontend_ui/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── styles.css
│   ├── package.json
│   └── .env.example
│
├── 2_setup_courier_user.bat
├── 4_start_frontend.bat
├── verify_environment.ps1
└── README.md

💻 Local Setup

Prerequisites

Install:

Oracle Database Free / Oracle 26ai Free

Java 17+

Maven or Maven Wrapper

Node.js + npm

Git

1. Clone

git clone https://github.com/NithinSarvesh/CourierManagement.git
cd CourierManagement

2. Configure Oracle

Use:

Database : Oracle
Service  : FREEPDB1
Port     : 1521
Schema   : COURIER_APP

Database resources:

courier-backend/src/main/resources/schema.sql
courier-backend/src/main/resources/data.sql
courier-backend/src/main/resources/plsql_procedures.sql

When the expected schema is not present, the backend's database initializer can execute the schema, PL/SQL objects, and seed-data scripts.

3. Start Backend

cd courier-backend

Windows:

mvnw.cmd spring-boot:run

Or:

mvn spring-boot:run

Backend:

http://localhost:8081

4. Start Frontend

Open another terminal:

cd courier_frontend_ui
npm install
npm run dev

Vite will display the frontend URL, typically:

http://localhost:5173

🔧 Frontend API Configuration

The frontend supports:

VITE_API_BASE

Local example:

VITE_API_BASE=http://localhost:8081/api

For deployment, configure the variable to the deployed backend API URL.

Security: never place Oracle credentials inside the React frontend.

🔐 Security

Never commit:

Database passwords

AWS private keys

API keys

Tokens

Production secrets

Use environment variables or secure server-side configuration.

For cloud deployment, Oracle port 1521 should remain private and only the application/API layer should be exposed publicly.

🧪 Testing

Backend helper scripts include:

./test-apis.sh
./test-crud.sh

A typical CRUD test is:

CREATE
  ↓
READ
  ↓
UPDATE
  ↓
READ
  ↓
DELETE
  ↓
READ

Persistence validation:

User action
   ↓
REST API
   ↓
Oracle
   ↓
COMMIT
   ↓
Browser refresh
   ↓
REST GET
   ↓
Persisted Oracle state

☁️ Deployment Architecture

The intended cloud architecture is:

                     Internet
                        │
                        ▼
                 React Frontend
                        │
                        ▼
                 HTTPS API Layer
                        │
                        ▼
                    AWS EC2
                ┌─────────────┐
                │ Spring Boot │
                │   Backend   │
                └──────┬──────┘
                       │
                       ▼
              Oracle 26ai Free
                  (Docker)
                       │
                       ▼
                   FREEPDB1
                       │
                       ▼
                  COURIER_APP

This allows the application backend and database to run independently of a developer laptop.

📸 Recommended Project Screenshots

For the project report/presentation, capture:

Dashboard

Customer CRUD

Orders

Parcel / Tracking

Full EER Diagram

Database Schema

SQL Console

SQL Query Catalog

PL/SQL Operations

Oracle tables/data

Backend running

Frontend running

🎓 DBMS Topics Covered

Database Design

ER Model

EER Model

Strong entities

Weak entities

Specialization / Generalization

Attributes

Relationships

Cardinality

Primary keys

Foreign keys

Composite keys

Relational Database

Relational tables

Referential integrity

Constraint enforcement

Sequences

Views

Cascading deletes

Null handling

SQL

DML

Filtering

Sorting

Aggregation

Grouping

Joins

Subqueries

Reporting queries

PL/SQL

Procedures

Functions

Parameters

Cursors

Loops

Exceptions

User-defined exceptions

COMMIT

ROLLBACK

Database-side business logic

Application Integration

REST APIs

JDBC

Spring Boot

React

Oracle database integration

Persistent CRUD operations

🧭 Recommended Presentation Flow

1. Introduction / Problem Statement
        ↓
2. Objectives
        ↓
3. System Architecture
        ↓
4. Full EER Diagram
        ↓
5. Relational Schema
        ↓
6. PK / FK / Weak Entity / ISA
        ↓
7. CRUD Demonstration
        ↓
8. SQL Query Demonstration
        ↓
9. PL/SQL Demonstration
        ↓
10. Frontend–Backend–Oracle Integration
        ↓
11. Testing & Persistence
        ↓
12. Conclusion

🚀 Future Enhancements

Authentication and role-based access control

Customer and courier portals

Real-time shipment tracking

Email/SMS notifications

Delivery route optimization

PDF invoice generation

Advanced analytics

Barcode / QR-code tracking

Audit logs

CI/CD

Automated backup and recovery

Production HTTPS configuration

👥 Team Contribution

Area

Responsibility

Database

Oracle schema, constraints, sequences, views, PL/SQL

Backend

Spring Boot REST API + JDBC integration

Frontend

React UI and interaction

Integration

Frontend ↔ REST API ↔ Oracle

Testing

API, CRUD, persistence, database validation

Documentation

EER, schema, SQL/PLSQL and report

📚 Important Files

File

Purpose

schema.sql

Oracle DDL and relational structure

data.sql

Seed/sample data

plsql_procedures.sql

Procedures, functions, sequences and views

application.properties

Backend configuration

api.js

Frontend API layer

EerDiagram.jsx

Interactive EER diagram

DatabaseSchema.jsx

Schema viewer

SqlEditor.jsx

SQL console

SqlQueries.jsx

SQL catalog

PlsqlOperations.jsx

PL/SQL interface

🏁 Conclusion

CourierX transforms a real-world courier workflow into a structured relational database and a full-stack application.

It brings together:

EER Design
+
Relational Database
+
Oracle SQL
+
PL/SQL
+
REST API
+
Spring Boot
+
React
+
Database Persistence

The result is both a working courier-management application and a practical demonstration of core DBMS concepts and database application integration.

🔗 Repository

https://github.com/NithinSarvesh/CourierManagement

📄 Project Status

Academic full-stack DBMS project

The repository contains the frontend, backend, Oracle database scripts, SQL/PLSQL demonstrations, EER visualization, API integration, and testing utilities.

📜 License

No open-source license has been specified for this academic project.
