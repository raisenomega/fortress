/* TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
   NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS. */
import { useState, useCallback, useRef, useId } from "react";

const PHASES = [
  { id: "transport", name: "Transporte y Cifrado", icon: "🔐", prompt: `Analiza transporte y cifrado de {D}. Busca en web: "{D}" SSL Labs grade, "{D}" certificate transparency crt.sh, hstspreload.org status "{D}". Visita https://{D} y http://{D} con web_fetch para leer headers reales. Verifica: HTTPS activo, redirección HTTP→HTTPS, HSTS, TLS version, certificado válido/expiración.` },
  { id: "headers", name: "Cabeceras de Seguridad", icon: "🛡️", prompt: `Analiza headers de seguridad de {D}. USA web_fetch para GET https://{D} — lee TODOS los response headers. Busca presencia/ausencia de: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security, Cache-Control. Detecta headers que filtran info: Server, X-Powered-By. Reporta valor EXACTO de cada header encontrado.` },
  { id: "tech", name: "Fingerprinting Tecnológico", icon: "🔍", prompt: `Detecta tecnología de {D}. USA web_fetch en https://{D} para leer HTML. Busca: meta generator, frameworks JS (React/Vue/Next/Nuxt/Angular), scripts CDN, analytics, chat widgets. Busca en web: "{D}" site:builtwith.com, "{D}" technology stack. Identifica servidor web, CDN, WAF (Cloudflare CF-RAY, AWS).` },
  { id: "surface", name: "Superficie de Ataque", icon: "🗺️", prompt: `Mapea superficie de {D}. Busca subdominios: site:crt.sh "{D}", "*.{D}" certificate transparency. USA web_fetch para probar: https://api.{D}, https://admin.{D}, https://dev.{D}, https://staging.{D}, https://mail.{D}, https://app.{D}. Busca shadow IT y activos olvidados.` },
  { id: "files", name: "Archivos Expuestos", icon: "📂", prompt: `Busca archivos expuestos en {D}. USA web_fetch para visitar CADA UNA: https://{D}/robots.txt, https://{D}/.git/config, https://{D}/.env, https://{D}/sitemap.xml, https://{D}/.well-known/security.txt, https://{D}/wp-admin/, https://{D}/admin/, https://{D}/api/docs, https://{D}/swagger, https://{D}/graphql, https://{D}/.DS_Store, https://{D}/backup/, https://{D}/config.php, https://{D}/wp-config.php.bak. Reporta código HTTP de cada intento.` },
  { id: "email", name: "Email y DNS", icon: "📧", prompt: `Analiza seguridad email de {D}. Busca en web: "{D}" SPF record, "{D}" DMARC, "{D}" DKIM, "{D}" MX record, mxtoolbox.com "{D}". Busca: ¿tiene SPF con -all o ~all? ¿DMARC con p=reject/quarantine? ¿está en listas negras? Busca security.txt y bug bounty.` },
  { id: "cve", name: "CVEs y Vulnerabilidades", icon: "⚠️", prompt: `Busca CVEs para {D}. Basándote en tecnologías detectadas, busca: CVE + WordPress 2025, CVE + React, CVE + Next.js, CVE + nginx, o lo que aplique. Busca: "{D}" data breach, "{D}" hack, "{D}" vulnerability. Busca en web: site:{D} filetype:sql OR filetype:env OR filetype:log. Busca "{D}" github.com password OR api_key OR secret.` },
  { id: "infra", name: "Infraestructura", icon: "🔗", prompt: `Analiza infraestructura de {D}. USA web_fetch en https://{D} para ver qué dominios externos carga (scripts src, links, iframes). Busca: hosting provider, DNS provider, CDN. Busca en web: "{D}" site:shodan.io, "{D}" hosting, "{D}" nameservers. ¿Tiene redundancia? ¿Single points of failure?` },
];

