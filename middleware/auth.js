// middleware/auth.js
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect("/login");
}

module.exports = { isAuthenticated };
