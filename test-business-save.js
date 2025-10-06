// This will help us debug what's happening
console.log("Testing business save flow...");

// Check the API endpoint
fetch('https://reviewsandmarketing.com/api/dashboard/summary', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log("Dashboard summary response:", JSON.stringify(data, null, 2));
  if (data.business) {
    console.log("✅ Business found:", data.business.name);
  } else {
    console.log("❌ No business found");
  }
})
.catch(e => console.error("Error:", e));
