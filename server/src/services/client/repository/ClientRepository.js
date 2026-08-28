import logger from "../../../shared/config/logger.js";
import Client from "../../../shared/models/Client.js";
import BaseClientRepository from "./BaseClientRepository.js";


class MongoClientRepository extends BaseClientRepository{
    constructor() {
        super(Client);
    }
    /**
     * Creates a new client in the database.
     * @param {Object} clientData - The data for the new client.
     * @returns {Promise<Object>} - The created client object.
     * @throws {Error} - Throws an error if the client creation fails.
     */
    async create(clientData) {
        try {
            const client = new this.model(clientData);
            await client.save();

            logger.info('Client created in MongoDB',{
                mongoId: client._id,
                slug: client.slug,
            })

            return client;
        } catch (error) {
            logger.error('Error creating client in MongoDB', error);
            throw error;
        }
    }
    
    /**
     * Finds a client by their ID.
     * @param {string} clientId - The ID of the client to find.
     * @returns {Promise<Object>} - The found client object.
     * @throws {Error} - Throws an error if the client is not found or if the search fails.
     */
    async findById(clientId) {
        try {
            const client = await this.model.findById(clientId);
            logger.info('Client found by id in MongoDB', {
                mongoId: client._id,
                slug: client.slug,
            });
            return client;
        } catch (error) {
            logger.error('Error finding client by id in MongoDB', error);
            throw error;
        }
    }

    /**
     * Finds a client by their slug.
     * @param {string} slug - The slug of the client to find.
     * @returns {Promise<Object>} - The found client object.
     * @throws {Error} - Throws an error if the client is not found or if the search fails.
     */
    async findBySlug(slug) {
        try {
            const client = await this.model.findOne({ slug });
            return client;
        } catch (error) {
            logger.error('Error finding client by slug in MongoDB', error);
            throw error;
        }
    }
   

    /**
     * Finds clients based on provided filters and options.
     * @param {Object} filters - The filters to apply to the search.
     * @param {Object} options - The options for pagination and sorting.
     * @param {number} options.limit - The maximum number of clients to return.
     * @param {number} options.skip - The number of clients to skip (for pagination).
     * @param {Object} options.sort - The sorting criteria for the results.
     * @returns {Promise<Array>} - An array of found client objects.
     * @throws {Error} - Throws an error if the search fails.
     */
    async find(filters ={}, options={}) {
        try {
            const {limit=50, skip=0, sort={createdAt:-1}} = options;
            const clients = await this.model.find(filters)
                .limit(limit)
                .skip(skip)
                .sort(sort)
                .select('-__v');
            return clients;
        } catch (error) {
            logger.error('Error finding clients in MongoDB', error);
            throw error;
        }
    }

    async count(filters = {}) {
        try {
            const count = await this.model.countDocuments(filters);
            return count;
        } catch (error) {
            logger.error('Error counting clients in MongoDB', error);
            throw error;
        }
    }
}


export default new MongoClientRepository();