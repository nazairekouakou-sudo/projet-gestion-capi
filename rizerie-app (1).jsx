import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
// Palette : terrain ivoirien — terre ocre, vert rizière sombre, blanc cassé céréale
// Typo : IBM Plex Sans (data) + espace structuré industriel
const T = {
  bg: "#0F1A0F",         // vert nuit profond
  surface: "#172117",    // surface card
  surfaceHigh: "#1E2B1E",// surface surélevée
  border: "#2A3B2A",     // séparateur subtil
  accent: "#7EC850",     // vert rizière vif — signature couleur
  accentDim: "#3D6B20",  // accent sombre
  gold: "#D4A843",       // ocre paddy — 2e accent chaud
  goldDim: "#6B521F",
  red: "#E05252",
  redDim: "#5C2020",
  text: "#E8F0E8",       // texte principal
  textMuted: "#7A9478",  // texte secondaire
  textDim: "#4A6148",    // texte tertiaire
};

// ─── DONNÉES ────────────────────────────────────────────────────────────────
const CODES = {
  "112233": { nom: "ADMIN SYSTÈME",    role: "admin",        entite: "Direction" },
  "445566": { nom: "SUPERVISEUR",      role: "superviseur",  entite: "Encadrement" },
  "778899": { nom: "ABOU",             role: "agent_saisie", entite: "CAPI" },
  "321654": { nom: "SOHA RICHMOND",    role: "agent_saisie", entite: "Trieuse" },
  "000111": { nom: "COMMERCIAL",       role: "commercial",   entite: "Ventes" },
  "999888": { nom: "LECTURE SEULE",    role: "lecture_seule",entite: "Partenaire" },
};

const ROLE_LABELS = {
  admin: "Administrateur",
  superviseur: "Superviseur",
  agent_saisie: "Agent de Saisie",
  commercial: "Commercial",
  lecture_seule: "Lecture Seule",
};

const PERMISSIONS = {
  admin:        ["dashboard","entre_paddy","usinage","trieuse","commercial","inventaire","admin"],
  superviseur:  ["dashboard","entre_paddy","usinage","trieuse","commercial","inventaire"],
  agent_saisie: ["dashboard","entre_paddy","usinage","trieuse"],
  commercial:   ["dashboard","commercial","inventaire"],
  lecture_seule:["dashboard"],
};

const EVOLUTION_DATA = [
  { mois: "Déc 25", paddy: 0,      blanchi: 42014, brisure: 3110 },
  { mois: "Jan 26", paddy: 105194, blanchi: 40853, brisure: 2292 },
  { mois: "Fév 26", paddy: 30458,  blanchi: 23245, brisure: 1883 },
  { mois: "Mar 26", paddy: 29366,  blanchi: 13679, brisure: 1092 },
  { mois: "Avr 26", paddy: 741,    blanchi: 41098, brisure: 8235 },
  { mois: "Mai 26", paddy: 0,      blanchi: 13349, brisure: 2128 },
];

const ENTITES_DATA = [
  { name: "NEPPER FARMER", kg: 629682, pct: 44.2 },
  { name: "Prestation/ANGE", kg: 629682, pct: 44.2 },
  { name: "CAPI", kg: 165759, pct: 11.6 },
];

const TRIEUSE_DATA = [
  { date: "07/05", fournisseur: "ANGE",         entree: 3200,  apres: 2936,  rebus: 268, rend: 91.8, tx: 8.4,  tech: "SOHA RICHMOND" },
  { date: "06/05", fournisseur: "ANGE",         entree: 1200,  apres: 1124,  rebus: 193, rend: 93.7, tx: 16.1, tech: "SOHA RICHMOND" },
  { date: "06/05", fournisseur: "SIKABOUTOU 4", entree: 800,   apres: 700,   rebus: 112, rend: 87.5, tx: 14.0, tech: "SOHA RICHMOND" },
  { date: "05/05", fournisseur: "SIKABOUTOU 4", entree: 500,   apres: 404,   rebus: 93,  rend: 80.8, tx: 18.6, tech: "SOHA RICHMOND" },
  { date: "05/05", fournisseur: "ANGE",         entree: 2900,  apres: 2620,  rebus: 290, rend: 90.3, tx: 10.0, tech: "SOHA RICHMOND" },
  { date: "04/05", fournisseur: "ANGE",         entree: 1000,  apres: 907,   rebus: 93,  rend: 90.7, tx: 9.3,  tech: "SOHA RICHMOND" },
  { date: "04/05", fournisseur: "NANA AIME",    entree: 2010,  apres: 1842,  rebus: 80,  rend: 91.6, tx: 4.0,  tech: "SOHA RICHMOND" },
  { date: "02/05", fournisseur: "SIKABOUTOU 4", entree: 2131,  apres: 1838,  rebus: 260, rend: 86.3, tx: 12.2, tech: "ZAMBLE DONATIEN" },
];

const PADDY_INIT = [
  { date: "25/11/2026", agent:"ABOU", localite:"Tortilla/Niakara", fournisseur:"Ange",         entite:"NEPPER FARMER", sacs:6501, variete:"JT11", poids:629682, prix:250, montant:157420500 },
  { date: "20/11/2025", agent:"ABOU", localite:"Tortilla/Niakara", fournisseur:"ANGE",          entite:"Prestation",    sacs:6501, variete:"JT11", poids:629682, prix:0,   montant:0 },
  { date: "05/01/2026", agent:"ABOU", localite:"ZEPREGHE",         fournisseur:"SOULE OUEDRAOGO",entite:"CAPI",         sacs:85,   variete:"JT11", poids:6897,   prix:250, montant:1724250 },
  { date: "05/01/2026", agent:"ABOU", localite:"ZEPREGHE",         fournisseur:"KONATE SEYDOU", entite:"CAPI",         sacs:40,   variete:"JT11", poids:3780,   prix:250, montant:945000 },
  { date: "09/01/2026", agent:"ABOU", localite:"DIBOBLY",          fournisseur:"DIABATE",        entite:"CAPI",         sacs:167,  variete:"JT11", poids:14741,  prix:225, montant:3316725 },
  { date: "10/01/2026", agent:"ABOU", localite:"SIKABOUTOU",       fournisseur:"SIKABOUTOU 1",   entite:"CAPI",         sacs:140,  variete:"JT11", poids:12735,  prix:250, montant:3183750 },
];

