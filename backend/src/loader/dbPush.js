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
                !v.includes("localhost") &&
                (k.includes("DATABASE_URL") || k.includes("POSTGRES") || k.endsWith("_URL"))
        )
        .map(([, v]) => v),
].filter((v) => typeof v === "string" && v.trim() && !v.includes("localhost"));

const rawUrl =
    candidates[0] ||
    "postgresql://neondb_owner:npg_RTVW2o4hNbDk@ep-damp-silence-bb7ycyr4.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require";

const cleanUrl = rawUrl.replace(/([?&])channel_binding=require(&?)/, (_, p1, p2) =>
    p2 ? p1 : ""
);

try {
    console.log("Pushing Prisma schema to Neon PostgreSQL...");
    execSync("npx prisma db push --accept-data-loss", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: cleanUrl },
    });
    console.log("Prisma schema push completed.");
} catch (err) {
    console.warn("Prisma db push warning:", err.message);
}
