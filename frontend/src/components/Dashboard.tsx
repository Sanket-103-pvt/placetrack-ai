"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, Bell, BookOpenCheck, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2,
  CircleUserRound, Command, FileScan, Gauge, GraduationCap, LayoutDashboard, Loader2, LogOut,
  Menu, Moon, Plus, Search, Send, Sparkles, Sun, Target, Trophy, Upload, Users, X
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, demoAccounts, type LoginResponse, type Role, type SessionUser } from "@/lib/api";
import { ApplicationTimeline } from "./ApplicationTimeline";
import { ReadinessRing } from "./ReadinessRing";

type View = "Overview" | "Applications" | "Opportunities" | "Resume AI" | "Aptitude" | "Interview" | "Profile" | "Drive Creator" | "Analytics";

type Drive = {
  id: string;
  company: { name: string; website?: string | null };
  role: string;
  package: number;
  location: string;
  jobType: string;
  deadline: string;
  allowedBranches: string[];
  minCgpa: number;
  eligibility?: { eligible: boolean; score: number; reasons: string[] } | null;
  alreadyApplied?: boolean;
  _count?: { applications: number };
};

type Application = {
  id: string;
  status: string;
  updatedAt: string;
  timeline: unknown;
  drive: Drive;
  interview?: { dateTime: string; mode: string; locationOrLink: string; status: string } | null;
  student?: { name: string; branch: string; cgpa: number; user?: { email: string } };
};

type TestSummary = {
  id: string;
  title: string;
  duration: number;
  _count?: { questions: number; results: number };
};

type DashboardData = Record<string, unknown>;

const statusOptions = ["APPLIED", "SHORTLISTED", "APTITUDE_CLEARED", "TECHNICAL_ROUND", "HR_ROUND", "SELECTED", "REJECTED"];
const navIcons: Record<View, ElementType> = {
  Overview: LayoutDashboard,
  Applications: BriefcaseBusiness,
  Opportunities: Building2,
  "Resume AI": FileScan,
  Aptitude: BookOpenCheck,
  Interview: Sparkles,
  Profile: CircleUserRound,
  "Drive Creator": Plus,
  Analytics: Gauge
};

