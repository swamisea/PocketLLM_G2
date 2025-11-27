import dotenv from "dotenv";
import * as mongoDB from "mongodb";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import argon2 from 'argon2';
import { getCollection } from "./database.service";
import { CreateUserRequest, LoginUserRequest } from "@common/types/account";

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
            createdAt: new Date().toISOString()
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
            createdAt: payload.createdAt
        };

        const result = await userCollection.insertOne(newUser);
        res.status(201).json({ 
            success: true, 
            message: "User created successfully",
            userId: result.insertedId.toString()
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

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: existingUser._id.toString(),
                email: existingUser.email,
                username: existingUser.username
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
}
