const webpush = require("web-push");
const db = require("./db");

function init() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log("[push] VAPID keys not set — generating new ones...");
    const keys = webpush.generateVAPIDKeys();
    console.log("[push] Add these to your environment variables:");
    console.log(`  VAPID_PUBLIC_KEY=${keys.publicKey}`);
    console.log(`  VAPID_PRIVATE_KEY=${keys.privateKey}`);
    process.env.VAPID_PUBLIC_KEY  = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  }
  webpush.setVapidDetails(
    "mailto:runcoach@localhost",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendReportReady(weekStart, summary) {
  const subs = db.getAllSubscriptions();
  if (!subs.length) return;

  const payload = JSON.stringify({
    title: "Weekly Run Report Ready",
    body:  `Week of ${weekStart}: ${summary.totalRuns} runs, ${summary.totalKm} km. Tap to view your coaching insights.`,
    icon:  "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    url:   `/week/${weekStart}`,
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(sub, payload).catch((err) => {
        if (err.statusCode === 410) db.removeSubscription(sub.endpoint); // unsubscribed
        throw err;
      })
    )
  );

  const sent    = results.filter((r) => r.status === "fulfilled").length;
  const failed  = results.filter((r) => r.status === "rejected").length;
  console.log(`[push] Sent ${sent} notifications, ${failed} failed`);
}

module.exports = { init, sendReportReady };
