import dotenv from "dotenv";
import * as mongoDB from "mongodb";
import { Request, Response } from "express";
import argon2 from 'argon2';
import { getCollection } from "./database.service";
import { CreateUserRequest, LoginUserRequest, UserPreferences } from "@common/types/account";
import { generateJWTToken} from "../utils/jwt.util";
import { ObjectId } from "mongodb";
import { AuthRequest } from "../middleware/auth.middleware";

interface InputFieldValidation {
    valid: boolean;
    errors: string[];
}

interface UserAccountValidation {
    valid: boolean;
    usernameErrors: string[];
    emailErrors: string[];
    passwordErrors: string[]
}

const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'light',
    model: 'gemma3:270m',
    temp: 1.0,
    custom_instructions: '',
  };

dotenv.config()

function validateUsername(username: string): InputFieldValidation {
    var errors: string[] = []
    if (username && username.length >= 8) {
        return {
            valid: true,
            errors
        }
    }
    errors.push("Username must be at least 8 characters long")
    return {
        valid: errors.length == 0,
        errors
    };
}

function validatePassword(password: string): InputFieldValidation {
    const errors: string[] = [];
    // Check minimum length
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase character");
    }
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase character");
    }
    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }
    // Check for number
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    return {
        valid: errors.length === 0,
        errors
    };
}

function validateEmail(email: string): InputFieldValidation {
    const errors: string[] = [];
    // Check if empty
    if (!email || email.trim() === "") {
        errors.push("Email is required");
    }

    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        errors.push("Please enter a valid email address");
    }

    // Check for common issues
    if (email.includes("..")) {
        errors.push("Email cannot contain consecutive dots");
    }

    if (email.startsWith(".") || email.endsWith(".")) {
        errors.push("Email cannot start or end with a dot");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function getGuestEnv() {
    const email = process.env.GUEST_EMAIL;
    const username = process.env.GUEST_USERNAME;
    const password = process.env.GUEST_PASSWORD;
    const name = process.env.GUEST_NAME;
    return { email, username, password, name };
}

function isGuestConfigured() {
    const { email, username, password } = getGuestEnv();
    return Boolean(email && username && password);
}

function validatePayload(payload: CreateUserRequest): UserAccountValidation {
    const errors: string[] = [];
    const validUserName = validateUsername(payload.username)
    const validPassword = validatePassword(payload.password)
    const validEmail = validateEmail(payload.email)
    return {
        valid: validUserName.valid && validEmail.valid && validPassword.valid,
        usernameErrors: validUserName.errors,
        emailErrors: validEmail.errors,
        passwordErrors: validPassword.errors
    }
}

async function hashPassword(password: string): Promise<string> {
    try {
        // argon2 handles salting automatically and uses secure defaults
        const hash = await argon2.hash(password);
        return hash;
    } catch (error) {
        throw new Error('Error hashing password');
    }
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        // argon2.verify automatically extracts params from the hash
        const isMatch = await argon2.verify(hash, password);
        return isMatch;
    } catch (error) {
        throw new Error('Error verifying password');
    }
}

export async function createUser(req: Request, res: Response) {
    try {
        const payload: CreateUserRequest = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            createdAt: new Date().toISOString(),
            preferences: req.body.preferences || DEFAULT_PREFERENCES
        };

        const validation = validatePayload(payload);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: {
                    username: validation.usernameErrors,
                    email: validation.emailErrors,
                    password: validation.passwordErrors
                }
            });
        }

        const USERDETAILS_COLL = process.env.USER_DETAILS_COLLECTION_NAME || "";
        const userCollection = getCollection(USERDETAILS_COLL);

        // Check if email exists
        const existingUser = await userCollection.findOne({
            email: payload.email
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        const hashedPassword = await hashPassword(payload.password);
        const newUser = {
            email: payload.email,
            username: payload.username,
            password: hashedPassword,
            createdAt: payload.createdAt,
            isAdmin: false,
            preferences: payload.preferences
        };

        const result = await userCollection.insertOne(newUser);
        const token = generateJWTToken(
          result.insertedId.toString(),
          newUser.email,
          newUser.username,
          false
        )
        res.status(201).json({ 
            success: true, 
            message: "User created successfully",
            userId: result.insertedId.toString(),
            token: token,
            user: {
                id: result.insertedId.toString(),
                email: newUser.email,
                username: newUser.username,
                isAdmin: false,
                preferences: newUser.preferences
            }
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create user"
        });
    }
}

