// ATS board radar: polls the public job-board APIs (Greenhouse, Ashby, Lever, Workable) of a curated company list
// and keeps remote roles open to Latin America or worldwide, flagging the ones that disclose pay in USD or EUR.
// The company list comes from the open dataset github.com/pugarte7/spanish-top-tech-companies (data/careers.json, CC BY-SA 4.0
// for data). Its boards are mostly European or US-headquartered employers that hire remote, so the pay is in hard currency.
// Two modes:
//   jobs (default): job search. Remote roles open to LatAm/worldwide, paid in USD/EUR when disclosed.
//   leads: sales signal. Companies posting the roles we place (engineers, support, admin, finance ops), one row per company
//          with a priority (1: open to LatAm, 2: remote, 3: the role fits). Competitor and size filtering happen in the next step.
// Usage: node radar-ats.js [--mode leads] [--paid-only] [--extra boards.json]
//   boards.json (optional): [{ "ats": "greenhouse|ashby|lever|workable", "board": "slug", "name": "Company" }]
// Output: one line per posting: company | title | location | pay | url
const CAREERS = 'https://raw.githubusercontent.com/pugarte7/spanish-top-tech-companies/main/data/careers.json';
// Job-search profile (jobs mode). Default "gtm": Head of Sales / GTM engineer. "--profile all" restores the generic role list.
// ★★★ core GTM (revops, GTM engineering, sales ops, sales leadership, outbound, growth) · ★★ adjacent (partnerships, CS, solutions, BD, marketing ops).
const gtm = process.argv[process.argv.indexOf('--profile') + 1] !== 'all';
const gtmCore = /(gtm|go.?to.?market|rev(enue)?.?ops|sales ops|sales operations|sales engineer|growth|demand gen|outbound|sales enablement|head of sales|sales (manager|lead)|vp (of )?sales|business operations|marketing operations|automation engineer)/i;
const gtmAdjacent = /(customer success|solutions|partnership|business development|account (executive|manager)|sales|marketing|operations manager)/i;
// Engineering, security and risk titles that mention "growth" or "operations" are not GTM roles, unless the title says GTM or sales/automation engineering.
const offProfile = /(software|full.?stack|react|backend|frontend|engineering manager|security|risk|compliance|regulatory|devops)/i;
const keepAnyway = /(gtm|go.?to.?market|sales engineer|solutions engineer|presales|automation)/i;
const internOnly = /(intern\b|internship|junior)/i;
const leads =process.argv[process.argv.indexOf('--mode') + 1] === 'leads';
const paidOnly =process.argv.includes('--paid-only');
const extraIdx = process.argv.indexOf('--extra');
const latam = /(latin america|latam|americas|worldwide|anywhere|global|mexico|colombia|argentina|brazil|chile|peru|costa rica|uruguay|ecuador|guatemala|dominican|panama|el salvador|honduras|paraguay)/i;
// Regions that exclude LatAm candidates; a remote posting naming one of these is dropped, a bare "Remote" is kept with a VERIFY flag.
const restricted = /(united states|usa|\bus\b|u\.s\.|canada|\buk\b|united kingdom|europe|emea|apac|asia|india|germany|france|spain|ireland|netherlands|poland|portugal|italy|sweden|australia|singapore|israel|japan|dach|nordic|\bEU\b|\b(aus|ita|deu|gbr|fra|esp|nld|pol|prt|irl|swe|ind|sgp|jpn|can|usa)\b)/i;
const role =/(engineer|developer|full.?stack|backend|frontend|support|customer success|solutions|data|devops|qa|product|designer|analyst|operations|revops|growth|marketing)/i;
const exclude = /(intern\b|principal|staff |vp |head of|director)/i;
// Roles we place for US companies (Company A offer); sales and recruiting titles are excluded, as in radar-himalayas.js.
const placed = /(engineer|developer|full.?stack|backend|frontend|support|customer success|executive assistant|admin|paralegal|billing|accounts receivable|bookkeep|accountant|qa|data analyst|devops)/i;
const notPlaced = /(sales|account executive|sdr|bdr|recruit|senior director|vp |head of|principal|staff |intern\b)/i;

// Pull {ats, board} out of a careers URL or an object entry.
function parse(entry) {
  if (typeof entry === 'object') return ['greenhouse', 'ashby', 'lever', 'workable'].includes(entry.ats) ? { ats: entry.ats, board: entry.board } : null;
  for (const [ats, re] of [['greenhouse', /greenhouse\.io\/(?:embed\/job_board\?for=)?([\w-]+)/], ['ashby', /jobs\.ashbyhq\.com\/([\w.-]+)/], ['lever', /jobs(?:\.eu)?\.lever\.co\/([\w-]+)/], ['workable', /apply\.workable\.com\/([\w-]+)/]]) {
    const m = entry.match(re);
    if (m) return { ats, board: m[1] };
  }
  return null;
}

const money = (cur, lo, hi) => `${cur} ${lo ? Math.round(lo / 1000) + 'k' : '?'}-${hi ? Math.round(hi / 1000) + 'k' : '?'}`;
const hard = (cur) => /^(USD|EUR)$/i.test(cur || '');
const get = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } };

const fetchers = {
  async greenhouse(b) {
    const j = await get(`https://boards-api.greenhouse.io/v1/boards/${b}/jobs`);
    return (j?.jobs || []).map(x => ({ title: x.title, loc: x.location?.name || '', url: x.absolute_url, remote: /remote/i.test(x.location?.name || ''), pay: null }));
  },
  async ashby(b) {
    const j = await get(`https://api.ashbyhq.com/posting-api/job-board/${b}?includeCompensation=true`);
    return (j?.jobs || []).map(x => {
      const c = (x.compensation?.summaryComponents || []).find(s => s.compensationType === 'Salary');
      return { title: x.title, loc: [x.location, ...(x.secondaryLocations || []).map(s => s.location)].join(' / '), url: x.jobUrl, remote: x.isRemote || /remote/i.test(x.workplaceType || ''), pay: c ? { cur: c.currencyCode, lo: c.minValue, hi: c.maxValue } : null };
    });
  },
  async lever(b) {
    const j = await get(`https://api.lever.co/v0/postings/${b}?mode=json`);
    return (Array.isArray(j) ? j : []).map(x => ({ title: x.text, loc: (x.categories?.allLocations || [x.categories?.location]).filter(Boolean).join(' / '), url: x.hostedUrl, remote: x.workplaceType === 'remote' || /remote/i.test(x.categories?.location || ''), pay: x.salaryRange ? { cur: x.salaryRange.currency, lo: x.salaryRange.min, hi: x.salaryRange.max } : null }));
  },
  async workable(b) {
    const j = await get(`https://apply.workable.com/api/v1/widget/accounts/${b}`);
    return (j?.jobs || []).map(x => ({ title: x.title, loc: [x.city, x.country].filter(Boolean).join(', '), url: x.url, remote: !!x.telecommuting, pay: null }));
  },
};

(async () => {
  const careers = await get(CAREERS) || {};
  let boards = Object.entries(careers).map(([slug, e]) => { const p = parse(e); return p && { ...p, name: slug }; }).filter(Boolean);
  if (extraIdx > -1) boards = boards.concat(require('fs').existsSync(process.argv[extraIdx + 1]) ? JSON.parse(require('fs').readFileSync(process.argv[extraIdx + 1], 'utf8')) : []);
  let scanned = 0, kept = 0;
  const seenCo = new Set(), rows = [];
  const queue = [...boards];
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let b; (b = queue.shift());) {
      const jobs = await fetchers[b.ats](b.board);
      scanned += jobs.length;
      for (const j of jobs) {
        if (leads) {
          if (!placed.test(j.title) || notPlaced.test(j.title) || seenCo.has(b.name)) continue;
          seenCo.add(b.name); kept++;
          const prio = latam.test(j.loc) ? 1 : j.remote ? 2 : 3;
          console.log([b.name, j.title, j.loc || 'remote', 'P' + prio, j.url].join(' | '));
          continue;
        }
        // Confirmed: the posting names LatAm or worldwide. Verify: remote with no region that excludes us (a bare "Remote" often hides the real rule).
        const confirmed = latam.test(j.loc);
        // Only a generic location qualifies: a named city means an office-based or country-bound role.
        const verify = !confirmed && j.remote && (j.loc === '' || /^(remote|home.?based|fully remote)\b/i.test(j.loc.trim())) && !restricted.test(j.loc);
        const open = confirmed ? (j.remote || /remote/i.test(j.loc) || j.loc !== '') : verify;
        const score = gtm ? (gtmCore.test(j.title) ? 3 : gtmAdjacent.test(j.title) ? 2 : 0) : (role.test(j.title) && !exclude.test(j.title) ? 1 : 0);
        if (!open || !score || internOnly.test(j.title) || (gtm && offProfile.test(j.title) && !keepAnyway.test(j.title))) continue;
        const pay = j.pay ? (hard(j.pay.cur) ? money(j.pay.cur, j.pay.lo, j.pay.hi) : 'other: ' + money(j.pay.cur, j.pay.lo, j.pay.hi)) : 'undisclosed';
        if (paidOnly && !/^(USD|EUR)/.test(pay)) continue;
        kept++;
        rows.push({ score, verify: confirmed ? 0 : 1, paid: /^(USD|EUR)/.test(pay) ? 1 : 0, line: [b.name, j.title, j.loc || 'remote', pay, (confirmed ? '' : 'VERIFY LatAm eligibility | ') + j.url].join(' | ') });
      }
    }
  }));
  // Best profile fit first; within the same fit, roles that disclose USD/EUR pay first.
  rows.sort((a, c) => c.score - a.score || a.verify - c.verify || c.paid - a.paid).forEach(r => console.log(`${'★'.repeat(r.score)} | ${r.line}`));
  console.log(`# ${boards.length} boards, ${scanned} postings scanned, ${kept} kept. "Remote" with no region is NOT proof it is open to LatAm: check the posting before applying.`);
})();
