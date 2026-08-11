/** config-constellation — config graph/drift/secrets by zAx4hub */
export type ConfigDoc = { name: string; data: Record<string, unknown> };
export type Drift = { key: string; left: unknown; right: unknown; path: string };
export type SecretHit = { path: string; kind: string; snippet: string };
export type Edge = { from: string; to: string; via: string };

export type Report = {
  project: string;
  author: string;
  summary: string;
  score: number;
  findings: Array<{ id: string; text: string; score: number; tag: string }>;
  drift: Drift[];
  secrets: SecretHit[];
  edges: Edge[];
  metrics: Record<string, number>;
};

const SECRET_RE = [
  { kind: "password", re: /password|passwd|pwd/i },
  { kind: "token", re: /token|api[_-]?key|secret/i },
  { kind: "private-key", re: /BEGIN PRIVATE KEY|private_key/i },
];

export function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v as Record<string, unknown>, path));
    else out[path] = v;
  }
  return out;
}

export function driftDetect(a: Record<string, unknown>, b: Record<string, unknown>): Drift[] {
  const A = flatten(a);
  const B = flatten(b);
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  const drift: Drift[] = [];
  for (const key of keys) {
    if (JSON.stringify(A[key]) !== JSON.stringify(B[key])) {
      drift.push({ key, left: A[key], right: B[key], path: key });
    }
  }
  return drift;
}

export function findSecrets(data: Record<string, unknown>): SecretHit[] {
  const flat = flatten(data);
  const hits: SecretHit[] = [];
  for (const [path, value] of Object.entries(flat)) {
    const s = String(value ?? "");
    for (const r of SECRET_RE) {
      if (r.re.test(path) || r.re.test(s)) {
        hits.push({ path, kind: r.kind, snippet: s.slice(0, 40) });
        break;
      }
    }
  }
  return hits;
}

export function configGraph(docs: ConfigDoc[]): Edge[] {
  const edges: Edge[] = [];
  for (const doc of docs) {
    const flat = flatten(doc.data);
    for (const [path, value] of Object.entries(flat)) {
      if (typeof value === "string" && value.startsWith("ref:")) {
        edges.push({ from: doc.name, to: value.slice(4), via: path });
      }
    }
  }
  return edges;
}

export function run(input: { baseline?: ConfigDoc; current?: ConfigDoc; docs?: ConfigDoc[] } = {}): Report {
  const baseline = input.baseline ?? { name: "base", data: { db: { host: "db", port: 5432 }, apiKey: "hidden" } };
  const current =
    input.current ??
    { name: "prod", data: { db: { host: "db", port: 5433 }, apiKey: "sk_live_xxx", cache: { ref: "ref:redis" } } };
  const docs = input.docs?.length ? input.docs : [baseline, current, { name: "redis", data: { url: "redis://localhost" } }];
  const drift = driftDetect(baseline.data, current.data);
  const secrets = findSecrets(current.data);
  const edges = configGraph(docs);
  const score = Math.max(0, 1 - drift.length * 0.1 - secrets.length * 0.2);
  const findings = [
    ...drift.map((d, i) => ({ id: `drift-${i + 1}`, text: `drift ${d.path}: ${JSON.stringify(d.left)} → ${JSON.stringify(d.right)}`, score: 0.5, tag: "drift" })),
    ...secrets.map((s, i) => ({ id: `sec-${i + 1}`, text: `secret ${s.kind} at ${s.path}`, score: 0.2, tag: "secret" })),
    ...edges.map((e, i) => ({ id: `edge-${i + 1}`, text: `${e.from} -${e.via}-> ${e.to}`, score: 1, tag: "edge" })),
  ];
  return {
    project: "config-constellation",
    author: "zAx4hub",
    summary: `drift=${drift.length}; secrets=${secrets.length}; edges=${edges.length}`,
    score: Math.round(score * 1000) / 1000,
    findings,
    drift,
    secrets,
    edges,
    metrics: { drift: drift.length, secrets: secrets.length, edges: edges.length, keys: Object.keys(flatten(current.data)).length },
  };
}

export function demo(): Report {
  return run({});
}

export function inspect() {
  return {
    name: "config-constellation",
    author: "zAx4hub",
    oneLiner: "Config map + drift + secrets-in-config",
    features: ["flatten", "drift", "secrets", "graph", "refs"],
    version: "0.1.0",
    commands: ["demo", "run", "inspect"],
  };
}
