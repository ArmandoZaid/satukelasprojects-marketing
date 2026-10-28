"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addProspect, createDemo, currency, DEMO_TODAY, followUpState, moveStage, OWNERS, recordResult, selectOpportunities, SERVICES, STAGES, summarize, type DemoState, type Opportunity, type Stage } from "@/lib/crm-demo";
import { Icon } from "./icon";
import { AccountSettings, type AccountProfile } from "./account-settings";
import { BusinessCard } from "./business-card";
import type { CardProfile } from "@/lib/business-card";

const NAV = [
  ["dashboard", "Dashboard", "grid"],
  ["opportunities", "Sekolah & peluang", "school"],
  ["pipeline", "Pipeline", "pipeline"],
  ["follow-ups", "Tindak lanjut", "calendar"],
  ["activities", "Aktivitas", "check"],
  ["reports", "Laporan", "chart"],
  ["members", "Tim marketing", "users"],
  ["settings", "Pengaturan", "settings"]
];
const TITLES: Record<string, string> = {
  dashboard: "Dashboard marketing",
  opportunities: "Sekolah & peluang",
  pipeline: "Pipeline peluang",
  "follow-ups": "Tindak lanjut",
  activities: "Riwayat aktivitas",
  reports: "Laporan marketing",
  members: "Tim & Member Marketing",
  settings: "Pengaturan akun"
};
const FOLLOW: Record<string, string> = { overdue: "Terlambat", today: "Hari ini", unscheduled: "Tanpa jadwal", upcoming: "Mendatang" };
const date = (value: string) => value ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "Belum dijadwalkan";
type Modal = { type: "add" | "result" | "detail" | "stage" | "reset"; id?: string } | null;

export interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: "MARKETER" | "ADMIN";
  avatarUrl: string | null;
  isActive: boolean;
  phone?: string;
  address?: string;
  title?: string;
  prospectsCount?: number;
  createdAt: string;
}

const DEFAULT_PREVIEW_MEMBERS: MemberItem[] = [
  { id: "usr_mkt_01", name: "Yunus", email: "yunus@satukelas.com", role: "MARKETER", avatarUrl: null, isActive: true, prospectsCount: 6, createdAt: "2026-10-16T00:00:00.000Z" },
  { id: "usr_mkt_02", name: "Dzaky", email: "dzaky@satukelas.com", role: "MARKETER", avatarUrl: null, isActive: true, prospectsCount: 5, createdAt: "2026-10-16T00:00:00.000Z" },
  { id: "usr_mkt_03", name: "Armando", email: "armando@satukelas.com", role: "MARKETER", avatarUrl: null, isActive: true, prospectsCount: 4, createdAt: "2026-10-16T00:00:00.000Z" },
  { id: "usr_mkt_04", name: "Yasser", email: "yasser@satukelas.com", role: "MARKETER", avatarUrl: null, isActive: true, prospectsCount: 5, createdAt: "2026-10-16T00:00:00.000Z" },
];

type MemberModal =
  | { type: "member-add" }
  | { type: "member-edit"; member: MemberItem }
  | { type: "member-reset-pw"; member: MemberItem }
  | { type: "member-delete"; member: MemberItem }
  | { type: "member-detail"; member: MemberItem }
  | null;

