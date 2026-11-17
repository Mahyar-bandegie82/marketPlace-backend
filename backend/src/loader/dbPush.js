import "dotenv/config";
import { execSync } from "child_process";

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

const rawUrl = candidates.find((v) => !v.includes("localhost") && !v.includes("127.0.0.1")) || candidates[0];

if (!rawUrl) {
    console.warn("No DATABASE_URL found in environment variables; skipping prisma db push.");
} else {
    const cleanUrl = rawUrl.replace(/([?&])channel_binding=require(&?)/, (_, p1, p2) =>
        p2 ? p1 : ""
    );

    try {
        console.log("Pushing Prisma schema to PostgreSQL...");
        execSync("npx prisma db push --accept-data-loss", {
            stdio: "inherit",
            env: { ...process.env, DATABASE_URL: cleanUrl },
        });
        console.log("Prisma schema push completed.");

        const { injectOnlineDatabase } = await import("../services/admin/injector.js");
        await injectOnlineDatabase({ force: false });
    } catch (err) {
        console.warn("Prisma db push / seed warning:", err.message);
    }
}
