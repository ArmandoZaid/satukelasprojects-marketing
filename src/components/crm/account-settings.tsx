"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import "./account-settings.css";

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MARKETER";
  phone?: string;
  title?: string;
  avatarUrl?: string;
}

type AccountTab = "profile" | "security";

function isAccountProfile(value: unknown): value is AccountProfile {
  if (!value || typeof value !== "object") return false;
  const account = value as Record<string, unknown>;
  return typeof account.id === "string" && typeof account.name === "string" &&
    typeof account.email === "string" && ["ADMIN", "MANAGER", "MARKETER"].includes(String(account.role)) &&
    ["phone", "title", "avatarUrl"].every(key => account[key] === undefined || typeof account[key] === "string");
}

function isSafeAvatarUrl(url: string): boolean {
  if (!url) return false;
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(url)) return true;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  return false;
}

export function AccountSettings({ profile, onUpdated }: {
  profile: AccountProfile;
  onUpdated: (profile: AccountProfile) => void;
}) {
  const uid = useId();
  const [tab, setTab] = useState<AccountTab>("profile");
  const [saving, setSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const [profileFailed, setProfileFailed] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordFailed, setPasswordFailed] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState<"current" | "new" | "confirm" | null>(null);
  const passwordForm = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState(() => ({
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? "",
    title: profile.title ?? "",
    avatarUrl: profile.avatarUrl ?? "",
  }));
  const [syncedProfile, setSyncedProfile] = useState(profile);
  const [photoError, setPhotoError] = useState("");
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (syncedProfile !== profile) {
    setSyncedProfile(profile);
    setDraft({
      name: profile.name,
      email: profile.email,
      phone: profile.phone ?? "",
      title: profile.title ?? "",
      avatarUrl: profile.avatarUrl ?? "",
    });
    setPhotoError("");
    setAvatarLoadError(false);
  }

  useEffect(() => {
    const formElement = passwordForm.current;
    return () => {
      formElement?.reset();
    };
  }, []);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setPhotoError("Foto profil harus berupa unggahan JPEG, PNG, atau WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Foto profil maksimal 2 MiB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result) {
        setAvatarLoadError(false);
        setDraft(prev => ({ ...prev, avatarUrl: result }));
      }
    };
    reader.onerror = () => {
      setPhotoError("Gagal membaca berkas gambar. Silakan coba lagi.");
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    setDraft(prev => ({ ...prev, avatarUrl: "" }));
    setPhotoError("");
    setAvatarLoadError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setProfileFailed(false);
    setProfileStatus("Menyimpan perubahan profil…");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: draft.name.trim(),
          email: draft.email.trim().toLowerCase(),
          phone: draft.phone.trim(),
          title: draft.title.trim(),
          avatarUrl: draft.avatarUrl,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Profil belum tersimpan. Silakan coba lagi.");
      if (!isAccountProfile(data?.account)) throw new Error("Respons profil tidak valid. Muat ulang halaman dan coba lagi.");
      const account = data.account;
      setDraft({ name: account.name, email: account.email, phone: account.phone ?? "", title: account.title ?? "", avatarUrl: account.avatarUrl ?? "" });
      setProfileStatus("Profil berhasil diperbarui.");
      onUpdated(account);
    } catch (error) {
      setProfileFailed(true);
      setProfileStatus(error instanceof TypeError ? "Profil belum tersimpan. Periksa koneksi Anda dan coba lagi." : error instanceof Error ? error.message : "Profil belum tersimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changingPassword || saving) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = {
      currentPassword: String(values.get("currentPassword") ?? ""),
      newPassword: String(values.get("newPassword") ?? ""),
      confirmPassword: String(values.get("confirmPassword") ?? ""),
    };
    let invalid: "current" | "new" | "confirm" | null = null;
    let message = "";
    if (!payload.currentPassword) {
      invalid = "current";
      message = "Kata sandi saat ini wajib diisi.";
    } else if (payload.newPassword.length < 8 || payload.newPassword.length > 128) {
      invalid = "new";
      message = "Kata sandi baru harus berisi 8–128 karakter.";
    } else if (payload.confirmPassword !== payload.newPassword) {
      invalid = "confirm";
      message = "Konfirmasi kata sandi baru tidak cocok.";
    }
    setPasswordInvalid(invalid);
    setPasswordFailed(Boolean(invalid));
    if (invalid) {
      setPasswordStatus(message);
      form.querySelector<HTMLInputElement>(`#password-${invalid}`)?.focus();
      return;
    }
    setChangingPassword(true);
    setPasswordStatus("Mengganti kata sandi…");
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Kata sandi belum diganti. Silakan coba lagi.");
      if (!isAccountProfile(data?.account)) throw new Error("Respons akun tidak valid. Muat ulang halaman dan coba lagi.");
      form.reset();
      setPasswordStatus("Kata sandi berhasil diperbarui.");
      onUpdated(data.account);
    } catch (error) {
      setPasswordFailed(true);
      setPasswordStatus(error instanceof TypeError ? "Kata sandi belum diganti. Periksa koneksi Anda dan coba lagi." : error instanceof Error ? error.message : "Kata sandi belum diganti. Silakan coba lagi.");
    } finally {
      payload.currentPassword = "";
      payload.newPassword = "";
      payload.confirmPassword = "";
      setChangingPassword(false);
    }
  }

  function selectTab(next: AccountTab) {
    if (tab === "security" && next !== "security") {
      passwordForm.current?.reset();
      setPasswordInvalid(null);
      setPasswordStatus("");
      setPasswordFailed(false);
    }
    setTab(next);
  }

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>) {
    let next: AccountTab;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      next = tab === "profile" ? "security" : "profile";
    } else if (event.key === "Home") {
      next = "profile";
    } else if (event.key === "End") {
      next = "security";
    } else {
      return;
    }
    event.preventDefault();
    selectTab(next);
    document.getElementById(`${uid}-${next}-tab`)?.focus();
  }

  return (
    <section className="account-settings" aria-labelledby={`${uid}-heading`}>
      <header className="account-settings-header">
        <div>
          <h2 className="account-settings-heading" id={`${uid}-heading`}>Pengaturan akun</h2>
          <p>Kelola identitas dan keamanan akun Anda.</p>
        </div>
        <span className="account-settings-role"><span>Role:</span> <strong>{profile.role}</strong></span>
      </header>

      <div className="account-settings-tabs" role="tablist" aria-label="Pengaturan akun">
        {([ ["profile", "Data Diri"], ["security", "Keamanan"] ] as const).map(([value, label]) => (
          <button
            key={value}
            id={`${uid}-${value}-tab`}
            type="button"
            role="tab"
            aria-controls={`${uid}-${value}-panel`}
            aria-selected={tab === value}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => selectTab(value)}
            onKeyDown={navigateTabs}
          >{label}</button>
        ))}
      </div>

      <div id={`${uid}-profile-panel`} role="tabpanel" aria-labelledby={`${uid}-profile-tab`} hidden={tab !== "profile"} tabIndex={0}>
        <form onSubmit={saveProfile} aria-busy={saving}>
          <fieldset className="account-settings-form" disabled={saving}>
          <div className="account-settings-photo">
            <div className="account-settings-avatar" role="img" aria-label={`Inisial atau foto ${draft.name || "pengguna"}`}>
              {draft.avatarUrl && !avatarLoadError && isSafeAvatarUrl(draft.avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.avatarUrl}
                  alt=""
                  className="account-settings-avatar-img"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                draft.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase() || "?"
              )}
            </div>
            <div className="account-settings-photo-controls">
              <label htmlFor="account-avatar">Foto profil</label>
              <input
                ref={fileInputRef}
                id="account-avatar"
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby={`${uid}-photo-hint${photoError ? ` ${uid}-photo-error` : ""}`}
                onChange={handleAvatarChange}
              />
              <p className="account-settings-hint" id={`${uid}-photo-hint`}>JPEG, PNG, atau WebP. Maksimal 2 MiB. Pilih berkas dari perangkat Anda.</p>
              {photoError && (
                <p className="account-settings-status" id={`${uid}-photo-error`} data-error="true" role="alert">
                  {photoError}
                </p>
              )}
              <button
                className="account-settings-button account-settings-button-quiet"
                type="button"
                disabled={!draft.avatarUrl}
                onClick={removeAvatar}
              >
                Hapus foto
              </button>
            </div>
          </div>
          <div className="account-settings-grid">
            <div className="account-settings-field">
              <label htmlFor="account-name">Nama lengkap</label>
              <input id="account-name" name="name" autoComplete="name" required maxLength={200} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
            </div>
            <div className="account-settings-field">
              <label htmlFor="account-email">Email akun</label>
              <input id="account-email" name="email" type="email" autoComplete="email" required maxLength={254} value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} />
            </div>
            <div className="account-settings-field">
              <label htmlFor="account-phone">Nomor WhatsApp / telepon</label>
              <input id="account-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} value={draft.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })} aria-describedby={`${uid}-phone-hint`} />
              <p className="account-settings-hint" id={`${uid}-phone-hint`}>Opsional. Contoh: +62 812 3456 7890.</p>
            </div>
            <div className="account-settings-field">
              <label htmlFor="account-title">Jabatan</label>
              <input id="account-title" name="title" autoComplete="organization-title" maxLength={100} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} />
            </div>
          </div>
          <p className="account-settings-hint">Nama lengkap dan email wajib diisi. Role dikelola oleh administrator.</p>
          <p className="account-settings-status" data-error={profileFailed || undefined} role="status" aria-live="polite" aria-atomic="true">{profileStatus}</p>
          <div className="account-settings-actions">
            <button className="account-settings-button account-settings-button-primary" type="submit">{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
          </div>
          </fieldset>
        </form>
      </div>

      <div id={`${uid}-security-panel`} role="tabpanel" aria-labelledby={`${uid}-security-tab`} hidden={tab !== "security"} tabIndex={0}>
        <form ref={passwordForm} className="account-settings-security" noValidate onSubmit={changePassword} aria-busy={changingPassword}>
          <fieldset className="account-settings-form" disabled={changingPassword || saving}>
          <div>
            <h3 className="account-settings-subheading">Ganti kata sandi</h3>
            <p className="account-settings-hint">Gunakan 8–128 karakter untuk kata sandi baru.</p>
          </div>
          <div className="account-settings-field">
            <label htmlFor="password-current">Kata sandi saat ini</label>
            <input id="password-current" name="currentPassword" type="password" autoComplete="current-password" required aria-invalid={passwordInvalid === "current" || undefined} aria-describedby={passwordInvalid === "current" ? `${uid}-password-status` : undefined} onInput={() => setPasswordInvalid(null)} />
          </div>
          <div className="account-settings-field">
            <label htmlFor="password-new">Kata sandi baru</label>
            <input id="password-new" name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} aria-invalid={passwordInvalid === "new" || undefined} aria-describedby={`${uid}-password-hint${passwordInvalid === "new" ? ` ${uid}-password-status` : ""}`} onInput={() => setPasswordInvalid(null)} />
            <p className="account-settings-hint" id={`${uid}-password-hint`}>Minimal 8 dan maksimal 128 karakter. Anda dapat menempelkan kata sandi.</p>
          </div>
          <div className="account-settings-field">
            <label htmlFor="password-confirm">Konfirmasi kata sandi baru</label>
            <input id="password-confirm" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} aria-invalid={passwordInvalid === "confirm" || undefined} aria-describedby={passwordInvalid === "confirm" ? `${uid}-password-status` : undefined} onInput={() => setPasswordInvalid(null)} />
          </div>
          <p
            id={`${uid}-password-status`}
            className="account-settings-status"
            data-error={passwordFailed || undefined}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {passwordStatus}
          </p>
          <div className="account-settings-actions">
            <button className="account-settings-button account-settings-button-blue" type="submit">{changingPassword ? "Mengganti…" : "Ganti kata sandi"}</button>
          </div>
          </fieldset>
        </form>
      </div>
      <p className="account-settings-runtime">Penyimpanan sementara (runtime): perubahan profil dan kata sandi akan direset saat server dimulai ulang.</p>
    </section>
  );
}
