export const ensureAuth = (req, res, next) => {
  // Support API key header for programmatic admin access (tests/tools)
  const apiKey = req.get('x-api-key') || req.get('X-API-KEY');
  if (apiKey && process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY) {
    // create a temporary admin session in memory for this request
    req.session = req.session || {};
    req.session.user = { username: 'api-admin', role: 'admin' };
    return next();
  }

  if (req.session && req.session.user) return next();

  if (req.path.startsWith("/api/")) return res.status(401).json({ message: "Authentication required" });

  return res.redirect("/login");
};

export const ensureAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === "admin") return next();

  if (req.path.startsWith("/api/")) return res.status(403).json({ message: "Admin required" });

  return res.status(403).render("error", { errorMessage: "Admin required" });
};
