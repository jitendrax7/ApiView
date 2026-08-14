import config from "../../../shared/config/index.js";
import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";
import ResponseFormatter from "../../../shared/utils/responceFormatter.js";

export class AuthController {
    constructor(authService) {
        if(!authService) {
            throw new Error('AuthService is required for AuthController');
        }
        this.authService = authService;
    }

    async onboardSuperAdmin(req, res, next) {
        try {
            const { username, email, password} = req.body;

            const superAdminData = {
                username,
                email,
                password,
                role: APPLICATION_ROLES.SUPER_ADMIN
            };

            const {token, user} = await this.authService.onboardSuperAdmin(superAdminData);

            res.cookie("authToken", token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            });

            res.status(201).json(ResponseFormatter.success(user,"Super admin created successfully",201 ));
        } catch (error) {
            next(error);
        }
    }

}