function readStorage(key: string) {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // App still works for the current session if browser storage is unavailable.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function Dashboard() {
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<View>("Overview");
  const [notice, setNotice] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const role = user?.role ?? "STUDENT";
  const nav = useMemo(() => {
    const base: View[] = ["Overview", "Applications", "Opportunities", "Resume AI", "Aptitude", "Profile"];
    if (role !== "STUDENT") base.push("Interview", "Drive Creator", "Analytics");
    if (role === "STUDENT") base.push("Interview");
    return base;
  }, [role]);

  useEffect(() => {
    const savedToken = readStorage("placetrack-token");
    if (savedToken) {
      api<SessionUser>("/api/auth/me", savedToken)
        .then((freshUser) => {
          setToken(savedToken);
          setUser(freshUser);
          writeStorage("placetrack-user", JSON.stringify(freshUser));
        })
        .catch(() => {
          removeStorage("placetrack-token");
          removeStorage("placetrack-user");
        });
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshAll(token).catch((error) => flash(error.message));
  }, [token]);

  useEffect(() => {
    const handler = (event: MouseEvent | PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest?.("button[data-view]") as HTMLButtonElement | null;
      const next = button?.dataset.view as View | undefined;
      if (!next) return;
      setView(next);
      setMenuOpen(false);
    };
    document.addEventListener("click", handler);
    document.addEventListener("pointerup", handler);
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("pointerup", handler);
    };
  }, []);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const refreshAll = async (activeToken = token) => {
    if (!activeToken) return;
    setLoading(true);
    try {
      const [dashboardData, driveRows, applicationRows, testRows] = await Promise.all([
        api<DashboardData>("/api/dashboard", activeToken),
        api<Drive[]>("/api/drives", activeToken),
        api<Application[]>("/api/applications", activeToken),
        api<TestSummary[]>("/api/tests", activeToken)
      ]);
      setDashboard(dashboardData);
      setDrives(driveRows);
      setApplications(applicationRows);
      setTests(testRows);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const session = await api<LoginResponse>("/api/auth/login", null, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(session.token);
      setUser(session.user);
      writeStorage("placetrack-token", session.token);
      writeStorage("placetrack-user", JSON.stringify(session.user));
      flash(`Logged in as ${session.user.role.toLowerCase()}`);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (input: { name: string; email: string; password: string; branch: string; cgpa: number; skills: string[] }) => {
    setLoading(true);
    try {
      const session = await api<LoginResponse>("/api/auth/signup", null, {
        method: "POST",
        body: JSON.stringify({ ...input, graduationYear: 2027, backlogs: 0 })
      });
      setToken(session.token);
      setUser(session.user);
      writeStorage("placetrack-token", session.token);
      writeStorage("placetrack-user", JSON.stringify(session.user));
      flash("Account created and logged in");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeStorage("placetrack-token");
    removeStorage("placetrack-user");
    setToken(null);
    setUser(null);
    setDashboard(null);
  };

  const refreshMe = async (activeToken = token) => {
    if (!activeToken) return;
    const freshUser = await api<SessionUser>("/api/auth/me", activeToken);
    setUser(freshUser);
    writeStorage("placetrack-user", JSON.stringify(freshUser));
  };

  if (!user || !token) {
    return <LoginScreen dark={dark} loading={loading} onToggleTheme={() => setDark(!dark)} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const name = user.student?.name ?? user.coordinator?.department ?? (role === "ADMIN" ? "Admin Console" : user.email);

  return (
    <main className={dark ? "app dark" : "app light"}>
      <AnimatePresence>{notice && <motion.div className="toast" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}>{notice}</motion.div>}</AnimatePresence>
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <button className="mobile-close" onClick={() => setMenuOpen(false)}><X /></button>
        <div className="brand"><div className="brand-mark"><Command size={20} /></div><span>PlaceTrack <b>AI</b></span></div>
        <div className="profile-card">
          <div className="avatar">{initials(name)}</div>
          <div><strong>{name}</strong><span>{role} {user.student ? `· ${user.student.branch}` : ""}</span></div>
        </div>
        <nav>
          <p className="nav-label">Workspace</p>
          {nav.map((item) => {
            const Icon = navIcons[item];
            return <button
              type="button"
              data-view={item}
              className={view === item ? "active" : ""}
              onClick={() => { setView(item); setMenuOpen(false); }}
              onPointerUp={() => { setView(item); setMenuOpen(false); }}
              key={item}
            ><Icon size={18} /><span>{item}</span></button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={logout}><LogOut size={18} /> Logout</button>
          <div className="tip"><div><Target size={18} /></div><strong>Live API mode</strong><span>{loading ? "Syncing data" : "Backend connected"}</span><progress value={loading ? 1 : 5} max="5" /></div>
        </div>
      </aside>

      <section className="workspace">
        <header>
          <button className="menu-button" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div className="search"><Search size={17} /><input placeholder="Search drives, companies, tests..." /><kbd>API</kbd></div>
          <div className="header-actions">
            <button onClick={() => refreshAll()} aria-label="Refresh">{loading ? <Loader2 className="spin" size={18} /> : <Bell size={18} />}</button>
            <button onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="user-button" onClick={() => setProfileOpen(true)} aria-label="Open profile"><CircleUserRound size={22} /></button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div className="content" key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .22 }}>
            {view === "Overview" && <Overview role={role} name={name} dashboard={dashboard} applications={applications} drives={drives} onNavigate={setView} />}
            {view === "Applications" && <Applications role={role} token={token} applications={applications} onRefresh={() => refreshAll()} flash={flash} />}
            {view === "Opportunities" && <Opportunities role={role} token={token} drives={drives} onRefresh={() => refreshAll()} onNavigate={setView} flash={flash} />}
            {view === "Resume AI" && <ResumeAI token={token} flash={flash} />}
            {view === "Aptitude" && <Aptitude token={token} role={role} tests={tests} flash={flash} />}
            {view === "Interview" && <InterviewCoach token={token} applications={applications} flash={flash} />}
            {view === "Profile" && <ProfilePage user={user} token={token} onSaved={async () => { await refreshMe(); await refreshAll(); flash("Profile updated"); }} flash={flash} />}
            {view === "Drive Creator" && <DriveCreator token={token} flash={flash} onCreated={() => refreshAll()} />}
            {view === "Analytics" && <Analytics dashboard={dashboard} />}
          </motion.div>
        </AnimatePresence>
      </section>
      {profileOpen && <ProfileModal user={user} token={token} onClose={() => setProfileOpen(false)} onSaved={async () => { await refreshMe(); await refreshAll(); flash("Profile updated"); }} flash={flash} />}
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
    </main>
  );
}

function ProfileModal({ user, token, onClose, onSaved, flash }: {
  user: SessionUser;
  token: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  flash: (message: string) => void;
}) {
  const student = user.student;
  const [form, setForm] = useState({
    name: student?.name ?? "",
    branch: student?.branch ?? "Computer Engineering",
    cgpa: String(student?.cgpa ?? 7),
    graduationYear: String(student?.graduationYear ?? 2027),
    skills: student?.skills?.join(", ") ?? "Java, Python, SQL",
    backlogs: String(student?.backlogs ?? 0)
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!student) {
      flash("Only student profiles can be edited here");
      return;
    }
    setSaving(true);
    try {
      await api("/api/auth/me/student", token, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          branch: form.branch,
          cgpa: Number(form.cgpa),
          graduationYear: Number(form.graduationYear),
          skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
          backlogs: Number(form.backlogs)
        })
      });
      await onSaved();
      onClose();
    } catch (error) {
      flash(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="card profile-modal" onClick={(event) => event.stopPropagation()}>
        <div className="card-head">
          <div><span className="card-kicker">Student profile</span><h3>Edit readiness inputs</h3></div>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        {!student && <p className="section-copy">Coordinator/admin profile editing is not needed here. Student records can be managed from applications and analytics.</p>}
        {student && <>
          <p className="section-copy">Update CGPA, branch, skills, or backlog count whenever your profile improves. Dashboard readiness will refresh after saving.</p>
          <div className="profile-form">
            {Object.entries(form).map(([key, value]) => <label key={key}>{key}<input value={value} onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))} /></label>)}
          </div>
          <div className="inline-actions">
            <button className="primary-button" onClick={save} disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />} Save profile</button>
            <button className="ghost-button" onClick={onClose}>Cancel</button>
          </div>
        </>}
      </section>
    </div>
  );
}

