import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMarketingMemberBySlug } from "@/lib/member-store";
import { MemberLanding } from "@/components/member-landing";

interface MemberPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
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
    openGraph: {
      title: `${member.name} — Representative Satukelas Projects`,
      description: `Konsultasi gratis & bawa sampel buku fisik ke sekolah bersama ${member.name}.`,
    },
  };
}

export default async function MemberProfilePage({ params }: MemberPageProps) {
  const { slug } = await params;
  const member = getMarketingMemberBySlug(slug);

  if (!member || !member.isActive) {
    notFound();
  }

  return <MemberLanding member={member} />;
}
