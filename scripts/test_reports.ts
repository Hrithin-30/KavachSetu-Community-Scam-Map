/**
 * Automated Verification Script for KavachSetu API (Mitigata Problem 03 Rubric)
 * Run against live server: npx tsx scripts/test_reports.ts
 */
const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function runVerification() {
  console.log(`=== KavachSetu API Judge Verification Suite (${BASE_URL}) ===\n`);

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('1. GET /health ->', healthRes.status, health);

  // 2. Admin Reset (wipes to 0 reports as required by Student Brief Page 11)
  const resetRes = await fetch(`${BASE_URL}/admin/reset`, { method: 'POST' });
  console.log('2. POST /admin/reset ->', resetRes.status, await resetRes.json());

  // 3. Submit 3 independent reports for same phone number in messy formats using ip_prefix in body
  const formats = ['+91 98450-11223', '09845011223', '98450 11223'];
  for (let i = 0; i < formats.length; i++) {
    const repRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier_type: 'phone',
        identifier_value: formats[i],
        scam_type: 'digital-arrest',
        channel: 'WhatsApp',
        pincode: '560102',
        occurred_at: new Date().toISOString(),
        reporter_id: `judge_rep_${i + 1}`,
        ip_prefix: `${49 + i * 20}.205.10`,
        note: `Independent witness report #${i + 1} describing fake video call.`
      })
    });
    console.log(`3.${i + 1} POST /reports (${formats[i]}) ->`, repRes.status, await repRes.json());
  }

  // 4. Lookup the canonical number -> expect KNOWN_SCAM
  const lookupRes = await fetch(`${BASE_URL}/lookup?type=phone&value=9845011223`);
  const lookupData = await lookupRes.json();
  console.log('4. GET /lookup?type=phone&value=9845011223 ->', lookupRes.status, {
    verdict: lookupData.verdict,
    distinct_reporters: lookupData.distinct_reporters,
    display_value: lookupData.display_value
  });

  // 5. Verified entity protection check (freshbakes@okaxis & 1930)
  const verifiedRes = await fetch(`${BASE_URL}/lookup?type=upi&value=freshbakes@okaxis`);
  const verifiedData = await verifiedRes.json();
  console.log('5. GET /lookup?type=upi&value=freshbakes@okaxis ->', verifiedData.verdict);

  // 6. Business Dispute Challenge (/challenges with claimant_name and proof_note)
  const challengeRes = await fetch(`${BASE_URL}/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier_type: 'phone',
      identifier_value: '+91 98450 11223',
      claimant_name: 'Bengaluru MedCare Clinic',
      proof_note: 'Airtel PRI Line Allocation Certificate #BLR-99201'
    })
  });
  console.log('6. POST /challenges ->', challengeRes.status, await challengeRes.json());

  const postChallengeLookup = await fetch(`${BASE_URL}/lookup?type=phone&value=+919845011223`);
  const postChallengeData = await postChallengeLookup.json();
  console.log('7. GET /lookup (after dispute) ->', {
    verdict: postChallengeData.verdict,
    challenged: postChallengeData.challenged
  });

  // 8. Map & Alerts check
  const mapRes = await fetch(`${BASE_URL}/map?pincode=560102&days=7&radius_km=2`);
  const mapData = await mapRes.json();
  console.log('8. GET /map -> clusters count:', mapData.clusters?.length, mapData.clusters?.[0]);

  const alertsRes = await fetch(`${BASE_URL}/alerts?pincode=560102`);
  const alertsData = await alertsRes.json();
  console.log('9. GET /alerts -> alerts count:', alertsData.alerts?.length);

  // 10. Restore demo seed data so the browser UI remains populated for interactive review
  const seedRes = await fetch(`${BASE_URL}/api/demo/seed`, { method: 'POST' });
  console.log('10. POST /api/demo/seed ->', seedRes.status, await seedRes.json());
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
