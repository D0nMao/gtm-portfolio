/**
 * Throttled sender for Gmail drafts (Google Apps Script).
 *
 * Every 10 minutes it checks the mailbox's drafts and sends at most ONE, only during the
 * prospects' business hours, with a daily cap and a minimum gap between sends.
 * The draft goes out as-is, in its own thread, with its signature.
 *
 * Which drafts it sends: ones that carry the approved signature, have an external recipient
 * and were created more than REVIEW_WINDOW_MIN minutes ago (time to review or delete them).
 * To stop one: delete it, or add the "outbound/do-not-send" label to its thread.
 * To stop everything: run pause().
 *
 * Setup: paste into a new Apps Script project bound to the sending mailbox and run install() once.
 */

const CONFIG = {
  TIMEZONE: 'America/New_York',   // prospects' time zone
  START_HOUR: 9,                   // first send at 9:00
  END_HOUR: 16,                    // last send before 16:00
  DAYS: [1, 2, 3, 4, 5],           // Monday to Friday
  DAILY_CAP: 45,                   // raised 35 → 40 → 45 after clean days
  MIN_GAP_MIN: 8,                  // minimum minutes between two sends
  REVIEW_WINDOW_MIN: 30,           // a draft waits this long before it can go out
  SKIP_PROBABILITY: 0.3,           // sometimes skip a run so sends aren't on an exact clock
  SIGNATURE: 'Head of Sales, Example Co',
  EXCLUDED_DOMAINS: ['example.com'], // internal domains: never auto-send to these
  SENT_LABEL: 'outbound/auto-sent',
  DO_NOT_SEND_LABEL: 'outbound/do-not-send',
};

/** Run once: creates the 10-minute trigger and the labels. */
function install() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendNext')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendNext').timeBased().everyMinutes(10).create();
  label_(CONFIG.SENT_LABEL);
  label_(CONFIG.DO_NOT_SEND_LABEL);
  PropertiesService.getScriptProperties().setProperty('PAUSED', 'no');
  Logger.log('Installed: checking drafts every 10 minutes.');
}

/** Kill switch. Nothing goes out until resume(). */
function pause() {
  PropertiesService.getScriptProperties().setProperty('PAUSED', 'yes');
  Logger.log('Paused.');
}

function resume() {
  PropertiesService.getScriptProperties().setProperty('PAUSED', 'no');
  Logger.log('Resumed.');
}

/** Shows how many went out today and what is queued, without sending anything. */
function status() {
  const p = PropertiesService.getScriptProperties();
  Logger.log('Paused: ' + p.getProperty('PAUSED') + ' | Sent today: ' + sentToday_() + '/' + CONFIG.DAILY_CAP);
  const queue = eligible_();
  Logger.log('Queued (' + queue.length + '):');
  queue.forEach(c => Logger.log('  ' + c.to + ' | ' + c.subject));
}

/** Called by the trigger. Sends at most one draft per run. */
function sendNext() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('PAUSED') === 'yes') return;

  const now = new Date();
  const day = Number(Utilities.formatDate(now, CONFIG.TIMEZONE, 'u')); // 1 = Monday
  const hour = Number(Utilities.formatDate(now, CONFIG.TIMEZONE, 'H'));
  if (CONFIG.DAYS.indexOf(day) < 0 || hour < CONFIG.START_HOUR || hour >= CONFIG.END_HOUR) return;
  if (sentToday_() >= CONFIG.DAILY_CAP) return;

  const last = Number(p.getProperty('LAST_SEND') || 0);
  if (now.getTime() - last < CONFIG.MIN_GAP_MIN * 60000) return;
  if (Math.random() < CONFIG.SKIP_PROBABILITY) return;

  const queue = eligible_();
  if (!queue.length) return;

  const next = queue[0];
  const message = next.draft.send();
  message.getThread().addLabel(label_(CONFIG.SENT_LABEL));
  p.setProperty('LAST_SEND', String(now.getTime()));
  countSent_();
  Logger.log('Sent to ' + next.to + ' | ' + next.subject);
}

function eligible_() {
  const cutoff = Date.now() - CONFIG.REVIEW_WINDOW_MIN * 60000;
  return GmailApp.getDrafts()
    .map(d => {
      const m = d.getMessage();
      return { draft: d, msg: m, to: m.getTo(), subject: m.getSubject(), date: m.getDate() };
    })
    .filter(c => {
      if (!c.to) return false;
      if (c.date.getTime() > cutoff) return false;
      if (c.msg.getBody().indexOf(CONFIG.SIGNATURE) < 0) return false;
      const recipients = (c.to + ',' + c.msg.getCc()).toLowerCase();
      if (CONFIG.EXCLUDED_DOMAINS.some(d => recipients.indexOf('@' + d) >= 0)) return false;
      const labels = c.msg.getThread().getLabels().map(l => l.getName());
      if (labels.indexOf(CONFIG.DO_NOT_SEND_LABEL) >= 0) return false;
      return true;
    })
    .sort((a, b) => a.date - b.date); // oldest first
}

function today_() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function sentToday_() {
  const p = PropertiesService.getScriptProperties();
  return p.getProperty('DAY') === today_() ? Number(p.getProperty('COUNT') || 0) : 0;
}

function countSent_() {
  const p = PropertiesService.getScriptProperties();
  p.setProperties({ DAY: today_(), COUNT: String(sentToday_() + 1) });
}

function label_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}
