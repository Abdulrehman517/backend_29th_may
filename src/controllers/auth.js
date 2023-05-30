import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Users from '../models/user.js';
import settings from '../config/settings.js';

class AuthController {
    constructor() {}

    static async login(req, res) {
        try {
            const { username, password } = req.body;

            const user = await Users.findOne(username);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (!passwordIsValid) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            const payload = {
                user_name: user.user_name,
                email: user.email,
                id: user.id,
                role: user.role,
                venue_name: user.venue_name,
                venue_id: user.venue_id,
                permissions: user.permissions,
            };

            const token = jwt.sign(payload, settings.jwtSecret, {
                expiresIn: 604800, // 7 days
            });

            return res.status(201).json({ message: 'Success', user, token });
        } catch (error) {
            return res.status(400).json({ message: 'Failed', error: error.message });
        }
    }

    static async validate(req, res) {
        try {
            let accessToken = null;
            if (req.headers && req.headers.authorization) {
                const parts = req.headers.authorization.split(' ');
                if (parts.length === 2) {
                    const scheme = parts[0];
                    const credentials = parts[1];
                    if (/^Bearer$/i.test(scheme)) {
                        accessToken = credentials;
                    } else {
                        return res.status(401).json({ message: 'No authorization token was found' }).end();
                    }
                } else {
                    return res.status(401).json({ message: 'No authorization token was found' }).end();
                }
            } else if (req.query && req.query['access-token']) {
                accessToken = req.query['access-token'];
            }
            if (!accessToken) {
                return res.status(401).json({ message: 'No authorization token was found' }).end();
            }
            const data = await jwt.verify(accessToken, settings.jwtSecret);

            if (data) {
                return res.end();
            } else {
                return res.status(401).end();
            }
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: 'Failed', error: error.message });
        }
    }

    static accessControl(roles, action) {
        action = action || 'ALLOW';

        return (req, res, next) => {
            const user = req._user;
            if (!user) {
                return next(
                    new Error({
                        name: 'AUTHORIZATION_ERROR',
                        message: 'Please Login or register to continue',
                    })
                );
            }
            const userRole = user.role;
            let allowed = false;

            roles = Array.isArray(roles) ? roles : [roles];
            roles.forEach((role) => {
                switch (role) {
                    case '*':
                    case userRole:
                        allowed = true;
                        break;
                    default:
                        break;
                }
            });

            if (!allowed) {
                return next(
                    new Error({
                        name: 'AUTHORIZATION_ERROR',
                    })
                );
            }

            return next();
        };
    }
}

export default AuthController;
