import dotenv from 'dotenv';
dotenv.config();
import redis from 'redis';

const redisClient = redis.createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => {
    console.error('redis error:', err);
});

// Connect the Redis client if not already open
const connectRedis = async () => {
    if (!redisClient.isOpen) {
        console.log("redis has been connected");
        await redisClient.connect();
    }
};

// Disconnect the Redis client if currently connected
const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        console.log("redis has been disconnected");
    }
};

export default redisClient;
export { connectRedis, disconnectRedis };
