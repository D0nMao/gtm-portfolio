# 04 · Launching a local B2B line (domain, web, Google profile, AI search, reviews)

**Question:** A 20-year event producer known for weddings wants to sell corporate events. How do companies, and the AI assistants they ask, find out the business does that?
**Company:** B (Bogotá, Spanish market) · **When:** October 2026 · **Stack:** Wix (editor plus API), Google Business Profile, Gemini/ChatGPT/Perplexity, LinkedIn (manual), WhatsApp.

## Starting point (audit)

- The website was 100% about weddings. Corporate events got one sentence.
- 6 of the 8 indexed pages were duplicates of an unrelated affiliate course page. That dilutes search relevance and confuses a corporate buyer.
- Two different contact emails were published, and one had a typo.
- The new domain had no DKIM or DMARC (see [case 03](../03-deliverability-and-throttled-sender/)).
- **AI search baseline:** asked for event companies in Bogotá, Gemini built its lists from Google Maps listings with a visible rating. It saw this company as a wedding planner, and it had **0 reviews**, so it wasn't in the lists.

## What I built

1. **A B2B landing page:** what's included, scale by headcount, FAQ, a lead form that writes to a CMS collection, and a WhatsApp button. The FAQ and key copy are native text, not embedded HTML, because Google and AI crawlers don't read embedded blocks.
2. **Structured data:** JSON-LD `EventPlanner`, validated on the published site.
3. **llms.txt rewritten.** The previous version promised a "satisfaction guarantee" the business doesn't offer.
4. **Google Business Profile:**
   - One name, phone and email across the profile and directories.
   - Hidden home address (a privacy risk with Street View).
   - An 8-zone service area set through the API.
   - Categories, 15 photos and a WhatsApp link.
5. **Reviews:** a WhatsApp campaign to past clients. **0 → 12 five-star reviews in about 2 hours.** The 13th came from the owner, so it gets removed. Goal: 10 that stick before the year-end corporate season closes.
6. **Directories:** a single fact sheet to copy from, plus a tracker of profile links.
7. **Outbound:**
   - LinkedIn to HR and People leaders: first batch, 10 invitations, 2 accepted the same day (20%).
   - Partnership outreach to boutique hotels and venues.
   - A four-touch LinkedIn follow-up system with reply branches.

## Results: event requests by channel

Since launch, Company B received **4 event requests** (quotes and messages about events and stage builds). All 4 reached a proposal. None has closed yet.

| Channel | Requests |
|---|---|
| Email | 1 |
| WhatsApp | 2 |
| Directories | 1 |

Counts only, no client names. Closing is still pending, so revenue is not reported.

## Update, 10 Nov: Google Maps visibility

- Reviews: 12 visible (the owner's was removed).
- A first Maps search showed the profile at position 6, but that result was personalized. A second search with the same phrase, over the full list of about 90 results, did not show it at all, so I treat the position-6 reading as invalid.
- Hypothesis, not confirmed: few reviews with text, no visible address (service-area business), no recent posts, no "years in business" label. Competitors that rank put the search words in their names, which Google can penalize, so I am not copying that.
- Next step: measure weekly with the same phrase from the same place. Further Maps work and venue outreach are paused until December because the owner's calendar is full.

## Lessons logged

- In Wix, saving is not publishing. Every change was verified on the published site (view-source, the schema validator, the sitemap).
- The Wix screen that syncs with the Google profile carries old data and can overwrite the profile.
- Google's WhatsApp field takes a `wa.me` URL, not a number.
- Lists in AI assistants come from Maps with visible ratings. Reviews are the price of entry, not a bonus.

## What this proves, and what it doesn't

- **It proves** the launch checklist was executed and verified end to end: domain, site, structured data, profile, reviews.
- **It doesn't prove** the AI-search result yet. The Gemini re-test was scheduled for early November and I have no result to report yet. The first effects usually show in 8–12 weeks, and the profile does not yet appear in generic Maps searches.
- **It shows** the channels are producing demand: 4 requests reached a proposal, across 3 channels.
- **It doesn't show** revenue or conversion: none of the 4 has closed, and 4 requests is too small a sample to say which channel is best.