// Cuota de cortesia en cliente (templates/CLAUDE.md, Rate Limiting: IA 10-30 req/hora).
// Cada escaneo son 9 llamadas; el control real va en el servidor o proxy de la API.
// El registro persiste en localStorage para sobrevivir recargas; si el storage esta
// bloqueado (artefacto, iframe sandboxed) degrada al registro en memoria de la sesion.
const SCANS_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;
const SCAN_LOG_KEY = "fortress-shield-v3.scan-log";
const readScanLog = () => {
  try {
    const log = JSON.parse(window.localStorage.getItem(SCAN_LOG_KEY) || "[]");
    return Array.isArray(log) ? log.filter(t => typeof t === "number") : [];
  } catch { return null; }
};
const writeScanLog = (log) => { try { window.localStorage.setItem(SCAN_LOG_KEY, JSON.stringify(log)); } catch {} };
const PHASE_GAP_MS = 1500;
const MAX_SEARCHES = 5;
const MAX_RETRIES = 3;
const BACKOFF_MS = 5000;
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const SEV_CONFIG = {
  CRITICAL: { bg: "#450a0a", text: "#fca5a5", border: "#7f1d1d", dot: "#ef4444", label: "CRÍTICO", weight: 4 },
  HIGH:     { bg: "#431407", text: "#fdba74", border: "#7c2d12", dot: "#f97316", label: "ALTO", weight: 3 },
  MEDIUM:   { bg: "#422006", text: "#fde047", border: "#713f12", dot: "#eab308", label: "MEDIO", weight: 2 },
  LOW:      { bg: "#052e16", text: "#86efac", border: "#14532d", dot: "#22c55e", label: "BAJO", weight: 1 },
  INFO:     { bg: "#0c1a3d", text: "#93c5fd", border: "#1e3a5f", dot: "#3b82f6", label: "INFO", weight: 0 },
  OK:       { bg: "#052e16", text: "#86efac", border: "#14532d", dot: "#22c55e", label: "OK", weight: 0 },
};

const SYSTEM_PROMPT = `Eres FORTRESS SHIELD v3, analizador EASM enterprise grado gubernamental/CIA.
REGLAS ABSOLUTAS:
- Solo análisis PASIVO y legal. NUNCA explotas ni penetras.
- USA web_fetch para VISITAR URLs reales y leer headers/HTML.
- USA web_search para buscar info en internet.
- Sé BRUTALMENTE ESPECÍFICO: reporta datos reales (headers exactos, versiones, valores, códigos HTTP).
- Si no puedes verificar algo, marca como INFO con "no verificable" — NUNCA como CRITICAL por suposición.
- Solo CRITICAL/HIGH para hallazgos REALES confirmados con evidencia.
- Cada finding DEBE tener fix concreto y accionable.

Responde SOLO JSON puro (sin markdown, sin backticks):
{"score":<0-100>,"findings":[{"severity":"CRITICAL|HIGH|MEDIUM|LOW|INFO|OK","title":"<corto>","description":"<detalle REAL>","fix":"<solución CONCRETA paso a paso>"}]}`;

function Gauge({ score }) {
  const s = 160, r = 66, c = 2 * Math.PI * r, p = (score / 100) * c;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  const label = score >= 80 ? "PROTEGIDO" : score >= 60 ? "ACEPTABLE" : score >= 40 ? "EN RIESGO" : "CRÍTICO";
  return (
    <div style={{ position: "relative", width: s, height: s }}>
      <svg width={s} height={s}>
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="#1e293b" strokeWidth="10"/>
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={c} strokeDashoffset={c-p} strokeLinecap="round" transform={`rotate(-90 ${s/2} ${s/2})`} style={{transition:"stroke-dashoffset 2s ease-out"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:40,fontWeight:800,color,fontFamily:"monospace"}}>{score}</span>
        <span style={{fontSize:9,fontWeight:700,color:"#64748b",letterSpacing:2}}>{label}</span>
      </div>
    </div>
  );
}

