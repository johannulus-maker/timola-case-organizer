import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  Filter,
  FolderOpen,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Scale,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";

type CaseItem = {
  id: string;
  title: string;
  type: string;
  authority: string;
  reference: string;
  received: string;
  deadline: string;
  status: "active" | "waiting" | "done";
  impact: string;
  note: string;
  purpose: string;
  facts: string;
  evidence: string;
  goal: string;
  limitations: string;
  workflowStatus: "draft" | "in_review" | "admin_review" | "approved";
  round: number;
  openObjections: number;
  createdAt: string;
};

const STORAGE_KEY = "timola-case-organizer-v1";
const emptyForm = {
  title: "",
  type: "Exekuční řízení",
  authority: "",
  reference: "",
  received: "",
  deadline: "",
  status: "active" as CaseItem["status"],
  impact: "",
  note: "",
  purpose: "",
  facts: "",
  evidence: "",
  goal: "",
  limitations: "",
  workflowStatus: "draft" as CaseItem["workflowStatus"],
  round: 0,
  openObjections: 0,
};

const starterCases: CaseItem[] = [
  {
    id: "demo-1",
    title: "Ukázkový případ – doplňte své údaje",
    type: "Jiné",
    authority: "",
    reference: "",
    received: "",
    deadline: "",
    status: "active",
    impact: "",
    note: "Toto je pouze ukázková karta. Můžete ji smazat a začít zadávat vlastní věci.",
    purpose: "",
    facts: "",
    evidence: "",
    goal: "",
    limitations: "",
    workflowStatus: "draft",
    round: 0,
    openObjections: 0,
    createdAt: new Date().toISOString(),
  },
];

const templates = [
  { title: "Žádost o vysvětlení", text: "Žádám o sdělení, zda byl při posouzení mé věci použit automatizovaný nebo digitálně podporovaný postup, a o vysvětlení jeho účelu, právního základu, použitých dat a možnosti lidského přezkoumání." },
  { title: "Žádost o opravu údajů", text: "Namítám možnou nepřesnost nebo neúplnost údaje uvedeného v dokumentu. Žádám o jeho ověření člověkem, opravu nebo označení jako sporného a o sdělení výsledku přezkoumání." },
  { title: "Kumulativní dopad", text: "Upozorňuji, že vůči mé osobě současně působí více řízení nebo zásahů. Žádám o posouzení jejich celkového dopadu a o sdělení méně zatěžujícího zákonného postupu, pokud existuje." },
];

