import crypto from 'crypto';
import redisClient from '../config/redis.config';

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '600');

export function hashPrompt(prompt: string): string {
    const normalized = prompt
        .trim()
        .replace(/\s+/g, '')
        .toLowerCase();

    return crypto
        .createHash('md5')
        .update(normalized)
        .digest('hex');
}

export function generateCacheKey(userId: string,
                                 sessionId: string,
                                 prompt: string): string {
    const promptHash = hashPrompt(prompt);
    return `${userId}:${sessionId}:${promptHash}`;
}

export async function getCachedResponse(userId: string,
                                        sessionId: string,
                                        prompt: string): Promise<string | null> {
    try {
        const key = generateCacheKey(userId, sessionId, prompt);
        const cached = await redisClient.get(key);

        if (cached) {
            return cached;
        }
        console.log(`Cache MISS for user ${userId}`);
        return null;
    } catch (error) {
        console.error('Error getting cached response:', error);
        return null;
    }
}

export async function setCachedResponse(userId: string,
                                        sessionId: string,
                                        prompt: string,
                                        response: string,
                                        ttl: number): Promise<void> {
    try {
        const key = generateCacheKey(userId, sessionId, prompt);
        await redisClient.setEx(key, ttl, response);
        console.log(`Cached response for user ${userId} (TTL: ${ttl}s)`);
    } catch (error) {
        console.error('Error caching response:', error);
    }
}

export async function invalidateUserCache(userId: string): Promise<void> {
    try {
        const pattern = `${userId}:*`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`Invalidated ${keys.length} cache entries for user ${userId}`);
        }
    } catch (error) {
        console.error('Error invalidating user cache:', error);
    }
}