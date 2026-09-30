import ResponseFormatter from "../utils/responceFormatter.js";
import logger from "../config/logger.js";
import clientContainer from "../../services/client/Dependencies/dependencies.js";


const validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            logger.warn('API request without an API key',{
                path: req.path,
                ip: req.ip
            });
            return res.status(401).json(ResponseFormatter.error("API key is missing", 401));
        }

        const result = await clientContainer.services.clientService.getClientByApiKey(apiKey);

        if(!result){
            logger.warn('Invalid API key attempted',{
                path: req.path,
                ip: req.ip,
                apiKey: apiKey.substring(0, 8) + '...' ,// Log only the first 8 characters of the API key for security reasons
            });
            return res.status(403).json(ResponseFormatter.error("Invalid API key", 403));
        }

        const {client, apiKey: apikeyObj} = result;

        //check if client is active
        if(!client.isActive){
            logger.warn('Inactive client attempted API access',{
                path: req.path,
                ip: req.ip,
                clientId: client.id
            });
            return res.status(403).json(ResponseFormatter.error("Client is inactive", 403));
        }

        // check API key permissions
        if(!apikeyObj.permissions?.canIngest){
            logger.warn('API key without ingestion permission attempted API access',{
                path: req.path,
                ip: req.ip,
                apikeyId: apikeyObj._id ,
            });
            return res.status(403).json(ResponseFormatter.error("API key does not have ingestion permission", 403));
        }

        req.client = client;
        req.apiKey = apikeyObj;

        logger.info('API key validated successfully',{
            clientId: client._id,
            clientId: client.name,
            apikeyId: apikeyObj._id ,
        });

        next();
    } catch (error) {
        logger.error('Error validating API key', error);
        return res.status(500).json(ResponseFormatter.error("Internal server error", 500));
    }
}