const axios = require('axios');
const { logger } = require('../utils/logger');

const verifyAuth = async (req, res, next) => {
  try {
    const sessionCookie = req.headers.cookie;
    
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: { cookie: sessionCookie }
    });

    if (authResponse.data.valid) {
      req.user = authResponse.data.user;
      next();
    } else {
      res.status(401).json({ error: 'Invalid session' });
    }
  } catch (error) {
    logger.error('Auth verification failed:', error.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  verifyAuth
};
