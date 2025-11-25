import dotenv from "dotenv";
import * as mongoDB from "mongodb";
import { randomUUID } from "crypto";
import argon2 from 'argon2';
import { collections, databaseService } from "./database.service";
import { CreateUserRequest, User, LoginUserRequest } from "../models/account.schema";
import { pathToFileURL } from "url";

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

export class AccountService {

    validatePayload(payload: CreateUserRequest): UserAccountValidation {
        const errors: string[] = [];
        const validUserName = this.validateUsername(payload.username)
        const validPassword = this.validatePassword(payload.password)
        const validEmail = this.validateEmail(payload.email)
        return {
            valid: validUserName.valid && validEmail.valid && validPassword.valid,
            usernameErrors: validUserName.errors,
            emailErrors: validEmail.errors,
            passwordErrors: validPassword.errors
        }
    }

    validateUsername(username: string): InputFieldValidation {
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

    validatePassword(password: string): InputFieldValidation {
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

    validateEmail(email: string): InputFieldValidation {
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

    async hashPassword(password: string): Promise<string> {
        try {
            // argon2 handles salting automatically and uses secure defaults
            const hash = await argon2.hash(password);
            return hash;
        } catch (error) {
            throw new Error('Error hashing password');
        }
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        try {
            // argon2.verify automatically extracts params from the hash
            const isMatch = await argon2.verify(hash, password);
            return isMatch;
        } catch (error) {
            throw new Error('Error verifying password');
        }
    }

    async addUserToDatabase(payload: CreateUserRequest) {
        if (!this.validatePayload(payload).valid) {
            throw new Error("Invalid payload");
        }

        const USERDETAILS_COLL = process.env.USER_DETAILS_COLLECTION_NAME || "";
        const userCollection = collections[USERDETAILS_COLL];

        // Check if email exists in DB
        const existingUser = await userCollection.findOne({
            email: payload.email
        });

        if (existingUser) {
            throw new Error("Email already exists");
        }

        const hashedPassword = await this.hashPassword(payload.password);
        const newUser = {
            email: payload.email,
            username: payload.username,
            password: hashedPassword,
            createdAt: payload.createdAt
        };

        try {
            console.log(collections)
            const result = await userCollection.insertOne(newUser);
            return result;
        } catch (error: any) {
            // Handle race condition where user was created between check and insert
            if (error.code === 11000) {
                throw new Error("Email already exists");
            }
            throw error;
        }
    }

    async verifyUser(payload: LoginUserRequest){
        const USERDETAILS_COLL = process.env.USER_DETAILS_COLLECTION_NAME || "";
        const userCollection = collections[USERDETAILS_COLL];
        const existingUser = await userCollection.findOne({
            email: payload.email
        });
         const hashedPassword = await this.hashPassword(payload.password);
        if (existingUser) {
            const validPassword = await this.verifyPassword(payload.password, hashedPassword)
            if (validPassword){
                return {valid: true, message: "Login successful"}
            }
            else{
                return {valid: false, message: "Login failed, incorrect password"}
            }
        }
        else{
            return {valid: false, message: "Email does not exist"}
        }
    }

}

export const accountService = new AccountService();
