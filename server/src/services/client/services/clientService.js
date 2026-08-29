import AppError from "../../../shared/utils/AppError.js";


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
}