export async function loginUser(req: Request, res: Response) {
    try {
        const payload: LoginUserRequest = {
            email: req.body.email,
            password: req.body.password
        };

        const USERDETAILS_COLL = process.env.USER_DETAILS_COLLECTION_NAME || "";
        const userCollection = getCollection(USERDETAILS_COLL);

        const existingUser = await userCollection.findOne({
            email: payload.email
        }) as any;

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const validPassword = await verifyPassword(
            payload.password, 
            existingUser.password
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateJWTToken(
            existingUser._id.toString(),
            existingUser.email,
            existingUser.username,
            existingUser.isAdmin || false
        )
        res.status(200).json({
            success: true,
            message: "Login successful",
            token: token,
            user: {
                id: existingUser._id.toString(),
                email: existingUser.email,
                username: existingUser.username,
                isAdmin: existingUser.isAdmin || false,
                preferences: existingUser.preferences || DEFAULT_PREFERENCES
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
}

export async function guestAvailable(_req: Request, res: Response) {
    return res.status(200).json({ available: isGuestConfigured() });
}

export async function guestLogin(_req: Request, res: Response) {
    if (!isGuestConfigured()) {
        return res.status(404).json({
            success: false,
            message: "Guest login not configured"
        });
    }

    const { email, username, password, name } = getGuestEnv();
    const USERDETAILS_COLL = process.env.USER_DETAILS_COLLECTION_NAME || "";
    const userCollection = getCollection(USERDETAILS_COLL);

    try {
        let user = await userCollection.findOne({ email }) as any;

        if (!user) {
            const hashedPassword = await hashPassword(password!);
            const newUser: any = {
                email,
                username,
                password: hashedPassword,
                createdAt: new Date().toISOString(),
                isAdmin: false,
                preferences: DEFAULT_PREFERENCES,
            };
            if (name) newUser.name = name;

            const result = await userCollection.insertOne(newUser);
            user = { ...newUser, _id: result.insertedId };
        }

        const token = generateJWTToken(
            user._id.toString(),
            user.email,
            user.username,
            false
        )
        return res.status(200).json({
            success: true,
            message: "Guest login successful",
            token: token,
            user: {
                id: user._id.toString(),
                email: user.email,
                username: user.username,
                isAdmin: false,
                preferences: DEFAULT_PREFERENCES,
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Guest login failed"
        });
    }
}

function getAdminEnv() {
    const email = process.env.ADMIN_EMAIL;
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME;
    return { email, username, password, name };
}

function isAdminConfigured() {
    const { email, username, password } = getAdminEnv();
    return Boolean(email && username && password);
}

export async function adminAvailable(_req: Request, res: Response) {
    return res.status(200).json({ available: isAdminConfigured() });
}

export async function adminLogin(_req: Request, res: Response) {
    if (!isAdminConfigured()) {
        return res.status(404).json({
            success: false,
            message: "Admin login not configured"
        });
    }
    const { email, username, password, name } = getAdminEnv();
    const USERDETAILS_COLL = process.env.USER_DETAILS_COLLECTION_NAME || "";
    const userCollection = getCollection(USERDETAILS_COLL);

    try {
        let user = await userCollection.findOne({ email }) as any;
        if (!user) {
            const hashedPassword = await hashPassword(password!);
            const newUser: any = {
                email,
                username,
                password: hashedPassword,
                createdAt: new Date().toISOString(),
                isAdmin: true,
                preferences: DEFAULT_PREFERENCES,
            }
            if (name) newUser.name = name;
            const result = await userCollection.insertOne(newUser);

            user = { ...newUser, _id: result.insertedId };
            console.log(`Admin User created ${email}`)
        }

        const token = generateJWTToken(
            user._id.toString(),
            user.email,
            user.username,
            true
        )

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                username: user.username,
                isAdmin: true,
                preferences: DEFAULT_PREFERENCES,
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Admin login failed"
        });
    }

}

export async function updateUserPreferences(req: AuthRequest, res: Response) {
    const USERDETAILS_COLL = process.env.USER_DETAILS_COLLECTION_NAME || "";
    const userCollection = getCollection(USERDETAILS_COLL);
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const preferences: UserPreferences = req.body as UserPreferences;
        await userCollection.updateOne(
            { _id: new ObjectId(req.user.id) },
            { $set: { preferences } }
        );
        const updatedUser = await userCollection.findOne({
            _id: new ObjectId(req.user.id),
          }) as any;
        return res.status(200).json({
            success: true,
            user: {
                id: updatedUser._id.toString(),
                email: updatedUser.email,
                username: updatedUser.username,
                isAdmin: updatedUser.isAdmin || false,
                preferences: updatedUser.preferences,
            },
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update user preferences"
        });
    }
}