function ProfilePage({ user, token, onSaved, flash }: {
  user: SessionUser;
  token: string;
  onSaved: () => void | Promise<void>;
  flash: (message: string) => void;
}) {
  return (
    <>
      <PageTitle eyebrow="Profile" title="Keep your placement profile updated." copy="CGPA, skills, branch, graduation year, and backlogs directly affect eligibility and readiness." />
      <ProfileEditor user={user} token={token} onSaved={onSaved} flash={flash} />
    </>
  );
}

function ProfileEditor({ user, token, onSaved, flash }: {
  user: SessionUser;
  token: string;
  onSaved: () => void | Promise<void>;
  flash: (message: string) => void;
}) {
  const student = user.student;
  const [form, setForm] = useState({
    name: student?.name ?? "",
    branch: student?.branch ?? "Computer Engineering",
    cgpa: String(student?.cgpa ?? 7),
    graduationYear: String(student?.graduationYear ?? 2027),
    skills: student?.skills?.join(", ") ?? "Java, Python, SQL",
    backlogs: String(student?.backlogs ?? 0)
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!student) {
      flash("Only student profiles can be edited here");
      return;
    }
    setSaving(true);
    try {
      await api("/api/auth/me/student", token, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          branch: form.branch,
          cgpa: Number(form.cgpa),
          graduationYear: Number(form.graduationYear),
          skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
          backlogs: Number(form.backlogs)
        })
      });
      await onSaved();
    } catch (error) {
      flash(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return <section className="card form-card"><EmptyState title="No student profile" copy="Coordinator and admin accounts use analytics and application tools instead." /></section>;
  }

  return (
    <section className="card profile-page-card">
      <div className="profile-hero">
        <div className="avatar big">{initials(form.name)}</div>
        <div>
          <span className="card-kicker">Student readiness profile</span>
          <h3>{form.name}</h3>
          <p>{form.branch} · CGPA {form.cgpa} · {form.skills.split(",").filter(Boolean).length} skills</p>
        </div>
      </div>
      <div className="profile-form">
        {Object.entries(form).map(([key, value]) => <label key={key}>{key}<input value={value} onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))} /></label>)}
      </div>
      <div className="inline-actions">
        <button className="primary-button" onClick={save} disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />} Save profile</button>
        <span className="helper-text">Tip: add hackathons, certifications, internships, and stack keywords to improve matching.</span>
      </div>
    </section>
  );
}

