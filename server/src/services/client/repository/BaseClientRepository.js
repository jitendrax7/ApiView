

export default class BaseClientRepository {
    constructor(model) {
        this.model = model;
    }

    async create(clientData) {
        throw new Error('Method not implemented');
    }

    async findById(ClientId) {
        throw new Error('Method not implemented');
    }

    async findBySlug(slug) {
        throw new Error('Method not implemented');
    }

    async find(filters, options) {
        throw new Error('Method not implemented');
    }

    async count(filters) {
        throw new Error('Method not implemented');
    }
}