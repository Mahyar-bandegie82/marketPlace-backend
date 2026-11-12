import dotenv from 'dotenv'
dotenv.config()
import redis from 'redis';

const redisClient = redis.createClient({url: process.env.REDIS_URL});

redisClient.on('error', (err) => {
    console.error('redis error:', err);
})

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        console.log("redis has been connected");
        await redisClient.connect();
    }
};

const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        console.log("redis has been disconnected");
    }
};

export default redisClient;
export { connectRedis, disconnectRedis };
