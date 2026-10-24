import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getMarketingMembers,
  resetMarketingMembers,
} from "./member-store";
import { authenticateUser } from "./auth";
import { GET as getMembersHandler, POST as postMemberHandler } from "../app/api/admin/members/route";
import {
  PATCH as patchMemberHandler,
  DELETE as deleteMemberHandler,
} from "../app/api/admin/members/[id]/route";
import { POST as resetPasswordHandler } from "../app/api/admin/members/[id]/reset-password/route";
import * as authModule from "./auth";

function mockAdminSession(): authModule.SessionPayload {
  return {
    userId: "usr_admin_01",
    email: "admin@satukelas.com",
    name: "Administrator",
    role: "ADMIN",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

function mockMarketerSession(): authModule.SessionPayload {
  return {
    userId: "usr_mkt_01",
    email: "marketer@satukelas.com",
    name: "Yunus",
    role: "MARKETER",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

describe("API /api/admin/members (RBAC, CRUD & Reset Password)", () => {
  beforeEach(() => {
    process.env.MARKETING_ENABLE_DEMO_AUTH = "true";
    resetMarketingMembers();
    vi.restoreAllMocks();
  });

  describe("GET /api/admin/members", () => {
    it("menolak akses (401) jika sesi pengguna tidak ada", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(null);

      const response = await getMembersHandler();
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Sesi tidak ditemukan");
    });

    it("menolak akses (403) jika sesi bukan role ADMIN (misal MARKETER)", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue({
        userId: "usr_mkt_01",
        email: "marketer@satukelas.com",
        name: "Yunus",
        role: "MARKETER",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const response = await getMembersHandler();
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("Akses ditolak");
    });

    it("mengizinkan akses (200) untuk role ADMIN dan mengembalikan daftar member marketing tanpa bocor hash", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue({
        userId: "usr_admin_01",
        email: "admin@satukelas.com",
        name: "Administrator",
        role: "ADMIN",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const response = await getMembersHandler();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.members)).toBe(true);
      expect(data.members.length).toBeGreaterThanOrEqual(4);

      // Pastikan atribut sensitif passwordHash tidak bocor ke client
      for (const m of data.members) {
        expect(m.passwordHash).toBeUndefined();
        expect(m.rawPassword).toBeUndefined();
        expect(m.id).toBeDefined();
        expect(m.name).toBeDefined();
        expect(m.email).toBeDefined();
        expect(m.role).toBe("MARKETER");
      }
    });
  });

  describe("POST /api/admin/members", () => {
    it("menolak akses (403) jika diakses oleh MARKETER", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockMarketerSession());

      const req = new Request("http://127.0.0.1:3100/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Budi",
          email: "budi@satukelas.com",
          password: "PasswordBudi123!",
        }),
      });

      const response = await postMemberHandler(req);
      expect(response.status).toBe(403);
    });

    it("berhasil membuat member marketing baru oleh ADMIN dengan gambar profil data URI", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockAdminSession());

      const dummyAvatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const req = new Request("http://127.0.0.1:3100/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Tegar Pratama",
          email: "tegar@satukelas.com",
          password: "PasswordTegar2026!",
          avatarUrl: dummyAvatar,
          isActive: true,
        }),
      });

      const response = await postMemberHandler(req);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.member).toBeDefined();
      expect(data.member.name).toBe("Tegar Pratama");
      expect(data.member.email).toBe("tegar@satukelas.com");
      expect(data.member.avatarUrl).toBe(dummyAvatar);
      expect(data.member.passwordHash).toBeUndefined();

      // Verifikasi langsung bisa login
      const authResult = authenticateUser("tegar@satukelas.com", "PasswordTegar2026!");
      expect(authResult.ok).toBe(true);
    });

    it("mengembalikan status 400 jika validasi gagal (email duplikat atau password pendek)", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockAdminSession());

      // Email duplikat Yunus
      const reqDuplicate = new Request("http://127.0.0.1:3100/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Kloning Yunus",
          email: "marketer@satukelas.com",
          password: "PasswordYunus123!",
        }),
      });

      const resDuplicate = await postMemberHandler(reqDuplicate);
      expect(resDuplicate.status).toBe(400);
      const errDuplicate = await resDuplicate.json();
      expect(errDuplicate.error).toContain("Email sudah terdaftar");
    });
  });

  describe("PATCH /api/admin/members/[id]", () => {
    it("berhasil memperbarui data profil member marketing oleh ADMIN", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockAdminSession());

      const req = new Request("http://127.0.0.1:3100/api/admin/members/usr_mkt_01", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Yunus Al-Hafiz",
          isActive: false,
        }),
      });

      const response = await patchMemberHandler(req, {
        params: Promise.resolve({ id: "usr_mkt_01" }),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.member.name).toBe("Yunus Al-Hafiz");
      expect(data.member.isActive).toBe(false);
    });

    it("mengembalikan 404 jika ID member tidak ditemukan", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockAdminSession());

      const req = new Request("http://127.0.0.1:3100/api/admin/members/usr_mkt_9999", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ghost" }),
      });

      const response = await patchMemberHandler(req, {
        params: Promise.resolve({ id: "usr_mkt_9999" }),
      });
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/admin/members/[id]", () => {
    it("berhasil menghapus member marketing oleh ADMIN", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockAdminSession());

      const req = new Request("http://127.0.0.1:3100/api/admin/members/usr_mkt_03", {
        method: "DELETE",
      });

      const response = await deleteMemberHandler(req, {
        params: Promise.resolve({ id: "usr_mkt_03" }),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.deletedId).toBe("usr_mkt_03");

      const remaining = getMarketingMembers();
      expect(remaining.some((m) => m.id === "usr_mkt_03")).toBe(false);
    });

    it("menolak penghapusan akun Administrator", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockAdminSession());

      const req = new Request("http://127.0.0.1:3100/api/admin/members/usr_admin_01", {
        method: "DELETE",
      });

      const response = await deleteMemberHandler(req, {
        params: Promise.resolve({ id: "usr_admin_01" }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/admin/members/[id]/reset-password", () => {
    it("berhasil mereset kata sandi member marketing oleh ADMIN dan langsung dapat digunakan login", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockAdminSession());

      const req = new Request("http://127.0.0.1:3100/api/admin/members/usr_mkt_02/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: "BrandNewDzakyPassword2026!",
        }),
      });

      const response = await resetPasswordHandler(req, {
        params: Promise.resolve({ id: "usr_mkt_02" }),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verifikasi login dengan password baru
      const newAuth = authenticateUser("dzaky@satukelas.com", "BrandNewDzakyPassword2026!");
      expect(newAuth.ok).toBe(true);
    });

    it("menolak reset password jika kurang dari 8 karakter", async () => {
      vi.spyOn(authModule, "getServerSession").mockResolvedValue(mockAdminSession());

      const req = new Request("http://127.0.0.1:3100/api/admin/members/usr_mkt_02/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: "short",
        }),
      });

      const response = await resetPasswordHandler(req, {
        params: Promise.resolve({ id: "usr_mkt_02" }),
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("minimal 8 karakter");
    });
  });
});
