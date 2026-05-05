import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

/* ═══════════════════════════════════════════════════════════════
   STORAGE HELPERS — Firebase Firestore
═══════════════════════════════════════════════════════════════ */
const KEYS = {
  EMPLOYEES: "gpmax:employees",
  RECORDS:   "gpmax:records",
  DAILY_CODE:"gpmax:dailycode",
};

/* ═══════════════════════════════════════════════════════════════
   SESSION HELPERS — persiste sessão no sessionStorage
   (evita deslogar ao fazer pull-to-refresh no PWA)
═══════════════════════════════════════════════════════════════ */
const SESSION_KEY = "gpmax:session";

function saveSession(s) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}
function restoreSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

async function save(key, value) {
  try {
    const ref = doc(db, "gpmax", key);
    await setDoc(ref, { value });
  } catch (e) {
    console.error("Firestore save error:", key, e);
    throw e; // re-throw so the caller can show an error
  }
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const ADMINS = {
  Chairman: { password:"03315077",  role:"admin", title:"Chairman" },
  CEO:      { password:"lolic0778", role:"admin", title:"CEO" },
  Agnus:    { password:"A03Maximus",role:"admin", title:"Gerente de GP / RH & DP" },
};

const SECTORS = ["Gestão de Pessoas","Finanças","Logística","Vendas e Atendimento","Marketing"];

const SECTOR_COLOR = {
  "Gestão de Pessoas":    "#4F8EF7",
  "Finanças":             "#F7C44F",
  "Logística":            "#3DFFA0",
  "Vendas e Atendimento": "#FF4F8E",
  "Marketing":            "#C44FF7",
};

// ⚠️ FIX: "break" e "return" são palavras reservadas do JS.
// Renomeados para "intervalo" e "retorno" para evitar erros de runtime.
const CHECKPOINTS = [
  { id:"entry",     label:"Entrada",   time:"07:40", icon:"🟢" },
  { id:"intervalo", label:"Intervalo", time:"09:00", icon:"⏸️" },
  { id:"retorno",   label:"Retorno",   time:"09:20", icon:"🔄" },
  { id:"exit",      label:"Saída",     time:"11:20", icon:"🏁" },
];
const CP_ORDER = ["entry","intervalo","retorno","exit"];

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
function todayDate() {
  return new Date().toLocaleDateString("pt-BR");
}
function genCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join("");
}

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07090F; --s1:#0D1120; --s2:#131929; --s3:#1C2540; --bd:#243050;
  --gold:#E8B84B; --gold2:#FFD97A; --cyan:#2DD4BF; --red:#FF4D6A;
  --green:#22C97A; --blue:#4F8EF7; --txt:#EEF2FF; --muted:#5A6A90;
  --r:10px; --font:'Syne',sans-serif; --mono:'JetBrains Mono',monospace;
}
html,body,#root{height:100%;background:var(--bg);color:var(--txt);font-family:var(--font);}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:var(--s1);}
::-webkit-scrollbar-thumb{background:var(--bd);border-radius:2px;}

