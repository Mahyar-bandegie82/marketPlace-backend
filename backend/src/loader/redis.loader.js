import dotenv from 'dotenv';
dotenv.config();
import redis from 'redis';

// In-memory fallback store used automatically if Redis is unreachable
const memoryStore = new Map();
const memorySets = new Map();

function resolveRedisUrl() {
    const candidates = [
        process.env.REDIS_URL_REDIS_URL,
        process.env.REDIS_URL_KV_URL,
        process.env.REDIS_URL,
        process.env.KV_URL,
        process.env.STORAGE_REDIS_URL,
        process.env.STORAGE_KV_URL,
        ...Object.entries(process.env)
            .filter(
                ([k, v]) =>
                    typeof v === 'string' &&
                    (v.startsWith('redis://') || v.startsWith('rediss://')) &&
                    (k.includes('REDIS') || k.includes('KV') || k.endsWith('_URL'))
            )
            .map(([, v]) => v),
    ].filter((v) => typeof v === 'string' && v.trim());

    const cloudCandidate = candidates.find(
        (v) => !v.includes('localhost') && !v.includes('127.0.0.1')
    );

    return cloudCandidate || candidates[0] || null;
}

const resolvedRedisUrl = resolveRedisUrl();

const rawClient = resolvedRedisUrl
    ? redis.createClient({
          url: resolvedRedisUrl,
          socket: {
              connectTimeout: 5000,
              reconnectStrategy: (retries) => (retries < 2 ? 250 : false),
          },
      })
    : null;

if (rawClient) {
    rawClient.on('error', (err) => {
        console.warn('redis warning:', err.message);
    });
}

let connectingPromise = null;

// Connect the Redis client if configured and not already open
const connectRedis = async () => {
    if (!rawClient) return false;
    if (rawClient.isOpen) return true;
    if (connectingPromise) return connectingPromise;

    connectingPromise = rawClient
        .connect()
        .then(() => {
            console.log('redis has been connected');
            return true;
        })
        .catch((err) => {
            console.warn('Redis unavailable, using in-memory fallback:', err.message);
            return false;
        })
        .finally(() => {
            connectingPromise = null;
        });

    return connectingPromise;
};

// Disconnect the Redis client if currently connected
const disconnectRedis = async () => {
    if (rawClient && rawClient.isOpen) {
        await rawClient.quit();
        console.log('redis has been disconnected');
    }
};

const isReady = () => Boolean(rawClient && rawClient.isOpen);

const ensureReady = async () => {
    if (isReady()) return true;
    return await connectRedis();
};

const redisClient = {
    get isOpen() {
        return isReady();
    },
    async get(key) {
        if (await ensureReady()) return rawClient.get(key);
        const entry = memoryStore.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            memoryStore.delete(key);
            return null;
        }
        return entry.value;
    },
    async set(key, value, options = {}) {
        if (await ensureReady()) return rawClient.set(key, value, options);
        if (options.NX) {
            const existing = await this.get(key);
            if (existing !== null) return null;
        }
        const expiresAt = options.EX ? Date.now() + options.EX * 1000 : null;
        memoryStore.set(key, { value: String(value), expiresAt });
        return 'OK';
    },
    async getDel(key) {
        if (await ensureReady()) return rawClient.getDel(key);
        const val = await this.get(key);
        memoryStore.delete(key);
        return val;
    },
    async del(keys) {
        if (await ensureReady()) return rawClient.del(keys);
        const list = Array.isArray(keys) ? keys : [keys];
        for (const k of list) {
            memoryStore.delete(k);
            memorySets.delete(k);
        }
        return list.length;
    },
    async incr(key) {
        if (await ensureReady()) return rawClient.incr(key);
        const current = Number((await this.get(key)) || 0) + 1;
        const existing = memoryStore.get(key);
        memoryStore.set(key, {
            value: String(current),
            expiresAt: existing?.expiresAt || null,
        });
        return current;
    },
    async expire(key, seconds) {
        if (await ensureReady()) return rawClient.expire(key, seconds);
        const existing = memoryStore.get(key);
        if (existing) {
            existing.expiresAt = Date.now() + seconds * 1000;
        }
        return 1;
    },
    async sAdd(key, member) {
        if (await ensureReady()) return rawClient.sAdd(key, member);
        if (!memorySets.has(key)) memorySets.set(key, new Set());
        memorySets.get(key).add(String(member));
        return 1;
    },
    async sMembers(key) {
        if (await ensureReady()) return rawClient.sMembers(key);
        return Array.from(memorySets.get(key) || []);
    },
    multi() {
        const ops = [];
        return {
            set(k, v, opts) {
                ops.push({ type: 'set', args: [k, v, opts] });
                return this;
            },
            sAdd(k, m) {
                ops.push({ type: 'sAdd', args: [k, m] });
                return this;
            },
            expire(k, s) {
                ops.push({ type: 'expire', args: [k, s] });
                return this;
            },
            async exec() {
                if (await ensureReady()) {
                    const m = rawClient.multi();
                    for (const op of ops) {
                        m[op.type](...op.args);
                    }
                    return m.exec();
                }
                const results = [];
                for (const op of ops) {
                    results.push(await redisClient[op.type](...op.args));
                }
                return results;
            },
        };
    },
};

export default redisClient;
export { connectRedis, disconnectRedis };
