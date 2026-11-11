import fs from "fs";
import path from "path";
import { load } from "js-yaml";

export function loadSwaggerDocs(docsDir, serverUrl) {
    if (!fs.existsSync(docsDir)) {
        throw new Error(`Swagger docs folder not found: ${docsDir}`);
    }

    const files = fs
        .readdirSync(docsDir)
        .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

    const spec = {
        openapi: "3.0.0",
        info: {
            title: "market place api",
            version: "1.0.0",
            description: "API documentation for the marketplace backend",
        },
        servers: [{ url: serverUrl }],
        paths: {},
        components: {},
    };

    for (const file of files) {
        let doc;
        try {
            doc = load(fs.readFileSync(path.join(docsDir, file), "utf8"));
        } catch (err) {
            throw new Error(`Invalid YAML in ${file}: ${err.message}`);
        }
        if (!doc) continue;

        Object.assign(spec.paths, doc.paths ?? {});

        for (const [section, value] of Object.entries(doc.components ?? {})) {
            spec.components[section] = { ...spec.components[section], ...value };
        }

        console.log(`Swagger: loaded ${file} (${Object.keys(doc.paths ?? {}).length} paths)`);
    }

    console.log(`Swagger: ${Object.keys(spec.paths).length} endpoints total from ${files.length} files`);
    return spec;
}