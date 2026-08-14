import config from "../../../shared/config/index.js";
import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/appError.js";   
import jwt from "jsonwebtoken"

export class AuthService {
    constructor(userRepository) {
        if(!userRepository) {
            throw new Error('UserRepository is required for AuthService');
        }
        this.userRepository = userRepository;
    }


    generateToken(user){
        const {_id, email, username, role, clientId} = user;

        const payload = {
            userId: _id,
            username,
            email,
            role,
            clientId
        }

        return jwt.sign(payload, config.jwt.secret, {
            expiresIn:config.jwt.expiresIn
        })
    }

    formateUserForResponce(user){
        const useObj = user.toObject ? user.toObject() : user;
        delete useObj.password;
        return useObj;
    }

    async onboardSuperAdmin(superAdminData) {
        try {
            const existingUser = await this.userRepository.findAll();
            if(existingUser && existingUser.length > 0){
                throw new AppError('Super admin onboarding is disabled.', 403);
            }

            const user = await this.userRepository.create(superAdminData);
            const token = this.generateToken(user);

            logger.info("Admin onboarded successfully",{
                username: user.username
            });

            return {
                user:this.formateUserForResponce(user),
                token
            }
        } catch (error) {
            logger.error("Error in onboarding Super admin", error);
            throw error
        }
    }
}