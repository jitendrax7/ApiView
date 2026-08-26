import express from "express";
import dependencies from "../Dependencies/dependencies.js";
import validate from "../../../shared/middlewares/validate.js";
import authorize from "../../../shared/middlewares/authorize.js";
import authenticate from "../../../shared/middlewares/authenticate.js";
import { onboardSuperAdminSchema, registrationSchema, loginSchema } from "../validation/authSchema.js";
import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";


const router = express.Router();

const {controller} = dependencies;
const authController = controller.authController;

router.post("/onboard-super-admin", 
    validate(onboardSuperAdminSchema),
    (req, res, next) => authController.onboardSuperAdmin(req, res, next)
);

router.post("/register",
    authenticate,
    authorize([APPLICATION_ROLES.SUPER_ADMIN]),
    validate(registrationSchema),
    (req, res, next) => authController.register(req, res, next)
);

router.post("/login",
    validate(loginSchema),
    (req, res, next) => authController.login(req, res, next)
);

router.get("/profile",
    authenticate,
    (req, res, next) => authController.getProfile(req, res, next)
);

router.get("/logout",
    authenticate,
    (req, res, next) => authController.logout(req, res, next)
);

export default router;