import ResponseFormatter from "../utils/responceFormatter.js";

const validate = (schema) => (req, res, next) => {
    if(!schema){
        return next();
    }

    const errors = [];
    const body = req.body || {};
 
    Object.entries(schema).forEach(([field, rules]) => {
        const value = body[field];

        if(rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            return 
        }

        if(rules.minLength && value.length < rules.minLength && typeof value === 'string') {
            errors.push(`${field} must be at least ${rules.minLength} characters long`); 
        }

        if(rules.custom && typeof rules.custom === 'function') {
            const customError = rules.custom(value, body);
            if(customError) {
                errors.push(customError);
            }
        }
    })

    if(errors.length > 0){
        return res.status(400).json(ResponseFormatter.error(
            "Validation failed",
            400,
            errors
        ));
    }

    next();
}

export default validate;