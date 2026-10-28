# 05 · Incident: wrong recipient on threaded follow-ups

**Severity:** medium (2 bounces, 6 near misses) · **Date:** October 2026 · **Process:** P17 Gmail drafts (RevOps agent) · **Status:** mitigated; the process was demoted A1 → A0 until its SOP is fixed.

## What happened

The RevOps agent created 50 drafts in one batch. 38 were follow-ups written as replies inside existing threads.

For 8 of them, the draft was addressed to the contact's email **without the dot** (`firstnamelastname@`). The original thread had gone to `firstname.lastname@`. The agent noticed the mismatch and reported it, but assumed the thread was right and the CRM was wrong.

The throttled sender started sending. Two bounced the same day: one "address not found", one "blocked".

## How it was caught

The end-of-day report put the bounce count next to the agent's "0 bounces in 48h" summary, and the two didn't match. The manager opened both bounce notices. Both were addressed to dotless versions of emails that had worked before.

The manager then pulled the original sent messages in the threads, confirmed the dotted address in every case, and searched the queue for the other 6 dotless recipients.

## Fix

1. Deleted the 6 remaining drafts before they sent, and recreated them as replies to the last sent message, addressed to the exact original recipient.
2. Queued the 2 bounced follow-ups to resend to the correct address.
3. Logged the deviation in the run log.

## Root cause

The rule for "who does a follow-up go to" was never written down. The agent picked a source by inference. That is the exact failure the [operating model](../../docs/operating-model.md) exists to prevent: a gap in the process gets filled by improvisation.

## Prevention

- **New SOP rule and test case:** before creating a reply, the recipient must match, character for character, the `to` of the last sent message in the thread. If it doesn't, stop and report. Never pick one.
- **Process demoted** from A1 (runs on request) to A0 (assisted). It goes back up after 3 clean runs.
- The CRM gets corrected from the thread, the source that actually delivered.

## Why this is in a portfolio

Because it will happen in any system that lets agents touch real outbound. What matters is that it was caught the same day, contained before most of it went out, and turned into a rule and a test, not a one-off fix.
