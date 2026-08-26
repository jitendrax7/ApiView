
import ResponseFormatter from "../utils/responceFormatter.js";



const authorize = (allowedRoles=[]) => (req, res, next) => {
    try {
        if(!req.user || !req.user.role){
            return res.status(403).json(
                ResponseFormatter.error(
                    'Forbidden access. User role is missing.',
                    403
                )
            );
        }

        if(allowedRoles.length===0){
            next();
        }

        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json(
                ResponseFormatter.error(
                    'Insufficient permissions',
                    403
                )
            );
        }

        next();
    } catch (error) {
        return res.status(500).json(
            ResponseFormatter.error(
                'Forbidden',
                403
            )
        );
    }
};


export default authorize;