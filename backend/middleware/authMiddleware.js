import jwt from "jsonwebtoken";

// Check JWT from httpOnly cookie and attach user id to req.user
export default function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ status: "error", message: "Please log in first" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRETKEY);
    req.user = { id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ status: "error", message: "Session expired. Please log in again" });
  }
}
