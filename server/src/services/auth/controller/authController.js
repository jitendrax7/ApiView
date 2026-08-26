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

    async register(req, res, next) {
        try {
            const { username, email, password, role } = req.body;
            const userData = {
                username,
                email,
                password,
                role : role || APPLICATION_ROLES.CLIENT_VIEWER
            };

            const { token, user } = await this.authService.register(userData);

            res.cookie("authToken", token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            });

            res.status(201).json(ResponseFormatter.success(user, "User created successfully", 201));

        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const { token, user } = await this.authService.login(username, password);

            res.cookie("authToken", token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            });

            res.status(200).json(ResponseFormatter.success(user, "User Login successful", 200));
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await this.authService.getProfile(userId);
            res.status(200).json(ResponseFormatter.success(result, "User profile fetched successfully", 200));
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            res.clearCookie("authToken");
            res.status(200).json(ResponseFormatter.success({}, "User logged out successfully", 200));
        } catch (error) {
            next(error);
        }
    }

}