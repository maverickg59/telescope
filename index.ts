import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { readdir, readFile } from "node:fs/promises";
import { watch } from "node:fs";
import { join } from "node:path";
import { Parser } from "@dbml/core";

const app = new Hono();
const DIAGRAMS_DIR = join(import.meta.dir, "diagrams");

// Live reload via SSE
const clients = new Set<ReadableStreamDefaultController>();

// Heartbeat every 240s to keep SSE alive within the 255s idle timeout
setInterval(() => {
  for (const client of clients) {
    try {
      client.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
    } catch {
      clients.delete(client);
    }
  }
}, 240_000);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(DIAGRAMS_DIR, { recursive: true }, () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    for (const client of clients) {
      try {
        client.enqueue(new TextEncoder().encode("data: reload\n\n"));
      } catch {
        clients.delete(client);
      }
    }
  }, 200);
});

interface DiagramEntry {
  project: string;
  name: string;
  file: string;
  type: "mermaid" | "dbml";
}

async function scanDiagrams(type: "mermaid" | "dbml"): Promise<DiagramEntry[]> {
  const entries: DiagramEntry[] = [];
  const ext = type === "mermaid" ? ".mmd" : ".dbml";
  const typeDir = join(DIAGRAMS_DIR, type);

  let projects;
  try {
    projects = await readdir(typeDir, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const project of projects) {
    if (!project.isDirectory()) continue;
    const projectDir = join(typeDir, project.name);
    const files = await readdir(projectDir);

    for (const file of files) {
      if (!file.endsWith(ext)) continue;
      const name = file.replace(new RegExp(`\\${ext}$`), "");
      entries.push({
        project: project.name,
        name,
        file: `${project.name}/${file}`,
        type,
      });
    }
  }

  return entries.sort((a, b) =>
    a.project.localeCompare(b.project) || a.name.localeCompare(b.name),
  );
}

// Mermaid API
app.get("/api/mermaid/diagrams", async (c) => {
  return c.json(await scanDiagrams("mermaid"));
});

app.get("/api/mermaid/diagram/:project/:name", async (c) => {
  const { project, name } = c.req.param();
  const filePath = join(DIAGRAMS_DIR, "mermaid", project, `${name}.mmd`);
  try {
    const content = await readFile(filePath, "utf-8");
    return c.text(content);
  } catch {
    return c.text("Diagram not found", 404);
  }
});

// DBML API — serves converted Mermaid ERD
app.get("/api/dbml/diagrams", async (c) => {
  return c.json(await scanDiagrams("dbml"));
});

app.get("/api/dbml/diagram/:project/:name", async (c) => {
  const { project, name } = c.req.param();
  const filePath = join(DIAGRAMS_DIR, "dbml", project, `${name}.dbml`);
  try {
    const content = await readFile(filePath, "utf-8");
    const database = new Parser().parse(content, "dbmlv2");
    const schema = database.schemas[0];

    const tables = (schema?.tables || []).map((t: any) => ({
      name: t.name,
      fields: (t.fields || []).map((f: any) => ({
        name: f.name,
        type: f.type?.type_name || "unknown",
        pk: !!f.pk,
        unique: !!f.unique,
        not_null: !!f.not_null,
      })),
    }));

    const refs = (schema?.refs || []).map((r: any) => ({
      endpoints: r.endpoints.map((ep: any) => ({
        tableName: ep.tableName,
        fieldNames: ep.fieldNames,
        relation: ep.relation,
      })),
    }));

    return c.json({ tables, refs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: msg }, 500);
  }
});

// SSE reload
app.get("/api/reload", (c) => {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      c.req.raw.signal.addEventListener("abort", () => clients.delete(controller));
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

// Static files + pages
app.get("/static/*", serveStatic({ root: "./" }));
app.get("/mermaid", serveStatic({ path: "./static/mermaid.html" }));
app.get("/assets/*", serveStatic({ root: "./dbml-dist" }));
app.get("/dbml", serveStatic({ path: "./dbml-dist/index.html" }));
app.get("/", (c) => c.redirect("/mermaid"));

export default {
  port: 3333,
  idleTimeout: 255,
  fetch: app.fetch,
};
