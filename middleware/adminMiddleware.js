module.exports = function (req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res
      .status(403)
      .json({ error: "Admin jogosultság szükséges." });
  }

  next();
};
