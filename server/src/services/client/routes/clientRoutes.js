import express from "express";

import clientDependencies from "../Dependencies/dependencies.js";
import authenticate from "../../../shared/middlewares/authenticate.js";

const router = express.Router();

const {clientController} = clientDependencies.controllers;

router.use(authenticate);

router.post("/admin/clients/onboard",(req,res,next) => clientController.createClient(req, res, next));
router.post("/admin/clients/:clientId/users",(req,res,next) => clientController.createClientUser(req, res, next));
router.post("/admin/clients/:clientId/api/keys",(req,res,next) => clientController.createApiKey(req, res, next));

router.get("/admin/clients/:clientId/api/keys",(req,res,next) => clientController.getClientApiKeys(req, res, next));


export default router;