function LoginScreen({ dark, loading, onToggleTheme, onLogin, onSignup }: {
  dark: boolean;
  loading: boolean;
  onToggleTheme: () => void;
  onLogin: (email: string, password: string) => void;
  onSignup: (input: { name: string; email: string; password: string; branch: string; cgpa: number; skills: string[] }) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [name, setName] = useState("New KK Wagh Student");
  const [branch, setBranch] = useState("Computer Engineering");
  const [cgpa, setCgpa] = useState("7.8");
  const [skills, setSkills] = useState("Java, Python, SQL, Communication");
  const submitAuth = () => mode === "signin"
    ? onLogin(email, password)
    : onSignup({ name, email, password, branch, cgpa: Number(cgpa), skills: skills.split(",").map((item) => item.trim()).filter(Boolean) });
  return (
    <main className={dark ? "app dark login-app" : "app light login-app"}>
      <form className="login-card card" onSubmit={(event) => { event.preventDefault(); submitAuth(); }}>
        <div className="brand"><div className="brand-mark"><Command size={20} /></div><span>PlaceTrack <b>AI</b></span></div>
        <span className="eyebrow">Campus placement command center</span>
        <h1>{mode === "signin" ? "Login and run the full workflow." : "Create a student account."}</h1>
        <p className="section-copy">{mode === "signin" ? "Use demo accounts after seeding. Student, coordinator, and admin roles unlock different placement modules." : "Signup creates a student profile and logs you in instantly."}</p>
        <div className="auth-tabs">
          <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>
        {mode === "signin" && <div className="demo-buttons">
          {demoAccounts.map((account) => <button key={account.email} onClick={() => { setEmail(account.email); setPassword(account.password); }}>{account.label}</button>)}
        </div>}
        {mode === "signup" && <>
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Branch<input value={branch} onChange={(event) => setBranch(event.target.value)} /></label>
          <label>CGPA<input value={cgpa} onChange={(event) => setCgpa(event.target.value)} /></label>
          <label>Skills<input value={skills} onChange={(event) => setSkills(event.target.value)} /></label>
        </>}
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitAuth(); }} /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitAuth(); }} /></label>
        <button className="primary-button" disabled={loading} type="button" onClick={submitAuth}>
          {loading ? <Loader2 className="spin" size={16} /> : <ArrowUpRight size={16} />} {mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button className="ghost-button" type="button" onClick={onToggleTheme}>{dark ? <Sun size={16} /> : <Moon size={16} />} Toggle theme</button>
      </form>
    </main>
  );
}

