# 02 · Copy QA without templates

**Question:** Why do 1:1 emails written by an AI team end up reading like a template, and how do you catch it before they send?
**Company:** A · **Batch:** 45 emails (7 first touches, 38 follow-ups), October 2026 · **Stack:** copy agent, QA agent, `validate-copy.js`.

## The problem

After three weeks I had ~460 emails, 5 human replies and 0 meetings. Three of the six replies said some version of "we hire directly / no agencies."

What made me look again was a LinkedIn post about "toy prospecting": the same opener, a generic line about the company, an inflated promise. So I counted the phrases in the batch about to go out:

| Pattern | Emails |
|---|---|
| First touches opening with "I'm [name], writing from [city]" | 7 of 7 |
| Follow-ups repeating "full-time / 40 hours / full workweek" | 38 of 38 |
| "Only for [company] / nobody else" | 20 of 38 |

Every email opened with something specific to the company. From the second sentence on, they all said the same thing in different words. The QA agent hadn't caught it, because it checked each email on its own against the rules and never compared emails with each other.

## The fix

1. **Rewrite with constraints** (copy agent):
   - Keep the company-specific opener.
   - Put the offer in one sentence that is different in every email, and pick what matters to that business (time-zone overlap for a support team, retained knowledge for an engineering seat, cost for a small firm).
   - Mention the city in at most 1 of 3 emails.
   - Never use the same type of closing question twice in a row.
2. **QA with new checks** (QA agent): it put "full-time" back once per email. Without it, some emails read as freelance.
   It also removed four promises the offer doesn't support, replaced three "clever inference" openers with the real signal, and fixed three closing questions that assumed facts we didn't have.
3. **Make it a script** ([tools/validate-copy.js](../../tools/validate-copy.js)), so nobody has to remember the check:
   - 6-word phrases shared across emails: 2 emails is a warning, 3 or more is an error.
   - Banned phrases.
   - "Full-time" exactly once.
   - Length by touch type.

## Result on the same batch

| | Errors | Warnings |
|---|---|---|
| Before (v1) | 21 | 12 |
| After rewrite and QA (v2) | 3 | 9 |

Before and after, one first touch:

> **Before:** Saw the company is hiring an Administrative Clerk. Mauricio here, from Bogotá. An admin clerk in Latin America can work Eastern hours full-time, in your systems, only for you. We'd hold the contract and payroll on our side, so for you it's one more person on the team. Open to a LatAm option for this one?
>
> **After:** Saw the company is hiring an Administrative Clerk. We'd find that clerk in Latin America, and for you it's one more person in your systems on Eastern time, with the paperwork on our side. Is the role open to remote, or does it need someone in the office?

## What this proves, and what it doesn't

- **It proves** that template drift can be measured and blocked automatically, and that the check is cheap: no model, it runs in under a second.
- **It doesn't prove** that the new copy books meetings. The A/B read is pending. That number will go here, whatever it is.

## Lesson

A QA step that only reviews emails one at a time won't catch a template. The check has to compare the whole batch.
