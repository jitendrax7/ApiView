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


export default router;