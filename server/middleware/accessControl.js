export default function checkDatasetAccess(req, res, next) {
  const user = req.user; // Assume user is already set by auth middleware
  const dataset = req.dataset; // Assume dataset is loaded earlier (e.g. in route param middleware)

  if (dataset.isPrivate) {
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!user.hasPaidPackage) {
      return res.status(403).json({ error: "Access denied: Private dataset" });
    }
  }
  next();
};
