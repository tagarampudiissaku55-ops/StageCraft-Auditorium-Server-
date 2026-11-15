# StageCraft Auditorium — Submission & ERP Hand-In Checklist

**Group Code:** `JP-GAI2C-G10`  
**Theme:** 25 of 30 · Sound Equipment  
**Deadline:** Sunday, 15 November (Upload to ERP)  
**Demo Day:** Monday, 16 November (3-minute presentation + member questions)  
**Grading Breakdown:** 70 Marks Group + 30 Marks Individual

---

## 1. What Needs to be Uploaded to ERP

According to the brief under **HAND IN**:
- [x] **GitHub Link**: Link to your repository containing all commits and files.
- [x] **Postman Collection**: `postman/StageCraft_Auditorium.postman_collection.json`
- [x] **README**: `README.md` (comprehensive documentation of endpoints, database, and roles).

---

## 2. Steps to Push to GitHub

1. Create a new repository on your GitHub account (name it `stagecraft-auditorium-backend`).
2. Open your terminal in this project directory:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/stagecraft-auditorium-backend.git
   git push -u origin main
   ```
3. Verify that your commit history appears on GitHub showing the role-based commits.

---

## 3. Pre-Submission Self-Audit (100% Mark Check)

| Rubric Item | Checked | File / Location |
|---|---|---|
| **Express server with routes for technicians, speakers, bookings** |  | `src/app.js`, `src/routes/` |
| **SQLite database with 3 related tables** |  | `src/database/schema.sql`, `src/database/db.js` |
| **Full CRUD for speakers with correct status codes** |  | `src/routes/speakers.js` (200, 201, 400, 404) |
| **One Join endpoint returning technician name and speaker name** |  | `GET /bookings` & `GET /bookings/joined` |
| **Validation on add and update with clear error messages** |  | `src/middleware/validation.js` |
| **Search by query parameter (e.g. speakers by type)** |  | `GET /speakers?type=Subwoofer` |
| **Twist Test 1: sort=name&order=asc -> 200 (A to Z)** |  | Verified in `npm test` & Postman |
| **Twist Test 2: sort=name&order=desc -> 200 (Z to A)** |  | Verified in `npm test` & Postman |
| **Twist Test 3: sort=colour -> 400 ("Cannot sort by that field")** |  | Verified in `npm test` & Postman |
| **Postman collection with automated test scripts** |  | `postman/StageCraft_Auditorium.postman_collection.json` |
| **Interactive demo dashboard for presentation** |  | `http://localhost:3000` (`public/index.html`) |
| **Demo Day Script & Member Q&A Guide** |  | `DEMO_DAY_GUIDE.md` |

---

## 4. On Demo Day (Monday, 16 Nov)

1. Run `npm run reset-db` 5 minutes before your demo to ensure fresh seed data.
2. Run `npm start` to have the server running.
3. Open `http://localhost:3000` in your browser.
4. Follow the timing in [DEMO_DAY_GUIDE.md](file:///c:/Users/tagar/OneDrive/Documents/backend group assignent/DEMO_DAY_GUIDE.md):
   - **Minute 1**: Problem statement + 3-table database architecture.
   - **Minute 2**: CRUD, validation, and Join endpoint.
   - **Minute 3**: Twist rule (demonstrate the 3 test buttons on the dashboard) + show `npm test` passing.
5. Answer individual questions using the Q&A cheat sheet in `DEMO_DAY_GUIDE.md`.