function Overview({ role, name, dashboard, applications, drives, onNavigate }: { role: Role; name: string; dashboard: DashboardData | null; applications: Application[]; drives: Drive[]; onNavigate: (view: View) => void }) {
  const readiness = dashboard?.readiness as { score?: number; reasons?: string[] } | undefined;
  const stats = dashboard?.stats as Record<string, number> | undefined;
  return (
    <>
      <PageTitle eyebrow={role} title={`Good morning, ${name}.`} copy="Real backend data is powering this dashboard now." />
      <section className="hero-grid">
        <div className="card readiness-card">
          <div className="card-head"><div><span className="card-kicker">Placement readiness</span><h3>{role === "STUDENT" ? "Your current signal" : "Campus overview"}</h3></div><button onClick={() => onNavigate("Analytics")}>Details <ArrowUpRight size={14} /></button></div>
          <div className="readiness-body">
            <ReadinessRing value={Math.round(readiness?.score ?? Number(dashboard?.placementRate ?? 0) ?? 68)} />
            <div className="score-breakdown">
              <Metric label="Applications" value={stats?.applications ?? Number(dashboard?.applications ?? applications.length)} />
              <Metric label="Open drives" value={Number(dashboard?.activeDrives ?? drives.length)} />
              <Metric label="Offers/selected" value={stats?.offers ?? Number(dashboard?.selected ?? 0)} />
              <p><Sparkles size={14} /> {readiness?.reasons?.[0] ?? "Keep profiles updated before every drive."}</p>
            </div>
          </div>
        </div>
        <div className="stats-grid">
          <Stat icon={<BriefcaseBusiness />} value={String(stats?.applications ?? dashboard?.applications ?? applications.length)} label="Applications" sub="Live from DB" tone="violet" />
          <Stat icon={<CalendarDays />} value={String(stats?.interviews ?? applications.filter((item) => item.interview).length)} label="Interviews" sub="Scheduled rounds" tone="mint" />
          <Stat icon={<Trophy />} value={String(stats?.offers ?? dashboard?.selected ?? 0)} label="Offers" sub="Selected students" tone="gold" />
          <Stat icon={<Building2 />} value={String(dashboard?.companies ?? drives.length)} label="Companies" sub="Engineering seed" tone="blue" />
        </div>
      </section>
      <section className="mid-grid">
        <div className="card applications-card">
          <div className="card-head"><div><span className="card-kicker">Recent</span><h3>Applications</h3></div><button onClick={() => onNavigate("Applications")}>View all <ArrowUpRight size={14} /></button></div>
          <MiniApplicationList rows={applications.slice(0, 5)} />
        </div>
        <div className="card upcoming-card">
          <div className="card-head"><div><span className="card-kicker">Action</span><h3>Next best step</h3></div></div>
          <div className="event-date"><strong>{new Date().getDate()}</strong><span>{new Date().toLocaleString("en", { month: "short" }).toUpperCase()}</span></div>
          <div className="event-info"><span>{role === "STUDENT" ? "Student" : "Coordinator"}</span><h4>{role === "STUDENT" ? "Apply to a matching drive" : "Review applications and schedule rounds"}</h4><p>Use live modules from the sidebar.</p></div>
          <button className="primary-button" onClick={() => onNavigate(role === "STUDENT" ? "Opportunities" : "Applications")}>Open module <ArrowUpRight size={15} /></button>
        </div>
      </section>
    </>
  );
}

function Applications({ role, token, applications, onRefresh, flash }: { role: Role; token: string; applications: Application[]; onRefresh: () => void; flash: (message: string) => void }) {
  const [busyId, setBusyId] = useState("");
  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await api(`/api/applications/${id}/status`, token, { method: "PATCH", body: JSON.stringify({ status, note: "Updated from coordinator UI" }) });
      flash("Application status updated");
      onRefresh();
    } catch (error) {
      flash(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId("");
    }
  };
  return (
    <>
      <PageTitle eyebrow="Application center" title="Every application, one clear story." copy="Track status, timelines, and interview details." />
      <div className="application-detail-list">
        {applications.map((item) => <section className="card application-detail" key={item.id}>
          <div className="application-detail-head">
            <div className="company-logo large">{initials(item.drive.company.name)}</div>
            <div><h3>{item.drive.company.name}</h3><p>{item.drive.role}{item.student ? ` · ${item.student.name}` : ""}</p></div>
            <span className="status-badge">{pretty(item.status)}</span>
            <div className="deadline"><span>Updated</span><strong>{new Date(item.updatedAt).toLocaleDateString()}</strong></div>
          </div>
          <ApplicationTimeline current={Math.max(0, statusOptions.indexOf(item.status))} />
          {role !== "STUDENT" && <div className="inline-actions">
            <select disabled={busyId === item.id} defaultValue={item.status} onChange={(event) => updateStatus(item.id, event.target.value)}>
              {statusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
            {busyId === item.id && <Loader2 className="spin" size={16} />}
          </div>}
        </section>)}
        {!applications.length && <EmptyState title="No applications yet" copy="Apply to an open drive to create the first timeline." />}
      </div>
    </>
  );
}

