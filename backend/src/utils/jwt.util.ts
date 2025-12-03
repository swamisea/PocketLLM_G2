import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import type {StringValue} from "ms";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as StringValue || '1H';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface JWTPayload {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
}

export const generateJWTToken = (id: string,
                                 email: string,
                                 username: string,
                                 isAdmin: boolean = false): string => {
    return jwt.sign(
        {id, email, username, isAdmin} as JWTPayload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
    );
};

export const verifyJWTToken = (token: string) : JWTPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};