function Dialog({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = ref.current!; const active = document.activeElement as HTMLElement; el.showModal(); return () => { el.close(); active?.focus(); }; }, []);
  return <dialog ref={ref} className="crm-dialog" aria-labelledby="crm-dialog-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="crm-dialog-body"><div className="crm-dialog-heading"><h2 id="crm-dialog-title">{title}</h2><button className="crm-icon-button" aria-label="Tutup dialog" onClick={close}><Icon name="close" /></button></div>{children}</div></dialog>;
}
function Field({ label, name, children, ...props }: { label: string; name: string; children?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="crm-field"><span>{label}</span>{children ?? <input name={name} {...props} />}</label>;
}
function Badge({ value, kind = "" }: { value: string; kind?: string }) { return <span className={`crm-badge ${kind}`}>{value}</span>; }

export interface CrmUser {
  userId?: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MARKETER";
}

export function CrmApp({ children, currentUser: suppliedUser, initialState, initialAccount }: { children?: React.ReactNode; currentUser?: CrmUser | null; initialState?: DemoState; initialAccount?: AccountProfile }) {
  const [account, setAccount] = useState<AccountProfile | null>(() => initialAccount ?? (suppliedUser?.userId ? {
    id: suppliedUser.userId, name: suppliedUser.name, email: suppliedUser.email, role: suppliedUser.role,
  } : null));
  const currentUser = account ? { ...suppliedUser, userId: account.id, name: account.name, email: account.email, role: account.role } : suppliedUser;
  const [cardProfile, setCardProfile] = useState<CardProfile | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const serverMode = Boolean(initialState && currentUser);
  const isMarketer = serverMode && currentUser?.role === "MARKETER";
  const [state, setState] = useState<DemoState>(() => initialState ?? createDemo());
  const [saving, setSaving] = useState(false);
  const ownerOptions = isMarketer ? [currentUser!.name] : serverMode ? [...new Set([currentUser!.name, ...state.opportunities.map(o => o.owner)])] : [...OWNERS];
  const [modal, setModal] = useState<Modal>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [tab, setTab] = useState("overdue");
  const [sort, setSort] = useState("school");
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<MemberItem[]>(() => !serverMode ? DEFAULT_PREVIEW_MEMBERS : []);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberModal, setMemberModal] = useState<MemberModal>(null);
  const [memberError, setMemberError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname(); const params = useSearchParams(); const router = useRouter();
  const isPreview = pathname.startsWith("/preview");
  const pathSegments = pathname.replace(/^\/+/, "").split("/");
  const screen = isPreview ? (pathSegments[1] || "dashboard") : (pathSegments[0] || "dashboard");
  const basePath = isPreview ? "/preview" : "";
  const filters = { q: params.get("q") || "", owner: isMarketer ? "" : params.get("owner") || "", region: params.get("region") || "", service: params.get("service") || "", businessPeriod: params.get("period") || "", stage: params.get("stage") || "" };
  const filtered = selectOpportunities(state.opportunities, filters);
  const metrics = summarize(filtered);
  const open = filtered.filter(o => o.status === "OPEN");
  const selected = state.opportunities.find(o => o.id === modal?.id);
  const visibleActivities = state.activities.filter(a => filtered.some(o => o.id === a.opportunityId));
  const updateFilter = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setPage(1); router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }); };
  const show = (next: Modal) => { setError(""); setModal(next); };
  const navigate = (target: string) => `${basePath}/${target}${params.size ? `?${params}` : ""}`;
  const close = () => { setModal(null); setError(""); };
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // lanjut redirect
    }
    // Force full page reload on logout to clear all cached client state
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  const fetchMembers = async () => {
    if (isMarketer) return;
    setMembersLoading(true);
    try {
      const res = await fetch("/api/admin/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      } else if (!serverMode) {
        setMembers(DEFAULT_PREVIEW_MEMBERS);
      }
    } catch {
      if (!serverMode) setMembers(DEFAULT_PREVIEW_MEMBERS);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (screen === "members" && !isMarketer && serverMode) {
      fetch("/api/admin/members")
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (!ignore && data?.members) {
            setMembers(data.members);
            setMembersLoading(false);
          }
        })
        .catch(() => {
          if (!ignore) setMembersLoading(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [screen, serverMode, isMarketer]);

  function showMemberAdd() {
    setMemberError("");
    setAvatarPreview(null);
    setMemberModal({ type: "member-add" });
  }

  function showMemberEdit(member: MemberItem) {
    setMemberError("");
    setAvatarPreview(member.avatarUrl);
    setMemberModal({ type: "member-edit", member });
  }

  function showMemberResetPw(member: MemberItem) {
    setMemberError("");
    setMemberModal({ type: "member-reset-pw", member });
  }

  function showMemberDelete(member: MemberItem) {
    setMemberError("");
    setMemberModal({ type: "member-delete", member });
  }

  function showMemberDetail(member: MemberItem) {
    setMemberError("");
    setAvatarPreview(member.avatarUrl);
    setMemberModal({ type: "member-detail", member });
  }

  function closeMemberModal() {
    setMemberModal(null);
    setMemberError("");
    setAvatarPreview(null);
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMemberError("Ukuran foto profil tidak boleh melebihi 2 MB.");
      e.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMemberError("Format berkas harus JPEG, PNG, atau WebP.");
      e.target.value = "";
      return;
    }

    setMemberError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.onerror = () => {
      setMemberError("Gagal membaca berkas gambar.");
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleMemberAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setMemberError("");
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const phone = (formData.get("phone") as string)?.trim() || "";
    const address = (formData.get("address") as string)?.trim() || "";
    const password = formData.get("password") as string;
    const isActive = formData.get("isActive") === "true";

    if (!name || name.length < 2) {
      setMemberError("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (!email || !email.includes("@")) {
      setMemberError("Email tidak valid.");
      return;
    }
    if (!password || password.length < 8) {
      setMemberError("Password minimal 8 karakter.");
      return;
    }

    setSaving(true);
    try {
      if (serverMode) {
        const res = await fetch("/api/admin/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            address,
            password,
            avatarUrl: avatarPreview,
            isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menambahkan member.");
        await fetchMembers();
        setMessage(`Member marketing ${name} berhasil ditambahkan.`);
        closeMemberModal();
      } else {
        const newMember: MemberItem = {
          id: `usr_mkt_${Date.now()}`,
          name,
          email,
          phone,
          address,
          role: "MARKETER",
          avatarUrl: avatarPreview,
          isActive,
          prospectsCount: 0,
          createdAt: new Date().toISOString(),
        };
        setMembers(prev => [...prev, newMember]);
        setMessage(`Member marketing contoh ${name} ditambahkan (mode preview).`);
        closeMemberModal();
      }
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMemberEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !memberModal || memberModal.type !== "member-edit") return;
    setMemberError("");
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const phone = (formData.get("phone") as string)?.trim() || "";
    const address = (formData.get("address") as string)?.trim() || "";
    const isActive = formData.get("isActive") === "true";

    if (!name || name.length < 2) {
      setMemberError("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (!email || !email.includes("@")) {
      setMemberError("Email tidak valid.");
      return;
    }

    setSaving(true);
    try {
      if (serverMode) {
        const res = await fetch(`/api/admin/members/${memberModal.member.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            address,
            avatarUrl: avatarPreview,
            isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui data member.");
        await fetchMembers();
        setMessage(`Data member ${name} berhasil diperbarui.`);
        closeMemberModal();
      } else {
        setMembers(prev =>
          prev.map(m =>
            m.id === memberModal.member.id
              ? { ...m, name, email, phone, address, avatarUrl: avatarPreview, isActive }
              : m
          )
        );
        setMessage(`Data member contoh ${name} diperbarui (mode preview).`);
        closeMemberModal();
      }
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMemberResetPwSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !memberModal || memberModal.type !== "member-reset-pw") return;
    setMemberError("");
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword.length < 8) {
      setMemberError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMemberError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setSaving(true);
    try {
      if (serverMode) {
        const res = await fetch(`/api/admin/members/${memberModal.member.id}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mereset kata sandi.");
        setMessage(`Kata sandi untuk ${memberModal.member.name} berhasil di-reset.`);
        closeMemberModal();
      } else {
        setMessage(`Kata sandi contoh untuk ${memberModal.member.name} berhasil di-reset (mode preview).`);
        closeMemberModal();
      }
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMemberDeleteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !memberModal || memberModal.type !== "member-delete") return;
    setMemberError("");
    setSaving(true);
    try {
      if (serverMode) {
        const res = await fetch(`/api/admin/members/${memberModal.member.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menghapus member.");
        await fetchMembers();
        setMessage(`Akun member ${memberModal.member.name} berhasil dihapus.`);
        closeMemberModal();
      } else {
        setMembers(prev => prev.filter(m => m.id !== memberModal.member.id));
        setMessage(`Akun member contoh ${memberModal.member.name} dihapus (mode preview).`);
        closeMemberModal();
      }
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (saving) return;
    setSaving(true); setError("");
    try {
      if (serverMode) {
        if (modal?.type === "reset") throw new Error("Reset server tidak tersedia dari browser.");
        const isAdd = modal?.type === "add";
        if (!isAdd && !selected) throw new Error("Peluang tidak ditemukan.");
        const response = await fetch(isAdd ? "/api/crm" : `/api/crm/opportunities/${encodeURIComponent(selected!.id)}`, {
          method: isAdd ? "POST" : "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isAdd ? values : { action: modal?.type, input: values }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Perubahan gagal disimpan.");
        setState(data); setMessage("Perubahan contoh tersimpan di memori proses server. Hanya data yang diizinkan untuk akun Anda ditampilkan."); close();
        return;
      }
      let next = state; let success = "";
      if (modal?.type === "add") { next = addProspect(state, values as Parameters<typeof addProspect>[1]); success = "Prospek contoh ditambahkan di memori tab. Tidak disimpan ke server."; }
      if (modal?.type === "result" && selected) { next = recordResult(state, selected.id, values as Parameters<typeof recordResult>[2]); success = "Hasil dan tindak lanjut contoh diperbarui bersama di memori tab."; }
      if (modal?.type === "stage" && selected) { next = moveStage(state, selected.id, values as Parameters<typeof moveStage>[2]); success = "Tahap contoh diperbarui di memori tab."; }
      if (modal?.type === "reset") { next = createDemo(); success = "Data contoh dikembalikan ke snapshot awal."; }
      setState(next); setMessage(success); close();
    } catch (err) { setError(err instanceof Error ? err.message : "Perubahan contoh gagal. Periksa isian."); }
    finally { setSaving(false); }
  }
  const queue = open.filter(o => followUpState(o) === tab).sort((a, b) => a.due.localeCompare(b.due));
  const sorted = [...filtered].sort((a, b) => sort === "value" ? (b.estimate ?? -1) - (a.estimate ?? -1) : sort === "recent" ? b.created - a.created : a.school.localeCompare(b.school));
  const pageCount = Math.max(1, Math.ceil(sorted.length / 8)); const currentPage = Math.min(page, pageCount);
  function opportunityTable(items: Opportunity[], queueMode = false) {
    return items.length ? <div className="crm-table-scroll" role="region" aria-label={queueMode ? "Tabel antrean tindak lanjut" : "Tabel peluang contoh"} tabIndex={0}><table className="crm-table"><thead><tr><th>Sekolah / layanan</th><th>PIC</th><th>Tahap</th>{queueMode ? <><th>Jadwal / tindak lanjut</th><th>Aksi</th></> : <><th>Estimasi</th><th>Status</th><th>Aksi</th></>}</tr></thead><tbody>{items.map(o => <tr key={o.id}><td><button className="crm-school-link" onClick={() => show({ type: "detail", id: o.id })}>{o.school}</button><span className="crm-subtext">{o.service} · {o.region}</span></td><td>{o.owner}</td><td><Badge value={o.stage} /></td>{queueMode ? <><td><span className={`crm-due ${followUpState(o)}`}>{date(o.due)}</span><span className="crm-subtext">{o.nextAction || "Tetapkan tindak lanjut berikutnya"}</span></td><td><button className="crm-button compact" aria-label={`Catat hasil ${o.school}`} onClick={() => show({ type: "result", id: o.id })}>Catat hasil <Icon name="arrow" /></button></td></> : <><td className="crm-numeric">{o.estimate === null ? "Belum diisi" : currency(o.estimate)}</td><td><Badge value={o.legacy ? "Won legacy" : o.status === "OPEN" ? "Aktif" : o.status === "WON" ? "Won valid" : "Lost"} kind={o.legacy ? "attention" : ""} /></td><td><button className="crm-text-button" aria-label={`Buka detail ${o.school}`} onClick={() => show({ type: "detail", id: o.id })}>Detail <Icon name="arrow" /></button></td></>}</tr>)}</tbody></table></div> : <div className="crm-empty"><Icon name="check" /><h3>{queueMode ? "Tidak ada antrean di kategori ini" : "Tidak ada peluang yang cocok"}</h3><p>{queueMode ? "Coba kategori jadwal lain atau ubah filter tim." : "Ubah pencarian atau reset filter untuk melihat data contoh."}</p><button className="crm-button" onClick={() => { router.replace(pathname); setTab("overdue"); }}>Reset filter</button></div>;
  }
  function activityList(limit?: number) { return visibleActivities.length ? <ol className="crm-activity-list">{visibleActivities.slice(0, limit).map(a => <li key={a.id}><span className="crm-activity-dot" aria-hidden="true" /><div><strong>{a.title}</strong><button className="crm-activity-school" onClick={() => show({ type: "detail", id: a.opportunityId })}>{state.opportunities.find(o => o.id === a.opportunityId)?.school}</button><p>{a.summary}</p><small>{date(a.date)} · {a.time} WIB (simulasi) · {a.owner}</small></div></li>)}</ol> : <p className="crm-empty-note">Belum ada aktivitas contoh pada filter ini.</p>; }

  return <div className="crm-app">
    <a href="#crm-main" className="skip-link">Lewati ke konten admin</a>
    <aside className={`crm-sidebar ${mobileNav ? "is-open" : ""}`} aria-label={currentUser ? "Navigasi web admin" : "Navigasi admin preview"}><Link href={navigate("dashboard")} className="crm-brand" prefetch={false}><span className="crm-brand-mark">s.</span><span>satukelas<span>Marketing CRM</span></span></Link><div className="crm-workspace"><span className="crm-avatar">SK</span><div><strong>Satukelas Projects</strong><small>{serverMode ? isMarketer ? "Workspace Marketing" : "Workspace Administrator" : "Workspace contoh"}</small></div></div><nav aria-label="Menu marketing">{NAV.filter(([key]) => !isMarketer || (key !== "members" && key !== "settings")).map(([key, title, icon]) => <Link key={key} href={navigate(key)} prefetch={false} aria-current={screen === key ? "page" : undefined} onClick={() => setMobileNav(false)}><Icon name={icon} />{title}{key === "follow-ups" && <span className="crm-nav-count">{state.opportunities.filter(o => o.status === "OPEN" && followUpState(o) === "overdue").length}</span>}</Link>)}</nav>{currentUser ? <div className="crm-sidebar-bottom"><div className="crm-auth-badge"><span className="crm-auth-indicator" aria-hidden="true" /><span>{isMarketer ? "Sesi Marketing Terverifikasi" : "Sesi Admin Terverifikasi"}</span></div><div className="crm-profile"><span className="crm-avatar">{currentUser.name.slice(0, 2).toUpperCase()}</span><div><strong>{currentUser.name}</strong><small>{currentUser.email}</small><span className="crm-role-tag">ROLE: {currentUser.role}</span></div></div><div className="crm-sidebar-actions">{serverMode && account && <>{isMarketer && (account.id || currentUser.userId) && <a href={`/tim/${encodeURIComponent(account.id || currentUser.userId || "")}`} target="_blank" rel="noopener noreferrer" className="crm-button compact crm-landing-cta" aria-label="Buka landing page saya"><Icon name="external" /> Landing page saya</a>}<button type="button" className="crm-button compact" onClick={() => setShowAccountModal(true)} aria-label="Pengaturan akun"><Icon name="settings" /> Pengaturan akun</button><button type="button" className="crm-button compact" onClick={() => setCardProfile(account)} aria-label="Kartu nama saya"><Icon name="users" /> Kartu nama saya</button></>}<button type="button" className="crm-button compact crm-logout-action" onClick={handleLogout} aria-label="Keluar dari sesi akun"><Icon name="exit" /> Keluar (Logout)</button><Link href="/" prefetch={false} className="crm-public-link">Lihat website publik →</Link></div></div> : <div className="crm-sidebar-bottom"><p>Mode preview lokal</p><small>Tanpa login dan database.<br />Gunakan data fiktif saja.</small><Link href="/" prefetch={false} className="crm-public-link"><Icon name="exit" /> Lihat website publik</Link><div className="crm-profile"><span className="crm-avatar">DM</span><div><strong>Demo Manager</strong><small>Persona simulasi, bukan sesi</small></div></div></div>}</aside>
    <div className="crm-workspace-main"><div className="crm-topbar"><div className="crm-breadcrumb"><button className="crm-icon-button crm-menu" aria-label="Buka menu marketing" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Icon name="menu" /></button><span>Workspace</span><span aria-hidden="true">/</span><strong>{NAV.find(n => n[0] === screen)?.[1]}</strong></div><div className="crm-topbar-meta">{currentUser ? <><span className="crm-role-chip">{currentUser.role}</span><span className="crm-topbar-user">{currentUser.email}</span><span className="crm-topbar-date">16 Okt 2026 · WIB</span><button type="button" className="crm-topbar-logout" onClick={handleLogout} aria-label="Keluar dari sesi akun"><Icon name="exit" /> Keluar</button></> : <><span className="crm-demo-dot" />Data contoh<span className="crm-topbar-date">16 Okt 2026 · WIB</span></>}</div></div>
    <main id="crm-main" tabIndex={-1} className="crm-main">{serverMode ? <div className="crm-preview-notice verified"><strong>{isMarketer ? "Workspace Marketing" : "Web Admin Satukelas"}</strong><span>Autentikasi role {currentUser!.role} berhasil. {isMarketer ? "Hanya data akun Anda." : "Akses seluruh data contoh."} Data sintetis di memori proses server; hilang saat server restart. Bukan data operasional.</span></div> : <div className="crm-preview-notice"><strong>Preview interaktif</strong><span>Data sintetis, bukan operasional. Perubahan hanya di tab ini dan hilang saat reload. Acuan: 16 Oktober 2026 WIB.</span></div>}
      <div className="crm-page-heading"><div><h1>{TITLES[screen] || "Admin preview"}</h1><p>{screen === "dashboard" ? "Mulai dari tindak lanjut yang perlu perhatian hari ini." : screen === "settings" ? "Kelola profil, keamanan, dan kartu nama Anda." : screen === "members" ? "Kelola akun member marketing, foto profil PIC, dan reset kata sandi." : "Kelola alur marketing dengan dataset contoh yang sama."}</p></div>{screen === "members" ? <button className="crm-button primary" onClick={showMemberAdd}><Icon name="plus" />Tambah member</button> : screen !== "settings" && <button className="crm-button primary" onClick={() => show({ type: "add" })}><Icon name="plus" />Tambah prospek</button>}</div>
      <div className="crm-live" role="status" aria-live="polite">{message}</div>
      {screen !== "settings" && screen !== "members" && <div className="crm-filters" aria-label="Filter data marketing"><label>Cari sekolah<input aria-label="Cari sekolah" type="search" value={filters.q} placeholder="Nama sekolah atau layanan…" maxLength={120} onChange={e => updateFilter("q", e.target.value)} /></label>{([["owner", "PIC", ownerOptions], ["region", "Wilayah", ["Surabaya", "Sidoarjo"]], ["service", "Layanan", SERVICES], ["period", "Periode", ["2026/2027", "2027/2028"]]] as const).map(([key, label, options]) => <label key={key}>{label}<select aria-label={`Filter ${label}`} value={key === "owner" && isMarketer ? currentUser!.name : params.get(key) || ""} disabled={key === "owner" && isMarketer} onChange={e => updateFilter(key, e.target.value)}><option value="">Semua {label.toLowerCase()}</option>{options.map(o => <option key={o}>{o}</option>)}</select></label>)}<button className="crm-text-button" onClick={() => { router.replace(pathname); setPage(1); }}>Reset filter</button></div>}
      {(screen === "dashboard" || screen === "reports") && <section className="crm-kpis" aria-label="Ringkasan contoh sesuai filter"><div><span>Peluang aktif</span><strong data-testid="active-count">{metrics.active}</strong><small>Open di periode terpilih</small></div><div><span>Estimasi pipeline aktif</span><strong data-testid="pipeline-value">{currency(metrics.pipeline)}</strong><small>{metrics.coverage} dari {metrics.active} peluang terisi estimasi</small></div><div><span>Won valid</span><strong>{metrics.won}<small>peluang</small></strong><small>{metrics.legacy} Won legacy dipisahkan dari KPI</small></div></section>}
      {(screen === "dashboard" || screen === "follow-ups") && <section className="crm-panel crm-queue"><div className="crm-panel-heading"><div><h2>Antrean tindak lanjut</h2><p>Kerjakan yang terlambat, lalu rapikan jadwal berikutnya.</p></div><span className="crm-asof">Acuan demo: {date(DEMO_TODAY)}</span></div><div className="crm-tabs" aria-label="Kategori tindak lanjut">{Object.entries(FOLLOW).map(([key, title]) => <button key={key} className={tab === key ? `active ${key}` : ""} aria-pressed={tab === key} onClick={() => setTab(key)}>{title}<span>{open.filter(o => followUpState(o) === key).length}</span></button>)}</div>{opportunityTable(screen === "dashboard" ? queue.slice(0, 5) : queue, true)}<div className="crm-panel-footer"><small>{screen === "dashboard" ? Math.min(queue.length, 5) : queue.length} dari {queue.length} peluang {FOLLOW[tab].toLowerCase()} · sesuai filter</small>{screen === "dashboard" && <Link href={navigate("follow-ups")} prefetch={false}>Lihat semua tindak lanjut <Icon name="arrow" /></Link>}</div></section>}
      {screen === "opportunities" && <section className="crm-panel"><div className="crm-panel-heading"><div><h2>Daftar peluang</h2><p>{filtered.length} peluang contoh sesuai filter, termasuk status terminal.</p></div><label className="crm-inline-label">Urutkan<select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="school">Nama sekolah</option><option value="value">Estimasi terbesar</option><option value="recent">Terbaru</option></select></label></div>{opportunityTable(sorted.slice((currentPage - 1) * 8, currentPage * 8))}<div className="crm-pagination"><button className="crm-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button><span>Halaman {currentPage} / {pageCount}</span><button className="crm-button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Berikutnya</button></div></section>}
      {screen === "dashboard" && <div className="crm-bottom-grid"><section className="crm-panel"><div className="crm-panel-heading"><div><h2>Snapshot pipeline</h2><p>Peluang aktif per tahap, bukan grafik konversi.</p></div><Link className="crm-text-button" href={navigate("pipeline")} prefetch={false}>Buka pipeline <Icon name="arrow" /></Link></div><div className="crm-stage-bars">{STAGES.slice(0, 6).map(stage => { const count = open.filter(o => o.stage === stage).length; return <Link key={stage} href={`${basePath}/opportunities?${new URLSearchParams({ ...Object.fromEntries(params), stage })}`} prefetch={false}><span>{stage}</span><span className="crm-bar-track"><span style={{ width: `${open.length ? count / open.length * 100 : 0}%` }} /></span><strong>{count}</strong></Link>; })}</div><p className="crm-panel-caption">Won / Lost terminal tidak masuk pipeline aktif.</p></section><section className="crm-panel"><div className="crm-panel-heading"><div><h2>Aktivitas terbaru</h2><p>Jejak simulasi pekerjaan tim.</p></div><Link href={navigate("activities")} className="crm-text-button" prefetch={false}>Semua <Icon name="arrow" /></Link></div>{activityList(3)}</section></div>}
      {screen === "pipeline" && <section aria-label="Papan pipeline contoh"><div className="crm-board-note">Pilih kartu untuk membuka detail dan mengubah tahap. Tidak menggunakan drag-and-drop agar perubahan tetap eksplisit.</div><div className="crm-board">{STAGES.map(stage => { const items = filtered.filter(o => o.stage === stage); return <section className="crm-column" key={stage}><h2>{stage}<span>{items.length}</span></h2><small>{currency(items.reduce((sum, o) => sum + (o.estimate ?? 0), 0))} estimasi</small>{items.map(o => <button key={o.id} className="crm-opportunity-card" onClick={() => show({ type: "detail", id: o.id })}><strong>{o.school}</strong><span>{o.service}</span><span>{o.owner} · {o.region}</span><span>{o.estimate === null ? "Estimasi belum diisi" : currency(o.estimate)}</span>{o.status === "OPEN" && <Badge value={FOLLOW[followUpState(o)]} kind={followUpState(o)} />}{o.legacy && <Badge value="Won legacy" kind="attention" />}</button>)}{!items.length && <p className="crm-empty-note">Belum ada peluang.</p>}</section>; })}</div></section>}
      {screen === "activities" && <section className="crm-panel"><div className="crm-panel-heading"><div><h2>Aktivitas contoh</h2><p>{visibleActivities.length} catatan sesuai filter. Bukan audit trail produksi.</p></div></div>{activityList()}</section>}
      {screen === "reports" && <section className="crm-panel"><div className="crm-panel-heading"><div><h2>Kinerja per PIC</h2><p>Dihitung dari snapshot lokal, bukan pendapatan atau konversi terverifikasi.</p></div></div><div className="crm-table-scroll" tabIndex={0} role="region" aria-label="Laporan PIC"><table className="crm-table"><thead><tr><th>PIC</th><th>Open</th><th>Estimasi pipeline</th><th>Won valid</th><th>Terlambat</th></tr></thead><tbody>{ownerOptions.filter(owner => !filters.owner || owner === filters.owner).map(owner => { const items = filtered.filter(o => o.owner === owner); const sum = summarize(items); return <tr key={owner}><td><strong>{owner}</strong></td><td>{sum.active}</td><td>{currency(sum.pipeline)}</td><td>{sum.won}</td><td>{items.filter(o => o.status === "OPEN" && followUpState(o) === "overdue").length}</td></tr>; })}</tbody></table></div><div className="crm-report-notes"><p>Nilai final Won valid: <strong>{currency(metrics.finalValue)}</strong> · Lost: <strong>{metrics.lost}</strong></p><p>Pipeline adalah estimasi seluruh peluang Open yang nilainya terisi; nilai kosong tidak diasumsikan nol pada cakupan kelengkapan. Won legacy tetap terpisah.</p></div></section>}
      {screen === "settings" && serverMode && account && <div className="crm-account-layout">
        <AccountSettings profile={account} onUpdated={updated => { setAccount(updated); router.refresh(); }} />
        <section id="kartu-nama" className="crm-panel crm-own-card" aria-labelledby="crm-own-card-title">
          <div className="crm-panel-heading"><div><h2 id="crm-own-card-title">Kartu nama saya</h2><p>Menggunakan profil yang terakhir berhasil disimpan.</p></div></div>
          <BusinessCard profile={account} />
        </section>
      </div>}
      {screen === "settings" && !serverMode && <div className="crm-settings"><section className="crm-panel"><div className="crm-panel-heading"><h2>Status implementasi</h2></div><dl><div><dt>Mode</dt><dd>{currentUser ? "Web Admin Terautentikasi (Role ADMIN)" : "Frontend preview lokal"}</dd></div><div><dt>Data</dt><dd>{serverMode ? "Sintetis di memori proses server; hilang saat restart. Tidak memakai data pelanggan." : "Sintetis di memori tab. Tidak memakai workbook atau data pelanggan."}</dd></div><div><dt>Akses</dt><dd>{currentUser ? `Terverifikasi sebagai ${currentUser.name} (${currentUser.role})` : "Tanpa autentikasi/RBAC. Demo Manager hanya persona visual."}</dd></div><div><dt>Penyimpanan Sesi</dt><dd>{currentUser ? "Cookie HttpOnly signed HMAC-SHA256 («redacted:sk_…»)" : "Tidak ada cookie sesi."}</dd></div><div><dt>Acuan waktu</dt><dd>16 Oktober 2026 WIB; jam aktivitas adalah simulasi.</dd></div><div><dt>Backend berikutnya</dt><dd>PostgreSQL, Drizzle ORM/Kit, pg; terisolasi di apps/marketing.</dd></div></dl></section>{!serverMode && <section className="crm-panel"><div className="crm-panel-heading"><h2>Ulangi simulasi</h2></div><div className="crm-reset"><p>Reset menghapus perubahan contoh di tab ini dan mengembalikan dataset awal. Tidak mengubah website publik.</p><button className="crm-button" onClick={() => show({ type: "reset" })}>Reset data contoh</button></div></section>}</div>}
      {screen === "members" && (
        <div className="crm-members-view">
          <section className="crm-kpis" aria-label="Ringkasan tim marketing">
            <div>
              <span>Total member</span>
              <strong data-testid="total-members-count">{members.length}</strong>
              <small>Akun PIC marketing terdaftar</small>
            </div>
            <div>
              <span>Member aktif</span>
              <strong data-testid="active-members-count">{members.filter(m => m.isActive).length}</strong>
              <small>Dapat login dan mengelola prospek</small>
            </div>
            <div>
              <span>Total prospek dikelola</span>
              <strong data-testid="managed-prospects-count">
                {members.reduce((acc, m) => acc + (m.prospectsCount ?? state.opportunities.filter(o => o.owner === m.name).length), 0)}
              </strong>
              <small>Peluang di database CRM</small>
            </div>
          </section>

          <section className="crm-panel">
            <div className="crm-panel-heading">
              <div>
                <h2>Daftar Member Marketing</h2>
                <p>Akun tim marketing dengan 6 menu CRM dan pengaturan akun mandiri.</p>
              </div>
              <button className="crm-button primary compact" onClick={showMemberAdd}>
                <Icon name="plus" /> Tambah member
              </button>
            </div>

            {membersLoading ? (
              <div className="crm-empty-note" style={{ padding: 24 }}>Memuat data member marketing...</div>
            ) : members.length === 0 ? (
              <div className="crm-empty">
                <Icon name="users" />
                <h3>Belum ada member marketing</h3>
                <p>Tambahkan member marketing pertama Anda untuk mulai membagikan tugas PIC.</p>
                <button className="crm-button primary" onClick={showMemberAdd}>
                  <Icon name="plus" /> Tambah member
                </button>
              </div>
            ) : (
              <div className="crm-table-scroll" role="region" aria-label="Tabel member marketing" tabIndex={0}>
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Member / PIC</th>
                      <th>Email aktif</th>
                      <th>Status</th>
                      <th>Prospek Dikelola</th>
                      <th>Terdaftar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id} data-testid={`member-row-${m.id}`}>
                        <td>
                          <div className="crm-member-cell">
                            {m.avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={m.avatarUrl}
                                alt={`Foto ${m.name}`}
                                className="crm-member-table-avatar"
                              />
                            ) : (
                              <span className="crm-avatar crm-member-fallback-avatar">
                                {m.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <div>
                              <strong>{m.name}</strong>
                              <span className="crm-subtext">{m.role}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="crm-member-email">{m.email}</span>
                        </td>
                        <td>
                          <Badge
                            value={m.isActive ? "Aktif" : "Nonaktif"}
                            kind={m.isActive ? "success" : "muted"}
                          />
                        </td>
                        <td className="crm-numeric">
                          {m.prospectsCount ?? state.opportunities.filter(o => o.owner === m.name).length} peluang
                        </td>
                        <td>
                          <small>{date(m.createdAt ? m.createdAt.slice(0, 10) : "")}</small>
                        </td>
                        <td>
                          <div className="crm-member-actions">
                            <button
                              type="button"
                              className="crm-button compact crm-cta-detail"
                              onClick={() => showMemberDetail(m)}
                              aria-label={`Detail akun ${m.name}`}
                              data-testid={`member-detail-btn-${m.id}`}
                            >
                              <Icon name="info" /> Detail
                            </button>
                            {m.role === "MARKETER" && (
                              <a
                                href={m.isActive ? `/tim/${encodeURIComponent(m.id)}` : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`crm-button compact crm-cta-landing ${!m.isActive ? "disabled" : ""}`}
                                role="link"
                                aria-disabled={!m.isActive || undefined}
                                tabIndex={m.isActive ? undefined : -1}
                                aria-label={`Landing page ${m.name}`}
                                title={m.isActive ? `Buka landing page publik ${m.name}` : "Member nonaktif"}
                                onClick={e => { if (!m.isActive) e.preventDefault(); }}
                              >
                                <Icon name="external" /> Landing page
                              </a>
                            )}
                            <button type="button" className="crm-button compact" aria-label={`Kartu nama ${m.name}`} disabled={!m.isActive} onClick={() => setCardProfile(m)}>Kartu nama</button>
                            <button
                              type="button"
                              className="crm-button compact"
                              onClick={() => showMemberEdit(m)}
                              aria-label={`Edit ${m.name}`}
                            >
                              <Icon name="edit" /> Edit
                            </button>
                            <button
                              type="button"
                              className="crm-button compact"
                              onClick={() => showMemberResetPw(m)}
                              aria-label={`Reset password ${m.name}`}
                            >
                              <Icon name="key" /> Reset Password
                            </button>
                            <button
                              type="button"
                              className="crm-button compact danger"
                              onClick={() => showMemberDelete(m)}
                              aria-label={`Hapus ${m.name}`}
                              disabled={m.id === "usr_admin_01"}
                            >
                              <Icon name="trash" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
      <footer className="crm-footer"><span>Satukelas Projects · Marketing CRM v0.13</span><span>{currentUser ? `Sesi ${currentUser.role} aktif · Data contoh` : "Data contoh. Tidak untuk operasional."}</span></footer>{children}
    </main></div>
    {modal && <Dialog title={modal.type === "add" ? "Tambah prospek contoh" : modal.type === "result" ? "Catat hasil aktivitas" : modal.type === "stage" ? "Ubah tahap peluang" : modal.type === "reset" ? "Reset data contoh?" : selected?.school || "Detail peluang"} close={close}>
      {modal.type === "detail" && selected ? <><p className="crm-form-note">Data sintetis · {selected.id}</p><dl className="crm-detail"><div><dt>Layanan / periode</dt><dd>{selected.service} · {selected.period}</dd></div><div><dt>PIC / wilayah</dt><dd>{selected.owner} · {selected.region}</dd></div><div><dt>Tahap</dt><dd>{selected.stage}{selected.legacy ? " (legacy)" : ""}</dd></div><div><dt>Estimasi</dt><dd>{selected.estimate === null ? "Belum diisi" : currency(selected.estimate)}</dd></div><div><dt>Tindak lanjut</dt><dd>{selected.nextAction || "Belum ada"} · {date(selected.due)}</dd></div></dl>{selected.status === "OPEN" ? <div className="crm-form-actions"><button className="crm-button" onClick={() => show({ type: "stage", id: selected.id })}>Ubah tahap</button><button className="crm-button primary" onClick={() => show({ type: "result", id: selected.id })}>Catat hasil</button></div> : <p className="crm-form-note">Status terminal. Reopen memerlukan alur backend dan otorisasi yang belum tersedia.</p>}<h3 className="crm-detail-title">Riwayat contoh</h3>{state.activities.filter(a => a.opportunityId === selected.id).map(a => <p className="crm-detail-activity" key={a.id}><strong>{a.title}</strong><br />{a.summary}</p>)}{!state.activities.some(a => a.opportunityId === selected.id) && <p>Belum ada aktivitas pada snapshot ini.</p>}</> : <form onSubmit={submit} className="crm-form"><p className="crm-form-note">{modal.type === "reset" ? "Seluruh perubahan simulasi di tab ini akan hilang. Tindakan ini tidak dapat dibatalkan." : "Simulasi saja. Gunakan informasi fiktif, bukan data pribadi atau pelanggan nyata."}</p>
      {modal.type === "add" && <><Field label="Nama sekolah contoh *" name="school" required minLength={3} maxLength={120} placeholder="SMA Contoh…" /><div className="crm-form-grid"><Field label="PIC contoh *" name="owner"><select name="owner" required disabled={serverMode} value={serverMode ? currentUser!.name : undefined}>{(serverMode ? [currentUser!.name] : ownerOptions).map(o => <option key={o}>{o}</option>)}</select></Field><Field label="Wilayah *" name="region"><select name="region" required><option>Surabaya</option><option>Sidoarjo</option></select></Field><Field label="Layanan *" name="service"><select name="service" required>{SERVICES.map(o => <option key={o}>{o}</option>)}</select></Field><Field label="Periode *" name="period"><select name="period" required><option>2026/2027</option><option>2027/2028</option></select></Field></div><Field label="Estimasi Rp (opsional)" name="estimate" type="number" min={1} max={1000000000000} step={1} placeholder="Contoh: 10000000" /><p className="crm-form-note">Peluang baru dimulai pada Cold Lead tanpa jadwal. Nilai kosong tidak masuk cakupan estimasi.</p></>}
      {modal.type === "result" && selected && <><p><strong>{selected.school}</strong></p><div className="crm-form-grid"><Field label="Jenis aktivitas *" name="kind"><select name="kind">{["Telepon", "Pesan", "Pertemuan", "Presentasi", "Proposal"].map(o => <option key={o}>{o}</option>)}</select></Field><Field label="Tanggal aktivitas *" name="date" type="date" defaultValue={DEMO_TODAY} max={DEMO_TODAY} required /></div><label className="crm-field"><span>Ringkasan hasil *</span><textarea name="summary" required maxLength={2000} rows={3} /></label><Field label="Tindak lanjut berikutnya (opsional)" name="nextAction" defaultValue={selected.nextAction} maxLength={300} /><Field label="Tanggal tindak lanjut" name="due" type="date" defaultValue={selected.due} /><p className="crm-form-note">Judul dan tanggal harus diisi bersama. Kosongkan keduanya untuk memindahkan peluang ke Tanpa jadwal.</p></>}
      {modal.type === "stage" && selected && <StageFields current={selected.stage} />}
      <p className="crm-form-error" role="alert">{error}</p><div className="crm-form-actions"><button className="crm-button" type="button" onClick={close}>Batal</button><button className="crm-button primary" type="submit" disabled={saving}>{saving ? "Menyimpan…" : modal.type === "reset" ? "Ya, reset contoh" : "Simpan contoh"}</button></div></form>}
    </Dialog>}
    {cardProfile && <Dialog title={`Kartu nama: ${cardProfile.name}`} close={() => setCardProfile(null)}><BusinessCard profile={cardProfile} /></Dialog>}
    {showAccountModal && account && (
      <Dialog title="Pengaturan akun" close={() => setShowAccountModal(false)}>
        <AccountSettings
          profile={account}
          onUpdated={(updated) => {
            setAccount(updated);
            router.refresh();
          }}
        />
      </Dialog>
    )}
    {memberModal && (
      <Dialog
        title={
          memberModal.type === "member-add"
            ? "Tambah Member Marketing"
            : memberModal.type === "member-edit"
            ? `Edit Member: ${memberModal.member.name}`
            : memberModal.type === "member-reset-pw"
            ? `Reset Kata Sandi: ${memberModal.member.name}`
            : memberModal.type === "member-detail"
            ? `Detail Akun Member: ${memberModal.member.name}`
            : `Hapus Akun Member: ${memberModal.member.name}`
        }
        close={closeMemberModal}
      >
        {memberModal.type === "member-add" && (
          <form onSubmit={handleMemberAddSubmit} className="crm-form">
            <p className="crm-form-note">
              Akun baru akan memiliki role MARKETER dan hanya dapat mengakses 6 menu CRM untuk prospek miliknya.
            </p>

            <Field
              label="Nama Lengkap PIC *"
              name="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Contoh: Rian Pratama"
            />

            <Field
              label="Alamat Email Aktif *"
              name="email"
              type="email"
              required
              maxLength={120}
              placeholder="nama@satukelas.com"
            />

            <p className="crm-form-note">Gunakan email yang aktif. Email ini juga digunakan untuk login; keaktifan kotak masuk belum diverifikasi otomatis.</p>
            <Field label="Nomor Telepon / WhatsApp" name="phone" type="tel" autoComplete="tel" maxLength={30} pattern={String.raw`[+0-9][0-9 \(\)\-]{6,29}`} placeholder="Contoh: 081234567890" />
            <Field label="Alamat Tempat Tinggal" name="address">
              <textarea name="address" autoComplete="street-address" rows={3} maxLength={500} placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota, kode pos" />
            </Field>
            <p className="crm-form-note">Alamat tempat tinggal hanya untuk administrasi internal, tidak ditampilkan di landing page atau kartu nama.</p>

            <Field
              label="Kata Sandi Awal *"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              placeholder="Minimal 8 karakter"
            />

            <div className="crm-avatar-field-group">
              <label className="crm-field-label">Foto Profil PIC (Opsional)</label>
              <div className="crm-avatar-uploader">
                <div className="crm-avatar-preview-box">
                  {avatarPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarPreview} alt="Preview Avatar" className="crm-avatar-img-preview" />
                  ) : (
                    <span className="crm-avatar-placeholder">
                      <Icon name="camera" />
                    </span>
                  )}
                </div>
                <div className="crm-avatar-controls">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFileChange}
                    className="crm-file-input"
                    id="member-avatar-upload"
                  />
                  <label htmlFor="member-avatar-upload" className="crm-button compact">
                    <Icon name="camera" /> Pilih Berkas Foto
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="crm-button compact danger"
                      onClick={handleRemoveAvatar}
                    >
                      Hapus Foto
                    </button>
                  )}
                  <small className="crm-avatar-hint">Maksimal 2 MB (JPEG, PNG, atau WebP).</small>
                </div>
              </div>
            </div>

            <div className="crm-form-grid">
              <Field label="Status Akun *" name="isActive">
                <select name="isActive" defaultValue="true">
                  <option value="true">Aktif (Dapat Login)</option>
                  <option value="false">Nonaktif (Akses Diblokir)</option>
                </select>
              </Field>
            </div>

            {memberError && <p className="crm-form-error" role="alert">{memberError}</p>}

            <div className="crm-form-actions">
              <button className="crm-button" type="button" onClick={closeMemberModal}>
                Batal
              </button>
              <button className="crm-button primary" type="submit" disabled={saving}>
                {saving ? "Menyimpan…" : "Tambah Member"}
              </button>
            </div>
          </form>
        )}

        {memberModal.type === "member-edit" && (
          <form onSubmit={handleMemberEditSubmit} className="crm-form">
            <p className="crm-form-note">
              Perubahan profil dan status keaktifan akun member {memberModal.member.name}.
            </p>

            <Field
              label="Nama Lengkap PIC *"
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={memberModal.member.name}
            />

            <Field
              label="Alamat Email Aktif *"
              name="email"
              type="email"
              required
              maxLength={120}
              defaultValue={memberModal.member.email}
            />

            <p className="crm-form-note">Email aktif juga digunakan untuk login. Mengubah email akan mencabut sesi login member sebelumnya.</p>
            <Field label="Nomor Telepon / WhatsApp" name="phone" type="tel" autoComplete="tel" maxLength={30} pattern={String.raw`[+0-9][0-9 \(\)\-]{6,29}`} defaultValue={memberModal.member.phone || ""} />
            <Field label="Alamat Tempat Tinggal" name="address">
              <textarea name="address" autoComplete="street-address" rows={3} maxLength={500} defaultValue={memberModal.member.address || ""} />
            </Field>
            <p className="crm-form-note">Alamat tempat tinggal hanya untuk administrasi internal, tidak ditampilkan di landing page atau kartu nama.</p>

            <div className="crm-avatar-field-group">
              <label className="crm-field-label">Foto Profil PIC</label>
              <div className="crm-avatar-uploader">
                <div className="crm-avatar-preview-box">
                  {avatarPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarPreview} alt="Preview Avatar" className="crm-avatar-img-preview" />
                  ) : (
                    <span className="crm-avatar-placeholder">
                      <Icon name="camera" />
                    </span>
                  )}
                </div>
                <div className="crm-avatar-controls">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFileChange}
                    className="crm-file-input"
                    id="member-avatar-edit-upload"
                  />
                  <label htmlFor="member-avatar-edit-upload" className="crm-button compact">
                    <Icon name="camera" /> Ubah Berkas Foto
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="crm-button compact danger"
                      onClick={handleRemoveAvatar}
                    >
                      Hapus Foto
                    </button>
                  )}
                  <small className="crm-avatar-hint">Maksimal 2 MB (JPEG, PNG, atau WebP).</small>
                </div>
              </div>
            </div>

            <div className="crm-form-grid">
              <Field label="Status Akun *" name="isActive">
                <select name="isActive" defaultValue={String(memberModal.member.isActive)}>
                  <option value="true">Aktif (Dapat Login)</option>
                  <option value="false">Nonaktif (Akses Diblokir)</option>
                </select>
              </Field>
            </div>

            {memberError && <p className="crm-form-error" role="alert">{memberError}</p>}

            <div className="crm-form-actions">
              <button className="crm-button" type="button" onClick={closeMemberModal}>
                Batal
              </button>
              <button className="crm-button primary" type="submit" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}

        {memberModal.type === "member-reset-pw" && (
          <form onSubmit={handleMemberResetPwSubmit} className="crm-form">
            <p className="crm-form-note">
              Kata sandi akun <strong>{memberModal.member.email}</strong> akan di-hash ulang menggunakan scrypt. Member dapat langsung login dengan kata sandi baru ini.
            </p>

            <Field
              label="Kata Sandi Baru *"
              name="newPassword"
              type="password"
              required
              minLength={8}
              maxLength={128}
              placeholder="Minimal 8 karakter"
            />

            <Field
              label="Ulangi Kata Sandi Baru *"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={128}
              placeholder="Ketik ulang kata sandi baru"
            />

            {memberError && <p className="crm-form-error" role="alert">{memberError}</p>}

            <div className="crm-form-actions">
              <button className="crm-button" type="button" onClick={closeMemberModal}>
                Batal
              </button>
              <button className="crm-button primary" type="submit" disabled={saving}>
                {saving ? "Mereset…" : "Reset Kata Sandi"}
              </button>
            </div>
          </form>
        )}

        {memberModal.type === "member-delete" && (
          <form onSubmit={handleMemberDeleteSubmit} className="crm-form">
            <p className="crm-form-note" style={{ color: "#b91c1c" }}>
              Apakah Anda yakin ingin menghapus akun member <strong>{memberModal.member.name}</strong> ({memberModal.member.email})?
            </p>
            <p className="crm-form-note">
              Akun ini tidak akan dapat login lagi. Seluruh prospek yang pernah ditugaskan pada member ini tetap aman di CRM.
            </p>

            {memberError && <p className="crm-form-error" role="alert">{memberError}</p>}

            <div className="crm-form-actions">
              <button className="crm-button" type="button" onClick={closeMemberModal}>
                Batal
              </button>
              <button className="crm-button danger" type="submit" disabled={saving}>
                {saving ? "Menghapus…" : "Ya, Hapus Member"}
              </button>
            </div>
          </form>
        )}

        {memberModal.type === "member-detail" && (
          <div className="crm-member-detail-view">
            <div className="crm-member-detail-header">
              {memberModal.member.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={memberModal.member.avatarUrl}
                  alt={`Foto ${memberModal.member.name}`}
                  className="crm-member-detail-avatar"
                />
              ) : (
                <span className="crm-member-detail-avatar-fallback">
                  {memberModal.member.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="crm-member-detail-meta">
                <h3>{memberModal.member.name}</h3>
                <div className="crm-member-detail-tags">
                  <span className="crm-role-chip">{memberModal.member.role}</span>
                  <Badge
                    value={memberModal.member.isActive ? "Akun Aktif" : "Akun Nonaktif"}
                    kind={memberModal.member.isActive ? "success" : "muted"}
                  />
                  {memberModal.member.title && (
                    <span className="crm-subtext">{memberModal.member.title}</span>
                  )}
                </div>
              </div>
            </div>

            <dl className="crm-member-detail-list" data-testid="member-detail-dl">
              <div>
                <dt>ID Pengguna</dt>
                <dd><code>{memberModal.member.id}</code></dd>
              </div>
              <div>
                <dt>Nama Lengkap PIC</dt>
                <dd><strong>{memberModal.member.name}</strong></dd>
              </div>
              <div>
                <dt>Alamat Email Aktif</dt>
                <dd>
                  <span className="crm-member-email">{memberModal.member.email}</span>
                  <small className="crm-detail-note">Email autentikasi akun untuk login ke sistem CRM.</small>
                </dd>
              </div>
              <div>
                <dt>Nomor Telepon / WA</dt>
                <dd>
                  {memberModal.member.phone ? (
                    <div className="crm-detail-phone-row">
                      <a href={`tel:${memberModal.member.phone}`} className="crm-detail-link">
                        {memberModal.member.phone}
                      </a>
                      <a
                        href={`https://wa.me/${memberModal.member.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="crm-button compact crm-detail-wa-btn"
                        title="Buka obrolan WhatsApp"
                      >
                        <Icon name="external" /> Chat WhatsApp
                      </a>
                    </div>
                  ) : (
                    <span className="crm-empty-text">Belum diisi</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Alamat Tempat Tinggal</dt>
                <dd>
                  {memberModal.member.address ? (
                    <div className="crm-detail-address-text">{memberModal.member.address}</div>
                  ) : (
                    <span className="crm-empty-text">Belum diisi</span>
                  )}
                  <small className="crm-detail-note">Khusus administrasi internal, tidak ditampilkan pada publik.</small>
                </dd>
              </div>
              <div>
                <dt>Status Keaktifan</dt>
                <dd>
                  {memberModal.member.isActive ? (
                    <span style={{ color: "#0E6251", fontWeight: 600 }}>Aktif (dapat login dan mengakses workspace)</span>
                  ) : (
                    <span style={{ color: "#991B1B", fontWeight: 600 }}>Nonaktif (akses login ditangguhkan)</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Prospek Dikelola</dt>
                <dd>
                  <strong>{memberModal.member.prospectsCount ?? state.opportunities.filter(o => o.owner === memberModal.member.name).length}</strong> peluang di CRM
                </dd>
              </div>
              <div>
                <dt>Tanggal Terdaftar</dt>
                <dd>{date(memberModal.member.createdAt ? memberModal.member.createdAt.slice(0, 10) : "")}</dd>
              </div>
            </dl>

            <div className="crm-detail-actions">
              <button
                type="button"
                className="crm-button primary"
                onClick={() => showMemberEdit(memberModal.member)}
              >
                <Icon name="edit" /> Edit Akun
              </button>
              <button
                type="button"
                className="crm-button"
                onClick={() => showMemberResetPw(memberModal.member)}
              >
                <Icon name="key" /> Reset Password
              </button>
              <button
                type="button"
                className="crm-button"
                disabled={!memberModal.member.isActive}
                onClick={() => {
                  const m = memberModal.member;
                  closeMemberModal();
                  setCardProfile(m);
                }}
              >
                Kartu Nama
              </button>
              {memberModal.member.role === "MARKETER" && (
                <a
                  href={memberModal.member.isActive ? `/tim/${encodeURIComponent(memberModal.member.id)}` : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`crm-button crm-cta-landing ${!memberModal.member.isActive ? "disabled" : ""}`}
                  role="link"
                  aria-disabled={!memberModal.member.isActive || undefined}
                  tabIndex={memberModal.member.isActive ? undefined : -1}
                  onClick={e => { if (!memberModal.member.isActive) e.preventDefault(); }}
                >
                  <Icon name="external" /> Landing Page
                </a>
              )}
              <button
                type="button"
                className="crm-button"
                style={{ marginLeft: "auto" }}
                onClick={closeMemberModal}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Dialog>
    )}
  </div>;
}
function StageFields({ current }: { current: Stage }) {
  const [stage, setStage] = useState<Stage>(STAGES.find(s => s !== current) || "Cold Lead");
  return <><Field label="Tahap baru *" name="stage"><select name="stage" value={stage} onChange={e => setStage(e.target.value as Stage)}>{STAGES.filter(s => s !== current).map(s => <option key={s}>{s}</option>)}</select></Field><label className="crm-field"><span>Alasan (3–500 karakter jika skip, mundur, atau Lost)</span><textarea name="reason" maxLength={500} rows={2} /></label>{(stage === "Won" || stage === "Lost") && <Field label="Tanggal closing *" name="closedOn" type="date" defaultValue={DEMO_TODAY} max={DEMO_TODAY} required />}{stage === "Won" && <><Field label="Nilai final Rp *" name="finalValue" type="number" required min={1} max={1000000000000} step={1} /><Field label="Referensi kesepakatan contoh *" name="reference" required maxLength={300} /></>}<p className="crm-form-note">Won memerlukan nilai final, tanggal, dan referensi contoh. Lost memerlukan alasan dan tanggal. Validasi scope dan mutasi akun terautentikasi juga dijalankan server; preview anonim tetap simulasi lokal.</p></>;
}
