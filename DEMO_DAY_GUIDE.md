# StageCraft Auditorium — Demo Day Preparation Guide

**Date:** Monday, 16 November  
**Time Limit:** Exactly 3 Minutes Live Demo + Member Q&A  
**Weightage:** 70 Marks Group (Build, Twist, Postman, README) + 30 Marks Individual (Demo Answer, Commits, Peer Rating)  
**Group Reference:** `JP-GAI2C-G10` (Joel Prashanth) · Theme 25: Sound Equipment

---

## Part 1: 3-Minute Live Demo Walkthrough Script

### **0:00 – 1:00: Problem & Architecture**
- **Speaker:** "Hello everyone. Our client is StageCraft Auditorium. Their problem: campus clubs borrow sound equipment for events, return them late, and nobody knows which speaker went where."
- **Action:** Open terminal and run `npm start`.
- **Show:** The server boots up at `http://localhost:3000`.
- **Explain:** "We solved this with an Express.js backend and a relational SQLite database with 3 linked tables: `technicians`, `speakers`, and `bookings` with enforced foreign keys."
- **Show UI:** Open `http://localhost:3000` to show the StageCraft Auditorium dashboard. Point out the active bookings table showing which club currently has which speaker and the responsible technician.

### **1:00 – 2:00: CRUD, Validation & The Join Endpoint**
- **Action (Join Endpoint):** In Postman or browser, execute `GET /bookings`.
  - **Explain:** "Here is our required Join endpoint. It performs an SQL inner join connecting `bookings`, `technicians`, and `speakers`, returning both `technician_name` and `speaker_name`."
- **Action (Validation):** In Postman, execute `POST /speakers` with an empty name `""`.
  - **Explain:** "Notice the `400 Bad Request` with a clear message: *'Name and type are required and cannot be empty'*. The system prevents invalid equipment from entering inventory."
- **Action (Search):** Show query parameter filtering: `GET /speakers?type=Subwoofer`.
  - **Explain:** "Technicians can instantly filter equipment by type or name."

### **2:00 – 3:00: Twist Rule & Automated Verification**
- **Explain:** "Our assigned twist is **'Sorted lists'** on `GET /speakers` with 3 mandatory tests."
  - **Test 1:** Execute `GET /speakers?sort=name&order=asc` -> Show `200 OK` sorted A to Z (Alpha Sub Pro to Zephyr Stage Wedge).
  - **Test 2:** Execute `GET /speakers?sort=name&order=desc` -> Show `200 OK` sorted Z to A.
  - **Test 3:** Execute `GET /speakers?sort=colour` -> Show `400 Bad Request` with error message `"Cannot sort by that field"`.
- **Action (Automated Tests):** Run `npm test` in the terminal.
  - **Show:** 28 passing tests in green (including the 3 twist tests, CRUD, and join checks).
- **Wrap up:** "Thank you! We are ready for individual questions."

---

## Part 2: Individual Q&A Cheat Sheet (Per Role)

### **Part 1: Server and Routes (Express Setup, Routes, Status Codes)**
* **Q: Why did you separate routes into separate files instead of putting everything in `server.js`?**
  * **Answer:** "Separating concerns into `app.js` and dedicated routers (`speakers.js`, `technicians.js`, `bookings.js`) follows Express modularity best practices. It makes testing easier, prevents namespace collisions, and lets individual team members develop endpoints in parallel without merge conflicts."
* **Q: What HTTP status codes do you return and why?**
  * **Answer:** "We follow REST standards: `200 OK` for successful fetches and updates, `201 Created` for new resources on `POST`, `400 Bad Request` for validation failures or invalid query parameters (like `sort=colour`), `404 Not Found` when an ID doesn't exist, and `500 Internal Server Error` handled by global error middleware."

---

### **Part 2: Database (3 Related Tables, SQLite Queries, Foreign Keys)**
* **Q: How are foreign key constraints configured in your SQLite database?**
  * **Answer:** "SQLite disables foreign keys by default for backwards compatibility. In `src/database/db.js`, we immediately execute `PRAGMA foreign_keys = ON;` upon connection. Our `bookings` table defines `FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE` and `FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE`."
* **Q: Why is an asynchronous Promise wrapper needed around `sqlite3`?**
  * **Answer:** "The standard `sqlite3` driver uses callback functions. We wrapped `all()`, `get()`, and `run()` into native JavaScript Promises so our route handlers can use clean `async/await` syntax with proper `try/catch` error handling."

---

### **Part 3: REST Endpoints (CRUD & Join Endpoint)**
* **Q: How does the Join endpoint query work?**
  * **Answer:** "The query joins `bookings` with `technicians` on `b.technician_id = t.id` and with `speakers` on `b.speaker_id = s.id`. It selects the event and club information along with aliased fields `t.name AS technician_name` and `s.name AS speaker_name`, so client applications get all relational details in one request without N+1 query problems."
* **Q: What happens if a club returns a speaker?**
  * **Answer:** "On `PUT /bookings/:id`, when status is updated to `'Returned'`, the system automatically updates the corresponding speaker's status back to `'Available'`, resolving the StageCraft tracking problem."

---

### **Part 4: Validation and Search (Input Checks, Messages, Search)**
* **Q: How does input validation work on add and update?**
  * **Answer:** "We implemented Express middleware `validateSpeaker` in `src/middleware/validation.js`. It verifies that `name` and `type` exist, are strings, and are not just whitespace. If validation fails, it aborts the request before touching the database and sends a `400 Bad Request` with `{ error: 'Name and type are required and cannot be empty' }`."
* **Q: How does searching by query parameter work?**
  * **Answer:** "In `GET /speakers`, we inspect `req.query.type`. If present, we append a `WHERE LOWER(type) LIKE LOWER(?)` clause with SQL parameter binding (`%${type}%`). This allows flexible, case-insensitive partial searches (e.g., `?type=Sub` matches 'Subwoofer')."

---

### **Part 5: Twist Rule (Sorted Lists & Twist Tests)**
* **Q: How did you implement the Twist rule and prevent SQL injection?**
  * **Answer:** "We defined a strict whitelist of allowed sort fields: `['name', 'type', 'id', 'status', 'created_at']`. If `req.query.sort` is not in this whitelist (e.g. `sort=colour`), we immediately return `400 Bad Request` with `"Cannot sort by that field"`. Because the sort column is validated against a whitelist, arbitrary SQL cannot be injected into the `ORDER BY` clause. For string columns, we use `COLLATE NOCASE` for proper case-insensitive alphabetical order."
* **Q: How do you handle `order=asc` versus `order=desc`?**
  * **Answer:** "We check `req.query.order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'`, defaulting to ascending order if omitted."

---

### **Part 6: Postman and README (Test Collection & Documentation)**
* **Q: How are automated assertions configured inside Postman?**
  * **Answer:** "Every request in our Postman collection includes a `Tests` script using Postman's `pm.test()` framework. For example, for Twist Test 1, the test script verifies `pm.response.to.have.status(200)` and iterates over the response array to assert that `localeCompare` confirms alphabetical order from A to Z. For Test 3, it verifies `pm.response.to.have.status(400)` and that the body equals `'Cannot sort by that field'`."
* **Q: How can an evaluator run the entire suite in one click?**
  * **Answer:** "By clicking 'Run collection' in Postman or by executing `npm test` in the terminal, which runs our test suite asserting all 28 requirements."