function Opportunities({ role, token, drives, onRefresh, onNavigate, flash }: { role: Role; token: string; drives: Drive[]; onRefresh: () => void; onNavigate: (view: View) => void; flash: (message: string) => void }) {
  const sortedDrives = [...drives].sort((a, b) => {
    if (a.alreadyApplied !== b.alreadyApplied) return a.alreadyApplied ? 1 : -1;
    return (b.eligibility?.score ?? 0) - (a.eligibility?.score ?? 0);
  });
  const apply = async (driveId: string) => {
    try {
      await api("/api/applications", token, { method: "POST", body: JSON.stringify({ driveId }) });
      flash("Application submitted");
      onRefresh();
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not apply");
    }
  };
  return (
    <>
      <PageTitle eyebrow="Matched opportunities" title="KK Wagh engineering placement profile." copy="Students can apply; coordinators can monitor demand and eligibility." />
      <div className="opportunity-grid">
        {sortedDrives.slice(0, 24).map((drive) => <article className="card opportunity-card" key={drive.id}>
          <div className={drive.eligibility?.eligible === false ? "match-score weak" : "match-score"}><strong>{drive.eligibility?.score ?? drive._count?.applications ?? 0}</strong><span>{drive.eligibility ? "match" : "apps"}</span></div>
          <div className="opportunity-logo">{initials(drive.company.name)}</div>
          <span className="deadline-chip">Closes {new Date(drive.deadline).toLocaleDateString()}</span>
          <h3>{drive.company.name}</h3><p className="role">{drive.role}</p>
          <div className="job-meta"><span>Rs {drive.package} LPA</span><span>{drive.location}</span><span>CGPA {drive.minCgpa}+</span></div>
          {drive.eligibility && !drive.eligibility.eligible && <p className="warning">{drive.eligibility.reasons.join(", ")}</p>}
          {role === "STUDENT" && drive.alreadyApplied
            ? <button className="secondary-button" disabled>Already applied <CheckCircle2 size={15} /></button>
            : role === "STUDENT" && drive.eligibility?.eligible === false
            ? <button className="secondary-button" onClick={() => onNavigate("Profile")}>Update profile <ArrowUpRight size={15} /></button>
            : <button className="primary-button" disabled={role !== "STUDENT"} onClick={() => apply(drive.id)}>View & apply <ArrowUpRight size={15} /></button>}
        </article>)}
      </div>
    </>
  );
}

