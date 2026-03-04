module.exports = function getFrontendUrl() {
  console.log("🧪 getFrontendUrl CALLED");
  console.log("🧪 process.env.FRONTEND_URL =", process.env.FRONTEND_URL);

  if (!process.env.FRONTEND_URL) {
    throw new Error("❌ FRONTEND_URL nincs betöltve");
  }

  return process.env.FRONTEND_URL.replace(/\/$/, "");
};
