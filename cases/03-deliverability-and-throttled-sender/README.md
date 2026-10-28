# 03 · Deliverability and a throttled sender

**Question:** Are the emails reaching the inbox, and can a single Google Workspace mailbox send ~45 cold emails a day without looking like a bulk sender?
**Company:** A (plus domain setup for Company B) · **When:** October 2026 · **Stack:** Google Workspace, Google Apps Script, DNS, mail-tester, seed inboxes.

## What I found

I sent a seed test to 3 inboxes I control. 2 landed in the inbox. The Google Workspace one landed in **spam**.

"Show original" showed SPF, DKIM and DMARC all passing, so authentication wasn't the cause. The cause was in the signature:
- The company domain was being auto-linked as `http://` (no TLS).
- The workaround meant to prevent that (a zero-width character) never actually worked.
- The http link didn't even load.

## What I changed

1. Removed the domain from the signature across the whole system: the template, the agents' instructions and the drafting tool. mail-tester: **10/10**.
2. Moved sending out of "draft everything, send in a burst" into a **throttled sender** ([tools/throttled-sender.gs](../../tools/throttled-sender.gs)). It's an Apps Script that runs every 10 minutes and sends at most one approved draft per run:
   - Business hours in the prospect's time zone (9:00–16:00 ET, Monday to Friday).
   - A daily cap (35 → 40 → 45, raised step by step after clean days).
   - At least 8 minutes between sends, and a random 30% skip so it doesn't send on an exact clock.
   - A 30-minute review window before a draft can go out.
   - It sends only drafts that carry the approved signature and have an external recipient. Internal domains are excluded.
   - Per-thread "do not send" label, plus a global `pause()` / `resume()` kill switch.
3. Brake rule: if bounces pass 3% in a day, or the weekly seed test lands in spam again, the cap drops to 30 for that day.

## Company B: domain from zero

The new domain had MX and SPF, but no DKIM and no DMARC. Before any outreach I added:
- DKIM (2048-bit);
- DMARC at `p=none` (monitoring), with a plan to move to `quarantine` after 2–4 clean weeks.

I set both through the Wix DNS API and verified them on public DNS, then logged each change with what changed, where, who did it and its status.

## Numbers

| Metric | Value |
|---|---|
| Emails sent (month) | ~500 |
| Bounces | 6 (~1.2%) |
| Authentication | SPF, DKIM, DMARC pass on both domains |
| mail-tester | 10/10 after the signature fix |

## What this proves, and what it doesn't

- **It proves** a single mailbox can run steady, human-paced cold email with low bounces, and that the sender can be stopped in one call.
- **It doesn't prove** long-term domain reputation. That takes months of data, and Google Postmaster no longer exposes a domain reputation score. To scale, I would add a second warmed mailbox before raising the cap.