function ResumeAI({ token, flash }: { token: string; flash: (message: string) => void }) {
  const [text, setText] = useState("Education: B.Sc Computer Science. Skills: JavaScript, React, Node.js, SQL, Docker. Projects: Built placement tracker used by 500+ students. Experience: Internship in web development. Contact: student@example.com +91 9876543210");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const analyze = async () => {
    setLoading(true);
    try {
      setResult(await api("/api/ai/resume/text", token, { method: "POST", body: JSON.stringify({ text }) }));
      flash("Resume analyzed");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Resume analysis failed");
    } finally {
      setLoading(false);
    }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    const form = new FormData();
    form.set("resume", file);
    setLoading(true);
    try {
      setResult(await api("/api/ai/resume/upload", token, { method: "POST", body: form }));
      flash("Resume file analyzed");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="analyzer-grid">
      <div>
        <span className="eyebrow"><FileScan size={15} /> Resume AI</span>
        <h2>Analyze text or upload a local PDF.</h2>
        <p className="section-copy">The backend stores analysis history and uses Gemini when configured, with a safe offline fallback.</p>
        <textarea value={text} onChange={(event) => setText(event.target.value)} />
        <div className="inline-actions">
          <button className="primary-button" onClick={analyze} disabled={loading}>{loading ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />} Analyze text</button>
          <label className="upload-button"><Upload size={16} /> Upload PDF<input type="file" accept=".pdf,.txt" onChange={(event) => upload(event.target.files?.[0])} /></label>
        </div>
      </div>
      <AnalysisPanel result={result} />
    </section>
  );
}

function Aptitude({ token, role, tests, flash }: { token: string; role: Role; tests: TestSummary[]; flash: (message: string) => void }) {
  const [active, setActive] = useState<Record<string, unknown> | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const openTest = async (id: string) => {
    try {
      setActive(await api(`/api/tests/${id}`, token));
      setAnswers({});
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not load test");
    }
  };
  const submit = async () => {
    if (!active?.id) return;
    try {
      const result = await api<Record<string, unknown>>(`/api/tests/${active.id}/submit`, token, { method: "POST", body: JSON.stringify({ answers }) });
      flash(`Submitted. Accuracy ${result.accuracy}%`);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Submit failed");
    }
  };
  const questions = (active?.questions as Array<{ id: string; section: string; questionText: string; options: string[] }> | undefined) ?? [];
  return (
    <>
      <PageTitle eyebrow="Aptitude tests" title="Practice and submit mock tests." copy={role === "STUDENT" ? "Attempt seeded placement mocks." : "Monitor test inventory and participation."} />
      <div className="split-grid">
        <section className="card list-card">
          {tests.map((test) => <button className="list-row" key={test.id} onClick={() => openTest(test.id)}><BookOpenCheck size={18} /><span><strong>{test.title}</strong><small>{test.duration} min · {test._count?.questions ?? 0} questions · {test._count?.results ?? 0} attempts</small></span></button>)}
        </section>
        <section className="card test-card">
          {!active && <EmptyState title="Pick a test" copy="Questions will load here." />}
          {active && <>
            <h3>{String(active.title)}</h3>
            {questions.map((question, index) => <div className="question-card" key={question.id}>
              <strong>{index + 1}. {question.questionText}</strong>
              {question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={question.id} onChange={() => setAnswers((old) => ({ ...old, [question.id]: optionIndex }))} /> {option}</label>)}
            </div>)}
            {role === "STUDENT" && <button className="primary-button" onClick={submit}><Send size={16} /> Submit test</button>}
          </>}
        </section>
      </div>
    </>
  );
}

function InterviewCoach({ token, applications, flash }: { token: string; applications: Application[]; flash: (message: string) => void }) {
  const [role, setRole] = useState(applications[0]?.drive.role ?? "Software Engineer");
  const [questions, setQuestions] = useState<Array<{ question: string; difficulty: string; focus: string }>>([]);
  const generate = async () => {
    try {
      setQuestions(await api("/api/ai/interview", token, { method: "POST", body: JSON.stringify({ role, count: 8 }) }));
      flash("Interview questions generated");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not generate questions");
    }
  };
  return (
    <>
      <PageTitle eyebrow="Interview coach" title="Generate role-specific practice questions." copy="Students use it for prep; coordinators can use it to design mock panels." />
      <section className="card form-card">
        <label>Target role<input value={role} onChange={(event) => setRole(event.target.value)} /></label>
        <button className="primary-button" onClick={generate}><Sparkles size={16} /> Generate questions</button>
      </section>
      <div className="insight-list">
        {questions.map((item, index) => <div className="card insight" key={item.question}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.question}</strong><p>{item.difficulty} · {item.focus}</p></div></div>)}
      </div>
    </>
  );
}

function DriveCreator({ token, flash, onCreated }: { token: string; flash: (message: string) => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    company: "Cognizant", role: "Graduate Trainee", package: "2.9", location: "Pune", minCgpa: "6.5",
    branches: "CSE, IT, ECE", deadline: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)
  });
  const create = async () => {
    try {
      await api("/api/drives", token, {
        method: "POST",
        body: JSON.stringify({
          company: { name: form.company, description: `${form.company} campus hiring partner.` },
          role: form.role,
          package: Number(form.package),
          location: form.location,
          jobType: "Full-time",
          description: "Campus hiring drive created from coordinator dashboard.",
          minCgpa: Number(form.minCgpa),
          allowedBranches: form.branches.split(",").map((item) => item.trim()).filter(Boolean),
          maxBacklogs: 1,
          graduationYear: 2027,
          deadline: form.deadline,
          status: "OPEN"
        })
      });
      flash("Drive created");
      onCreated();
    } catch (error) {
      flash(error instanceof Error ? error.message : "Drive creation failed");
    }
  };
  return (
    <>
      <PageTitle eyebrow="Coordinator tools" title="Create a new placement drive." copy="This posts directly to the backend and appears for eligible students." />
      <section className="card form-card grid-form">
        {Object.entries(form).map(([key, value]) => <label key={key}>{key}<input value={value} type={key === "deadline" ? "date" : "text"} onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))} /></label>)}
        <button className="primary-button" onClick={create}><Plus size={16} /> Create drive</button>
      </section>
    </>
  );
}