function daysUntil(date: string) {
  if (!date) return null;
  const target = new Date(`${date}T23:59:59`);
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

function formatDate(date: string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function statusLabel(status: CaseItem["status"]) {
  return status === "active" ? "Aktivní" : status === "waiting" ? "Čeká se" : "Uzavřeno";
}

function AppMark() {
  return <div className="app-mark"><ShieldCheck size={20} strokeWidth={2.5} /></div>;
}

export default function Home() {
  const [items, setItems] = useState<CaseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : starterCases;
    } catch { return starterCases; }
  });
  const [activeView, setActiveView] = useState("overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | CaseItem["status"]>("all");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<CaseItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mobileNav, setMobileNav] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.title} ${item.authority} ${item.reference} ${item.type}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "all" || item.status === filter);
  }), [items, query, filter]);

  const deadlines = items.filter((item) => item.status !== "done" && item.deadline && (daysUntil(item.deadline) ?? 999) <= 30).sort((a, b) => (daysUntil(a.deadline) ?? 0) - (daysUntil(b.deadline) ?? 0));
  const activeCount = items.filter((item) => item.status === "active").length;
  const dueSoon = items.filter((item) => item.status !== "done" && (daysUntil(item.deadline) ?? 999) <= 14).length;

  function openNew() { setForm(emptyForm); setSelected(null); setShowForm(true); }
  function openEdit(item: CaseItem) { setForm(item); setSelected(item); setShowForm(true); }
  function saveCase(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Doplňte název nebo stručný popis."); return; }
    const record: CaseItem = { ...form, id: selected?.id ?? crypto.randomUUID(), createdAt: selected?.createdAt ?? new Date().toISOString() };
    setItems((current) => selected ? current.map((item) => item.id === selected.id ? record : item) : [record, ...current]);
    setShowForm(false); toast.success(selected ? "Záznam byl upraven." : "Záznam byl uložen.");
  }
  function deleteCase(id: string) { setItems((current) => current.filter((item) => item.id !== id)); setSelected(null); toast.success("Záznam byl odstraněn."); }
  function exportData() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "timola-zaznamy.json"; link.click(); URL.revokeObjectURL(link.href); toast.success("Záloha byla stažena.");
  }
  function importData(file?: File) {
    if (!file) return;
    const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)); if (!Array.isArray(parsed)) throw new Error(); setItems(parsed); toast.success("Záloha byla načtena."); } catch { toast.error("Soubor nemá správný formát."); } }; reader.readAsText(file);
  }

  const nav = [
    { id: "overview", label: "Přehled", icon: LayoutDashboard },
    { id: "cases", label: "Moje věci", icon: FolderOpen },
    { id: "deadlines", label: "Lhůty", icon: CalendarClock, count: deadlines.length },
    { id: "templates", label: "Pracovní šablony", icon: ClipboardList },
  ];

  return <div className="shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand"><AppMark /><div><strong>timola</strong><span>osobní organizér</span></div><button className="icon-button close-mobile" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
      <div className="workspace-label">MOJE PRACOVNÍ MÍSTO</div>
      <nav>{nav.map(({ id, label, icon: Icon, count }) => <button key={id} className={`nav-item ${activeView === id ? "active" : ""}`} onClick={() => { setActiveView(id); setMobileNav(false); }}><Icon size={18} /><span>{label}</span>{count ? <em>{count}</em> : null}</button>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-note"><ShieldCheck size={17} /><div><strong>Soukromé ve vašem zařízení</strong><p>Data se ukládají pouze v tomto prohlížeči.</p></div></div><button className="nav-item" onClick={toggleTheme}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}<span>{theme === "dark" ? "Světlý režim" : "Tmavý režim"}</span></button><button className="nav-item" onClick={exportData}><ArrowDownToLine size={18} /><span>Stáhnout zálohu</span></button><button className="nav-item" onClick={() => importRef.current?.click()}><ArrowUpFromLine size={18} /><span>Nahrát zálohu</span></button><input ref={importRef} hidden type="file" accept="application/json" onChange={(e) => importData(e.target.files?.[0])} /></div>
    </aside>
    {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)} />}
    <main className="main"><header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="crumb"><span>Pracovní místo</span><ChevronRight size={14} /><strong>{nav.find((item) => item.id === activeView)?.label}</strong></div><button className="primary-button top-add" onClick={openNew}><Plus size={17} /> Přidat záznam</button></header>
      <div className="content">
        {activeView === "overview" && <>
          <section className="welcome"><div><p className="eyebrow"><Sparkles size={15} /> Vaše věci na jednom místě</p><h1>Dobrý den. Mějte v tom jasno.</h1><p className="intro">Jednoduše si zapisujte řízení, dokumenty a důležité lhůty. Bez složitostí a bez posílání dat někam ven.</p></div><button className="secondary-button" onClick={() => setActiveView("cases")}>Zobrazit všechny věci <ChevronRight size={16} /></button></section>
          <section className="stats"><div className="stat-card"><div className="stat-icon purple"><FolderOpen size={19} /></div><span>Celkem záznamů</span><strong>{items.length}</strong><small>ve vašem pracovním místě</small></div><div className="stat-card"><div className="stat-icon blue"><CalendarClock size={19} /></div><span>Aktivní věci</span><strong>{activeCount}</strong><small>čekají na další krok</small></div><div className="stat-card warn"><div className="stat-icon amber"><CalendarClock size={19} /></div><span>Lhůty do 14 dnů</span><strong>{dueSoon}</strong><small>{dueSoon ? "zkontrolujte co nejdříve" : "zatím nic naléhavého"}</small></div></section>
          <section className="dashboard-grid"><div className="panel recent"><div className="panel-heading"><div><p className="eyebrow">PRACOVNÍ PŘEHLED</p><h2>Poslední záznamy</h2></div><button className="text-button" onClick={() => setActiveView("cases")}>Všechny <ChevronRight size={15} /></button></div>{items.length ? <div className="case-list">{items.slice(0, 4).map((item) => <CaseRow key={item.id} item={item} onClick={() => openEdit(item)} />)}</div> : <EmptyState onClick={openNew} />}</div><div className="panel next"><div className="panel-heading"><div><p className="eyebrow">NEJBLIŽŠÍ KROKY</p><h2>Lhůty a termíny</h2></div><CalendarClock size={19} className="muted-icon" /></div>{deadlines.length ? <div className="deadline-list">{deadlines.slice(0, 3).map((item) => <button key={item.id} className="deadline-row" onClick={() => openEdit(item)}><span className={`date-box ${(daysUntil(item.deadline) ?? 99) <= 7 ? "urgent" : ""}`}>{new Date(`${item.deadline}T12:00:00`).getDate()}<small>{new Intl.DateTimeFormat("cs-CZ", { month: "short" }).format(new Date(`${item.deadline}T12:00:00`))}</small></span><span><strong>{item.title}</strong><small>{daysUntil(item.deadline) === 0 ? "Dnes" : `Za ${daysUntil(item.deadline)} dní`}</small></span><ChevronRight size={16} /></button>)}</div> : <div className="empty-small"><CalendarClock size={25} /><span>Nemáte zadané blížící se lhůty.</span></div>}</div></section>
        </>}
        {activeView === "cases" && <ListView items={filtered} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} openNew={openNew} openEdit={openEdit} deleteCase={deleteCase} />}
        {activeView === "deadlines" && <DeadlineView items={deadlines} openEdit={openEdit} />}
        {activeView === "templates" && <TemplateView />}
      </div>
    </main>
    {showForm && <div className="modal-backdrop"><div className="modal"><div className="modal-header"><div><p className="eyebrow">{selected ? "UPRAVIT ZÁZNAM" : "NOVÝ ZÁZNAM"}</p><h2>{selected ? "Upravit věc" : "Přidat vlastní věc"}</h2></div><button className="icon-button" onClick={() => setShowForm(false)}><X size={19} /></button></div><form onSubmit={saveCase}><label>Název nebo stručný popis<input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="např. Výzva k úhradě…" /></label><div className="two-col"><label>Typ<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Exekuční řízení</option><option>Soudní řízení</option><option>Rozhodčí řízení</option><option>Správní řízení</option><option>Blokace / zásah</option><option>Jiné</option></select></label><label>Stav<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CaseItem["status"] })}><option value="active">Aktivní</option><option value="waiting">Čeká se</option><option value="done">Uzavřeno</option></select></label></div><div className="two-col"><label>Orgán / osoba<input value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })} placeholder="např. soud, úřad…" /></label><label>Spisová značka<input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="např. 123 EX 456/26" /></label></div><div className="two-col"><label>Datum doručení<input type="date" value={form.received} onChange={(e) => setForm({ ...form, received: e.target.value })} /></label><label>Další důležitá lhůta<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label></div><div className="workflow-form-note"><Scale size={16} /><span>Pro oponentní postup můžete níže oddělit fakta, podklady, cíl a omezení.</span></div><label>Účel případu<textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Co chcete zjistit nebo připravit?" rows={2} /></label><label>Skutkový stav<textarea value={form.facts} onChange={(e) => setForm({ ...form, facts: e.target.value })} placeholder="Jen ověřitelné skutečnosti, odděleně od domněnek…" rows={2} /></label><label>Podklady a zdroje<textarea value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} placeholder="Dokumenty, odkazy, data doručení…" rows={2} /></label><div className="two-col"><label>Cíl dalšího kroku<input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="např. připravit otázky" /></label><label>Omezení / nejistoty<input value={form.limitations} onChange={(e) => setForm({ ...form, limitations: e.target.value })} placeholder="co zatím nevíte" /></label></div><label>Hrozící nebo skutečný dopad<textarea value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} placeholder="Např. blokace účtu, dopad na bydlení, podnikání…" rows={2} /></label><label>Vlastní poznámka<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Co se stalo, co ověřit, další krok…" rows={3} /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Zrušit</button><button className="primary-button" type="submit"><Check size={17} /> Uložit záznam</button></div></form></div></div>}
  </div>;
}

