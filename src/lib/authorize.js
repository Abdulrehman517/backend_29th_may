import { unless } from 'express-unless';
import jwt from 'jsonwebtoken';
import settings from '../config/settings';

const middleware = async (req, res, next) => {
    let accessToken = null;
    if (req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2) {
            const scheme = parts[0];
            const credentials = parts[1];
            if (/^Bearer$/i.test(scheme)) {
                accessToken = credentials;
            } else {
                return res.status(400).json({ message: 'Format is Authorization: Bearer [token]' }).end();
            }
        } else {
            return res.status(400).json({ message: 'Format is Authorization: Bearer [token]' }).end();
        }
    } else if (req.query && req.query['access-token']) {
        accessToken = req.query['access-token'];
    }
    if (!accessToken) {
        return res.status(401).json({ message: 'No authorization token was found' }).end();
    }

    try {
        let user = jwt.verify(accessToken, settings.jwtSecret);
        req.user = user || null;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const authorizeAccess = (opts = this || {}) => {
    // const options = {};
    // _.extend(options, opts);
    middleware.unless = unless;
    return middleware;
};

export default authorizeAccess;
