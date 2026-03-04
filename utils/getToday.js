module.exports = function getToday() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Budapest",
  });
};
