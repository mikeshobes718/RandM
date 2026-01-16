const res = await fetch('https://www.reviewsandmarketing.com/api/sales/leads/log-call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    googlePlaceId: 'ChIJW3GbtYVZwokRzNb56LoD2BQ',
    leadData: { name: 'Test' },
    repId: 'rep_test',
    outcome: 'no answer'
  })
});
const data = await res.json();
console.log('Status:', res.status);
console.log('Data:', JSON.stringify(data, null, 2));