const STOCK_DATA = [
  { produit:"ECOS 650", unite:"Kg", stock:36.5,   prix:650,  valeur:23725,   seuil:20,  statut:"ok" },
  { produit:"ECOS 600", unite:"Kg", stock:76.5,   prix:600,  valeur:45900,   seuil:50,  statut:"ok" },
  { produit:"ECOS 550", unite:"Kg", stock:134,    prix:550,  valeur:73700,   seuil:100, statut:"ok" },
  { produit:"ECOS 400", unite:"Kg", stock:0,      prix:400,  valeur:0,       seuil:50,  statut:"epuise" },
  { produit:"ECOS 300", unite:"Kg", stock:84.5,   prix:300,  valeur:25350,   seuil:100, statut:"alerte" },
  { produit:"ECOS CB1", unite:"Kg", stock:164,    prix:1000, valeur:164000,  seuil:30,  statut:"ok" },
  { produit:"ECOS Brisure",unite:"Kg",stock:200,  prix:200,  valeur:40000,   seuil:50,  statut:"ok" },
  { produit:"K500",     unite:"Kg", stock:3739,   prix:500,  valeur:1869500, seuil:200, statut:"ok" },
  { produit:"A350",     unite:"Kg", stock:101.7,  prix:350,  valeur:35595,   seuil:30,  statut:"ok" },
  { produit:"A4.5 Kg",  unite:"Sacs",stock:24,   prix:2475, valeur:59400,   seuil:5,   statut:"ok" },
];

const VENTES_DATA = [
  { date:"Sem.act", entite:"ANGE",    client:"Femme d'Olivier", designation:"GB",       qte:300,  prix:250, montant:75000,   statut:"CREDIT" },
  { date:"Sem.act", entite:"ANGE",    client:"BB Maman",        designation:"GB",       qte:1500, prix:325, montant:487500,  statut:"CREDIT" },
  { date:"Sem.act", entite:"ANGE",    client:"Mme Koné",        designation:"GB",       qte:500,  prix:325, montant:162500,  statut:"CREDIT" },
  { date:"Sem.act", entite:"KOLO",    client:"ECOS",            designation:"FB",       qte:975,  prix:200, montant:195000,  statut:"CREDIT" },
  { date:"Sem.act", entite:"Interne", client:"Client divers",   designation:"ECOS 600", qte:431,  prix:600, montant:258600,  statut:"CASH" },
  { date:"Sem.act", entite:"Interne", client:"Client divers",   designation:"ECOS 550", qte:208.5,prix:550, montant:114675,  statut:"CASH" },
  { date:"Sem.act", entite:"Interne", client:"Client divers",   designation:"K500",     qte:386,  prix:500, montant:193000,  statut:"CASH" },
];

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtPct = (n) => `${(n * 100).toFixed(1)}%`;
const today = () => new Date().toLocaleDateString("fr-FR");

// ─── COMPOSANTS DE BASE ──────────────────────────────────────────────────────

function Badge({ children, variant = "neutral" }) {
  const styles = {
    ok:      { bg: T.accentDim, color: T.accent },
    alerte:  { bg: T.goldDim,   color: T.gold },
    epuise:  { bg: T.redDim,    color: T.red },
    credit:  { bg: T.goldDim,   color: T.gold },
    cash:    { bg: T.accentDim, color: T.accent },
    neutral: { bg: T.border,    color: T.textMuted },
    admin:   { bg: "#1A2A4A",   color: "#6BA4E0" },
    superviseur: { bg: T.accentDim, color: T.accent },
    agent_saisie:{ bg: T.border, color: T.textMuted },
    commercial:  { bg: T.goldDim, color: T.gold },
    lecture_seule:{ bg: T.redDim, color: T.textMuted },
  };
  const s = styles[variant] || styles.neutral;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase", background: s.bg, color: s.color,
    }}>
      {children}
    </span>
  );
}

