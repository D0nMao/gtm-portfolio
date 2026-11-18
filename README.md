# GTM Engineering Portfolio: Harold Mauricio Lopez

I build outbound and go-to-market systems: an AI agent team that finds accounts with buying signals, verifies them before spending a single credit, writes 1:1 messages, checks them automatically, and sends on a throttle a human controls.

This repo documents two systems I built and run in production (October to November 2026; data updated 18 Nov 2026), one per company, plus the operating model behind both. Everything here is sanitized: companies and people are anonymized, and all sample data is synthetic (`*.example.com`).

| | Company A | Company B |
|---|---|---|
| What they sell | Nearshore talent from Latin America to US companies | Corporate event production in Bogotá (new B2B line) |
| Market and language | US, English | Colombia, Spanish |
| Channels | Cold email, LinkedIn | LinkedIn, email, WhatsApp, Google and AI search |
| My role | Head of Sales, built the GTM system end to end | Built the B2B line's acquisition system |

## Results so far (about seven weeks, from zero; updated 18 Nov 2026)

| Metric | Value | Notes |
|---|---|---|
| Cold emails sent | ~500 in the first month; 234 more from 3 to 18 Nov | Company A, one mailbox, capped at 45/day. The 234 are 54 first touches and 180 follow-ups to 183 unique people. I have not merged the two into one running total |
| Accounts in CRM | 497 (420 at the first count) | Every account has a source and a documented signal. 76 new, 340 connected, 57 discarded, 2 that were already clients before I started |
| Bounce rate | ~1.2% (6) in the first month; 0 of 234 from 3 to 18 Nov | 2 of the first 6 came from a bug I documented in [case 05](cases/05-incident-thread-recipient/). On 18 Nov a draft to an address that had bounced on 9 Oct was caught and deleted before sending |
| Authentication | SPF, DKIM, DMARC | Pass on Company A (mail-tester 10/10 after the fix in [case 03](cases/03-deliverability-and-throttled-sender/)); set up from scratch on Company B's new domain |
| Replies | ~1% in the first month; 2 from 3 to 18 Nov (1 positive, 1 neutral) | First month: 2 replies reached pricing with decision makers (a CSO; an HR manager after an internal referral). On 18 Nov an HR manager asked for a call, the first positive reply to the "open job posting in LatAm" angle |
| Meetings booked (Company A) | 0 | The open problem; one call request is pending as of 18 Nov. Diagnosis and fix in [case 02](cases/02-copy-qa-without-templates/) |
| Meetings booked (Company B) | 4 at proposal stage | The 4 event requests below, none closed yet |
| Templated-copy errors per batch | 21 → 3 | Automated validator, same 45-email batch before and after |
| Google reviews (Company B) | 0 → 12 | Five-star reviews in ~2 hours from one WhatsApp campaign. Still 12 on 10 Nov. The profile does not yet show up in generic "corporate events Bogotá" Maps searches; [case 04](cases/04-local-b2b-launch-geo/) has the measurements |
| Event requests (Company B) | 4, all at proposal stage | Quotes and messages for events and stage builds since launch: 1 by email, 2 by WhatsApp, 1 from directories. None closed yet. Breakdown in [case 04](cases/04-local-b2b-launch-geo/) |

I report the meetings number as it is. Company A has 0. Company B has 4 requests that reached a proposal, and none has closed. The systems are about seven weeks old, and what they have proven so far is the top of the funnel: finding, verifying, reaching decision makers, and getting into pricing and proposal conversations. The case studies say what each part proves and what it does not.

## What changed in November

- **Target rule:** Company A now sends only to companies of 1 to 50 people (51 or more stopped working), and the score threshold went from 7 to 5.
- **Credits:** Apollo credits ran out on 18 Nov, so cold first touches are paused and the daily 45 go to follow-ups first.
- **Source of truth:** the CRM had drifted (20 accounts marked "no first touch" had already had two emails), so every batch is now cross-checked against Gmail, not against the CRM field.

## Case studies

| # | Case | What it shows |
|---|---|---|
| 01 | [Signal-based outbound](cases/01-signal-based-outbound/) | 6,240 job postings → 7 qualified accounts → 5 verified decision-maker emails for 5 credits |
| 02 | [Copy QA without templates](cases/02-copy-qa-without-templates/) | How an AI writing team drifted into a template, and the script that now catches it |
| 03 | [Deliverability and a throttled sender](cases/03-deliverability-and-throttled-sender/) | From the spam folder to 10/10, and an Apps Script that sends like a person |
| 04 | [Launching a local B2B line](cases/04-local-b2b-launch-geo/) | Domain setup, landing page, Google profile, AI-search (GEO) baseline and reviews |
| 05 | [Incident: wrong recipient on threaded follow-ups](cases/05-incident-thread-recipient/) | A real bug, how it was caught, and how the process was demoted until it is fixed |

## How it is built

- **[Architecture](docs/architecture.md):** a manager agent plus five specialists (research, data, copy, QA, RevOps), a live office dashboard and an approval inbox.
- **[Operating model](docs/operating-model.md):**
  - a process registry, with one human owner per process;
  - SOPs on a fixed template;
  - an automation ladder (A0 assisted to A3 autonomous);
  - run logs, and deviations that become test cases.
- **[Tools](tools/):** the code that runs in production, translated and sanitized:
  - `throttled-sender.gs`: Gmail drafts sent one at a time, inside business hours, with a daily cap and a kill switch.
  - `radar-himalayas.js`: a job-board signal radar.
  - `validate-copy.js`: catches repeated phrasing, banned phrases and length problems across a batch.
  - `sanitize-check.js`: the gate this repo runs before every commit.
- **[Agents](agents/):** the role specs for each agent.
- **[SOPs](sops/):** the SOP template and one full example.

## Design principles

1. **Signal before spend.** No credit is spent until an account has a documented buying signal and passes free verification (size, not a competitor, a real decision maker).
2. **Humans approve what leaves.** Anything that reaches a prospect (an email, a DM, a public comment) passes QA and a human. That has a hard ceiling: those processes never go fully autonomous.
3. **Every rule lives in one place.** If a rule only lives in a chat, the model will improvise around it. Rules go in the SOP of the process they govern.
4. **Write down the run, especially when it fails.** Every run is logged, and every deviation becomes a test case.
5. **Report the real number.** Including the ones that are still zero.

## Stack

Claude Code in VS Code with custom subagents · Gmail and Google Apps Script · Apollo (free plan, credit-gated) · HubSpot (read-only) · LinkedIn (manual, not automated) · Himalayas, Workable and Hacker News APIs · Wix API (DNS, CMS, Google Business Profile, llms.txt) · Claude artifacts as CRM and dashboards · Node.js scripts.

## About the data

No client data and no real third-party personal data are in this repo. Companies are described by industry and size only. Every email and domain in the samples ends in `example.com`. The numbers come from the production systems and are aggregates. `tools/sanitize-check.js` blocks any commit that contains a real email address, a private artifact link or a name on the local denylist.

## License

Code in `tools/` is MIT. Case-study text, diagrams and docs are © Harold Mauricio Lopez, all rights reserved.

## Contact

Harold Mauricio Lopez · Bogotá, Colombia · [LinkedIn](https://www.linkedin.com/in/maolopez/) · ad.mauricio.lopez@gmail.com