/* LOGIN */
.login-root{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(ellipse 80% 60% at 50% 0%,#1a2a50 0%,var(--bg) 70%);padding:20px;}
.login-panel{width:100%;max-width:420px;background:var(--s2);border:1px solid var(--bd);
  border-radius:20px;padding:44px 36px;box-shadow:0 32px 80px rgba(0,0,0,.7);position:relative;overflow:hidden;}
.login-panel::before{content:'';position:absolute;top:-80px;right:-80px;width:220px;height:220px;
  border-radius:50%;background:radial-gradient(circle,rgba(232,184,75,.12) 0%,transparent 70%);pointer-events:none;}
.brand-name{font-size:38px;font-weight:800;letter-spacing:2px;line-height:1;
  background:linear-gradient(135deg,var(--gold),var(--gold2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.brand-sub{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--muted);margin-top:5px;}
.tab-row{display:flex;gap:8px;margin:24px 0;}
.tab-btn{flex:1;padding:10px;border-radius:8px;border:1px solid var(--bd);background:transparent;
  color:var(--muted);font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
.tab-btn.active{background:rgba(232,184,75,.12);border-color:var(--gold);color:var(--gold);}
.tab-btn:hover:not(.active){color:var(--txt);}
.field{margin-bottom:16px;}
.field label{display:block;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:7px;}
.field input,.field select{width:100%;background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);
  padding:12px 14px;color:var(--txt);font-family:var(--font);font-size:14px;outline:none;transition:border-color .2s;}
.field input:focus,.field select:focus{border-color:var(--gold);}
.field input::placeholder{color:var(--muted);}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 20px;border:none;
  border-radius:var(--r);font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.5px;}
.btn-full{width:100%;}
.btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#07090F;}
.btn-gold:hover{opacity:.88;transform:translateY(-1px);}
.btn-ghost{background:var(--s3);border:1px solid var(--bd);color:var(--muted);}
.btn-ghost:hover{border-color:var(--gold);color:var(--gold);}
.btn-red{background:rgba(255,77,106,.15);border:1px solid rgba(255,77,106,.3);color:var(--red);}
.btn-red:hover{background:rgba(255,77,106,.25);}
.btn-sm{padding:8px 14px;font-size:12px;}
.err{color:var(--red);font-size:12px;margin-top:8px;text-align:center;}

/* ADMIN LAYOUT */
.app{display:flex;min-height:100vh;}
.sidebar{width:230px;flex-shrink:0;background:var(--s1);border-right:1px solid var(--bd);
  display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;}
.sb-logo{padding:24px 20px 20px;border-bottom:1px solid var(--bd);}
.sb-user{padding:16px 20px;border-bottom:1px solid var(--bd);}
.sb-role{display:inline-block;background:rgba(232,184,75,.12);border:1px solid rgba(232,184,75,.25);
  border-radius:20px;padding:2px 10px;font-size:9px;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;}
.sb-name{font-size:14px;font-weight:700;}
.sb-title{font-size:11px;color:var(--muted);}
.nav{flex:1;padding:12px 0;overflow-y:auto;}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;
  font-size:13px;font-weight:600;color:var(--muted);transition:all .15s;border-left:3px solid transparent;}
.nav-item:hover{color:var(--txt);background:rgba(255,255,255,.02);}
.nav-item.on{color:var(--gold);border-left-color:var(--gold);background:rgba(232,184,75,.05);}
.nav-icon{font-size:15px;width:18px;text-align:center;}
.sb-bottom{padding:16px 20px;border-top:1px solid var(--bd);}
.main{margin-left:230px;flex:1;padding:28px 32px;min-height:100vh;}
.pg-title{font-size:28px;font-weight:800;letter-spacing:1px;margin-bottom:3px;}
.pg-sub{font-size:12px;color:var(--muted);margin-bottom:24px;}

/* CARDS */
.card{background:var(--s2);border:1px solid var(--bd);border-radius:var(--r);padding:22px;}
.kpi-label{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;}
.kpi-val{font-size:40px;font-weight:800;line-height:1;font-family:var(--mono);}
.kpi-note{font-size:11px;color:var(--muted);margin-top:3px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px;}
.g5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.card-ttl{font-size:13px;font-weight:700;}

/* TABLE */
.tbl-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:9px 12px;text-align:left;border-bottom:1px solid var(--bd);}
td{padding:11px 12px;font-size:13px;border-bottom:1px solid rgba(36,48,80,.5);}
tr:last-child td{border-bottom:none;}
tr:hover td{background:rgba(255,255,255,.015);}
.tag{display:inline-block;border-radius:20px;padding:3px 9px;font-size:10px;font-weight:700;}
.tag-ok{background:rgba(34,201,122,.12);color:var(--green);}
.tag-no{background:rgba(255,77,106,.12);color:var(--red);}

/* BARS */
.bars{display:flex;flex-direction:column;gap:11px;}
.bar-row{display:flex;align-items:center;gap:10px;}
.bar-lbl{font-size:11px;color:var(--muted);width:150px;flex-shrink:0;}
.bar-track{flex:1;background:var(--s1);border-radius:3px;height:20px;overflow:hidden;}
.bar-fill{height:100%;border-radius:3px;transition:width .7s ease;display:flex;align-items:center;padding-left:6px;}
.bar-v{font-size:11px;font-weight:700;color:#fff;}
.bar-n{font-size:11px;color:var(--muted);width:36px;text-align:right;}

/* CODE BOX */
.code-box{background:var(--s1);border:2px dashed rgba(232,184,75,.4);border-radius:14px;padding:24px;text-align:center;}
.code-big{font-family:var(--mono);font-size:52px;font-weight:600;letter-spacing:12px;
  background:linear-gradient(135deg,var(--gold),var(--gold2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.1;}
.code-hint{font-size:11px;color:var(--muted);margin-top:8px;letter-spacing:1px;}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px;}
.modal{background:var(--s2);border:1px solid var(--bd);border-radius:16px;padding:32px;width:100%;max-width:460px;}
.modal-ttl{font-size:20px;font-weight:800;color:var(--gold);margin-bottom:22px;}
.flex-end{display:flex;justify-content:flex-end;gap:8px;margin-top:20px;}

/* ALERTS */
.alert{border-radius:var(--r);padding:11px 14px;font-size:12px;margin-bottom:14px;font-weight:600;}
.alert-ok{background:rgba(34,201,122,.1);border:1px solid rgba(34,201,122,.3);color:var(--green);}
.alert-err{background:rgba(255,77,106,.1);border:1px solid rgba(255,77,106,.3);color:var(--red);}
.alert-info{background:rgba(79,142,247,.1);border:1px solid rgba(79,142,247,.3);color:var(--blue);}

/* EMPLOYEE AREA */
.emp-root{min-height:100vh;background:var(--bg);display:flex;flex-direction:column;align-items:center;}
.emp-header{width:100%;background:var(--s1);border-bottom:1px solid var(--bd);
  padding:14px 20px;display:flex;align-items:center;justify-content:space-between;}
.emp-header .brand-name{font-size:22px;}
.emp-body{width:100%;max-width:440px;padding:24px 16px;}

.welcome-card{background:linear-gradient(135deg,var(--s2) 0%,var(--s3) 100%);
  border:1px solid var(--bd);border-radius:16px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden;}
.welcome-card::after{content:'';position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;
  background:radial-gradient(circle,rgba(232,184,75,.08) 0%,transparent 70%);}
.welcome-hey{font-size:12px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;}
.welcome-name{font-size:26px;font-weight:800;margin:3px 0;}
.welcome-sector{display:inline-flex;align-items:center;gap:6px;background:var(--s1);border:1px solid var(--bd);
  border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;margin-top:6px;}
.sector-dot{width:8px;height:8px;border-radius:50%;}

.clock-wrap{text-align:center;margin-bottom:20px;}
.big-clock{font-family:var(--mono);font-size:56px;font-weight:600;
  background:linear-gradient(135deg,var(--gold),var(--gold2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;}
.date-line{font-size:12px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-top:4px;}

.cp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}
.cp-card{background:var(--s2);border:1px solid var(--bd);border-radius:14px;padding:18px 14px;
  cursor:pointer;transition:all .2s;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;}
.cp-card:hover:not(.cp-done):not(.cp-locked){border-color:var(--gold);background:rgba(232,184,75,.06);transform:translateY(-2px);}
.cp-card.cp-sel{border-color:var(--gold);background:rgba(232,184,75,.1);box-shadow:0 0 0 3px rgba(232,184,75,.15);}
.cp-card.cp-done{border-color:var(--green);background:rgba(34,201,122,.05);cursor:default;}
.cp-card.cp-locked{opacity:.3;cursor:not-allowed;}
.cp-emoji{font-size:26px;}
.cp-name{font-size:13px;font-weight:700;}
.cp-sched{font-size:10px;color:var(--muted);font-family:var(--mono);}
.cp-stamp{font-size:11px;color:var(--green);font-family:var(--mono);font-weight:600;}
.cp-done-badge{position:absolute;top:8px;right:8px;width:16px;height:16px;border-radius:50%;
  background:var(--green);display:flex;align-items:center;justify-content:center;font-size:9px;color:#07090F;font-weight:800;}

.code-input-area{background:var(--s2);border:1px solid var(--bd);border-radius:14px;padding:22px;text-align:center;margin-bottom:16px;}
.code-lbl{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;}
.code-field{width:100%;background:var(--s1);border:2px solid var(--bd);border-radius:var(--r);padding:14px;
  font-family:var(--mono);font-size:32px;font-weight:600;letter-spacing:10px;color:var(--gold);
  text-align:center;outline:none;transition:border-color .2s;text-transform:uppercase;}
.code-field:focus{border-color:var(--gold);}

.tl{display:flex;flex-direction:column;}
.tl-item{display:flex;gap:14px;padding:10px 0;position:relative;}
.tl-item:not(:last-child)::before{content:'';position:absolute;left:10px;top:30px;bottom:-10px;width:2px;background:var(--bd);}
.tl-dot{width:22px;height:22px;border-radius:50%;flex-shrink:0;border:2px solid var(--bd);
  background:var(--s1);display:flex;align-items:center;justify-content:center;font-size:9px;margin-top:2px;}
.tl-dot.tl-ok{border-color:var(--green);background:rgba(34,201,122,.18);}
.tl-info{flex:1;}
.tl-name{font-size:13px;font-weight:700;}
.tl-time{font-size:12px;color:var(--gold);font-family:var(--mono);}
.tl-pend{font-size:11px;color:var(--muted);}

.pill{display:inline-block;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700;}
.flex{display:flex;} .fxc{align-items:center;} .fxb{justify-content:space-between;}
.gap2{gap:8px;} .gap3{gap:12px;}
.mb2{margin-bottom:8px;} .mb3{margin-bottom:12px;} .mb4{margin-bottom:16px;} .mb6{margin-bottom:24px;}
.mt2{margin-top:8px;} .mt3{margin-top:12px;} .mt4{margin-top:16px;}
.divider{height:1px;background:var(--bd);margin:16px 0;}
.txt-gold{color:var(--gold);} .txt-green{color:var(--green);} .txt-red{color:var(--red);}
.txt-muted{color:var(--muted);font-size:12px;} .txt-center{text-align:center;} .w-full{width:100%;}

@media(max-width:700px){
  .sidebar{width:100%;position:relative;height:auto;}
  .app{flex-direction:column;}
  .main{margin-left:0;padding:16px;}
  .g4{grid-template-columns:1fr 1fr;} .g2{grid-template-columns:1fr;} .g5{grid-template-columns:repeat(3,1fr);}
  .nav{display:flex;flex-direction:row;overflow-x:auto;padding:0;}
  .nav-item{padding:10px 14px;border-left:none;border-bottom:3px solid transparent;white-space:nowrap;}
  .nav-item.on{border-bottom-color:var(--gold);border-left-color:transparent;}
  .sb-bottom{display:none;}
}
@keyframes pop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
.pop{animation:pop .3s ease forwards;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fadeUp{animation:fadeUp .4s ease forwards;}
`;

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [session,   setSession]   = useState(()=>restoreSession()); // ← restaura sessão ao recarregar
  const [employees, setEmployees] = useState([]);
  const [records,   setRecords]   = useState([]);
  const [dailyCode, setDailyCode] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [loadErr,   setLoadErr]   = useState(false);

  /* ── Tempo real: onSnapshot nos 3 documentos ─────────────────
     Cada listener fica ativo enquanto o app estiver aberto e
     atualiza o estado automaticamente quando outro usuário salva. */
  useEffect(()=>{
    let resolved = 0;
    const total  = 3;
    let errored  = false;

    const check = () => { if(++resolved === total && !errored) setLoading(false); };

    const unsub = [
      onSnapshot(
        doc(db, "gpmax", KEYS.EMPLOYEES),
        snap => { if(snap.exists()) setEmployees(snap.data().value); check(); },
        err  => { console.error("onSnapshot employees:", err); errored=true; setLoadErr(true); setLoading(false); }
      ),
      onSnapshot(
        doc(db, "gpmax", KEYS.RECORDS),
        snap => { if(snap.exists()) setRecords(snap.data().value); check(); },
        err  => { console.error("onSnapshot records:", err); errored=true; setLoadErr(true); setLoading(false); }
      ),
      onSnapshot(
        doc(db, "gpmax", KEYS.DAILY_CODE),
        snap => { if(snap.exists()) setDailyCode(snap.data().value); check(); },
        err  => { console.error("onSnapshot dailycode:", err); errored=true; setLoadErr(true); setLoading(false); }
      ),
    ];

    return () => unsub.forEach(u => u()); // cancela listeners ao desmontar
  },[]);

  // ⚠️ FIX: useCallback com deps corretas para evitar closures stale
  const saveEmp = useCallback(async d=>{
    setEmployees(d);
    await save(KEYS.EMPLOYEES, d);
  },[]); // sem deps pois usa apenas setters estáveis e a constante KEYS

  const saveRec = useCallback(async d=>{
    setRecords(d);
    await save(KEYS.RECORDS, d);
  },[]);

  const saveDC = useCallback(async d=>{
    setDailyCode(d);
    await save(KEYS.DAILY_CODE, d);
  },[]);

  const handleLogin = useCallback(s=>{
    saveSession(s);
    setSession(s);
  },[]);

  const handleLogout = useCallback(()=>{
    clearSession();
    setSession(null);
  },[]);

  if(loading) return(
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
        color:"var(--gold)",fontFamily:"'JetBrains Mono',monospace",fontSize:18,letterSpacing:4}}>
        CARREGANDO...
      </div>
    </>
  );

  if(loadErr) return(
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",gap:16,padding:24,textAlign:"center"}}>
        <div style={{fontSize:40}}>⚠️</div>
        <div style={{color:"var(--red)",fontSize:18,fontWeight:700}}>Erro de conexão com Firebase</div>
        <div style={{color:"var(--muted)",fontSize:13,maxWidth:360}}>
          Verifique se as credenciais em <code style={{color:"var(--gold)"}}>src/firebase.js</code> estão corretas
          e se as regras do Firestore permitem leitura e escrita.
        </div>
        <button className="btn btn-gold" onClick={()=>window.location.reload()}>
          🔄 Tentar novamente
        </button>
      </div>
    </>
  );

  return(
    <>
      <style>{CSS}</style>
      {!session
        ? <LoginScreen employees={employees} onLogin={handleLogin}/>
        : session.role==="admin"
          ? <AdminArea session={session} onLogout={handleLogout}
              employees={employees} records={records} dailyCode={dailyCode}
              saveEmp={saveEmp} saveRec={saveRec} saveDC={saveDC}/>
          : <EmployeeArea session={session} onLogout={handleLogout}
              records={records} dailyCode={dailyCode} saveRec={saveRec}/>
      }
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN — 2 abas: Gestor | Colaborador
═══════════════════════════════════════════════════════════════ */
function LoginScreen({employees, onLogin}){
  const [tab,  setTab]  = useState("admin");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [email,setEmail]= useState("");
  const [err,  setErr]  = useState("");

  // ── PWA Install prompt ──────────────────────────────────────
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showIOSHint,    setShowIOSHint]    = useState(false);

  useEffect(()=>{
    // Android/Chrome: captura o evento antes de suprimir
    const handler = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true); };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: detecta se ainda não está instalado em standalone
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    if(isIOS && !isStandalone) setShowIOSHint(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  },[]);

  const handleInstall = async () => {
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if(outcome === "accepted") setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const login = ()=>{
    setErr("");
    if(tab==="admin"){
      const u = ADMINS[user];
      if(u && u.password===pass){ onLogin({login:user,...u}); return; }
      setErr("Login ou senha incorretos.");
    } else {
      const emp = employees.find(e=>e.email.toLowerCase()===email.toLowerCase().trim());
      if(!emp){ setErr("E-mail não encontrado. Verifique com o gestor."); return; }
      onLogin({login:emp.name, role:"employee", empId:emp.id, emp});
    }
  };

  return(
    <div className="login-root">
      <div className="login-panel">
        <div style={{textAlign:"center",marginBottom:8}}>
          <img src="/logo-login.png" alt="RH Maximus" style={{width:200,height:"auto"}}/>
        </div>

        <div className="tab-row">
          <button className={`tab-btn${tab==="admin"?" active":""}`} onClick={()=>{setTab("admin");setErr("");}}>
            👔 Gestor
          </button>
          <button className={`tab-btn${tab==="employee"?" active":""}`} onClick={()=>{setTab("employee");setErr("");}}>
            🪪 Colaborador
          </button>
        </div>

        {tab==="admin" ? (
          <>
            <div className="field">
              <label>Login</label>
              <input value={user} onChange={e=>{setUser(e.target.value);setErr("");}}
                placeholder="Chairman / CEO / Agnus" onKeyDown={e=>e.key==="Enter"&&login()}/>
            </div>
            <div className="field">
              <label>Senha</label>
              <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
                placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&login()}/>
            </div>
          </>
        ):(
          <div className="field">
            <label>E-mail Corporativo</label>
            <input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}
              placeholder="seuemail@empresa.com" onKeyDown={e=>e.key==="Enter"&&login()}/>
            <div className="txt-muted mt2">Use o e-mail cadastrado pelo seu gestor.</div>
          </div>
        )}

        {err && <div className="err">{err}</div>}
        <button className="btn btn-gold btn-full mt3" onClick={login}>ENTRAR</button>

        {/* Android: botão de instalação nativo */}
        {showInstallBtn && (
          <button className="btn btn-ghost btn-full" style={{marginTop:10}}
            onClick={handleInstall}>
            📲 Instalar App na Tela Inicial
          </button>
        )}

        {/* iOS Safari: instrução manual */}
        {showIOSHint && (
          <div style={{marginTop:14,background:"rgba(79,142,247,.08)",border:"1px solid rgba(79,142,247,.25)",
            borderRadius:10,padding:"12px 14px",fontSize:12,color:"var(--blue)",lineHeight:1.6}}>
            <div style={{fontWeight:700,marginBottom:4}}>📲 Instalar no iPhone / iPad</div>
            Toque em <strong>compartilhar</strong> (□↑) no Safari → <strong>"Adicionar à Tela de Início"</strong> para usar como app sem barra do navegador.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN AREA
═══════════════════════════════════════════════════════════════ */
function AdminArea({session,onLogout,employees,records,dailyCode,saveEmp,saveRec,saveDC}){
  const [page,setPage] = useState("dashboard");
  const nav = [
    {id:"dashboard", icon:"▦",  label:"Dashboard"},
    {id:"employees", icon:"👥", label:"Colaboradores"},
    {id:"attendance",icon:"📋", label:"Frequência"},
    {id:"reports",   icon:"📊", label:"Relatórios"},
  ];
  return(
    <div className="app">
      <nav className="sidebar">
        <div className="sb-logo">
          <img src="/logo-login.png" alt="RH Maximus" style={{width:140,height:"auto"}}/>
        </div>
        <div className="sb-user">
          <div className="sb-role">{session.login}</div>
          <div className="sb-name">{session.title}</div>
        </div>
        <div className="nav">
          {nav.map(n=>(
            <div key={n.id} className={`nav-item${page===n.id?" on":""}`} onClick={()=>setPage(n.id)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </div>
          ))}
        </div>
        <div className="sb-bottom">
          <button className="btn btn-ghost btn-sm w-full" onClick={onLogout}>Sair</button>
        </div>
      </nav>
      <main className="main">
        {page==="dashboard"  && <AdminDashboard  employees={employees} records={records} dailyCode={dailyCode} saveDC={saveDC}/>}
        {page==="employees"  && <AdminEmployees  employees={employees} saveEmp={saveEmp}/>}
        {page==="attendance" && <AdminAttendance employees={employees} records={records} saveRec={saveRec}/>}
        {page==="reports"    && <AdminReports    employees={employees} records={records}/>}
      </main>
    </div>
  );
}

/* ── Dashboard ── */
function AdminDashboard({employees,records,dailyCode,saveDC}){
  const td = todayDate();
  const todayRecs  = records.filter(r=>r.date===td);
  const presentIds = new Set(todayRecs.filter(r=>r.entry).map(r=>r.empId));
  const total=employees.length, present=presentIds.size, absent=total-present;

  const sStats = SECTORS.map(s=>{
    const emps=employees.filter(e=>e.sector===s);
    return{sector:s,total:emps.length,pres:emps.filter(e=>presentIds.has(e.id)).length};
  });

  return(
    <div>
      <div className="pg-title">DASHBOARD</div>
      <div className="pg-sub">{td} — Visão geral em tempo real</div>

      <div className="g4">
        {[
          {l:"Colaboradores",   v:total,   c:"var(--txt)",  n:"cadastrados"},
          {l:"Presentes Hoje",  v:present, c:"var(--green)",n:"check-in feito"},
          {l:"Ausentes Hoje",   v:absent,  c:"var(--red)",  n:"sem registro"},
          {l:"Taxa de Presença",v:`${total?Math.round(present/total*100):0}%`,c:"var(--gold)",n:"hoje"},
        ].map(k=>(
          <div className="card" key={k.l}>
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-val" style={{color:k.c}}>{k.v}</div>
            <div className="kpi-note">{k.n}</div>
          </div>
        ))}
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-head"><span className="card-ttl">Presença por Setor</span></div>
          <div className="bars">
            {sStats.map(s=>(
              <div className="bar-row" key={s.sector}>
                <div className="bar-lbl">{s.sector}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width:`${s.total?s.pres/s.total*100:0}%`,background:SECTOR_COLOR[s.sector]}}>
                    {s.pres>0&&<span className="bar-v">{s.pres}</span>}
                  </div>
                </div>
                <div className="bar-n">{s.total}👤</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-ttl">Código do Dia</span>
            <span className="pill" style={{background:"rgba(79,142,247,.12)",color:"var(--blue)"}}>{td}</span>
          </div>
          {dailyCode?.date===td ? (
            <>
              <div className="code-box">
                <div className="code-hint mb3">EXIBA NA SALA ANTES DO CHECK-IN</div>
                <div className="code-big pop">{dailyCode.code}</div>
                <div className="code-hint mt3">Válido somente hoje</div>
              </div>
              <button className="btn btn-ghost btn-sm mt3" onClick={async()=>saveDC({code:genCode(),date:td})}>
                🔄 Gerar Novo Código
              </button>
            </>
          ):(
            <>
              <p className="txt-muted mb4">Gere o código antes da aula. Os colaboradores precisam dele para o check-in.</p>
              <button className="btn btn-gold btn-full" onClick={async()=>saveDC({code:genCode(),date:td})}>
                ✦ Gerar Código do Dia
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-ttl">Registros de Hoje — Tempo Real</span>
          <span className="pill tag-ok">{todayRecs.length} registros</span>
        </div>
        {todayRecs.length===0
          ? <p className="txt-muted txt-center" style={{padding:"20px 0"}}>Nenhum check-in realizado hoje ainda.</p>
          : <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Colaborador</th><th>Setor</th>
                    <th>Entrada</th><th>Intervalo</th><th>Retorno</th><th>Saída</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRecs.map(r=>{
                    const emp=employees.find(e=>e.id===r.empId);
                    return(
                      <tr key={r.empId}>
                        <td style={{fontWeight:700}}>{emp?.name||"—"}</td>
                        <td><span className="pill" style={{background:`${SECTOR_COLOR[emp?.sector]}18`,color:SECTOR_COLOR[emp?.sector]}}>{emp?.sector}</span></td>
                        <td style={{color:"var(--green)",fontFamily:"var(--mono)",fontSize:12}}>{r.entry||"—"}</td>
                        <td style={{color:"var(--gold)",fontFamily:"var(--mono)",fontSize:12}}>{r.intervalo||"—"}</td>
                        <td style={{color:"var(--blue)",fontFamily:"var(--mono)",fontSize:12}}>{r.retorno||"—"}</td>
                        <td style={{fontFamily:"var(--mono)",fontSize:12}}>{r.exit||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}

/* ── Employees ── */
function AdminEmployees({employees,saveEmp}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({name:"",email:"",sector:SECTORS[0]});
  const [editId,setEditId]=useState(null);
  const [search,setSearch]=useState("");
  const [filterS,setFS]=useState("Todos");
  const [msg,setMsg]=useState(null);

  const filtered=employees.filter(e=>
    (filterS==="Todos"||e.sector===filterS)&&
    (e.name.toLowerCase().includes(search.toLowerCase())||e.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd=()=>{setForm({name:"",email:"",sector:SECTORS[0]});setEditId(null);setModal(true);};
  const openEdit=emp=>{setForm({name:emp.name,email:emp.email,sector:emp.sector});setEditId(emp.id);setModal(true);};

  const handleSave=async()=>{
    if(!form.name.trim()||!form.email.trim()) return;
    const dup=employees.find(e=>e.email.toLowerCase()===form.email.toLowerCase()&&e.id!==editId);
    if(dup){setMsg({t:"err",m:"E-mail já cadastrado."});return;}
    let upd=editId
      ? employees.map(e=>e.id===editId?{...e,...form}:e)
      : [...employees,{id:Date.now().toString(),...form}];
    try {
      await saveEmp(upd);
      setModal(false);
      setMsg({t:"ok",m:editId?"Colaborador atualizado!":"Colaborador cadastrado!"});
      setTimeout(()=>setMsg(null),3000);
    } catch {
      setMsg({t:"err",m:"Erro ao salvar. Verifique a conexão."});
    }
  };

  const handleDel=async id=>{
    try {
      await saveEmp(employees.filter(e=>e.id!==id));
    } catch {
      setMsg({t:"err",m:"Erro ao excluir. Verifique a conexão."});
      setTimeout(()=>setMsg(null),3000);
    }
  };

  return(
    <div>
      <div className="pg-title">COLABORADORES</div>
      <div className="pg-sub">{employees.length} colaboradores cadastrados</div>
      {msg&&<div className={`alert alert-${msg.t==="ok"?"ok":"err"}`}>{msg.m}</div>}

      <div className="g5">
        {SECTORS.map(s=>(
          <div className="card" key={s} style={{padding:"14px 12px"}}>
            <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:SECTOR_COLOR[s],marginBottom:4}}>{s}</div>
            <div style={{fontSize:26,fontWeight:800,fontFamily:"var(--mono)"}}>{employees.filter(e=>e.sector===s).length}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head" style={{flexWrap:"wrap",gap:10}}>
          <div className="flex gap2" style={{flexWrap:"wrap"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
              style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:"var(--r)",
                padding:"8px 12px",color:"var(--txt)",fontSize:13,outline:"none",width:180}}/>
            <select value={filterS} onChange={e=>setFS(e.target.value)}
              style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:"var(--r)",
                padding:"8px 12px",color:"var(--txt)",fontSize:13,outline:"none"}}>
              <option>Todos</option>
              {SECTORS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-gold btn-sm" onClick={openAdd}>+ Novo Colaborador</button>
        </div>

        {filtered.length===0
          ? <p className="txt-muted txt-center" style={{padding:"20px 0"}}>Nenhum colaborador encontrado.</p>
          : <div className="tbl-wrap">
              <table>
                <thead><tr><th>#</th><th>Nome</th><th>E-mail</th><th>Setor</th><th>Ações</th></tr></thead>
                <tbody>
                  {filtered.map((e,i)=>(
                    <tr key={e.id}>
                      <td className="txt-muted">{i+1}</td>
                      <td style={{fontWeight:700}}>{e.name}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{e.email}</td>
                      <td><span className="pill" style={{background:`${SECTOR_COLOR[e.sector]}18`,color:SECTOR_COLOR[e.sector]}}>{e.sector}</span></td>
                      <td><div className="flex gap2">
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(e)}>✎</button>
                        <button className="btn btn-red btn-sm" onClick={()=>handleDel(e.id)}>✕</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {modal&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-ttl">{editId?"EDITAR":"NOVO COLABORADOR"}</div>
            <div className="field"><label>Nome Completo</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nome"/>
            </div>
            <div className="field"><label>E-mail Corporativo</label>
              <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@empresa.com"/>
            </div>
            <div className="field"><label>Setor</label>
              <select value={form.sector} onChange={e=>setForm({...form,sector:e.target.value})}
                style={{width:"100%",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:"var(--r)",
                  padding:"12px 14px",color:"var(--txt)",fontFamily:"var(--font)",fontSize:14,outline:"none"}}>
                {SECTORS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-end">
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-gold btn-sm" onClick={handleSave}>{editId?"Salvar":"Cadastrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Attendance ── */
function AdminAttendance({employees,records,saveRec}){
  const [filterDate,setFD]=useState(todayDate());
  const [filterS,setFS]=useState("Todos");

  const toInputVal = dmy => {
    const p=dmy.split("/"); return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:dmy;
  };
  const fromInput = val => {
    const p=val.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:val;
  };

  const dateRecs=records.filter(r=>r.date===filterDate);
  const presentIds=new Set(dateRecs.filter(r=>r.entry).map(r=>r.empId));
  const filtered=employees.filter(e=>filterS==="Todos"||e.sector===filterS);

  // Permite que admin corrija/limpe um registro manualmente
  const handleClearRecord = async (empId) => {
    const upd = records.filter(r=>!(r.empId===empId && r.date===filterDate));
    try { await saveRec(upd); } catch {}
  };

  return(
    <div>
      <div className="pg-title">FREQUÊNCIA</div>
      <div className="pg-sub">Controle de presenças e ausências</div>
      <div className="flex gap2 mb4" style={{flexWrap:"wrap"}}>
        <input type="date" value={toInputVal(filterDate)} onChange={e=>setFD(fromInput(e.target.value))}
          style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:"var(--r)",
            padding:"8px 12px",color:"var(--txt)",fontSize:13,outline:"none"}}/>
        <select value={filterS} onChange={e=>setFS(e.target.value)}
          style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:"var(--r)",
            padding:"8px 12px",color:"var(--txt)",fontSize:13,outline:"none"}}>
          <option>Todos</option>
          {SECTORS.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="g3 mb4">
        <div className="card"><div className="kpi-label">Presentes</div>
          <div className="kpi-val txt-green">{filtered.filter(e=>presentIds.has(e.id)).length}</div></div>
        <div className="card"><div className="kpi-label">Ausentes</div>
          <div className="kpi-val txt-red">{filtered.filter(e=>!presentIds.has(e.id)).length}</div></div>
        <div className="card"><div className="kpi-label">Taxa</div>
          <div className="kpi-val txt-gold">{filtered.length?Math.round(filtered.filter(e=>presentIds.has(e.id)).length/filtered.length*100):0}%</div></div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th><th>Setor</th><th>Status</th>
                <th>Entrada</th><th>Intervalo</th><th>Retorno</th><th>Saída</th><th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e=>{
                const rec=dateRecs.find(r=>r.empId===e.id);
                const ok=!!rec?.entry;
                return(
                  <tr key={e.id}>
                    <td style={{fontWeight:700}}>{e.name}</td>
                    <td><span className="pill" style={{background:`${SECTOR_COLOR[e.sector]}18`,color:SECTOR_COLOR[e.sector]}}>{e.sector}</span></td>
                    <td><span className={`tag ${ok?"tag-ok":"tag-no"}`}>{ok?"Presente":"Ausente"}</span></td>
                    <td style={{color:"var(--green)",fontFamily:"var(--mono)",fontSize:12}}>{rec?.entry||"—"}</td>
                    <td style={{color:"var(--gold)",fontFamily:"var(--mono)",fontSize:12}}>{rec?.intervalo||"—"}</td>
                    <td style={{color:"var(--blue)",fontFamily:"var(--mono)",fontSize:12}}>{rec?.retorno||"—"}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{rec?.exit||"—"}</td>
                    <td>{rec&&<button className="btn btn-red btn-sm" onClick={()=>handleClearRecord(e.id)}>✕</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Reports ── */
function AdminReports({employees,records}){
  const dates=[...new Set(records.map(r=>r.date))].sort().reverse();
  const sStats=SECTORS.map(s=>{
    const emps=employees.filter(e=>e.sector===s);
    const pres=records.filter(r=>emps.some(e=>e.id===r.empId)&&r.entry).length;
    return{sector:s,emps:emps.length,pres};
  });
  const maxP=Math.max(...sStats.map(s=>s.pres),1);

  return(
    <div>
      <div className="pg-title">RELATÓRIOS</div>
      <div className="pg-sub">Análise consolidada de frequência</div>
      <div className="g2">
        <div className="card">
          <div className="card-head"><span className="card-ttl">Ranking por Setor</span></div>
          <div className="bars">
            {[...sStats].sort((a,b)=>b.pres-a.pres).map(s=>(
              <div className="bar-row" key={s.sector}>
                <div className="bar-lbl">{s.sector}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width:`${(s.pres/maxP)*100}%`,background:SECTOR_COLOR[s.sector]}}>
                    {s.pres>0&&<span className="bar-v">{s.pres}</span>}
                  </div>
                </div>
                <div className="bar-n">{s.emps}👤</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="card-ttl">Histórico por Data</span></div>
          {dates.length===0
            ? <p className="txt-muted">Sem registros ainda.</p>
            : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {dates.slice(0,8).map(d=>{
                  const pres=records.filter(r=>r.date===d&&r.entry).length;
                  return(
                    <div key={d} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                      background:"var(--s1)",borderRadius:"var(--r)",padding:"10px 14px"}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:13}}>{d}</span>
                      <div className="flex gap2">
                        <span className="tag tag-ok">{pres} presentes</span>
                        <span className="tag tag-no">{employees.length-pres} aus.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>
      <div className="card">
        <div className="card-head"><span className="card-ttl">Taxa Individual</span></div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Colaborador</th><th>Setor</th><th>Presenças</th><th>Taxa</th></tr></thead>
            <tbody>
              {employees.map(e=>{
                const pres=records.filter(r=>r.empId===e.id&&r.entry).length;
                const total=dates.length||1;
                const rate=Math.min(100,Math.round(pres/total*100));
                const col=rate>=80?"var(--green)":rate>=50?"var(--gold)":"var(--red)";
                return(
                  <tr key={e.id}>
                    <td style={{fontWeight:700}}>{e.name}</td>
                    <td><span className="pill" style={{background:`${SECTOR_COLOR[e.sector]}18`,color:SECTOR_COLOR[e.sector]}}>{e.sector}</span></td>
                    <td style={{fontFamily:"var(--mono)"}}>{pres}</td>
                    <td>
                      <div className="flex fxc gap2">
                        <div style={{flex:1,height:5,background:"var(--s1)",borderRadius:3}}>
                          <div style={{width:`${rate}%`,height:"100%",borderRadius:3,background:col}}/>
                        </div>
                        <span style={{fontSize:11,color:col,fontFamily:"var(--mono)",width:32}}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPLOYEE AREA — Tela do Colaborador
═══════════════════════════════════════════════════════════════ */
function EmployeeArea({session,onLogout,records,dailyCode,saveRec}){
  const [tick,setTick]   = useState(nowTime());
  const [code,setCode]   = useState("");
  const [selCP,setSelCP] = useState(null);
  const [msg,setMsg]     = useState(null);
  const [saving,setSaving]= useState(false);
  const [showTL,setShowTL]=useState(false);

  const emp = session.emp;
  const td  = todayDate();

  useEffect(()=>{
    const t=setInterval(()=>setTick(nowTime()),1000);
    return()=>clearInterval(t);
  },[]);

  const rec = records.find(r=>r.empId===emp.id&&r.date===td);

  const getStatus = cpId => {
    if(rec?.[cpId]) return "done";
    const idx=CP_ORDER.indexOf(cpId);
    if(idx===0) return "avail";
    if(rec?.[CP_ORDER[idx-1]]) return "avail";
    return "locked";
  };

  const handleCheckin = async()=>{
    if(!selCP||saving) return;
    const todayCode=dailyCode?.date===td?dailyCode.code:null;
    if(!todayCode){
      setMsg({t:"err",m:"Nenhum código disponível hoje. Solicite ao gestor."});
      setTimeout(()=>setMsg(null),4000); return;
    }
    if(code.toUpperCase()!==todayCode){
      setMsg({t:"err",m:"Código incorreto. Verifique com o gestor."});
      setTimeout(()=>setMsg(null),3000); return;
    }
    setSaving(true);
    try {
      const existing=records.find(r=>r.empId===emp.id&&r.date===td);
      const upd=existing
        ? records.map(r=>r.empId===emp.id&&r.date===td?{...r,[selCP]:tick}:r)
        : [...records,{empId:emp.id,date:td,[selCP]:tick}];
      await saveRec(upd);
      const label=CHECKPOINTS.find(c=>c.id===selCP)?.label;
      setMsg({t:"ok",m:`✓ ${label} registrado às ${tick}`});
      setCode(""); setSelCP(null);
      setTimeout(()=>setMsg(null),5000);
    } catch {
      setMsg({t:"err",m:"Erro ao salvar. Verifique sua conexão e tente novamente."});
      setTimeout(()=>setMsg(null),5000);
    } finally {
      setSaving(false);
    }
  };

  const allDone=CP_ORDER.every(id=>rec?.[id]);

  return(
    <div className="emp-root">
      <div className="emp-header">
        <img src="/logo-login.png" alt="RH Maximus" style={{height:36,width:"auto"}}/>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sair</button>
      </div>

      <div className="emp-body fadeUp">
        {/* Boas-vindas */}
        <div className="welcome-card">
          <div className="welcome-hey">Bem-vindo(a),</div>
          <div className="welcome-name">{emp.name}</div>
          <div className="welcome-sector">
            <span className="sector-dot" style={{background:SECTOR_COLOR[emp.sector]}}/>
            {emp.sector}
          </div>
        </div>

        {/* Relógio */}
        <div className="clock-wrap">
          <div className="big-clock">{tick}</div>
          <div className="date-line">{td}</div>
        </div>

        {msg&&<div className={`alert alert-${msg.t==="ok"?"ok":"err"}`}>{msg.m}</div>}

        {allDone ? (
          <div className="alert alert-ok txt-center" style={{fontSize:14,padding:20}}>
            🎉 Todos os registros do dia foram concluídos!
          </div>
        ):(
          <>
            {/* Grade de checkpoints */}
            <div className="cp-grid">
              {CHECKPOINTS.map(cp=>{
                const st=getStatus(cp.id);
                return(
                  <div key={cp.id}
                    className={`cp-card${st==="done"?" cp-done":st==="locked"?" cp-locked":selCP===cp.id?" cp-sel":""}`}
                    onClick={()=>st==="avail"&&setSelCP(selCP===cp.id?null:cp.id)}
                  >
                    {st==="done"&&<div className="cp-done-badge">✓</div>}
                    <div className="cp-emoji">{cp.icon}</div>
                    <div className="cp-name">{cp.label}</div>
                    <div className="cp-sched">{cp.time}</div>
                    {st==="done"&&<div className="cp-stamp">{rec?.[cp.id]}</div>}
                    {st==="avail"&&selCP!==cp.id&&(
                      <div style={{fontSize:9,color:"var(--gold)",letterSpacing:1,textTransform:"uppercase"}}>toque para registrar</div>
                    )}
                    {selCP===cp.id&&(
                      <div style={{fontSize:9,color:"var(--gold)",letterSpacing:1,textTransform:"uppercase"}}>✦ selecionado</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Campo de código */}
            {selCP&&(
              <div className="code-input-area pop">
                <div className="code-lbl">CÓDIGO DO DIA</div>
                <input className="code-field" value={code}
                  onChange={e=>setCode(e.target.value.toUpperCase())}
                  maxLength={6} placeholder="______" autoFocus/>
                <div className="txt-muted mt2 mb3">
                  Digite o código de 6 letras exibido pelo gestor
                </div>
                <button className="btn btn-gold btn-full" onClick={handleCheckin} disabled={saving}>
                  {saving?"SALVANDO...":"CONFIRMAR — "+CHECKPOINTS.find(c=>c.id===selCP)?.label.toUpperCase()}
                </button>
              </div>
            )}
          </>
        )}

        {/* Timeline */}
        <button className="btn btn-ghost btn-sm w-full mt3" style={{marginTop:12}}
          onClick={()=>setShowTL(!showTL)}>
          {showTL?"▲ Ocultar":"▼ Ver"} Meus Registros do Dia
        </button>

        {showTL&&(
          <div className="card fadeUp" style={{marginTop:12}}>
            <div style={{fontWeight:700,marginBottom:14}}>Registros de Hoje</div>
            <div className="tl">
              {CHECKPOINTS.map(cp=>(
                <div className="tl-item" key={cp.id}>
                  <div className={`tl-dot${rec?.[cp.id]?" tl-ok":""}`}>{rec?.[cp.id]?"✓":""}</div>
                  <div className="tl-info">
                    <div className="tl-name">{cp.label}</div>
                    {rec?.[cp.id]
                      ? <div className="tl-time">{rec[cp.id]}</div>
                      : <div className="tl-pend">Previsto: {cp.time}</div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
