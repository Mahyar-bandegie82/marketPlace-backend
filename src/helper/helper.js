import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function hashPassword(password){
    return await bcrypt.hash(password, 10);
}

export function comparePassword(password, hash){
    return bcrypt.compare(password, hash);
}

export function verifyJoi(schema, json){
    const { error, value } = schema.validate(json, { abortEarly: false });
    if (error) {
        return { error: error.details.map(err => err.message) }
    }
    return { value: value };
}

export function generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
}

export function generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}