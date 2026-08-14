import BaseRepository from "./BaseRepository.js";
import User from "../../../shared/models/Users.js";
import logger from "../../../shared/config/logger.js";


class MongoUserRepository  extends BaseRepository{
    constructor(){
        super(User);
    }

    async create(userData){
        try {
            let data = {...userData};
            if(data.role === 'super_admin' && !data.permissions){
                data.permissions = {
                    canCreateApiKeys: true,
                    canManageUsers: true,
                    canExportData :true,
                    canViewAnalytics:true
                };
            }

            const user = new this.model(data);
            await user.save();
            logger.info('User created ', { username: user.username});
            return user;
        } catch (error) {
            logger.error('Error creating user ', error);
            throw error;
        }
    }

    async findById(userId){
        try {
            const user = await this.model.findById(userId);
            return user;
        } catch (error) {
            logger.error('Error finding user by id ', error);
            throw error;
        }
    }

    async findByUsername(username){
        try {
            const user = await this.model.findOne({ username });
            return user;
        } catch (error) {
            logger.error('Error finding user by username ', error);
            throw error;
        }
    }

    async findByEmail(email){
        try {
            const user = await this.model.findOne({ email });
            return user;
        } catch (error) {
            logger.error('Error finding user by email ', error);
            throw error;
        }
    }

    async findAll(){
        try {
            const user = await this.model.find({isActive:true}).select('-password');
            return user;
        } catch (error) {
            logger.error('Error finding all users ', error);
            throw error;
        }
    }
}


export default new MongoUserRepository();