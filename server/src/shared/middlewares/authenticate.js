import config from '../config/index.js';
import ResponceFormatter from '../utils/responceFormatter.js';
import jwt from 'jsonwebtoken';

const authenticate = async (req, res, next) => {
    try {
        let token = null;

        if(req.cookies && req.cookies.authToken){
            token = req.cookies.authToken;
        }
        if(!token){
            return res.status(401).json(
                ResponceFormatter.error(
                    'Unauthorized access. Token is missing.',
                    401
                ) 
            );
        } 

        const decoded = jwt.verify(token, config.jwt.secret);

        const {userId, email, username, role, clientId} = decoded;

        req.user = {
            userId,
            email,
            username,
            role,
            clientId
        };

        next()
    } catch (error) {
        logger.error('Authentication error:', {
            error: error.message,
            path: error.path,
        });
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json(
                ResponceFormatter.error(
                    'Unauthorized access. Token has expired.',
                    401
                )
            );
        }

        return res.status(401).json(
            ResponceFormatter.error(
                'Unauthorized access. Invalid token.',
                401
            )
        );
    }
}


export default authenticate;