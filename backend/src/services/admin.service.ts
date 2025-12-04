import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
    listOllamaModels,
    pullOllamaModel,
    deleteOllamaModel
} from "./ollama.service";
import {
    invalidateUserCache
} from "../utils/cache.util";
import { getCollection } from "./database.service";

export async function getModels(req: AuthRequest, res: Response): Promise<void> {
    try {
        const models = await listOllamaModels();
        res.json(models);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to list models"
        });
    }
}

export async function modelExists(modelName: string): Promise<boolean> {
    try {
        const models = await listOllamaModels();
        return models.some(model => model.name === modelName);
    } catch (error) {
        console.error('Error checking model existence:', error);
        return false;
    }
}

export async function addModel(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { modelName } = req.body;

        if (!modelName || typeof modelName !== 'string') {
            res.status(400).json({
                success: false,
                message: "Model name is required"
            });
            return;
        }

        const exists = await modelExists(modelName);
        if (exists) {
            res.status(409).json({
                success: false,
                message: `Model '${modelName}' already exists`
            });
            return;
        }

        console.log(`Admin ${req.user!.username} is pulling model: ${modelName}`);
        pullOllamaModel(modelName)
            .then(() => console.log(`Model ${modelName} pull completed`))
            .catch(err => console.error(`Model ${modelName} pull failed:`, err));

        res.status(202).json({
            success: true,
            message: `Model '${modelName}' is being downloaded. This may take several minutes.`,
            modelName
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to pull model"
        });
    }
}

export async function removeModel(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { modelName } = req.params;

        if (!modelName) {
            res.status(400).json({
                success: false,
                message: "Model name is required"
            });
            return;
        }
        const decodedModelName = decodeURIComponent(modelName);
        const exists = await modelExists(decodedModelName);
        if (!exists) {
            res.status(404).json({
                success: false,
                message: `Model '${decodedModelName}' not found`
            });
            return;
        }
        console.log(`Admin ${req.user!.username} is deleting model: ${decodedModelName}`);

        await deleteOllamaModel(decodedModelName);

        res.json({
            success: true,
            message: `Model '${decodedModelName}' deleted successfully`
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete model"
        });
    }
}

/**
 * Invalidate all cache for a specific user
 */
export async function clearUserCache(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { userId } = req.params;

        console.log(`Admin ${req.user!.username} is invalidating cache for user: ${userId}`);

        await invalidateUserCache(userId);

        res.json({
            success: true,
            message: `Cache invalidated for user ${userId}`
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to invalidate cache"
        });
    }
}

export async function clearAllCache(req: AuthRequest, res: Response): Promise<void> {
    try {
        const USERDETAILS_COLL = process.env.USER_DETAILS_COLLECTION_NAME || "UsersDetails";
        const userCollection = getCollection(USERDETAILS_COLL);
        const users = await userCollection.find({}).toArray();
        console.log(`Admin ${req.user!.username} is invalidating ALL caches`);
        await Promise.all(
            users.map(user => invalidateUserCache(user._id.toString()))
        );

        res.json({
            success: true,
            message: `Cache invalidated for ${users.length} users`
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to invalidate all caches"
        });
    }
}
