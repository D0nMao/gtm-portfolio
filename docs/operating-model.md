# Operating model

The agents are the easy part. What decides whether the output is consistent is the process layer around them. I diagnosed a common failure in my own system:
- rules lived scattered across chat history and memory;
- some of them contradicted each other;
- wherever a rule was missing, the model improvised.

This layer fixes that. It is adapted from standard process management: SOPs, RACI and the PDCA cycle.

Status in October 2026: the registry, the SOP template, the run log and the copy validator are **live**. The SOPs for the five busiest processes and the watchers are **in progress**.

## 1. Process registry

The registry has one row per process (30 today). Each row records:
- ID and area;
- the owner: always one human;
- the executor;
- maturity and automation level;
- irreversible actions;
- review cadence.

An agent executes a process. It never owns one.

## 2. Two axes per process

| Maturity | Meaning |
|---|---|
| Tacit | It is done, but nothing is written down |
| Written | Rules exist, but not in the template |
| SOP | Written on the template |
| Tested | Passes its test cases |
| Measured | Has an outcome metric and time saved |

| Automation | How it runs |
|---|---|
| A0 Assisted | The human asks in a session; the agent runs it with the SOP |
| A1 On request | One command; it runs alone |
| A2 Scheduled | It runs on a schedule and stops at every gate for approval |
| A3 Autonomous | It runs with no approval |

**Promotion rules:**
- A0 → A1: 3 clean runs in a row.
- A1 → A2: 5 clean runs.
- A2 → A3: 10 clean runs.
- Every promotion needs the owner's sign-off.
- A deviation demotes the process one level.
- **Anything that reaches a prospect is capped at A2.**

## 3. SOP template

Every SOP has the same sections:
- when to use it;
- inputs and preconditions (tools and connectors; if one is missing, the run stops);
- permissions;
- steps, each with an owner;
- gates;
- prohibitions with the reason behind each one;
- outputs;
- known deviations and test cases;
- a Mermaid diagram.

See [sops/](../sops/).

## 4. Run log

There is one CSV row per run, written even when the run fails. Columns:
- date and process;
- SOP version;
- executor and model;
- inputs and outputs;
- deviation (yes/no);
- who approved;
- credits spent;
- human minutes.

This is what turns "it feels like it works" into numbers.

## 5. Deviations become test cases

When a step doesn't go as the SOP says, or someone had to fix it by hand:
1. The deviation is logged.
2. The SOP is fixed.
3. The case is added to the tests.

Examples from October:
- Copy drifting into a template (case 02).
- A promise in a follow-up that the offer doesn't support.
- Follow-ups addressed to the wrong recipient (case 05).

## 6. Watchers (in progress)

Watchers are scheduled jobs that look and report. They never change anything. Each one runs even when it finds nothing ("no findings" is a result).

| Watcher | Job | Cadence |
|---|---|---|
| V0 Discovery | Read the week's sessions and list work done without an SOP | Weekly |
| V1 Signals | Check whether accounts in follow-up or nurture posted new jobs, which is a reason to reach out again | Weekly |
| V2 Deliverability | Bounces, seed-test placement, queue against the daily cap | Daily |
| VV | Flag any scheduled job that didn't leave a run | Daily |

## 7. Review

- **Per run:** check for deviations.
- **Per process:** a review date based on risk. The riskiest processes (copy, drafts) are reviewed every 7 days.
- **Monthly:** a 15-minute report with processes by level, runs, open deviations, overdue reviews and candidates to promote or retire. The owner decides, and the decision is written down.
