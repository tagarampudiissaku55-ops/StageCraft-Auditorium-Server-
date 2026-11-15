# StageCraft Auditorium — Sound Equipment Tracking Backend

**Backend Development Fundamentals (Modules 1 to 3 · 100 marks)**  
**Client Brief Code:** `JP-GAI2C-G10`  
**Theme 25 of 30:** Sound equipment  
**Student / Group:** Joel Prashanth · Section GAI2C · Group 10 of 10 (Card 355 of 375)

---

## 1. Problem Statement & Client Brief

> *"Speakers are lent for events. Clubs return them late and nobody knows which speaker went where. Please build us a system that fixes this."*

**StageCraft Auditorium** rents and lends audio equipment to campus clubs, drama societies, and music bands. Due to lack of tracking, equipment often returns late, or disappears without accountability.

This backend system provides a full relational tracking solution using **Express.js** and **SQLite3**, recording which technician checked out which speaker to which club, with scheduled borrow and return dates, automated join queries, strict data validation, search filters, and sorted lists.

---

## 2. Who Does What (Member Part Allocation)

| Part | Role / Domain | Assigned To | Key Responsibilities |
|---|---|---|---|
| **1** | **Server and routes** | Joel Prashanth | Express server architecture, routing layer, HTTP status codes (200, 201, 400, 404, 500) |
| **2** | **Database** | Joel Prashanth | SQLite database configuration, relational schema for 3 tables, foreign keys, seeding |
| **3** | **REST endpoints** | Joel Prashanth | CRUD operations on `speakers`, `technicians`, and the relational join endpoint |
| **4** | **Validation and search** | Joel Prashanth | Input checks, non-empty validations, clear error messages, query search by type/name |
| **5** | **Twist rule** | Joel Prashanth | Implementation and verification of the 3 sorting tests (`sort=name&order=asc/desc`, `sort=colour`) |
| **6** | **Postman and README** | Joel Prashanth | Comprehensive Postman collection with test assertions, system documentation |

*(In accordance with the brief: "One part per member; small groups combine parts".)*

---

## 3. System Architecture & Features

### Core Requirements Implemented
1. **Express Server & Modular Routing**: Separated into `app.js`, `server.js`, and route modules in `src/routes/`.
2. **SQLite Relational Database**: 3 related tables (`technicians`, `speakers`, `bookings`) with enforced foreign keys (`PRAGMA foreign_keys = ON;`).
3. **Full CRUD for Speakers**:
   - `GET /speakers` — Get all speakers with search and sort support (200)
   - `GET /speakers/:id` — Get single speaker by ID (200 / 404)
   - `POST /speakers` — Add new speaker (201 Created)
   - `PUT /speakers/:id` — Update speaker (200 OK / 404)
   - `DELETE /speakers/:id` — Delete speaker (200 OK / 404)
4. **Relational Join Endpoint**:
   - `GET /bookings` (and `GET /bookings/joined`) queries `bookings` joined with `technicians` and `speakers`, returning `technician_name` and `speaker_name` alongside event dates and return status.
5. **Input Validation**:
   - Mandatory checks for `name` and `type` on `POST /speakers` and `PUT /speakers/:id`.
   - Returns **400 Bad Request** with clear, descriptive error messages.
6. **Search by Query Parameter**:
   - Filter by type: `GET /speakers?type=Subwoofer`
   - Filter by name: `GET /speakers?name=JBL`
   - General search: `GET /speakers?search=monitor`

---

## 4. Your Twist: "Sorted Lists"

The brief assigns the **"Sorted lists"** twist with strict acceptance criteria:

> **Rule:** `GET /speakers?sort=name&order=asc|desc` sorts the list. An unknown sort field gets **400** and the message `"Cannot sort by that field"`.

### Test Cases Verified:
- **Test 1:** `GET /speakers?sort=name&order=asc`  
  - Status: **200 OK**  
  - Result: Sorted alphabetically **A to Z** (e.g. *Alpha Sub Pro 18* ... *Zephyr Stage Wedge 12*)
- **Test 2:** `GET /speakers?sort=name&order=desc`  
  - Status: **200 OK**  
  - Result: Sorted alphabetically **Z to A** (e.g. *Zephyr Stage Wedge 12* ... *Alpha Sub Pro 18*)
- **Test 3:** `GET /speakers?sort=colour`  
  - Status: **400 Bad Request**  
  - Result: Returns `{ "error": "Cannot sort by that field", "message": "Cannot sort by that field" }`

---

## 5. Database Schema

```sql
-- Technicians Table
CREATE TABLE technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Speakers Table
CREATE TABLE speakers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table (Relational Join Link)
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speaker_id INTEGER NOT NULL,
    technician_id INTEGER NOT NULL,
    club_name TEXT NOT NULL,
    event_name TEXT NOT NULL,
    borrow_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE
);
```

---

## 6. API Endpoints Reference

