import ResponseFormatter from "../../../shared/utils/responceFormatter.js";

export class ClientController {
    constructor(clientService, authService) {
        if (!clientService) {
            throw new Error('Client service is required');
        }
        if (!authService) {
            throw new Error('Auth service is required');
        }
        this.clientService = clientService;
        this.authService = authService;
    }


    async createClient(req, res, next) {
        try {
            const isSuperAdmin = this.authService.checkSuperAdminPermission(req.user.userId);

            if (!isSuperAdmin) {
                return res.status(403).json(ResponseFormatter.error("Access denied", 403));
            }

            const client  = await this.clientService.createClient(req.body, req.user);

            return res.status(201).json(ResponseFormatter.success(client, "Client created successfully", 201));
            
        } catch (error) {
            next(error);
        }
    }
}