import ratelimit from "../config/upstash.js";

const ratelimiter = async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  try {
    const { success } = await ratelimit.limit(req.ip);
    if (!success) {
      return res.status(429).json({ message: "Rate limit exceeded" });
    }
    next();
  } catch (e) {
    console.log(e);
    next();
  }
};


export default ratelimiter;