### Speakers (`/speakers`)

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/speakers` | Get all speakers (supports `type`, `search`, `sort`, `order`) | `200`, `400` |
| `GET` | `/speakers/:id` | Get speaker details by ID | `200`, `400`, `404` |
| `POST` | `/speakers` | Add new speaker (`name`, `type`, optional `status`) | `201`, `400` |
| `PUT` | `/speakers/:id` | Update speaker (`name`, `type`, optional `status`) | `200`, `400`, `404` |
| `DELETE` | `/speakers/:id` | Delete speaker by ID | `200`, `400`, `404` |

#### Twist Query Parameters on `/speakers`:
- `sort`: `name`, `type`, `id`, `status` *(unknown fields return 400)*
- `order`: `asc` *(default)* or `desc`

#### Example Validation Error Response (`400 Bad Request`):
```json
{
  "error": "Name and type are required and cannot be empty",
  "message": "Name and type are required and cannot be empty",
  "details": "Field \"name\" is missing or empty"
}
```

---

### Bookings & Join Endpoint (`/bookings`)

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/bookings` | **Join Endpoint:** All bookings with `technician_name` and `speaker_name` | `200` |
| `GET` | `/bookings/joined` | Explicit alias for the required Join Endpoint | `200` |
| `GET` | `/bookings/:id` | Get single booking with joined technician and speaker | `200`, `400`, `404` |
| `POST` | `/bookings` | Create new equipment booking / checkout | `201`, `400`, `404` |
| `PUT` | `/bookings/:id` | Update booking status (e.g. mark `Returned`) | `200`, `400`, `404` |
| `DELETE` | `/bookings/:id` | Delete booking record | `200`, `400`, `404` |

#### Example Joined Booking Response:
```json
[
  {
    "id": 1,
    "club_name": "Music Society",
    "event_name": "Annual Rock Fest",
    "borrow_date": "2026-11-10",
    "return_date": "2026-11-13",
    "status": "Active",
    "technician_id": 1,
    "technician_name": "Joel Prashanth",
    "technician_email": "joel.prashanth@stagecraft.edu",
    "speaker_id": 1,
    "speaker_name": "Alpha Sub Pro 18",
    "speaker_type": "Subwoofer"
  }
]
```

---

### Technicians (`/technicians`)

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/technicians` | Get list of all technicians | `200` |
| `GET` | `/technicians/:id` | Get technician by ID | `200`, `400`, `404` |
| `POST` | `/technicians` | Add new technician (`name`, `email`, optional `phone`) | `201`, `400` |
| `PUT` | `/technicians/:id` | Update technician details | `200`, `400`, `404` |
| `DELETE` | `/technicians/:id` | Delete technician by ID | `200`, `400`, `404` |

---

## 7. How to Install and Run

### 1. Prerequisites
- **Node.js** (v18 or higher recommended; developed and tested on Node v24)
- **npm** (v9 or higher)

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
The server will start at: `http://localhost:3000`  
The SQLite database `stagecraft.db` will automatically initialize with the schema and realistic seed data on the first run.

### 4. Run Automated Tests
```bash
npm test
```
Runs 28 automated assertions covering:
- Twist Test 1 (`sort=name&order=asc` -> 200, A to Z)
- Twist Test 2 (`sort=name&order=desc` -> 200, Z to A)
- Twist Test 3 (`sort=colour` -> 400, "Cannot sort by that field")
- Query search by type
- Speakers full CRUD and status codes (200, 201, 400, 404)
- Relational Join query returning `technician_name` and `speaker_name`
- Technicians routes

---

## 8. Postman Collection

The pre-configured Postman collection is located at:
```
postman/StageCraft_Auditorium.postman_collection.json
```

### Importing into Postman:
1. Open Postman.
2. Click **Import** (top left).
3. Select or drag-and-drop `postman/StageCraft_Auditorium.postman_collection.json`.
4. Ensure your server is running (`npm start`).
5. Open the collection in Postman:
   - Run the **1. Twist Tests (Sorted Lists)** folder to see all 3 test assertions pass.
   - Run the **2. Speakers (CRUD & Search)** folder.
   - Run the **3. Bookings (Join Endpoint)** folder.
   - Or click **Run Collection** to execute all tests automatically.

---

## 9. Demo Presentation Guide (3-Minute Live Demo)

1. **Minute 1 — Setup & Database Relationship**:
   - Start the server (`npm start`).
   - Show the 3 tables in SQLite: `technicians`, `speakers`, `bookings`.
   - Explain how bookings link technicians and speakers to track which club borrowed what equipment and when it must be returned.
2. **Minute 2 — REST Endpoints & Relational Join**:
   - Execute `GET /speakers` and `POST /speakers` (show 201 Created).
   - Test validation with missing fields (show 400 Bad Request with error message).
   - Show the **Join Endpoint** (`GET /bookings`): demonstrate that every booking shows both `technician_name` and `speaker_name`.
   - Show search by type (`GET /speakers?type=Subwoofer`).
3. **Minute 3 — Twist Rule Demonstration**:
   - **Test 1**: `GET /speakers?sort=name&order=asc` -> Demonstrate A-Z sorted list (200).
   - **Test 2**: `GET /speakers?sort=name&order=desc` -> Demonstrate Z-A sorted list (200).
   - **Test 3**: `GET /speakers?sort=colour` -> Demonstrate 400 Bad Request with message `"Cannot sort by that field"`.
   - Run `npm test` to show all 28 automated tests passing green.
