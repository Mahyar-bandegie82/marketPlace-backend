let appPromise = null;

function resolveDatabaseUrl() {
    const candidates = [
        process.env.DATABASE_URL_UNPOOLED,
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.DATABASE_URL,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL,
        ...Object.entries(process.env)
            .filter(
                ([k, v]) =>
                    typeof v === "string" &&
                    (v.startsWith("postgresql://") || v.startsWith("postgres://")) &&
                    (k.includes("DATABASE_URL") || k.includes("POSTGRES") || k.endsWith("_URL"))
            )
            .map(([, v]) => v),
    ].filter((v) => typeof v === "string" && v.trim());

    const cloudCandidate = candidates.find((v) => !v.includes("localhost") && !v.includes("127.0.0.1"));
    const chosen = cloudCandidate || candidates[0];

    if (!chosen) return undefined;

    return chosen.replace(/([?&])channel_binding=require(&?)/, (_, p1, p2) =>
        p2 ? p1 : ""
    );
}

export default async function handler(req, res) {
    try {
        const dbUrl = resolveDatabaseUrl();
        if (dbUrl) {
            process.env.DATABASE_URL = dbUrl;
        }
        if (!appPromise) {
            process.env.VERCEL = "1";
            appPromise = import("../src/server.js").then((mod) => mod.default);
        }
        const app = await appPromise;
        return app(req, res);
    } catch (err) {
        appPromise = null;
        console.error("Vercel serverless initialization error:", err);
        return res.status(500).json({
            status: "error",
            error: "Backend failed to initialize",
            message: err?.message || String(err),
        });
    }
}
