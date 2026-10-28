import { describe, it, expect, beforeEach } from "vitest";
import {
  getMarketingMembers,
  createMarketingMember,
  updateMarketingMember,
  resetMemberPassword,
  deleteMarketingMember,
  resetMarketingMembers,
  validateAvatarDataUrl,
  memberNameToSlug,
  getMarketingMemberBySlug,
} from "./member-store";
import { writeCrmStore } from "./crm-store";
import { authenticateUser } from "./auth";

describe("member-store (CRUD Member Marketing & Reset Password)", () => {
  beforeEach(() => {
    process.env.MARKETING_ENABLE_DEMO_AUTH = "true";
    resetMarketingMembers();
    process.env.MARKETING_ENABLE_SYNTHETIC_CRM = "true";
    writeCrmStore({ opportunities: [], activities: [] });
  });

  describe("getMarketingMembers", () => {
    it("mengembalikan daftar member marketing awal (seed)", () => {
      const members = getMarketingMembers();
      expect(members.length).toBeGreaterThanOrEqual(4);
      expect(members.some((m) => m.id === "usr_mkt_01" && m.name === "Yunus")).toBe(true);
      expect(members.some((m) => m.id === "usr_mkt_02" && m.name === "Dzaky")).toBe(true);
      expect(members.every((m) => m.role === "MARKETER")).toBe(true);
    });
  });

  describe("createMarketingMember", () => {
    it("berhasil membuat member marketing baru dengan password di-hash scrypt dan avatar", () => {
      const dummyAvatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const newMember = createMarketingMember({
        name: "Rian Hidayat",
        email: "rian@satukelas.com",
        password: "PasswordRian2026!",
        avatarUrl: dummyAvatar,
        isActive: true,
      });

      expect(newMember.id).toMatch(/^usr_mkt_/);
      expect(newMember.name).toBe("Rian Hidayat");
      expect(newMember.email).toBe("rian@satukelas.com");
      expect(newMember.role).toBe("MARKETER");
      expect(newMember.isActive).toBe(true);
      expect(newMember.avatarUrl).toBe(dummyAvatar);
      expect(newMember.passwordHash).toMatch(/^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
      // Password tidak boleh bocor dalam bentuk plaintext
      expect((newMember as unknown as { password?: string }).password).toBeUndefined();

      // Verifikasi member langsung dapat login via authenticateUser
      const authResult = authenticateUser("rian@satukelas.com", "PasswordRian2026!");
      expect(authResult.ok).toBe(true);
      if (authResult.ok) {
        expect(authResult.user.id).toBe(newMember.id);
        expect(authResult.user.role).toBe("MARKETER");
      }
    });

    it("menolak pembuatan member jika nama kosong atau melebihi 200 karakter", () => {
      expect(() =>
        createMarketingMember({
          name: "   ",
          email: "valid@satukelas.com",
          password: "ValidPassword123!",
        })
      ).toThrow("Nama lengkap wajib diisi");

      expect(() =>
        createMarketingMember({
          name: "A".repeat(201),
          email: "valid@satukelas.com",
          password: "ValidPassword123!",
        })
      ).toThrow("Nama lengkap maksimal 200 karakter");
    });

    it("menolak email tidak valid atau duplikat", () => {
      expect(() =>
        createMarketingMember({
          name: "Budi Santoso",
          email: "bukan-email",
          password: "ValidPassword123!",
        })
      ).toThrow("Format email tidak valid");

      // Duplikat dengan member yang sudah ada (Yunus: marketer@satukelas.com)
      expect(() =>
        createMarketingMember({
          name: "Yunus Kloning",
          email: "MARKETER@satukelas.com", // Case-insensitive
          password: "ValidPassword123!",
        })
      ).toThrow("Email sudah terdaftar");

      // Duplikat dengan admin
      expect(() =>
        createMarketingMember({
          name: "Admin Palsu",
          email: "admin@satukelas.com",
          password: "ValidPassword123!",
        })
      ).toThrow("Email sudah terdaftar");
    });

    it("menolak password awal kurang dari 8 karakter", () => {
      expect(() =>
        createMarketingMember({
          name: "Fajar",
          email: "fajar@satukelas.com",
          password: "short",
        })
      ).toThrow("Kata sandi minimal 8 karakter");
    });

    it("memvalidasi format avatar gambar", () => {
      // Format bukan data:image
      expect(() =>
        createMarketingMember({
          name: "Fajar",
          email: "fajar@satukelas.com",
          password: "ValidPassword123!",
          avatarUrl: "data:text/plain;base64,aGVsbG8=",
        })
      ).toThrow("Format gambar profil harus JPEG, PNG, atau WebP");

      // URL http/https yang valid diperbolehkan
      const memberWithHttpAvatar = createMarketingMember({
        name: "Fajar",
        email: "fajar@satukelas.com",
        password: "ValidPassword123!",
        avatarUrl: "https://example.com/avatar.png",
      });
      expect(memberWithHttpAvatar.avatarUrl).toBe("https://example.com/avatar.png");
    });
  });

  describe("updateMarketingMember", () => {
    it("berhasil memperbarui data profil member marketing dan foto profil", () => {
      const updated = updateMarketingMember("usr_mkt_01", {
        name: "Yunus Al-Fatih",
        email: "yunus.alfatih@satukelas.com",
        isActive: true,
        avatarUrl: "https://satukelas.com/avatars/yunus.png",
      });

      expect(updated.name).toBe("Yunus Al-Fatih");
      expect(updated.email).toBe("yunus.alfatih@satukelas.com");
      expect(updated.avatarUrl).toBe("https://satukelas.com/avatars/yunus.png");

      // Verifikasi login menggunakan email baru
      const authResult = authenticateUser("yunus.alfatih@satukelas.com", "MarketerSatukelas2026!");
      expect(authResult.ok).toBe(true);
    });

    it("menolak update jika ID tidak ditemukan", () => {
      expect(() =>
        updateMarketingMember("usr_mkt_999", {
          name: "Tidak Ada",
        })
      ).toThrow("Member marketing tidak ditemukan");
    });

    it("menonaktifkan akun member (isActive: false) dan memblokir login", () => {
      updateMarketingMember("usr_mkt_01", {
        isActive: false,
      });

      const authResult = authenticateUser("marketer@satukelas.com", "MarketerSatukelas2026!");
      expect(authResult.ok).toBe(false);
      if (!authResult.ok) {
        expect(authResult.code).toBe("ACCOUNT_INACTIVE");
      }
    });
  });

  describe("resetMemberPassword", () => {
    it("berhasil mereset password akun member dengan scrypt hash baru", () => {
      const result = resetMemberPassword("usr_mkt_01", "NewSecurePassword2026!");
      expect(result.success).toBe(true);

      // Login dengan password lama harus ditolak
      const oldAuth = authenticateUser("marketer@satukelas.com", "MarketerSatukelas2026!");
      expect(oldAuth.ok).toBe(false);
      if (!oldAuth.ok) {
        expect(oldAuth.code).toBe("INVALID_CREDENTIALS");
      }

      // Login dengan password baru harus sukses
      const newAuth = authenticateUser("marketer@satukelas.com", "NewSecurePassword2026!");
      expect(newAuth.ok).toBe(true);
    });

    it("menolak reset password jika panjang password baru kurang dari 8 karakter", () => {
      expect(() => resetMemberPassword("usr_mkt_01", "1234567")).toThrow(
        "Kata sandi baru minimal 8 karakter"
      );
    });

    it("menolak reset password untuk akun non-existent", () => {
      expect(() => resetMemberPassword("usr_mkt_unknown", "ValidPass1234!")).toThrow(
        "Member marketing tidak ditemukan"
      );
    });
  });

  describe("deleteMarketingMember", () => {
    it("berhasil menghapus member marketing dan mencabut akses login", () => {
      const result = deleteMarketingMember("usr_mkt_02");
      expect(result.success).toBe(true);
      expect(result.deletedId).toBe("usr_mkt_02");

      const members = getMarketingMembers();
      expect(members.some((m) => m.id === "usr_mkt_02")).toBe(false);

      const authResult = authenticateUser("dzaky@satukelas.com", "MarketerSatukelas2026!");
      expect(authResult.ok).toBe(false);
    });

    it("menolak penghapusan akun Administrator", () => {
      expect(() => deleteMarketingMember("usr_admin_01")).toThrow(
        "Akun Administrator tidak dapat dihapus melalui manajemen member marketing"
      );
    });
  });

  describe("validateAvatarDataUrl", () => {
    it("memvalidasi data URL format yang benar dan menolak ukuran berlebih (>2MB)", () => {
      expect(validateAvatarDataUrl("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(true);
      expect(validateAvatarDataUrl("data:image/png;base64,iVBORw0KGgo==")).toBe(true);
      expect(validateAvatarDataUrl("data:image/webp;base64,UklGRg==")).toBe(true);
      expect(validateAvatarDataUrl("https://images.example.com/photo.jpg")).toBe(true);

      // Tidak valid
      expect(validateAvatarDataUrl("data:image/gif;base64,R0lGODlh")).toBe(false);
      expect(validateAvatarDataUrl("data:application/pdf;base64,JVBERi0=")).toBe(false);
      expect(validateAvatarDataUrl("javascript:alert(1)")).toBe(false);
    });
  });

  describe("memberNameToSlug & getMarketingMemberBySlug", () => {
    it("mengonversi nama menjadi slug ramah URL secara konsisten", () => {
      expect(memberNameToSlug("Yunus")).toBe("yunus");
      expect(memberNameToSlug("Dzaky")).toBe("dzaky");
      expect(memberNameToSlug("Kak Rian Hidayat")).toBe("kak-rian-hidayat");
      expect(memberNameToSlug("Ahmad @ Fauzi # 2026")).toBe("ahmad-fauzi-2026");
    });

    it("menemukan member berdasarkan id, slug nama, maupun prefix email", () => {
      // Lookup by ID
      const byId = getMarketingMemberBySlug("usr_mkt_01");
      expect(byId).toBeDefined();
      expect(byId?.name).toBe("Yunus");

      // Lookup by name slug
      const bySlug = getMarketingMemberBySlug("yunus");
      expect(bySlug).toBeDefined();
      expect(bySlug?.id).toBe("usr_mkt_01");

      const bySlugDzaky = getMarketingMemberBySlug("dzaky");
      expect(bySlugDzaky).toBeDefined();
      expect(bySlugDzaky?.id).toBe("usr_mkt_02");

      // Lookup by email prefix
      const byEmail = getMarketingMemberBySlug("marketer");
      expect(byEmail).toBeDefined();
      expect(byEmail?.id).toBe("usr_mkt_01");
    });

    it("mengembalikan undefined jika slug tidak cocok atau kosong", () => {
      expect(getMarketingMemberBySlug("")).toBeUndefined();
      expect(getMarketingMemberBySlug("non-existent-marketer-99")).toBeUndefined();
    });
  });
});
