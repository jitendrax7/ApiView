import { isValidRole } from "../../../shared/constants/roles.js";

export const onboardSuperAdminSchema = {
    username: {
        required: true,
    },
    email:{
        required: true,
    },
    password:{
        required: true,
        minLength: 6,
    }
}


export const registrationSchema = {
    username: {
        required: true,
    },
    email:{
        required: true,
    },
    password:{
        required: true,
        minLength: 6,
    },
    role:{
        required: false,
        custom : (value) => {
            if(!value) return null; // role is optional
            return isValidRole(value) ? null : 'Invalid role';
        }
    }
}


export const loginSchema = {
    username:{ required: true },
    password:{ required: true }
}