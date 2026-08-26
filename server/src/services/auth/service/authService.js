import config from "../../../shared/config/index.js";
import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";   
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";


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


    async comparePassword(plainPassword, hashedPassword){
        return bcrypt.compare(plainPassword, hashedPassword);
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

    async register(userData) {
        try {
            const existingUser = await this.userRepository.findByUsername(userData.username);
            if(existingUser){
                throw new AppError('Username already exists', 409);
            }

            const existingEmail = await this.userRepository.findByEmail(userData.email);
            if(existingEmail){
                throw new AppError('Email already exists', 409);
            }

            const user = await this.userRepository.create(userData);
            const token = this.generateToken(user);

            logger.info("User registered successfully",{
                username: user.username
            });

            return {
                user:this.formateUserForResponce(user),
                token
            }

        } catch (error) {
            logger.error("Error in register service registering user", error);
            throw error;
        }
    }

    async login(username, password) {
        try {
            const user = await this.userRepository.findByUsername(username);
            if(!user){
                throw new AppError('Invalid credentials', 401);
            }

            if(!user.isActive){
                throw new AppError('User account is deactivated', 403);
            }

            const isPasswordValid = await this.comparePassword(password, user.password);
            if(!isPasswordValid){
                throw new AppError('Invalid credentials', 401);
            }
            const token = this.generateToken(user);

            logger.info("User logged in successfully",{
                username: user.username
            });
            return {
                user: this.formateUserForResponce(user),
                token
            };
        } catch (error) {
            logger.error("Error in login service", error);
            throw error;
        }
    }


    async getProfile(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if(!user){
                throw new AppError('User not found', 404);
            }
            return this.formateUserForResponce(user);
        } catch (error) {
            logger.error("Error in getProfile service", error);
            throw error;
        }
    }
}