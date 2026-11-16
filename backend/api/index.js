let appPromise = null;

export default async function handler(req, res) {
    try {
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
