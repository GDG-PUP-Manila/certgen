import fetch from 'node-fetch'; // If using an older Node version, otherwise native fetch is fine in v18+

/**
 * GDG CertGen Stress Test Simulator
 */

const TARGET_URL = 'https://cert.gdgpup.org/api/generate-cert';
const CONCURRENT_REQUESTS = 50;
const ATTENDANCE_CODE = 'SparkAtCosmos'; 
const EVENT_ID = '31f7a018-b3ca-4272-99f7-96fee480e41e';

async function runTest() {
  console.log(`🚀 Starting Stress Test: ${CONCURRENT_REQUESTS} concurrent requests to ${TARGET_URL}...`);
  console.log(`⏳ This will take a few seconds...\n`);

  const startTime = Date.now();
  const requests = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => {
    const id = i + 1;
    const payload = {
      email: `stress_test_user_${id}@example.com`,
      event_id: EVENT_ID,
      attendanceCode: ATTENDANCE_CODE,
      survey_data: {
        isPUPian: true,
        personalInfo: {
          name: `Stress User ${id}`,
          college: 'CCIS',
          program: 'BSIT',
          yearLevel: 'Third Year'
        },
        evaluation: {
          ratings: { schedule: 5, duration: 5, subject: 5, speakers: 5, programFlow: 5 },
          overallSatisfaction: 10,
          valuableAspects: "Stress testing system resilience.",
        }
      }
    };

    return fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://cert.gdgpup.org'
      },
      body: JSON.stringify(payload)
    }).then(async (res) => {
      const duration = Date.now() - startTime;
      if (res.ok) {
        console.log(`✅ Request #${id}: SUCCESS (${res.status}) - ${duration}ms`);
        return { success: true, status: res.status };
      } else {
        const text = await res.text();
        console.error(`❌ Request #${id}: FAILED (${res.status}) - ${text} - ${duration}ms`);
        return { success: false, status: res.status, error: text };
      }
    }).catch(err => {
      console.error(`💥 Request #${id}: CRASHED - ${err.message}`);
      return { success: false, error: err.message };
    });
  });

  const results = await Promise.all(requests);
  const endTime = Date.now();
  
  const successes = results.filter(r => r.success).length;
  const failures = results.length - successes;
  const rateLimited = results.filter(r => r.status === 429).length;

  console.log(`\n--- TEST SUMMARY ---`);
  console.log(`Total Time: ${(endTime - startTime) / 1000}s`);
  console.log(`Successes: ${successes}`);
  console.log(`Failures: ${failures} (Rate Limited: ${rateLimited})`);
  console.log(`--------------------\n`);
}

runTest();
