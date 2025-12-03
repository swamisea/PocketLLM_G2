import { Request, Response, NextFunction } from 'express';
import { verifyJWTToken, JWTPayload } from '../utils/jwt.util';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.'
            });
        }

        const token = authHeader.substring(7);
        req.user = verifyJWTToken(token);

        next();
    } catch (error: any) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid or expired token. Please login again.'
        });
    }
};

export const requireAdminAccess = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
)=> {
    if(!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Admin privileges required.'
        });
    }

    next();
};