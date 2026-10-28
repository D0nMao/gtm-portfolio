// Himalayas signal radar: pulls the public recent-jobs feed and keeps target roles open to Latin America or worldwide.
// Usage: node radar-himalayas.js [hours=24]
// Output: one line per company (first matching posting). Competitor and size filtering happen in the next step (data agent).
const hours = Number(process.argv[2] || 24);
const latam = ['Mexico','Colombia','Argentina','Brazil','Chile','Peru','Costa Rica','Uruguay','Ecuador','Guatemala','Dominican Republic','Panama','El Salvador','Honduras','Paraguay','Latin America'];
const role = /(engineer|developer|full.?stack|backend|frontend|support|customer success|executive assistant|admin|paralegal|legal assistant|billing|accounts receivable|bookkeep|accountant|qa|data analyst|devops)/i;
const exclude = /(sales|account executive|sdr|bdr|recruit|senior director|vp |head of|principal|staff )/i;

(async () => {
  let cursor = '', all = [];
  for (let i = 0; i < 100; i++) {
    const r = await fetch('https://himalayas.app/jobs/api?limit=20' + (cursor ? '&cursor=' + cursor : ''));
    const j = await r.json(); all.push(...j.jobs); cursor = j.nextCursor;
    if (!cursor || all[all.length - 1].pubDate * 1000 < Date.now() - hours * 36e5) break;
  }
  const seen = new Set();
  const rows = all.filter(j => {
    const loc = j.locationRestrictions || [], tz = j.timezoneRestrictions || [];
    return (loc.length === 0 || loc.some(l => latam.includes(l)))   // worldwide or LatAm
      && (tz.length === 0 || tz.some(t => t <= -3 && t >= -8))       // Americas time zones
      && role.test(j.title) && !exclude.test(j.title) && j.employmentType !== 'Part Time';
  }).filter(j => !seen.has(j.companySlug) && seen.add(j.companySlug)); // one row per company
  for (const j of rows) console.log([j.companyName, j.title, (j.locationRestrictions || []).join('/') || 'worldwide', new Date(j.pubDate * 1000).toISOString().slice(0, 10), j.applicationLink || j.guid].join(' | '));
  console.log(`# ${all.length} postings scanned, ${rows.length} candidate companies (competitors and size not filtered yet)`);
})();