function KpiCard({ icon, label, value, sub, accent = false, alert = false }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${alert ? T.goldDim : T.border}`,
      borderRadius: 12, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 4,
      position: "relative", overflow: "hidden",
    }}>
      {alert && (
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:2,
          background: `linear-gradient(90deg, ${T.gold}, transparent)`
        }}/>
      )}
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{
        fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
        color: accent ? T.accent : T.text, lineHeight: 1.1, marginTop: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
      <div>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:T.text, letterSpacing:"-0.02em" }}>{title}</h2>
        {subtitle && <p style={{ margin:"4px 0 0", fontSize:13, color:T.textMuted }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:"flex", gap:8 }}>{actions}</div>}
    </div>
  );
}

function Btn({ children, onClick, variant="primary", small=false, disabled=false }) {
  const styles = {
    primary:   { bg: T.accent,      color: T.bg, border: "none" },
    secondary: { bg: "transparent", color: T.text, border: `1px solid ${T.border}` },
    ghost:     { bg: "transparent", color: T.textMuted, border: "none" },
    danger:    { bg: T.redDim,      color: T.red, border: `1px solid ${T.redDim}` },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: s.bg, color: s.color, border: s.border,
        borderRadius: 8, padding: small ? "6px 14px" : "10px 20px",
        fontSize: small ? 12 : 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, letterSpacing: "0.01em",
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type="text", placeholder="" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:12, fontWeight:700, color:T.textMuted, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</label>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: T.surfaceHigh, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "10px 14px", color: T.text,
          fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:12, fontWeight:700, color:T.textMuted, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</label>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          background: T.surfaceHigh, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "10px 14px", color: T.text,
          fontSize: 14, outline: "none", width: "100%", cursor:"pointer",
          fontFamily: "inherit",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function DataTable({ columns, data, emptyMsg = "Aucune donnée" }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:`1px solid ${T.border}` }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding:"10px 14px", textAlign:"left",
                color:T.textDim, fontWeight:700, fontSize:11,
                letterSpacing:"0.07em", textTransform:"uppercase",
                whiteSpace:"nowrap",
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding:"40px 14px", textAlign:"center", color:T.textDim }}>{emptyMsg}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} style={{
                borderBottom:`1px solid ${T.border}`,
                transition:"background 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHigh}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {columns.map(col => (
                  <td key={col.key} style={{ padding:"12px 14px", color:T.text, whiteSpace:"nowrap" }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={onClose}>
      <div style={{
        background:T.surface, border:`1px solid ${T.border}`, borderRadius:16,
        padding:32, width:"100%", maxWidth:500, maxHeight:"90vh", overflowY:"auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h3 style={{ margin:0, color:T.text, fontSize:18, fontWeight:800 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.textMuted, fontSize:22, cursor:"pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── ÉCRAN LOGIN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const digits = code.split("");

  const handleKey = useCallback((val) => {
    if (val === "DEL") {
      setCode(c => c.slice(0, -1));
      setError("");
    } else if (code.length < 6 && /\d/.test(val)) {
      const next = code + val;
      setCode(next);
      setError("");
      if (next.length === 6) {
        setTimeout(() => submitCode(next), 150);
      }
    }
  }, [code]);

  const submitCode = (c) => {
    setLoading(true);
    setTimeout(() => {
      const user = CODES[c];
      if (user) {
        onLogin({ ...user, code: c });
      } else {
        setShake(true);
        setError("Code incorrect. Vérifiez et réessayez.");
        setCode("");
        setLoading(false);
        setTimeout(() => setShake(false), 500);
      }
    }, 600);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= "0" && e.key <= "9") handleKey(e.key);
      if (e.key === "Backspace") handleKey("DEL");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const PAD = ["1","2","3","4","5","6","7","8","9","","0","DEL"];

  return (
    <div style={{
      minHeight:"100vh", background:T.bg, display:"flex",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'IBM Plex Sans', system-ui, sans-serif",
    }}>
      {/* Fond décoratif */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", top:"-20%", right:"-10%", width:500, height:500,
          borderRadius:"50%", background:T.accentDim, opacity:0.08, filter:"blur(80px)",
        }}/>
        <div style={{
          position:"absolute", bottom:"-10%", left:"-5%", width:400, height:400,
          borderRadius:"50%", background:T.goldDim, opacity:0.06, filter:"blur(60px)",
        }}/>
      </div>

      <div style={{ position:"relative", width:"100%", maxWidth:380, padding:"0 24px" }}>
        {/* Logo / En-tête */}
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{
            width:64, height:64, background:T.accentDim, borderRadius:16,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:30, margin:"0 auto 20px", border:`1px solid ${T.accentDim}`,
          }}>🌾</div>
          <h1 style={{
            margin:"0 0 6px", fontSize:24, fontWeight:900, color:T.text,
            letterSpacing:"-0.03em",
          }}>RIZERIE SUIVI</h1>
          <p style={{ margin:0, fontSize:14, color:T.textMuted }}>
            Système de gestion intégré
          </p>
        </div>

        {/* Affichage code */}
        <div style={{
          display:"flex", justifyContent:"center", gap:10, marginBottom:32,
          animation: shake ? "shake 0.4s ease" : "none",
        }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{
              width:44, height:52, borderRadius:10,
              background: i < digits.length ? T.surfaceHigh : T.surface,
              border:`2px solid ${i === digits.length ? T.accent : i < digits.length ? T.accentDim : T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, fontWeight:800, color:T.accent,
              transition:"all 0.15s",
            }}>
              {digits[i] ? "●" : ""}
            </div>
          ))}
        </div>

        {/* Message */}
        <div style={{ textAlign:"center", height:20, marginBottom:24 }}>
          {error && <p style={{ margin:0, fontSize:13, color:T.red }}>{error}</p>}
          {loading && <p style={{ margin:0, fontSize:13, color:T.textMuted }}>Vérification…</p>}
          {!error && !loading && <p style={{ margin:0, fontSize:13, color:T.textDim }}>Saisissez votre code à 6 chiffres</p>}
        </div>

        {/* Clavier numérique */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
          {PAD.map((key, i) => (
            <button
              key={i}
              onClick={() => key && handleKey(key)}
              disabled={loading || !key}
              style={{
                background: key === "DEL" ? T.surfaceHigh : T.surface,
                border:`1px solid ${T.border}`, borderRadius:12,
                padding:"18px 0", fontSize: key === "DEL" ? 14 : 22,
                fontWeight: key === "DEL" ? 700 : 600,
                color: key === "DEL" ? T.textMuted : T.text,
                cursor: key ? "pointer" : "default",
                opacity: key ? 1 : 0,
                transition:"all 0.1s", fontFamily:"inherit",
                letterSpacing: key === "DEL" ? "0.05em" : 0,
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Codes démo */}
        <div style={{
          marginTop:32, padding:"16px 20px", background:T.surface,
          borderRadius:12, border:`1px solid ${T.border}`,
        }}>
          <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:T.textDim, letterSpacing:"0.08em", textTransform:"uppercase" }}>Codes de démonstration</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
            {Object.entries(CODES).map(([c, u]) => (
              <div key={c} style={{ fontSize:12, color:T.textMuted }}>
                <span style={{ color:T.accent, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{c}</span>
                <span style={{ color:T.textDim }}> — {ROLE_LABELS[u.role]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform:translateX(0) }
          20% { transform:translateX(-8px) }
          40% { transform:translateX(8px) }
          60% { transform:translateX(-6px) }
          80% { transform:translateX(6px) }
        }
      `}</style>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:T.surfaceHigh, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
        <p style={{ margin:"0 0 6px", fontWeight:700, color:T.text }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ margin:"2px 0", color:p.color }}>{p.name}: {fmt(p.value)} kg</p>
        ))}
      </div>
    );
  };

  return (
    <div>
      <SectionHeader
        title="Tableau de bord"
        subtitle={`Données consolidées · Mise à jour ${today()}`}
      />

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16, marginBottom:32 }}>
        <KpiCard icon="📦" label="Paddy collecté" value={`${fmt(1425123)} kg`} sub="Total campagne" accent />
        <KpiCard icon="💰" label="Valeur achat" value={`${fmt(197797555)}`} sub="FCFA investis" />
        <KpiCard icon="🌾" label="Riz blanchi" value={`${fmt(174238)} kg`} sub="Production totale" accent />
        <KpiCard icon="🔍" label="Fine brisure" value={`${fmt(18740)} kg`} sub="Récupérée" />
        <KpiCard icon="📉" label="Taux brisure" value="10.8%" sub="De la production" alert />
        <KpiCard icon="📦" label="Valeur stock" value={`${fmt(2337170)}`} sub="FCFA — produits finis" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20, marginBottom:20 }}>
        {/* Graphique évolution */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24 }}>
          <h3 style={{ margin:"0 0 20px", fontSize:15, fontWeight:700, color:T.text }}>Évolution mensuelle — Production</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={EVOLUTION_DATA} margin={{ top:5, right:10, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="gBlanchi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.accent} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gPaddy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.gold} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={T.gold} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="mois" tick={{ fill:T.textDim, fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:T.textDim, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="blanchi" name="Riz blanchi" stroke={T.accent} fill="url(#gBlanchi)" strokeWidth={2}/>
              <Area type="monotone" dataKey="paddy"   name="Paddy entré" stroke={T.gold}   fill="url(#gPaddy)"   strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition entités */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24 }}>
          <h3 style={{ margin:"0 0 20px", fontSize:15, fontWeight:700, color:T.text }}>Répartition Entités</h3>
          {ENTITES_DATA.map((e, i) => (
            <div key={i} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, color:T.textMuted, maxWidth:"60%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.name}</span>
                <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{e.pct}%</span>
              </div>
              <div style={{ background:T.border, borderRadius:99, height:5 }}>
                <div style={{
                  height:5, borderRadius:99,
                  background:i===0?T.accent:i===1?T.gold:T.textDim,
                  width:`${e.pct}%`, transition:"width 0.6s ease",
                }}/>
              </div>
              <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>{fmt(e.kg)} kg</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertes stock */}
      <div style={{ background:T.surface, border:`1px solid ${T.goldDim}`, borderRadius:12, padding:24 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:T.gold }}>⚠ Alertes Stock</h3>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {STOCK_DATA.filter(s => s.statut !== "ok").map((s, i) => (
            <div key={i} style={{
              background:T.surfaceHigh, border:`1px solid ${s.statut==="epuise"?T.redDim:T.goldDim}`,
              borderRadius:10, padding:"12px 16px",
            }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{s.produit}</div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>Stock : {s.stock} {s.unite}</div>
              <div style={{ marginTop:6 }}><Badge variant={s.statut}>{s.statut === "epuise" ? "ÉPUISÉ" : "ALERTE"}</Badge></div>
            </div>
          ))}
          {STOCK_DATA.filter(s => s.statut !== "ok").length === 0 && (
            <p style={{ color:T.accent, fontSize:14 }}>✓ Tous les stocks sont au-dessus des seuils d'alerte</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ENTRÉE PADDY ─────────────────────────────────────────────────────────────
function EntreePaddy({ user }) {
  const canWrite = ["admin","superviseur","agent_saisie"].includes(user.role);
  const [data, setData] = useState(PADDY_INIT);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ date:"", agent:user.nom, localite:"", fournisseur:"", entite:"CAPI", sacs:"", variete:"JT11", poids:"", prix:"250" });

  const filtered = data.filter(r =>
    [r.fournisseur, r.localite, r.entite, r.variete].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleAdd = () => {
    const row = {
      ...form,
      sacs: +form.sacs, poids: +form.poids, prix: +form.prix,
      montant: +form.poids * +form.prix,
      date: form.date || today(),
    };
    setData([row, ...data]);
    setShowForm(false);
    setForm({ date:"", agent:user.nom, localite:"", fournisseur:"", entite:"CAPI", sacs:"", variete:"JT11", poids:"", prix:"250" });
  };

  const cols = [
    { key:"date", label:"Date" },
    { key:"agent", label:"Agent" },
    { key:"localite", label:"Localité" },
    { key:"fournisseur", label:"Fournisseur" },
    { key:"entite", label:"Entité", render:v => <Badge variant="neutral">{v}</Badge> },
    { key:"variete", label:"Variété" },
    { key:"sacs", label:"Sacs", render:v => <span style={{color:T.text}}>{fmt(v)}</span> },
    { key:"poids", label:"Poids (kg)", render:v => <span style={{color:T.accent, fontWeight:700}}>{fmt(v)}</span> },
    { key:"prix", label:"Prix/kg", render:v => v ? `${fmt(v)} F` : <span style={{color:T.textDim}}>—</span> },
    { key:"montant", label:"Montant (FCFA)", render:v => v ? <span style={{color:T.gold, fontWeight:700}}>{fmt(v)}</span> : <span style={{color:T.textDim}}>—</span> },
  ];

  const totalPoids = data.reduce((s,r) => s + r.poids, 0);
  const totalMontant = data.reduce((s,r) => s + r.montant, 0);

  return (
    <div>
      <SectionHeader
        title="Entrée Paddy"
        subtitle={`${fmt(data.length)} enregistrements · Total : ${fmt(totalPoids)} kg`}
        actions={canWrite && <Btn onClick={() => setShowForm(true)}>+ Nouvelle entrée</Btn>}
      />

      {/* Stats rapides */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard icon="📦" label="Total paddy" value={`${fmt(totalPoids)} kg`} accent />
        <KpiCard icon="💰" label="Valeur achat" value={`${fmt(totalMontant)}`} sub="FCFA" />
        <KpiCard icon="🗂" label="Entrées saisies" value={data.length} sub="opérations" />
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom:16 }}>
        <Input value={search} onChange={setSearch} placeholder="Rechercher fournisseur, localité, entité…" />
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
        <DataTable columns={cols} data={filtered} emptyMsg="Aucune entrée trouvée" />
        <div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"flex-end", gap:32 }}>
          <span style={{ fontSize:13, color:T.textMuted }}>TOTAL : <strong style={{color:T.accent}}>{fmt(totalPoids)} kg</strong></span>
          <span style={{ fontSize:13, color:T.textMuted }}>MONTANT : <strong style={{color:T.gold}}>{fmt(totalMontant)} FCFA</strong></span>
        </div>
      </div>

      {showForm && (
        <Modal title="Nouvelle entrée paddy" onClose={() => setShowForm(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="Date" type="date" value={form.date} onChange={v => setForm({...form, date:v})} />
              <Input label="Agent" value={form.agent} onChange={v => setForm({...form, agent:v})} />
              <Input label="Localité" value={form.localite} onChange={v => setForm({...form, localite:v})} placeholder="Ex: ZEBRA" />
              <Input label="Fournisseur" value={form.fournisseur} onChange={v => setForm({...form, fournisseur:v})} />
              <Select label="Entité" value={form.entite} onChange={v => setForm({...form, entite:v})}
                options={[{value:"CAPI",label:"CAPI"},{value:"Prestation",label:"Prestation"},{value:"NEPPER FARMER",label:"NEPPER FARMER"}]} />
              <Select label="Variété" value={form.variete} onChange={v => setForm({...form, variete:v})}
                options={["JT11","CY-2","BKE","W9","RR","EQ"].map(v=>({value:v,label:v}))} />
              <Input label="Nombre de sacs" type="number" value={form.sacs} onChange={v => setForm({...form, sacs:v})} />
              <Input label="Poids (kg)" type="number" value={form.poids} onChange={v => setForm({...form, poids:v})} />
              <Input label="Prix unitaire (FCFA/kg)" type="number" value={form.prix} onChange={v => setForm({...form, prix:v})} />
              <div style={{ background:T.surfaceHigh, borderRadius:8, padding:"10px 14px", border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textDim, textTransform:"uppercase", marginBottom:4 }}>Montant calculé</div>
                <div style={{ fontSize:20, fontWeight:800, color:T.gold }}>
                  {fmt((+form.poids||0) * (+form.prix||0))} FCFA
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:8 }}>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Annuler</Btn>
              <Btn onClick={handleAdd} disabled={!form.fournisseur || !form.poids}>Enregistrer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── USINAGE ─────────────────────────────────────────────────────────────────
function Usinage({ user }) {
  const canWrite = ["admin","superviseur","agent_saisie"].includes(user.role);
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState([
    { date:"07/05/2026", localite:"Tortia/Niakara", fournisseur:"ANGE",             entite:"Prestataire", variete:"JT11", sacs:80, blanchi:3000,  brisure:500,  couleur:"MB" },
    { date:"06/05/2026", localite:"Tortia/Niakara", fournisseur:"ANGE",             entite:"Prestataire", variete:"JT11", sacs:64, blanchi:2500,  brisure:600,  couleur:"MB" },
    { date:"05/05/2026", localite:"Daloa",           fournisseur:"ALBERT",           entite:"Prestataire", variete:"NERIKA",sacs:4, blanchi:210,   brisure:22,   couleur:"MB" },
    { date:"04/05/2026", localite:"",                fournisseur:"NANA AIME",        entite:"CAPI",        variete:"JT11", sacs:40, blanchi:2010,  brisure:271,  couleur:"MB" },
    { date:"02/05/2026", localite:"SIKABOUTOU",      fournisseur:"SIKABOUTOU 4",     entite:"CAPI",        variete:"JT11", sacs:30, blanchi:2131,  brisure:100,  couleur:"MB" },
    { date:"29/04/2026", localite:"Tortia/Niakara",  fournisseur:"ANGE",             entite:"Prestataire", variete:"JT11", sacs:72, blanchi:3300,  brisure:300,  couleur:"MB" },
    { date:"23/04/2026", localite:"Daloa",           fournisseur:"MME CISSE",        entite:"Prestataire", variete:"JT11", sacs:28, blanchi:1285,  brisure:105,  couleur:"MB" },
    { date:"18/04/2026", localite:"",                fournisseur:"DIABATE MAMADOU",  entite:"CAPI",        variete:"JT11", sacs:20, blanchi:1143,  brisure:78,   couleur:"BLANC" },
  ]);
  const [form, setForm] = useState({ date:"", localite:"", fournisseur:"", entite:"CAPI", variete:"JT11", sacs:"", blanchi:"", brisure:"", couleur:"MB" });

  const totalBlanchi = data.reduce((s,r) => s+r.blanchi, 0);
  const totalBrisure = data.reduce((s,r) => s+r.brisure, 0);
  const txMoyen = totalBrisure / (totalBlanchi || 1);

  const cols = [
    { key:"date", label:"Date" },
    { key:"fournisseur", label:"Fournisseur" },
    { key:"localite", label:"Localité", render:v => v || <span style={{color:T.textDim}}>—</span> },
    { key:"entite", label:"Entité", render:v => <Badge variant="neutral">{v}</Badge> },
    { key:"variete", label:"Variété" },
    { key:"sacs", label:"Sacs" },
    { key:"blanchi", label:"Riz blanchi (kg)", render:v => <span style={{color:T.accent, fontWeight:700}}>{fmt(v)}</span> },
    { key:"brisure", label:"Fine brisure (kg)", render:v => <span style={{color:T.textMuted}}>{fmt(v)}</span> },
    { key:"couleur", label:"Couleur" },
    { key:"blanchi", label:"% Brisure", render:(v,r) => {
      const tx = r.brisure / (v||1);
      const color = tx > 0.15 ? T.red : tx > 0.10 ? T.gold : T.accent;
      return <span style={{color, fontWeight:700}}>{(tx*100).toFixed(1)}%</span>;
    }},
  ];

  const handleAdd = () => {
    setData([{...form, sacs:+form.sacs, blanchi:+form.blanchi, brisure:+form.brisure, date:form.date||today()}, ...data]);
    setShowForm(false);
  };

  return (
    <div>
      <SectionHeader
        title="Usinage"
        subtitle={`Riz blanchi & brisure · Taux moyen : ${(txMoyen*100).toFixed(1)}%`}
        actions={canWrite && <Btn onClick={() => setShowForm(true)}>+ Nouvelle session</Btn>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard icon="🌾" label="Riz blanchi total" value={`${fmt(totalBlanchi)} kg`} accent />
        <KpiCard icon="🔍" label="Fine brisure totale" value={`${fmt(totalBrisure)} kg`} />
        <KpiCard icon="📉" label="Taux brisure moyen" value={`${(txMoyen*100).toFixed(1)}%`} alert={txMoyen > 0.12} />
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
        <DataTable columns={cols} data={data} />
      </div>

      {showForm && (
        <Modal title="Nouvelle session d'usinage" onClose={() => setShowForm(false)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Date" type="date" value={form.date} onChange={v=>setForm({...form,date:v})} />
            <Input label="Localité" value={form.localite} onChange={v=>setForm({...form,localite:v})} />
            <Input label="Fournisseur" value={form.fournisseur} onChange={v=>setForm({...form,fournisseur:v})} />
            <Select label="Entité" value={form.entite} onChange={v=>setForm({...form,entite:v})}
              options={[{value:"CAPI",label:"CAPI"},{value:"Prestataire",label:"Prestataire"}]} />
            <Select label="Variété" value={form.variete} onChange={v=>setForm({...form,variete:v})}
              options={["JT11","CY-2","BKE","W9","RR","EQ","NERIKA"].map(v=>({value:v,label:v}))} />
            <Select label="Couleur" value={form.couleur} onChange={v=>setForm({...form,couleur:v})}
              options={[{value:"MB",label:"MB"},{value:"BLANC",label:"BLANC"}]} />
            <Input label="Sacs" type="number" value={form.sacs} onChange={v=>setForm({...form,sacs:v})} />
            <Input label="Riz blanchi (kg)" type="number" value={form.blanchi} onChange={v=>setForm({...form,blanchi:v})} />
            <div style={{ gridColumn:"span 2" }}>
              <Input label="Fine brisure (kg)" type="number" value={form.brisure} onChange={v=>setForm({...form,brisure:v})} />
            </div>
            {form.blanchi && form.brisure && (
              <div style={{ gridColumn:"span 2", background:T.surfaceHigh, borderRadius:8, padding:"10px 14px" }}>
                <span style={{ fontSize:12, color:T.textDim }}>Taux brisure calculé : </span>
                <span style={{ fontSize:18, fontWeight:800, color: (+form.brisure/+form.blanchi) > 0.15 ? T.red : T.accent }}>
                  {((+form.brisure / +form.blanchi)*100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:16 }}>
            <Btn variant="secondary" onClick={() => setShowForm(false)}>Annuler</Btn>
            <Btn onClick={handleAdd} disabled={!form.fournisseur||!form.blanchi}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TRIEUSE OPTIQUE ──────────────────────────────────────────────────────────
function TrieuseOptique({ user }) {
  const canWrite = ["admin","superviseur","agent_saisie"].includes(user.role);
  const [data, setData] = useState(TRIEUSE_DATA);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date:"", fournisseur:"", entree:"", apres:"", rebus:"", tech:"SOHA RICHMOND" });

  const avgRend = data.reduce((s,r)=>s+r.rend,0)/data.length;
  const avgRebus = data.reduce((s,r)=>s+r.tx,0)/data.length;

  const cols = [
    { key:"date", label:"Date" },
    { key:"fournisseur", label:"Fournisseur" },
    { key:"entree", label:"Entrée (kg)", render:v=><span style={{color:T.text}}>{fmt(v)}</span> },
    { key:"apres", label:"Après tri (kg)", render:v=><span style={{color:T.accent, fontWeight:700}}>{fmt(v)}</span> },
    { key:"rebus", label:"Rebus (kg)", render:v=><span style={{color:T.red}}>{fmt(v)}</span> },
    { key:"rend", label:"Rendement %", render:v => {
      const color = v >= 90 ? T.accent : v >= 85 ? T.gold : T.red;
      return <span style={{color, fontWeight:700}}>{v.toFixed(1)}%</span>;
    }},
    { key:"tx", label:"Taux rebus %", render:v => {
      const color = v <= 10 ? T.accent : v <= 15 ? T.gold : T.red;
      return <span style={{color, fontWeight:700}}>{v.toFixed(1)}%</span>;
    }},
    { key:"tech", label:"Technicien", render:v=><span style={{color:T.textMuted}}>{v}</span> },
  ];

  const handleAdd = () => {
    const rend = (+form.apres / +form.entree) * 100;
    const tx = (+form.rebus / +form.entree) * 100;
    setData([{ date:form.date||today(), fournisseur:form.fournisseur, entree:+form.entree, apres:+form.apres, rebus:+form.rebus, rend, tx, tech:form.tech }, ...data]);
    setShowForm(false);
  };

  return (
    <div>
      <SectionHeader
        title="Trieuse Optique"
        subtitle="Qualité & rendement au tri"
        actions={canWrite && <Btn onClick={()=>setShowForm(true)}>+ Nouvelle session</Btn>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard icon="⚙️" label="Sessions traitées" value={data.length} />
        <KpiCard icon="✅" label="Rendement moyen" value={`${avgRend.toFixed(1)}%`} accent />
        <KpiCard icon="🗑" label="Taux rebus moyen" value={`${avgRebus.toFixed(1)}%`} alert={avgRebus > 12} />
      </div>

      {/* Mini chart */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:T.text }}>Rendement par session</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={[...data].reverse()} margin={{ top:0, right:0, bottom:0, left:-20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="date" tick={{ fill:T.textDim, fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:T.textDim, fontSize:10 }} domain={[70,100]} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => `${v.toFixed(1)}%`} contentStyle={{ background:T.surfaceHigh, border:`1px solid ${T.border}`, borderRadius:8 }} />
            <Bar dataKey="rend" radius={[4,4,0,0]}>
              {[...data].reverse().map((r,i) => (
                <Cell key={i} fill={r.rend >= 90 ? T.accent : r.rend >= 85 ? T.gold : T.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
        <DataTable columns={cols} data={data} />
      </div>

      {showForm && (
        <Modal title="Nouvelle session trieuse" onClose={()=>setShowForm(false)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Date" type="date" value={form.date} onChange={v=>setForm({...form,date:v})} />
            <Input label="Fournisseur" value={form.fournisseur} onChange={v=>setForm({...form,fournisseur:v})} />
            <Input label="Poids entrée (kg)" type="number" value={form.entree} onChange={v=>setForm({...form,entree:v})} />
            <Input label="Poids après tri (kg)" type="number" value={form.apres} onChange={v=>setForm({...form,apres:v})} />
            <Input label="Rebus (kg)" type="number" value={form.rebus} onChange={v=>setForm({...form,rebus:v})} />
            <Input label="Technicien" value={form.tech} onChange={v=>setForm({...form,tech:v})} />
            {form.entree && form.apres && (
              <div style={{ gridColumn:"span 2", background:T.surfaceHigh, borderRadius:8, padding:"12px 14px", display:"flex", gap:24 }}>
                <div><div style={{fontSize:11,color:T.textDim}}>RENDEMENT</div><div style={{fontSize:20,fontWeight:800,color:T.accent}}>{((+form.apres/+form.entree)*100).toFixed(1)}%</div></div>
                <div><div style={{fontSize:11,color:T.textDim}}>TAUX REBUS</div><div style={{fontSize:20,fontWeight:800,color:T.gold}}>{((+form.rebus/+form.entree)*100).toFixed(1)}%</div></div>
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:16 }}>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Annuler</Btn>
            <Btn onClick={handleAdd} disabled={!form.fournisseur||!form.entree}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SERVICE COMMERCIAL ───────────────────────────────────────────────────────
function Commercial({ user }) {
  const canWrite = ["admin","superviseur","commercial"].includes(user.role);
  const [data, setData] = useState(VENTES_DATA);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date:"", entite:"Interne", client:"", designation:"ECOS 600", qte:"", prix:"", statut:"CASH" });

  const totalCA = data.reduce((s,r)=>s+r.montant,0);
  const nCredit = data.filter(r=>r.statut==="CREDIT").length;

  const cols = [
    { key:"date", label:"Date" },
    { key:"entite", label:"Entité", render:v=><Badge variant="neutral">{v}</Badge> },
    { key:"client", label:"Client" },
    { key:"designation", label:"Désignation" },
    { key:"qte", label:"Qté (kg)", render:v=><span style={{color:T.text}}>{fmt(v)}</span> },
    { key:"prix", label:"Prix/kg", render:v=>`${fmt(v)} F` },
    { key:"montant", label:"Montant (FCFA)", render:v=><span style={{color:T.gold, fontWeight:700}}>{fmt(v)}</span> },
    { key:"statut", label:"Statut", render:v=><Badge variant={v.toLowerCase()}>{v}</Badge> },
  ];

  const handleAdd = () => {
    setData([{...form, qte:+form.qte, prix:+form.prix, montant:+form.qte*+form.prix, date:form.date||today()}, ...data]);
    setShowForm(false);
  };

  return (
    <div>
      <SectionHeader
        title="Service Commercial"
        subtitle="Ventes hebdomadaires & sorties stock"
        actions={canWrite && <Btn onClick={()=>setShowForm(true)}>+ Nouvelle vente</Btn>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard icon="💵" label="CA semaine" value={`${fmt(totalCA)}`} sub="FCFA" accent />
        <KpiCard icon="📋" label="Opérations" value={data.length} />
        <KpiCard icon="⏳" label="En crédit" value={nCredit} alert={nCredit > 3} sub="opérations" />
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
        <DataTable columns={cols} data={data} />
        <div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"flex-end" }}>
          <span style={{ fontSize:13, color:T.textMuted }}>TOTAL CA : <strong style={{color:T.gold}}>{fmt(totalCA)} FCFA</strong></span>
        </div>
      </div>

      {showForm && (
        <Modal title="Nouvelle vente" onClose={()=>setShowForm(false)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Date" type="date" value={form.date} onChange={v=>setForm({...form,date:v})} />
            <Select label="Entité" value={form.entite} onChange={v=>setForm({...form,entite:v})}
              options={["ANGE","KOLO","Interne","CAPI"].map(v=>({value:v,label:v}))} />
            <Input label="Client" value={form.client} onChange={v=>setForm({...form,client:v})} />
            <Input label="Désignation" value={form.designation} onChange={v=>setForm({...form,designation:v})} />
            <Input label="Quantité (kg)" type="number" value={form.qte} onChange={v=>setForm({...form,qte:v})} />
            <Input label="Prix de vente (FCFA/kg)" type="number" value={form.prix} onChange={v=>setForm({...form,prix:v})} />
            <Select label="Statut" value={form.statut} onChange={v=>setForm({...form,statut:v})}
              options={[{value:"CASH",label:"CASH"},{value:"CREDIT",label:"CRÉDIT"}]} />
            {form.qte && form.prix && (
              <div style={{ background:T.surfaceHigh, borderRadius:8, padding:"10px 14px" }}>
                <div style={{fontSize:11,color:T.textDim}}>MONTANT</div>
                <div style={{fontSize:20,fontWeight:800,color:T.gold}}>{fmt(+form.qte * +form.prix)} FCFA</div>
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:16 }}>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Annuler</Btn>
            <Btn onClick={handleAdd} disabled={!form.client||!form.qte}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── INVENTAIRE STOCK ─────────────────────────────────────────────────────────
function Inventaire({ user }) {
  const totalValeur = STOCK_DATA.reduce((s,r)=>s+r.valeur,0);
  const cols = [
    { key:"produit", label:"Produit" },
    { key:"unite", label:"Unité" },
    { key:"stock", label:"Stock final", render:(v,r) => <span style={{color:r.statut==="epuise"?T.red:r.statut==="alerte"?T.gold:T.accent, fontWeight:700}}>{fmt(v)}</span> },
    { key:"prix", label:"Prix vente", render:v=>`${fmt(v)} F` },
    { key:"valeur", label:"Valeur (FCFA)", render:v=><span style={{color:T.gold}}>{fmt(v)}</span> },
    { key:"seuil", label:"Seuil alerte" },
    { key:"statut", label:"Statut", render:v=><Badge variant={v}>{v==="ok"?"✓ OK":v==="alerte"?"⚠ ALERTE":"ÉPUISÉ"}</Badge> },
  ];

  return (
    <div>
      <SectionHeader
        title="Inventaire Stock"
        subtitle={`Produits finis · Valeur totale : ${fmt(totalValeur)} FCFA`}
      />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard icon="📦" label="Produits suivis" value={STOCK_DATA.length} />
        <KpiCard icon="✅" label="En stock normal" value={STOCK_DATA.filter(s=>s.statut==="ok").length} accent />
        <KpiCard icon="⚠" label="En alerte" value={STOCK_DATA.filter(s=>s.statut==="alerte").length} alert />
        <KpiCard icon="🔴" label="Épuisés" value={STOCK_DATA.filter(s=>s.statut==="epuise").length} />
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
        <DataTable columns={cols} data={STOCK_DATA} />
        <div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"flex-end" }}>
          <span style={{ fontSize:13, color:T.textMuted }}>VALEUR TOTALE STOCK : <strong style={{color:T.gold}}>{fmt(totalValeur)} FCFA</strong></span>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function Admin({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState(
    Object.entries(CODES).map(([code, u]) => ({ code, ...u, actif: true }))
  );
  const [form, setForm] = useState({ nom:"", role:"agent_saisie", entite:"", code:"" });

  const genCode = () => {
    let c;
    do { c = String(Math.floor(100000 + Math.random() * 900000)); }
    while (users.some(u => u.code === c));
    return c;
  };

  const handleAdd = () => {
    const code = form.code || genCode();
    setUsers([...users, { ...form, code, actif: true }]);
    setShowForm(false);
    setForm({ nom:"", role:"agent_saisie", entite:"", code:"" });
  };

  const toggleActif = (code) => {
    setUsers(users.map(u => u.code === code ? {...u, actif: !u.actif} : u));
  };

  return (
    <div>
      <SectionHeader
        title="Gestion des accès"
        subtitle="Codes collaborateurs & rôles"
        actions={<Btn onClick={()=>setShowForm(true)}>+ Nouveau collaborateur</Btn>}
      />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
        {users.map((u, i) => (
          <div key={i} style={{
            background: T.surface, border:`1px solid ${u.actif ? T.border : T.redDim}`,
            borderRadius:12, padding:20, opacity: u.actif ? 1 : 0.6,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{u.nom}</div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{u.entite}</div>
              </div>
              <Badge variant={u.role}>{ROLE_LABELS[u.role]}</Badge>
            </div>
            <div style={{
              background:T.surfaceHigh, borderRadius:8, padding:"10px 14px",
              display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12,
            }}>
              <span style={{ fontSize:12, color:T.textDim }}>Code d'accès</span>
              <span style={{ fontSize:20, fontWeight:900, letterSpacing:"0.15em", color:T.accent, fontVariantNumeric:"tabular-nums" }}>
                {u.code}
              </span>
            </div>
            {u.code !== user.code && (
              <Btn variant={u.actif ? "danger" : "secondary"} small onClick={()=>toggleActif(u.code)}>
                {u.actif ? "Désactiver" : "Réactiver"}
              </Btn>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title="Nouveau collaborateur" onClose={()=>setShowForm(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Input label="Nom complet" value={form.nom} onChange={v=>setForm({...form,nom:v})} placeholder="Ex: KONE IBRAHIM" />
            <Select label="Rôle" value={form.role} onChange={v=>setForm({...form,role:v})}
              options={Object.entries(ROLE_LABELS).map(([v,l])=>({value:v,label:l}))} />
            <Input label="Entité / Service" value={form.entite} onChange={v=>setForm({...form,entite:v})} placeholder="Ex: CAPI, Trieuse…" />
            <div>
              <Input label="Code personnalisé (vide = généré automatiquement)" value={form.code} onChange={v=>setForm({...form,code:v.replace(/\D/,"").slice(0,6)})} placeholder="6 chiffres" />
              <p style={{ margin:"6px 0 0", fontSize:12, color:T.textDim }}>Laissez vide pour générer un code aléatoire.</p>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:8 }}>
              <Btn variant="secondary" onClick={()=>setShowForm(false)}>Annuler</Btn>
              <Btn onClick={handleAdd} disabled={!form.nom}>Créer l'accès</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── LAYOUT PRINCIPAL ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"dashboard",   icon:"📊", label:"Tableau de bord" },
  { id:"entre_paddy", icon:"📦", label:"Entrée Paddy" },
  { id:"usinage",     icon:"⚙️",  label:"Usinage" },
  { id:"trieuse",     icon:"🔍", label:"Trieuse Optique" },
  { id:"commercial",  icon:"💵", label:"Commercial" },
  { id:"inventaire",  icon:"🗃", label:"Inventaire Stock" },
  { id:"admin",       icon:"🔐", label:"Gestion Accès" },
];

function AppLayout({ user, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const allowed = PERMISSIONS[user.role] || [];

  const visibleNav = NAV_ITEMS.filter(n => allowed.includes(n.id));

  const renderPage = () => {
    switch(active) {
      case "dashboard":   return <Dashboard user={user} />;
      case "entre_paddy": return <EntreePaddy user={user} />;
      case "usinage":     return <Usinage user={user} />;
      case "trieuse":     return <TrieuseOptique user={user} />;
      case "commercial":  return <Commercial user={user} />;
      case "inventaire":  return <Inventaire user={user} />;
      case "admin":       return <Admin user={user} />;
      default:            return <Dashboard user={user} />;
    }
  };

  return (
    <div style={{
      display:"flex", minHeight:"100vh", background:T.bg,
      fontFamily:"'IBM Plex Sans', system-ui, sans-serif", color:T.text,
    }}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:90 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{
        width:240, background:T.surface, borderRight:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column", flexShrink:0,
        position:"fixed", top:0, left:0, bottom:0, zIndex:100,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition:"transform 0.25s ease",
      }}>
        {/* Logo */}
        <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:24 }}>🌾</div>
            <div>
              <div style={{ fontSize:15, fontWeight:900, color:T.text, letterSpacing:"-0.02em" }}>RIZERIE</div>
              <div style={{ fontSize:11, color:T.textDim, letterSpacing:"0.08em", textTransform:"uppercase" }}>Suivi Opérations</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto" }}>
          {visibleNav.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"10px 12px", borderRadius:8, border:"none", cursor:"pointer",
                background: active === item.id ? T.accentDim : "transparent",
                color: active === item.id ? T.accent : T.textMuted,
                fontSize:14, fontWeight: active===item.id ? 700 : 500,
                fontFamily:"inherit", textAlign:"left", marginBottom:2,
                transition:"all 0.15s",
              }}
            >
              <span style={{ fontSize:16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding:"16px 20px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{user.nom}</div>
            <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>{user.entite}</div>
            <div style={{ marginTop:6 }}><Badge variant={user.role}>{ROLE_LABELS[user.role]}</Badge></div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background:"transparent", border:`1px solid ${T.border}`,
              borderRadius:7, padding:"7px 14px", color:T.textMuted,
              fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600, width:"100%",
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", marginLeft:0 }}>
        {/* Topbar */}
        <header style={{
          height:60, background:T.surface, borderBottom:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", padding:"0 24px",
          position:"sticky", top:0, zIndex:50, gap:16,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background:"none", border:`1px solid ${T.border}`, borderRadius:8,
              padding:"6px 10px", color:T.text, cursor:"pointer", fontSize:18, lineHeight:1,
            }}
          >
            ☰
          </button>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:15, fontWeight:700, color:T.text }}>
              {NAV_ITEMS.find(n => n.id === active)?.label}
            </span>
          </div>
          <div style={{ fontSize:12, color:T.textDim }}>{today()}</div>
          <div style={{
            background:T.accentDim, width:32, height:32, borderRadius:8,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:800, color:T.accent,
          }}>
            {user.nom.charAt(0)}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding:"28px 28px", overflowY:"auto", maxWidth:1280 }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);

  return user
    ? <AppLayout user={user} onLogout={() => setUser(null)} />
    : <LoginScreen onLogin={setUser} />;
}
