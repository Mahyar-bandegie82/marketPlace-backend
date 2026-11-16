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
                    !v.includes("localhost") &&
                    (k.includes("DATABASE_URL") || k.includes("POSTGRES") || k.endsWith("_URL"))
            )
            .map(([, v]) => v),
    ].filter((v) => typeof v === "string" && v.trim() && !v.includes("localhost"));

    const chosen =
        candidates[0] ||
        "postgresql://neondb_owner:npg_RTVW2o4hNbDk@ep-damp-silence-bb7ycyr4.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require";

    return chosen.replace(/([?&])channel_binding=require(&?)/, (_, p1, p2) =>
        p2 ? p1 : ""
    );
}

export default async function handler(req, res) {
    try {
        process.env.DATABASE_URL = resolveDatabaseUrl();
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
