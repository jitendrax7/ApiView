import logger from "../../../shared/config/logger.js";
import { APPLICATION_ROLES, isValidClientRole } from "../../../shared/constants/roles.js";
import AppError from "../../../shared/utils/AppError.js";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class ClientService {
    constructor(dependencies) {
        if(!dependencies){
            throw new Error('Dependencies are required');
        }
        if(!dependencies.clientRepository){
            throw new Error('Client repository is required');
        }
        if(!dependencies.apiKeyRepository){
            throw new Error('API Key repository is required');
        }
        if(!dependencies.userRepository){
            throw new Error('User repository is required');
        }

        this.clientRepository = dependencies.clientRepository;
        this.apiKeyRepository = dependencies.apiKeyRepository;
        this.userRepository = dependencies.userRepository;
    }

    formateUserForResponce(user){
        const useObj = user.toObject ? user.toObject() : user;
        delete useObj.password;
        return useObj;
    }

    /**
     * Generates a slug from the given name.
     * @param {string} name - The name to generate the slug from.
     * @returns {string} - The generated slug.
     */
    generateSlug(name) {
        return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    async createClient(clientData, adminUser) {
        try {
            const { name, email, description , website} = clientData;
            const slug = this.generateSlug(name);
            
            const existingClient = await this.clientRepository.findBySlug(slug);

            
            if (existingClient) {
                throw new AppError(`client with slug ${slug} already exists`, 400);
            }

            const client = await this.clientRepository.create({
                name,
                email,
                description,
                website,
                slug,
                createdBy: adminUser.userId
            });

            return client;
        } catch (error) {
            throw error;
        }
    }
    canUserAccessClient(user, clientId) {
        if(user.role === APPLICATION_ROLES.SUPER_ADMIN){
            return true;
        }

        return user.clientId && user.clientId.toString() === clientId.toString();
    }


    async createClientUser(clientId, userData, adminUser) {
        try {
            const client = this.clientRepository.findById(clientId);
            if(!client){
                throw new AppError("Client not found", 404);
            }

            if(!this.canUserAccessClient(adminUser, clientId)){
                throw new AppError("Access denied", 403);
            }
            if(!(adminUser.role === APPLICATION_ROLES.SUPER_ADMIN || adminUser.role === APPLICATION_ROLES.CLIENT_ADMIN)){
                throw new AppError("Only client admins or super admins can create client users", 403);
            }
            const {username, email, password,role=APPLICATION_ROLES.CLIENT_VIEWER} = userData;

            if(!isValidClientRole(role)){
                throw new AppError("Invalid role for client user", 400);
            }

            
            let permissions = {
                canCreateApiKeys:false,
                canManageUsers:false,
                canViewAnalytics:true,
                canExportData:false
            };

            if(role === APPLICATION_ROLES.CLIENT_ADMIN){
                permissions = {
                    canCreateApiKeys:true,
                    canManageUsers:true,
                    canViewAnalytics:true,
                    canExportData:true
                };
            }

            const user = await this.userRepository.create({
                username,
                email,
                password,
                role,
                clientId,
                permissions
            })

            logger.info("Client user created",{
                clientId,
                userId: user.id,
                role
            });

            return this.formateUserForResponce(user);
        } catch (error) {
            logger.error("Error creating client user", error);
            throw error;
        }
    }
    
    generateApiKey() {
        const prefix = 'apim';
        const randomBytes = crypto.randomBytes(20).toString('hex');
        return `${prefix}_${randomBytes}`;
    }
    async createApiKey(clientId, KeyData, adminUser) {
        try {
            const client = await this.clientRepository.findById(clientId);
            if(!client){
                throw new AppError("Client not found", 404);
            };

            if(!this.canUserAccessClient(adminUser, clientId)){
                throw new AppError("Access denied", 403);
            };

            if(!(adminUser.role === APPLICATION_ROLES.SUPER_ADMIN || adminUser.role === APPLICATION_ROLES.CLIENT_ADMIN)){
                throw new AppError("Only client admins or super admins can create API keys", 403);
            }

            const {name, description, environment="production" } = KeyData;

            const keyId = uuidv4();
            const keyValue = this.generateApiKey();

            const apiKey = await this.apiKeyRepository.create({
                keyId,
                keyValue,
                clientId,
                name,
                description,
                environment,
                createdBy: adminUser.userId
            });

            return apiKey;

        } catch (error) {
            logger.error("Error creating API key", error);
            throw error;
        }
    }


    async getClientApiKeys(clientId, user) {
        try {
            if(!this.canUserAccessClient(user, clientId)){
                throw new AppError("Access denied", 403);
            }

            const apiKeys = await this.apiKeyRepository.findByClientId(clientId);

            const formattedResponse = apiKeys.map(key => {
                const keyObj = key.toObject ? key.toObject() : key;
                delete keyObj.keyValue; // Remove the keyValue from the response
                return keyObj;
            });

            return formattedResponse;
        } catch (error) {
            logger.error("Error retrieving client API keys", error);
            throw error;
        }
    }
}