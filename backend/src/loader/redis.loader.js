import dotenv from 'dotenv';
dotenv.config();
import redis from 'redis';

// In-memory fallback store used automatically if Redis is unreachable in serverless environments
const memoryStore = new Map();
const memorySets = new Map();

const rawClient = process.env.REDIS_URL
    ? redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
              connectTimeout: 3500,
              reconnectStrategy: false,
          },
      })
    : null;

if (rawClient) {
    rawClient.on('error', (err) => {
        console.warn('redis warning:', err.message);
    });
}

// Connect the Redis client if configured and not already open
const connectRedis = async () => {
    if (!rawClient) return;
    if (!rawClient.isOpen) {
        try {
            await rawClient.connect();
            console.log('redis has been connected');
        } catch (err) {
            console.warn('Redis unavailable, using in-memory fallback:', err.message);
        }
    }
};

// Disconnect the Redis client if currently connected
const disconnectRedis = async () => {
    if (rawClient && rawClient.isOpen) {
        await rawClient.quit();
        console.log('redis has been disconnected');
    }
};

const isReady = () => Boolean(rawClient && rawClient.isOpen);

const redisClient = {
    get isOpen() {
        return isReady();
    },
    async get(key) {
        if (isReady()) return rawClient.get(key);
        const entry = memoryStore.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            memoryStore.delete(key);
            return null;
        }
        return entry.value;
    },
    async set(key, value, options = {}) {
        if (isReady()) return rawClient.set(key, value, options);
        if (options.NX) {
            const existing = await this.get(key);
            if (existing !== null) return null;
        }
        const expiresAt = options.EX ? Date.now() + options.EX * 1000 : null;
        memoryStore.set(key, { value: String(value), expiresAt });
        return 'OK';
    },
    async getDel(key) {
        if (isReady()) return rawClient.getDel(key);
        const val = await this.get(key);
        memoryStore.delete(key);
        return val;
    },
    async del(keys) {
        if (isReady()) return rawClient.del(keys);
        const list = Array.isArray(keys) ? keys : [keys];
        for (const k of list) {
            memoryStore.delete(k);
            memorySets.delete(k);
        }
        return list.length;
    },
    async incr(key) {
        if (isReady()) return rawClient.incr(key);
        const current = Number((await this.get(key)) || 0) + 1;
        const existing = memoryStore.get(key);
        memoryStore.set(key, {
            value: String(current),
            expiresAt: existing?.expiresAt || null,
        });
        return current;
    },
    async expire(key, seconds) {
        if (isReady()) return rawClient.expire(key, seconds);
        const existing = memoryStore.get(key);
        if (existing) {
            existing.expiresAt = Date.now() + seconds * 1000;
        }
        return 1;
    },
    async sAdd(key, member) {
        if (isReady()) return rawClient.sAdd(key, member);
        if (!memorySets.has(key)) memorySets.set(key, new Set());
        memorySets.get(key).add(String(member));
        return 1;
    },
    async sMembers(key) {
        if (isReady()) return rawClient.sMembers(key);
        return Array.from(memorySets.get(key) || []);
    },
    multi() {
        if (isReady()) return rawClient.multi();
        const ops = [];
        return {
            set: (k, v, opts) => {
                ops.push(() => redisClient.set(k, v, opts));
                return this;
            },
            sAdd: (k, m) => {
                ops.push(() => redisClient.sAdd(k, m));
                return this;
            },
            expire: (k, s) => {
                ops.push(() => redisClient.expire(k, s));
                return this;
            },
            exec: async () => {
                const results = [];
                for (const op of ops) {
                    results.push(await op());
                }
                return results;
            },
        };
    },
};

export default redisClient;
export { connectRedis, disconnectRedis };
