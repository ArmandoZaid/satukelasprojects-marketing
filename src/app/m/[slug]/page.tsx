import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMarketingMemberBySlug } from "@/lib/member-store";
import { MemberLanding } from "@/components/member-landing";

interface ShortMemberPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ShortMemberPageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = getMarketingMemberBySlug(slug);

  if (!member || !member.isActive) {
    return {
      title: "Member Tidak Ditemukan | Satukelas Projects",
      description: "Halaman profil member marketing Satukelas Projects.",
    };
  }

  return {
    title: `${member.name} — Konsultan Buku Tahunan & Solusi Media Sekolah | Satukelas Projects`,
    description: `Konsultasi buku tahunan sekolah (BTS) inovasi AR, video profile sinematik, dan dokumentasi wisuda bersama ${member.name} di Satukelas Projects.`,
  };
}

export default async function ShortMemberProfilePage({ params }: ShortMemberPageProps) {
  const { slug } = await params;
  const member = getMarketingMemberBySlug(slug);

  if (!member || !member.isActive) {
    notFound();
  }

  return <MemberLanding member={member} />;
}
