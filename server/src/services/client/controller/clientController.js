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

    /** Creates a new user for a specific client.
     * @param {Object} req - The request object containing clientId and user data.
     * @param {Object} res - The response object to send the result.
     * @param {Function} next - The next middleware function for error handling.
     * @returns {Promise<void>} - A promise that resolves when the user is created or an error occurs.
     * @throws {Error} - Throws an error if the user creation fails.
     */
    async createClientUser(req, res, next) {
        try {
            const { clientId } = req.params;
            const user = await this.clientService.createClientUser(clientId, req.body, req.user);
            return res.status(201).json(ResponseFormatter.success(user, "Client user created successfully", 201));
        } catch (error) {
            next(error);
        }
    }

    
    async createApiKey(req, res, next) {
        try {
            const { clientId } = req.params;
            const apikey = await this.clientService.createApiKey(clientId, req.body, req.user);
            return res.status(201).json(ResponseFormatter.success(apikey, "API key created successfully", 201));
        } catch (error) {
            next(error);
        }
    }


    async getClientApiKeys(req, res, next) {
        try {
            const { clientId } = req.params;
            const apiKeys = await this.clientService.getClientApiKeys(clientId, req.user);
            return res.status(200).json(ResponseFormatter.success(apiKeys, "API keys retrieved successfully", 200));
        } catch (error) {
            next(error);
        }
    }

}