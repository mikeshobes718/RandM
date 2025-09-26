const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
(async () => {
  const res = await fetch('https://reviewsandmarketing.com/api/plan/status',{headers:{}});
  console.log(res.status);
  console.log(await res.text());
})();