function Analytics({ dashboard }: { dashboard: DashboardData | null }) {
  const rows = (dashboard?.branchPerformance as Array<{ branch: string; students: number; readiness: number }> | undefined) ?? [];
  return (
    <>
      <PageTitle eyebrow="Placement intelligence" title="Coordinator analytics." copy="Placement rate, packages, active companies, and branch readiness." />
      <div className="analytics-stats">
        <Stat icon={<Users />} value={String(dashboard?.students ?? 0)} label="Students" sub="Seeded profiles" tone="violet" />
        <Stat icon={<Building2 />} value={String(dashboard?.companies ?? 0)} label="Companies" sub="From report" tone="mint" />
        <Stat icon={<GraduationCap />} value={`${dashboard?.placementRate ?? 0}%`} label="Placement rate" sub="Selected/student" tone="gold" />
        <Stat icon={<BriefcaseBusiness />} value={`Rs ${Number(dashboard?.averagePackage ?? 0).toFixed(1)}L`} label="Avg package" sub={`High Rs ${Number(dashboard?.highestPackage ?? 0).toFixed(1)}L`} tone="blue" />
      </div>
      <section className="card analytics-chart">
        <div className="card-head"><div><span className="card-kicker">By department</span><h3>Readiness</h3></div></div>
        <ResponsiveContainer width="100%" height={310}>
          <BarChart data={rows} margin={{ left: -24, right: 10, top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="branch" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)" }} />
            <Tooltip cursor={{ fill: "var(--hover)" }} contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12 }} />
            <Bar dataKey="readiness" fill="#8c6cff" radius={[8, 8, 2, 2]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </>
  );
}

function PageTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="page-title"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div><div className="date-pill"><CalendarDays size={16} /> Placement season 2025-26</div></div>;
}

function Stat({ icon, value, label, sub, tone }: { icon: ReactNode; value: string; label: string; sub: string; tone: string }) {
  return <div className="card stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><strong>{value}</strong><span>{label}</span><small>{sub}</small></div></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><strong>{value}</strong><i><b style={{ width: `${Math.min(100, value)}%` }} /></i></div>;
}

function MiniApplicationList({ rows }: { rows: Application[] }) {
  if (!rows.length) return <EmptyState title="No applications" copy="Recent applications will appear here." />;
  return <div className="application-list">{rows.map((item) => <div className="application-row" key={item.id}>
    <div className="company-logo">{initials(item.drive.company.name)}</div>
    <div className="company-name"><strong>{item.drive.company.name}</strong><span>{item.drive.role}</span></div>
    <span className="status-badge">{pretty(item.status)}</span>
    <span className="date">{new Date(item.updatedAt).toLocaleDateString()}</span>
  </div>)}</div>;
}

function AnalysisPanel({ result }: { result: Record<string, unknown> | null }) {
  if (!result) return <div className="analysis-panel"><div className="empty-analysis"><div className="scan-lines"><i /><i /><i /><i /></div><h3>Waiting for resume</h3><p>Analysis score, skills, and suggestions will appear here.</p></div></div>;
  const skills = (result.skills as string[] | undefined) ?? [];
  const suggestions = (result.suggestions as string[] | undefined) ?? [];
  return <div className="analysis-panel">
    <div className="analysis-score"><CheckCircle2 /><div><strong>{String(result.score ?? 0)}</strong><span>resume score</span></div></div>
    <div className="tag-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
    <h4>Suggestions</h4>
    {suggestions.length ? suggestions.map((item) => <p className="suggestion" key={item}>{item}</p>) : <p className="suggestion success">Looks strong. Keep tailoring it per role.</p>}
  </div>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state"><Sparkles size={22} /><strong>{title}</strong><span>{copy}</span></div>;
}

function initials(value: string) {
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "PT";
}

function pretty(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
