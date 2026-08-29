import logger from "../../../shared/config/logger.js";
import ApiKey from "../../../shared/models/Apikey.js";
import BaseApiKeyRepository from "./BaseApiKeyRepository.js";


class MongoApiKeyRepository  extends BaseApiKeyRepository{
    constructor() {
        super(ApiKey);
    }


    async create(apiKeyData) {
        try {
            const apiKey = new this.model(apiKeyData);
            await apiKey.save();
            logger.info('API Key created in database', {
                apiKeyId: apiKey.keyId
            });
            return apiKey;

        } catch (error) {
            logger.error('Error creating API Key in database',  error );
            throw error;
        }
    }
   
    /**
     * Finds an API key by its key value.
     * @param {string} keyValue - The key value of the API key to find.
     * @param {boolean} includeInactive - Whether to include inactive API keys in the search.
     * @returns {Promise<Object>} - The found API key object.
     * @throws {Error} - Throws an error if the API key is not found or if the search fails.
     **/
    async findByKeyValue(keyValue, includeInactive = false) {
        try {
            const filter = { keyValue };
            if (!includeInactive) {
                filter.isActive = true;
            }
            const apiKey = await this.model.findOne(filter).populate('clientId');
            return apiKey;
        } catch (error) {
            logger.error('Error finding API Key by key value',  error );
            throw error;
        }
    }
    
    async findByClientId(clientId, filters = {}) {
        try {
            const query = { clientId, ...filters };
            const apiKeys = await this.model.find(query)
                .populate('clientId')
                .sort({ createdAt: -1 });
            return apiKeys;
        } catch (error) {
            logger.error('Error finding API Keys by client ID',  error );
            throw error;
        }
    }


    async countByClientId(clientId, filters = {}) {
        try {
            const query = { clientId, ...filters };
            const count = await this.model.countDocuments(query);
            return count;
        } catch (error) {
            logger.error('Error counting API Keys by client ID',  error );
            throw error;
        }
    }
    
}


export default new MongoApiKeyRepository();