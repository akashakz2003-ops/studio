const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:5000${path}`,
      {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } catch (_) {
            resolve({ status: res.statusCode, headers: res.headers, text: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING STUDIO FINANCIAL APP VERIFICATION SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Clean up test state before running assertions
    await request('/api/settings', {
      method: 'PUT',
      body: {
        passport_base_qty: 4,
        passport_base_price: 200,
        passport_reprint_price: 100,
        photostat_price_per_copy: 4,
        staff_salary_monthly: 15600,
        rent_daily_rate: 600,
        electricity_monthly: 1500,
      },
    });

    const testDate = '2026-09-22';
    await request('/api/rent-days/toggle', { method: 'POST', body: { date: testDate, applicable: 1 } });

    const existingTxs = await request(`/api/transactions?startDate=${testDate}&endDate=${testDate}&limit=100`);
    if (existingTxs.data?.data) {
      for (const t of existingTxs.data.data) {
        await request(`/api/transactions/${t.id}`, { method: 'DELETE' });
      }
    }

    // 0. Test Security & Login Authentication
    console.log('\n--- Testing Authentication & Security (Password Disabled) ---');
    const authStatus = await request('/api/auth/status');
    assert(authStatus.status === 200 && authStatus.data.success, 'Auth status endpoint returned 200');
    assert(authStatus.data.isPasswordRequired === false, 'Auth status returns isPasswordRequired === false');
    assert(authStatus.data.app_password === undefined, 'Auth status does NOT expose app_password');

    // 1. Check Initial Settings
    const sRes = await request('/api/settings');
    assert(sRes.status === 200 && sRes.data.success, 'Settings endpoint returned 200');
    const settings = sRes.data.data;
    assert(settings.app_password === undefined, 'Settings endpoint does NOT expose plain text app_password');
    assert(settings.passport_base_qty === 4, 'Initial passport base quantity is 4');
    assert(settings.passport_base_price === 200, 'Initial passport base price is ₹200');
    assert(settings.photostat_price_per_copy === 4, 'Initial photostat price is ₹4/copy');
    assert(settings.staff_salary_monthly === 15600, 'Initial staff salary is ₹15,600/month');
    assert(settings.rent_daily_rate === 600, 'Initial daily rent is ₹600/day');
    assert(settings.electricity_monthly === 1500, 'Initial electricity is ₹1,500/month');

    // 2. Add Quick Daily Sales Entry
    console.log('\n--- Testing Quick Daily Sales Entry ---');
    const entryRes = await request('/api/daily-sales/quick-entry', {
      method: 'POST',
      body: {
        date: testDate,
        passportQty: 8, // 8 photos = ₹400
        passportType: 'new',
        photostatCopies: 30, // 30 copies = ₹120
        otherAmount: 150, // ₹150
        otherDescription: 'Photo lamination',
      },
    });

    assert(entryRes.status === 200 && entryRes.data.success, 'Quick sale entry created successfully');
    const created = entryRes.data.createdTransactions;
    assert(created.length === 3, 'Created 3 separate transaction items (passport, photostat, other)');
    const passportTx = created.find(t => t.category === 'passport');
    const photostatTx = created.find(t => t.category === 'photostat');
    const otherTx = created.find(t => t.category === 'other_income');
    assert(passportTx && passportTx.amount === 400, '8 passport photos calculated as ₹400');
    assert(photostatTx && photostatTx.amount === 120, '30 photostat copies calculated as ₹120');
    assert(otherTx && otherTx.amount === 150, 'Other income recorded as ₹150');

    // 3. Verify Daily Sales & Today's Summary
    console.log('\n--- Verifying Daily Sales Summary ---');
    const dayRes = await request(`/api/daily-sales?date=${testDate}`);
    assert(dayRes.data.passportRevenue === 400, 'Passport revenue for day is ₹400');
    assert(dayRes.data.photostatRevenue === 120, 'Photostat revenue for day is ₹120');
    assert(dayRes.data.otherRevenue === 150, 'Other income for day is ₹150');
    assert(dayRes.data.totalRevenue === 670, 'Total daily revenue is ₹670');
    assert(dayRes.data.rentApplicable === true, 'Rent is applicable today');
    assert(dayRes.data.dailyRent === 600, 'Daily rent is ₹600');
    assert(dayRes.data.dailyProfit === 70, 'Daily profit is ₹670 - ₹600 = ₹70');

    // 4. Verify Rent Toggle
    console.log('\n--- Testing Rent Day Toggle ---');
    await request('/api/rent-days/toggle', {
      method: 'POST',
      body: { date: testDate, applicable: 0 },
    });
    const rentToggledRes = await request(`/api/daily-sales?date=${testDate}`);
    assert(rentToggledRes.data.rentApplicable === false, 'Rent successfully marked waived for date');
    assert(rentToggledRes.data.dailyRent === 0, 'Daily rent is now ₹0');
    assert(rentToggledRes.data.dailyProfit === 670, 'Daily profit with waived rent is ₹670');

    // Toggle rent back to Yes
    await request('/api/rent-days/toggle', {
      method: 'POST',
      body: { date: testDate, applicable: 1 },
    });

    // 5. Add Manual Expense
    console.log('\n--- Testing Manual Expense Entry ---');
    const expRes = await request('/api/transactions', {
      method: 'POST',
      body: {
        date: testDate,
        type: 'expense',
        category: 'supplies',
        description: 'Photo Glossy Paper 500 sheets',
        amount: 850,
      },
    });
    assert(expRes.status === 200 && expRes.data.success, 'Manual expense recorded');
    const manualExpId = expRes.data.data.id;

    // Verify day summary with expense
    const dayWithExpRes = await request(`/api/daily-sales?date=${testDate}`);
    assert(dayWithExpRes.data.manualExpenseTotal === 850, 'Manual expense total reflects ₹850');
    assert(dayWithExpRes.data.totalDailyExpenses === 1450, 'Total daily expenses is ₹600 + ₹850 = ₹1,450');
    assert(dayWithExpRes.data.dailyProfit === 670 - 1450, 'Daily net profit is ₹670 - ₹1450 = -₹780');

    // 6. Test Transaction Edit
    console.log('\n--- Testing Transaction Editing ---');
    const updateRes = await request(`/api/transactions/${passportTx.id}`, {
      method: 'PUT',
      body: {
        quantity: 12,
        rate: 50,
        amount: 600, // 12 photos @ ₹50 = ₹600
        description: 'Passport photos (new) - 12 photos updated',
      },
    });
    assert(updateRes.status === 200 && updateRes.data.success, 'Updated passport transaction');
    const dayAfterEdit = await request(`/api/daily-sales?date=${testDate}`);
    assert(dayAfterEdit.data.passportRevenue === 600, 'Recalculated passport revenue is now ₹600');
    assert(dayAfterEdit.data.totalRevenue === 600 + 120 + 150, 'Recalculated total revenue is ₹870');

    // 7. Test Settings Change & Dynamic Calculations
    console.log('\n--- Testing Dynamic Settings Change ---');
    // Change photostat rate from ₹4 to ₹5
    await request('/api/settings', {
      method: 'PUT',
      body: { photostat_price_per_copy: 5 },
    });
    const sUpdated = (await request('/api/settings')).data.data;
    assert(sUpdated.photostat_price_per_copy === 5, 'Photostat rate updated to ₹5 in database');

    // Add photostat sale of 20 copies
    const newCopySale = await request('/api/daily-sales/quick-entry', {
      method: 'POST',
      body: {
        date: testDate,
        photostatCopies: 20,
      },
    });
    const copyTx = newCopySale.data.createdTransactions.find(t => t.category === 'photostat');
    assert(copyTx && copyTx.amount === 100, '20 copies @ ₹5 = ₹100 calculated dynamically');

    // Restore photostat rate back to ₹4
    await request('/api/settings', {
      method: 'PUT',
      body: { photostat_price_per_copy: 4 },
    });

    // 8. Test Transaction Deletion
    console.log('\n--- Testing Transaction Deletion ---');
    const delRes = await request(`/api/transactions/${manualExpId}`, {
      method: 'DELETE',
    });
    assert(delRes.status === 200 && delRes.data.success, 'Manual expense deleted successfully');
    const dayAfterDel = await request(`/api/daily-sales?date=${testDate}`);
    assert(dayAfterDel.data.manualExpenseTotal === 0, 'Manual expenses reset back to 0');

    // 9. Test Monthly Report
    console.log('\n--- Testing Monthly Financial Report ---');
    const monthRep = await request('/api/reports/monthly?month=2026-09');
    assert(monthRep.status === 200 && monthRep.data.success, 'Monthly report generated');
    assert(monthRep.data.income.passport >= 600, 'Monthly report passport income accurate');
    assert(monthRep.data.expenses.staffSalary === 15600, 'Monthly report staff salary ₹15,600');
    assert(monthRep.data.expenses.electricity === 1500, 'Monthly report electricity ₹1,500');
    assert(monthRep.data.dailyHistory.length === 30, 'Daily history contains all 30 days of September');

    // 10. Test CSV Export
    console.log('\n--- Testing CSV Export ---');
    const exportRes = await request('/api/export?startDate=2026-09-01&endDate=2026-09-30');
    assert(exportRes.status === 200, 'CSV export endpoint returned 200');
    assert(exportRes.headers['content-type'].includes('text/csv'), 'Content-type is text/csv');
    assert(exportRes.text.includes('Passport photos'), 'CSV contains transaction descriptions');

    console.log(`\n===================================================`);
    console.log(`TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`===================================================`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test suite encountered an unhandled error:', err);
    process.exit(1);
  }
}

runTests();