function CaseRow({ item, onClick }: { item: CaseItem; onClick: () => void }) { const days = daysUntil(item.deadline); return <button className="case-row" onClick={onClick}><div className="case-avatar">{item.type.charAt(0)}</div><div className="case-main"><strong>{item.title}</strong><span>{item.authority || "Bez uvedeného orgánu"} {item.reference && `· ${item.reference}`}</span></div><span className={`status-pill ${item.status}`}>{statusLabel(item.status)}</span><span className={`deadline-mini ${days !== null && days <= 14 && item.status !== "done" ? "urgent-text" : ""}`}>{item.deadline ? formatDate(item.deadline) : "Bez lhůty"}</span><ChevronRight size={16} className="row-arrow" /></button>; }
function EmptyState({ onClick }: { onClick: () => void }) { return <div className="empty-state"><FolderOpen size={30} /><h3>Zatím tu nic není</h3><p>Přidejte první vlastní záznam a začněte si dělat pořádek.</p><button className="primary-button" onClick={onClick}><Plus size={17} /> Přidat první záznam</button></div>; }
function ListView({ items, query, setQuery, filter, setFilter, openNew, openEdit, deleteCase }: { items: CaseItem[]; query: string; setQuery: (v: string) => void; filter: "all" | CaseItem["status"]; setFilter: (v: "all" | CaseItem["status"]) => void; openNew: () => void; openEdit: (i: CaseItem) => void; deleteCase: (id: string) => void }) { return <section className="page-section"><div className="page-heading"><div><p className="eyebrow">VAŠE PRACOVNÍ MÍSTO</p><h1>Moje věci</h1><p>Evidence řízení, dopisů, lhůt a vlastních poznámek.</p></div><button className="primary-button" onClick={openNew}><Plus size={17} /> Přidat záznam</button></div><div className="toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hledat podle názvu, orgánu…" /></div><div className="filter-wrap"><Filter size={16} /><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">Všechny stavy</option><option value="active">Aktivní</option><option value="waiting">Čeká se</option><option value="done">Uzavřeno</option></select></div></div><div className="panel full-list">{items.length ? items.map((item) => <div className="list-item-wrap" key={item.id}><CaseRow item={item} onClick={() => openEdit(item)} /><button className="delete-button" onClick={() => deleteCase(item.id)} title="Smazat"><Trash2 size={15} /></button></div>) : <EmptyState onClick={openNew} />}</div></section>; }
function DeadlineView({ items, openEdit }: { items: CaseItem[]; openEdit: (i: CaseItem) => void }) { return <section className="page-section"><div className="page-heading"><div><p className="eyebrow">TERMÍNY</p><h1>Lhůty a další kroky</h1><p>Seznam nejbližších zadaných lhůt, abyste na nic důležitého nezapomněli.</p></div></div><div className="panel full-list">{items.length ? items.map((item) => <button className="deadline-card" key={item.id} onClick={() => openEdit(item)}><span className={`date-box large ${(daysUntil(item.deadline) ?? 99) <= 7 ? "urgent" : ""}`}>{new Date(`${item.deadline}T12:00:00`).getDate()}<small>{new Intl.DateTimeFormat("cs-CZ", { month: "short" }).format(new Date(`${item.deadline}T12:00:00`))}</small></span><div><strong>{item.title}</strong><p>{item.authority || "Bez uvedeného orgánu"} · {item.type}</p></div><span className={(daysUntil(item.deadline) ?? 99) <= 7 ? "urgent-text" : ""}>{daysUntil(item.deadline) === 0 ? "Dnes" : daysUntil(item.deadline)! < 0 ? `Po termínu ${Math.abs(daysUntil(item.deadline)!)} dní` : `Za ${daysUntil(item.deadline)} dní`}</span><ChevronRight size={17} /></button>) : <div className="empty-state"><CalendarClock size={30} /><h3>Žádné blížící se lhůty</h3><p>Přidejte lhůtu k záznamu, který chcete hlídat.</p></div>}</div></section>; }
function TemplateView() { const [copied, setCopied] = useState(""); return <section className="page-section"><div className="page-heading"><div><p className="eyebrow">PRACOVNÍ VZORY</p><h1>Bezpečné začátky textů</h1><p>Obecné formulace z vašich podkladů. Doplňte fakta a před odesláním ověřte místní právo.</p></div></div><div className="notice"><ShieldCheck size={18} /><span>Tyto vzory nejsou právní radou ani náhradou za advokáta. Samy o sobě nezastavují řízení ani lhůtu.</span></div><div className="template-grid">{templates.map((template) => <div className="template-card" key={template.title}><div className="template-icon"><FileText size={18} /></div><h3>{template.title}</h3><p>{template.text}</p><button className="text-button" onClick={() => { navigator.clipboard?.writeText(template.text); setCopied(template.title); setTimeout(() => setCopied(""), 1600); }}>{copied === template.title ? <><Check size={15} /> Zkopírováno</> : <>Kopírovat text <ArrowDownToLine size={15} /></>}</button></div>)}</div></section>; }

function WorkflowView({ items, openEdit }: { items: CaseItem[]; openEdit: (item: CaseItem) => void }) {
  const active = items.find((item) => item.status === "active") ?? items[0];
  const roles = [
    ["PROPOSER", "Připraví návrh tvrzení", "ON"],
    ["RESEARCHER", "Hledá podklady a zdroje", "ON"],
    ["OPPONENT", "Hledá vady a rozpory", active?.openObjections ? "REQUIRES_HUMAN_CHECK" : "ON"],
    ["EDITOR", "Sestaví další verzi", "ON"],
  ];
  const workflowLabel = active?.workflowStatus === "approved" ? "Schváleno pro další lidský krok" : active?.workflowStatus === "admin_review" ? "Čeká na administrátorskou kontrolu" : active?.workflowStatus === "in_review" ? "Probíhá oponentura" : "Koncept bez spuštěného kola";
  return <section className="page-section"><div className="page-heading"><div><p className="eyebrow"><Scale size={14} /> KONZILIUM · AUDITOVATELNÝ POSTUP</p><h1>Oponentní postup</h1><p>Nejdříve se zmrazí vstup, potom se oddělí tvrzení, podklady a námitky. Žádné automatické podání.</p></div>{active && <button className="secondary-button" onClick={() => openEdit(active)}>Upravit případ <ChevronRight size={16} /></button>}</div>{active ? <><div className="workflow-case-head"><div><span className="eyebrow">AKTIVNÍ PŘÍPAD</span><h2>{active.title}</h2><p>{active.authority || "Bez uvedeného orgánu"} {active.reference && `· ${active.reference}`}</p></div><div className="workflow-status"><span>STAV WORKFLOW</span><strong>{workflowLabel}</strong><small>Snapshot vstupu · verze 1 · kolo {active.round}/25</small></div></div><div className="workflow-grid"><div className="panel workflow-main"><div className="panel-heading"><div><p className="eyebrow">RING</p><h2>Role a kontrola vstupu</h2></div><span className="round-badge">MAX 25 KOL</span></div><div className="role-grid">{roles.map(([name, description, health]) => <div className="role-card" key={name}><div className={`health-dot ${health === "ON" ? "on" : "check"}`} /><div><strong>{name}</strong><small>{description}</small></div><em>{health}</em></div>)}</div><div className="workflow-actions"><button className="primary-button" onClick={() => toast.info("Před spuštěním je potřeba doplnit a zmrazit vstupní snapshot.")}><Check size={16} /> Uložit snapshot a pokračovat</button><button className="secondary-button" onClick={() => toast.info("Oponentura je připravená jako další krok, ale v této lokální verzi není automaticky spouštěna.")}>Spustit další kolo</button></div></div><div className="panel workflow-side"><div className="panel-heading"><div><p className="eyebrow">KONTROLNÍ STAV</p><h2>Co je potřeba hlídat</h2></div></div><div className="check-list"><div><Check size={15} /><span>Oddělit fakta od domněnek</span></div><div><Check size={15} /><span>Uvést zdroje a datum načtení</span></div><div className={active.openObjections ? "needs-check" : ""}><Check size={15} /><span>{active.openObjections ? `${active.openObjections} otevřené námitky` : "Bez otevřeného veta"}</span></div><div><Check size={15} /><span>Lidské rozhodnutí zůstává nutné</span></div></div></div></div><div className="panel workflow-timeline"><div className="panel-heading"><div><p className="eyebrow">ČASOVÁ OSA PŘÍPADU</p><h2>Poslední události</h2></div></div><div className="timeline"><div className="timeline-item latest"><span className="timeline-marker"><Check size={13} /></span><div><strong>Vytvořen pracovní záznam</strong><small>Vstupní data jsou uložena lokálně. Historie se nemaže.</small></div><em>verze 1</em></div><div className="timeline-item"><span className="timeline-marker"><FileText size={13} /></span><div><strong>Argumentační kniha čeká na doplnění</strong><small>{active.evidence || "Doplňte podklady, dokumenty nebo odkazy v detailu případu."}</small></div><em>čeká</em></div></div></div></> : <div className="panel"><EmptyState onClick={() => toast.info("Nejdříve vytvořte vlastní záznam v části Moje věci.")} /></div>}</section>;
}
