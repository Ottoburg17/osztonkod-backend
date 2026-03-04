const cron = require("node-cron");

const runSubscriptionReminder = require("./subscriptionReminder");
const runSubscriptionExpire = require("./subscriptionExpire");

cron.schedule("0 3 * * *", async () => {
  console.log("🕒 CRON: napi feladatok indulnak");

  try {
    await runSubscriptionReminder();
    await runSubscriptionExpire();
  } catch (err) {
    console.error("❌ CRON hiba:", err);
  }
});
