// Automated test suite for StageCraft Auditorium Backend
// Tests all endpoints, validation, join queries, and the specific 3 Twist Tests

const http = require('http');
const app = require('../src/app');
const { initDB, db } = require('../src/database/db');

async function runTests() {
  console.log('--- Initializing Test Environment ---');
  await initDB();

  // Start server on an ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(` PASS: ${testName}`);
      passed++;
    } else {
      console.error(` FAIL: ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TWIST TESTS (Required by Client Brief)
    // ----------------------------------------------------
    console.log('\n--- Twist Tests (Sorted Lists) ---');

    // Test 1: sort=name&order=asc -> 200, A to Z
    {
      const res = await fetch(`${baseUrl}/speakers?sort=name&order=asc`);
      const data = await res.json();
      assert(res.status === 200, 'Test 1 - Status is 200 for sort=name&order=asc', `Got ${res.status}`);
      const names = data.map((s) => s.name);
      const isSortedAsc = names.every((val, i, arr) => !i || arr[i - 1].localeCompare(val) <= 0);
      assert(isSortedAsc, 'Test 1 - Speakers sorted alphabetically A to Z', JSON.stringify(names));
    }

    // Test 2: sort=name&order=desc -> 200, Z to A
    {
      const res = await fetch(`${baseUrl}/speakers?sort=name&order=desc`);
      const data = await res.json();
      assert(res.status === 200, 'Test 2 - Status is 200 for sort=name&order=desc', `Got ${res.status}`);
      const names = data.map((s) => s.name);
      const isSortedDesc = names.every((val, i, arr) => !i || arr[i - 1].localeCompare(val) >= 0);
      assert(isSortedDesc, 'Test 2 - Speakers sorted alphabetically Z to A', JSON.stringify(names));
    }

    // Test 3: sort=colour -> 400, "Cannot sort by that field"
    {
      const res = await fetch(`${baseUrl}/speakers?sort=colour`);
      const data = await res.json();
      assert(res.status === 400, 'Test 3 - Status is 400 for sort=colour', `Got ${res.status}`);
      const hasMessage =
        data.error === 'Cannot sort by that field' ||
        data.message === 'Cannot sort by that field';
      assert(hasMessage, 'Test 3 - Response message is "Cannot sort by that field"', JSON.stringify(data));
    }

    // ----------------------------------------------------
    // SEARCH BY QUERY PARAMETER
    // ----------------------------------------------------
    console.log('\n--- Search Tests ---');
    {
      const res = await fetch(`${baseUrl}/speakers?type=Subwoofer`);
      const data = await res.json();
      assert(res.status === 200, 'Search by type returns 200');
      const allSubwoofers = data.length > 0 && data.every((s) => s.type.toLowerCase().includes('subwoofer'));
      assert(allSubwoofers, 'Search by ?type=Subwoofer returns only subwoofers', `Count: ${data.length}`);
    }

    // ----------------------------------------------------
    // SPEAKERS CRUD TESTS
    // ----------------------------------------------------
    console.log('\n--- Speakers CRUD Tests ---');

    let createdSpeakerId;

    // POST /speakers (Valid)
    {
      const res = await fetch(`${baseUrl}/speakers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Pioneer Pro Audio XPRS 12',
          type: 'PA Speaker',
          status: 'Available'
        })
      });
      const data = await res.json();
      assert(res.status === 201, 'POST /speakers returns 201 Created', `Got ${res.status}`);
      assert(data.data && data.data.name === 'Pioneer Pro Audio XPRS 12', 'POST /speakers returns created speaker');
      createdSpeakerId = data.data.id;
    }

    // POST /speakers (Validation: Missing name)
    {
      const res = await fetch(`${baseUrl}/speakers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          type: 'PA Speaker'
        })
      });
      const data = await res.json();
      assert(res.status === 400, 'POST /speakers with empty name returns 400 Bad Request');
      assert(Boolean(data.error), 'POST /speakers returns clear error message');
    }

    // POST /speakers (Validation: Missing type)
    {
      const res = await fetch(`${baseUrl}/speakers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Incomplete Speaker'
        })
      });
      const data = await res.json();
      assert(res.status === 400, 'POST /speakers with missing type returns 400 Bad Request');
    }

    // GET /speakers/:id (Get one)
    {
      const res = await fetch(`${baseUrl}/speakers/${createdSpeakerId}`);
      const data = await res.json();
      assert(res.status === 200, `GET /speakers/${createdSpeakerId} returns 200 OK`);
      assert(data.id === createdSpeakerId, 'GET /speakers/:id returns the correct speaker');
    }

    // GET /speakers/99999 (Not found)
    {
      const res = await fetch(`${baseUrl}/speakers/99999`);
      assert(res.status === 404, 'GET /speakers/99999 returns 404 Not Found');
    }

    // PUT /speakers/:id (Update)
    {
      const res = await fetch(`${baseUrl}/speakers/${createdSpeakerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Pioneer Pro Audio XPRS 12 MkII',
          type: 'PA Speaker',
          status: 'Lent'
        })
      });
      const data = await res.json();
      assert(res.status === 200, 'PUT /speakers/:id returns 200 OK');
      assert(data.data.name === 'Pioneer Pro Audio XPRS 12 MkII', 'PUT /speakers/:id updates speaker data');
    }

    // DELETE /speakers/:id (Delete)
    {
      const res = await fetch(`${baseUrl}/speakers/${createdSpeakerId}`, {
        method: 'DELETE'
      });
      assert(res.status === 200, 'DELETE /speakers/:id returns 200 OK');

      // Verify it is gone
      const checkRes = await fetch(`${baseUrl}/speakers/${createdSpeakerId}`);
      assert(checkRes.status === 404, 'Deleted speaker returns 404 when queried');
    }

    // ----------------------------------------------------
    // JOIN ENDPOINT TESTS
    // ----------------------------------------------------
    console.log('\n--- Join Endpoint Tests ---');
    {
      const res = await fetch(`${baseUrl}/bookings`);
      const data = await res.json();
      assert(res.status === 200, 'GET /bookings returns 200 OK');
      assert(Array.isArray(data) && data.length > 0, 'GET /bookings returns list of bookings');
      
      const first = data[0];
      const hasTechnicianName = Boolean(first.technician_name);
      const hasSpeakerName = Boolean(first.speaker_name);

      assert(hasTechnicianName, 'Join query returns technician_name', `technician_name: ${first.technician_name}`);
      assert(hasSpeakerName, 'Join query returns speaker_name', `speaker_name: ${first.speaker_name}`);
    }

    // Also verify alias /bookings/joined
    {
      const res = await fetch(`${baseUrl}/bookings/joined`);
      const data = await res.json();
      assert(res.status === 200, 'GET /bookings/joined returns 200 OK');
      assert(Boolean(data[0].technician_name && data[0].speaker_name), 'Alias /bookings/joined returns joined fields');
    }

    // ----------------------------------------------------
    // TECHNICIANS CRUD TESTS
    // ----------------------------------------------------
    console.log('\n--- Technicians CRUD Tests ---');
    {
      const res = await fetch(`${baseUrl}/technicians`);
      const data = await res.json();
      assert(res.status === 200, 'GET /technicians returns 200 OK');
      assert(Array.isArray(data) && data.length > 0, 'GET /technicians returns list of technicians');
    }

  } catch (err) {
    console.error('Unexpected error during testing:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`Test Summary: Passed: ${passed}, Failed: ${failed}`);
    console.log('====================================================\n');
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