function FindingRow({ f }) {
  const s = SEV_CONFIG[f.severity] || SEV_CONFIG.INFO;
  const [open, setOpen] = useState(false);
  const detailId = useId();
  return (
    <div style={{borderBottom:"1px solid #1e293b"}}>
      <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls={detailId} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",cursor:"pointer",width:"100%",background:"none",border:"none",color:"inherit",font:"inherit",textAlign:"left"}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
        <span style={{fontSize:10,fontWeight:700,color:s.text,minWidth:55}}>{s.label}</span>
        <span style={{fontSize:12,color:"#e2e8f0",flex:1}}>{f.title}</span>
        <span aria-hidden="true" style={{fontSize:11,color:"#475569",transform:open?"rotate(180deg)":"",transition:"0.2s"}}>▼</span>
      </button>
      {open && (
        <div id={detailId} style={{padding:"0 12px 12px 30px"}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 6px",lineHeight:1.6}}>{f.description}</p>
          {f.fix && <div style={{padding:"8px 10px",background:"#0c1a2e",border:"1px solid #1e3a5f",borderRadius:6,fontSize:11,color:"#67e8f9",lineHeight:1.6}}><span aria-hidden="true">💡 </span><strong>FIX:</strong> {f.fix}</div>}
        </div>
      )}
    </div>
  );
}

function PhaseBlock({ phase, data }) {
  const [open, setOpen] = useState(false);
  const fs = data?.findings || [];
  const sc = data?.score ?? 0;
  const bar = sc >= 80 ? "#22c55e" : sc >= 60 ? "#eab308" : sc >= 40 ? "#f97316" : "#ef4444";
  const crits = fs.filter(f=>f.severity==="CRITICAL").length;
  const highs = fs.filter(f=>f.severity==="HIGH").length;

  return (
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,marginBottom:8,overflow:"hidden"}}>
      <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls={`phase-${phase.id}`} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",width:"100%",background:"none",border:"none",color:"inherit",font:"inherit",textAlign:"left"}}>
        <span aria-hidden="true" style={{fontSize:20}}>{phase.icon}</span>
        <span style={{display:"block",flex:1}}>
          <span style={{display:"block",fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{phase.name}</span>
          <span style={{display:"block",fontSize:10,color:"#475569"}}>
            {fs.length} hallazgo{fs.length!==1?"s":""}
            {crits>0&&<span style={{color:"#ef4444",marginLeft:6}}><span aria-hidden="true">⬤ </span>{crits} crítico{crits>1?"s":""}</span>}
            {highs>0&&<span style={{color:"#f97316",marginLeft:6}}><span aria-hidden="true">⬤ </span>{highs} alto{highs>1?"s":""}</span>}
          </span>
        </span>
        <span style={{width:44,height:44,borderRadius:"50%",border:`2px solid ${bar}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:bar,fontFamily:"monospace"}}>{sc}</span>
        <span aria-hidden="true" style={{color:"#475569",fontSize:12,transform:open?"rotate(180deg)":"",transition:"0.2s"}}>▼</span>
      </button>
      {open && <div id={`phase-${phase.id}`} style={{borderTop:"1px solid #1e293b"}}>{fs.map((f,i)=><FindingRow key={i} f={f}/>)}</div>}
    </div>
  );
}

function generateReport(domain, results, globalScore, summary) {
  const now = new Date().toISOString().split("T")[0];
  let md = `# FORTRESS SHIELD v3 — Informe de Seguridad\n`;
  md += `## Dominio: ${domain}\n`;
  md += `### Fecha: ${now}\n`;
  md += `### Clasificación: CONFIDENCIAL · INTERNO\n\n`;
  md += `---\n\n`;
  md += `## RESUMEN EJECUTIVO\n\n`;
  md += `**Score Global: ${globalScore}/100**\n\n`;
  md += `${summary}\n\n`;

  const all = Object.values(results).flatMap(r => r.findings || []);
  const counts = {};
  all.forEach(f => { counts[f.severity] = (counts[f.severity]||0)+1; });
  md += `### Hallazgos Totales\n\n`;
  md += `| Severidad | Cantidad |\n|-----------|----------|\n`;
  ["CRITICAL","HIGH","MEDIUM","LOW","INFO","OK"].forEach(s => {
    if (counts[s]) md += `| ${s} | ${counts[s]} |\n`;
  });
  md += `\n---\n\n`;

  // Priority action items
  const critsAndHighs = all.filter(f => f.severity === "CRITICAL" || f.severity === "HIGH");
  if (critsAndHighs.length > 0) {
    md += `## ⛔ ACCIONES PRIORITARIAS (resolver antes de producción)\n\n`;
    critsAndHighs.forEach((f, i) => {
      md += `### ${i+1}. [${f.severity}] ${f.title}\n\n`;
      md += `**Problema:** ${f.description}\n\n`;
      md += `**Solución:** ${f.fix}\n\n`;
      md += `---\n\n`;
    });
  }

  // Full results by layer
  md += `## RESULTADOS POR CAPA\n\n`;
  PHASES.forEach(phase => {
    const data = results[phase.id];
    if (!data) return;
    md += `### ${phase.icon} ${phase.name} — Score: ${data.score}/100\n\n`;
    if (data.findings?.length === 0) {
      md += `✅ Sin hallazgos en esta capa.\n\n`;
    } else {
      data.findings?.forEach(f => {
        const icon = f.severity === "OK" ? "✅" : f.severity === "CRITICAL" ? "🔴" : f.severity === "HIGH" ? "🟠" : f.severity === "MEDIUM" ? "🟡" : f.severity === "LOW" ? "🟢" : "🔵";
        md += `#### ${icon} [${f.severity}] ${f.title}\n\n`;
        md += `${f.description}\n\n`;
        if (f.fix) md += `> **FIX:** ${f.fix}\n\n`;
      });
    }
    md += `---\n\n`;
  });

  // Remediation checklist
  md += `## CHECKLIST DE REMEDIACIÓN\n\n`;
  md += `Priorizar en este orden:\n\n`;
  let checkNum = 1;
  ["CRITICAL","HIGH","MEDIUM","LOW"].forEach(sev => {
    const items = all.filter(f => f.severity === sev && f.fix);
    items.forEach(f => {
      md += `- [ ] **${checkNum}.** [${sev}] ${f.title} → ${f.fix.slice(0,120)}${f.fix.length>120?"...":""}\n`;
      checkNum++;
    });
  });

  md += `\n---\n\n`;
  md += `## METODOLOGÍA\n\n`;
  md += `Este análisis fue ejecutado por FORTRESS SHIELD v3 usando metodología EASM (External Attack Surface Management).\n\n`;
  md += `**Frameworks de referencia:** OWASP WSTG · NIST CSF 2.0 · PTES (fases 1-3) · CIS Controls v8\n\n`;
  md += `**Tipo de análisis:** 100% pasivo y legal. No se penetró, explotó ni accedió a sistemas privados.\n\n`;
  md += `**Herramientas utilizadas:** web_fetch (inspección directa de headers/HTML), web_search (OSINT pasivo)\n\n`;
  md += `**8 capas analizadas:** Transporte/Cifrado, Cabeceras HTTP, Fingerprinting, Superficie de Ataque, Archivos Expuestos, Email/DNS, CVEs/Brechas, Infraestructura\n\n`;
  md += `---\n\n`;
  md += `\`\`\`\nFORTRESS SHIELD v3 · Informe generado: ${now}\nDominio: ${domain}\nScore: ${globalScore}/100\nClasificación: CONFIDENCIAL · INTERNO\nNO COMPARTIR sin autorización del operador\n\`\`\`\n`;

  return md;
}

function downloadMd(content, filename) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FortressV3() {
  const [domain, setDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState({});
  const [phaseIdx, setPhaseIdx] = useState(-1);
  const [globalScore, setGlobalScore] = useState(null);
  const [summary, setSummary] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const scanLog = useRef([]);

  const api = async (sys, usr) => {
    for (let attempt = 0; ; attempt++) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 3500, system: sys,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES }],
          messages: [{ role: "user", content: usr }] })
      });
      if (r.status === 429 && attempt < MAX_RETRIES) {
        const wait = Number(r.headers.get("retry-after"));
        await sleep(wait > 0 ? wait * 1000 : BACKOFF_MS * 2 ** attempt);
        continue;
      }
      if (!r.ok) {
        const e = await r.json().catch(()=>({}));
        const err = new Error(e.error?.message || `API ${r.status}`);
        err.rateLimited = r.status === 429;
        throw err;
      }
      const d = await r.json();
      return d.content.filter(c=>c.type==="text").map(c=>c.text).join("\n");
    }
  };

  const parseJ = (t) => { try { const m = t.match(/\{[\s\S]*\}/); if(m) return JSON.parse(m[0]); } catch{} return null; };

  const scan = useCallback(async () => {
    const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!clean) return;
    const now = Date.now();
    const stored = readScanLog();
    const log = (stored ?? scanLog.current).filter(t => now - t < HOUR_MS);
    if (log.length >= SCANS_PER_HOUR) {
      const mins = Math.ceil((HOUR_MS - (now - log[0])) / 60000);
      setError(`Límite de ${SCANS_PER_HOUR} escaneos por hora alcanzado. Reintenta en ${mins} min.`);
      return;
    }
    log.push(now);
    scanLog.current = log;
    writeScanLog(log);
    setScanning(true); setResults({}); setPhaseIdx(0); setGlobalScore(null); setSummary(""); setDone(false); setError("");

    const all = {};
    let limited = false;
    for (let i = 0; i < PHASES.length; i++) {
      setPhaseIdx(i);
      if (limited) {
        all[PHASES[i].id] = {score:50,findings:[{severity:"INFO",title:"Omitida por límite de API",description:"La API devolvió 429 tras los reintentos; esta capa no se lanzó.",fix:"Reintentar más tarde"}]};
        setResults(prev => ({...prev, [PHASES[i].id]: all[PHASES[i].id]}));
        continue;
      }
      if (i > 0) await sleep(PHASE_GAP_MS);
      try {
        const txt = await api(SYSTEM_PROMPT, PHASES[i].prompt.replace(/\{D\}/g, clean));
        const p = parseJ(txt);
        if (p) { all[PHASES[i].id] = p; setResults(prev => ({...prev, [PHASES[i].id]: p})); }
        else {
          all[PHASES[i].id] = {score:50,findings:[{severity:"INFO",title:"Respuesta no estructurada",description:txt.slice(0,400),fix:"Re-ejecutar esta capa"}]};
          setResults(prev => ({...prev, [PHASES[i].id]: all[PHASES[i].id]}));
        }
      } catch(e) {
        if (e.rateLimited) limited = true;
        all[PHASES[i].id] = {score:50,findings:[{severity:"INFO",title:"Error",description:e.message,fix:"Reintentar"}]};
        setResults(prev => ({...prev, [PHASES[i].id]: all[PHASES[i].id]}));
      }
    }

    setPhaseIdx(PHASES.length);
    const scores = Object.values(all).map(v=>v.score||50);
    const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
    setGlobalScore(avg);

    try {
      if (limited) throw new Error("API 429");
      const allFindings = Object.entries(all).map(([k,v])=>`${k}: score=${v.score}, crits=${(v.findings||[]).filter(f=>f.severity==="CRITICAL").length}, highs=${(v.findings||[]).filter(f=>f.severity==="HIGH").length}, total=${(v.findings||[]).length}`).join("; ");
      const st = await api(
        `Genera resumen ejecutivo en español (4-5 frases) de un análisis de seguridad EASM. Sé directo, honesto, sin alarmismo. Menciona los hallazgos más importantes y qué priorizar. Responde SOLO JSON: {"summary":"<texto>"}`,
        `Dominio: ${clean}. Score: ${avg}/100. Capas: ${allFindings}`
      );
      const sp = parseJ(st);
      setSummary(sp?.summary || `Análisis de ${clean} completado. Score: ${avg}/100.`);
    } catch { setSummary(`Análisis de ${clean} completado. Score global: ${avg}/100.`); }

    setDone(true); setScanning(false);
  }, [domain]);

  const completed = Object.keys(results).length;
  const allFindings = Object.values(results).flatMap(r=>r.findings||[]);
  const sev = {}; allFindings.forEach(f=>{sev[f.severity]=(sev[f.severity]||0)+1;});
  const cleanDomain = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  return (
    <div style={{minHeight:"100vh",background:"#020617",color:"#e2e8f0",fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <div style={{maxWidth:860,margin:"0 auto",padding:16}}>

        {/* Header */}
        <div style={{textAlign:"center",padding:"28px 0 20px"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:100,fontSize:10,fontWeight:700,color:"#ef4444",letterSpacing:1.5,marginBottom:10}}>
            ⛔ CLASIFICACIÓN GUBERNAMENTAL · DEEP SCAN · INFORME DESCARGABLE
          </div>
          <h1 style={{fontSize:24,fontWeight:800,margin:"0 0 4px",background:"linear-gradient(135deg,#e2e8f0 30%,#ef4444 60%,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            FORTRESS SHIELD v3
          </h1>
          <p style={{fontSize:11,color:"#475569",margin:0}}>8 pasadas · inspección real · OSINT profundo · informe .md descargable</p>
        </div>

        {/* Input */}
        <div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <input value={domain} onChange={e=>setDomain(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!scanning&&scan()}
            placeholder="tu-dominio.com" disabled={scanning} aria-label="Dominio a escanear"
            style={{flex:1,minWidth:200,padding:"11px 14px",fontSize:14,fontWeight:500,background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,color:"#e2e8f0",outline:"none",fontFamily:"monospace"}}/>
          <button onClick={scan} disabled={scanning||!domain.trim()}
            style={{padding:"11px 22px",fontSize:13,fontWeight:700,background:scanning?"#1e293b":"linear-gradient(135deg,#ef4444,#f97316)",border:"none",borderRadius:10,color:"#fff",cursor:scanning?"not-allowed":"pointer",opacity:!domain.trim()?0.4:1,letterSpacing:0.5}}>
            {scanning?`⏳ ${completed}/${PHASES.length}`:"⚡ DEEP SCAN"}
          </button>
        </div>
        <p style={{fontSize:12,color:"#94a3b8",textAlign:"center",margin:"0 0 16px"}}><span aria-hidden="true">🔒</span> 100% pasivo · legal · no intrusivo</p>

        {/* Progress */}
        {/* La region viva queda montada siempre: si naciera con el texto, el primer anuncio se perderia */}
        <div style={{marginBottom:scanning?16:0}}>
          {scanning && (
            <div role="progressbar" aria-label="Progreso del escaneo" aria-valuemin={0} aria-valuemax={PHASES.length} aria-valuenow={completed} aria-valuetext={`${completed} de ${PHASES.length} fases`}
              style={{display:"flex",gap:2,marginBottom:8}}>
              {PHASES.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<completed?"#3b82f6":i===phaseIdx?"#1e40af":"#1e293b",transition:"0.4s"}}/>)}
            </div>
          )}
          <div role="status" aria-live="polite" style={{fontSize:12,color:"#94a3b8",textAlign:"center"}}>
            {scanning ? (phaseIdx<PHASES.length ? `${PHASES[phaseIdx]?.icon} Escaneando: ${PHASES[phaseIdx]?.name}...` : "Generando resumen...") : ""}
          </div>
        </div>

        {error && <div style={{padding:12,background:"#1a0a0a",border:"1px solid #7f1d1d",borderRadius:10,marginBottom:14,fontSize:12,color:"#fca5a5"}}>⚠️ {error}</div>}

        {/* Global Score */}
        {globalScore !== null && (
          <div style={{background:"linear-gradient(135deg,rgba(239,68,68,0.05),rgba(139,92,246,0.05))",border:"1px solid rgba(239,68,68,0.15)",borderRadius:14,padding:22,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:22,flexWrap:"wrap",justifyContent:"center"}}>
              <Gauge score={globalScore}/>
              <div style={{flex:1,minWidth:220}}>
                <div style={{fontSize:10,fontWeight:700,color:"#ef4444",letterSpacing:2,marginBottom:4}}>RESUMEN EJECUTIVO</div>
                <p style={{fontSize:12,color:"#cbd5e1",lineHeight:1.6,margin:"0 0 10px"}}>{summary}</p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["CRITICAL","HIGH","MEDIUM","LOW"].map(s=>sev[s]?
                    <span key={s} style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:SEV_CONFIG[s].bg,color:SEV_CONFIG[s].text,display:"flex",alignItems:"center",gap:4}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:SEV_CONFIG[s].dot}}/>{sev[s]} {SEV_CONFIG[s].label}
                    </span>:null
                  )}
                  {sev.OK>0&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"#052e16",color:"#86efac"}}>✓ {sev.OK} OK</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase results */}
        {completed > 0 && (
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:2,marginBottom:8}}>
              RESULTADOS POR CAPA · {completed}/{PHASES.length}
            </div>
            {PHASES.map((ph,i) => {
              const d = results[ph.id];
              if (!d) return <div key={ph.id} style={{background:"#0f172a",border:"1px solid #0f172a",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18,opacity:0.3}}>{ph.icon}</span><span style={{fontSize:12,color:"#94a3b8"}}>{ph.name}</span><span style={{marginLeft:"auto",fontSize:10,color:"#94a3b8"}}>pendiente</span>
              </div>;
              return <PhaseBlock key={ph.id} phase={ph} data={d}/>;
            })}
          </div>
        )}

        {/* Download Report Button */}
        {done && (
          <div style={{marginTop:20,textAlign:"center"}}>
            <button
              onClick={() => {
                const md = generateReport(cleanDomain, results, globalScore, summary);
                downloadMd(md, `FORTRESS-SHIELD_${cleanDomain}_${new Date().toISOString().split("T")[0]}.md`);
              }}
              style={{
                padding:"14px 32px",fontSize:14,fontWeight:700,
                background:"linear-gradient(135deg,#1d4ed8,#6d28d9)",
                border:"none",borderRadius:12,color:"#fff",cursor:"pointer",
                letterSpacing:0.5,boxShadow:"0 4px 20px rgba(59,130,246,0.3)",
                display:"inline-flex",alignItems:"center",gap:8
              }}
            >
              📥 Descargar Informe Completo (.md)
            </button>
            <p style={{fontSize:10,color:"#94a3b8",marginTop:8}}>
              Incluye: todos los hallazgos, fixes propuestos, checklist de remediación y metodología
            </p>
          </div>
        )}

        {/* Empty state */}
        {!scanning && completed===0 && !error && (
          <div style={{textAlign:"center",padding:"44px 20px"}}>
            <div style={{fontSize:52,marginBottom:12}}>🛡️</div>
            <div style={{fontSize:15,fontWeight:600,color:"#e2e8f0",marginBottom:6}}>Deep Scan + Informe Descargable</div>
            <div style={{fontSize:11,color:"#94a3b8",maxWidth:420,margin:"0 auto",lineHeight:1.6}}>
              8 pasadas especializadas que inspeccionan tu dominio en profundidad.
              Al finalizar, descarga un informe .md completo con cada hallazgo,
              su causa, su fix, y un checklist de remediación priorizado.
            </div>
          </div>
        )}

        {/* Footer */}
        {done && (
          <div style={{marginTop:16,padding:12,background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,fontSize:9,color:"#94a3b8",textAlign:"center",lineHeight:1.6}}>
            FORTRESS SHIELD v3 · EASM · OWASP WSTG + NIST CSF + PTES 1-3 · 100% pasivo y legal<br/>
            Para pentesting activo se requiere contrato de autorización firmado + profesional certificado
          </div>
        )}
      </div>
    </div>
  );
}
