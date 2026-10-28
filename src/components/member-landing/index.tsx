import type { MarketingMember } from "@/lib/member-store";
import { MemberHeader, MemberFooter } from "./member-public-shell";
import { MemberHero } from "./member-hero";
import { ProductsCatalog } from "./products-catalog";
import { WorkflowSection } from "./workflow-section";
import { LeadForm } from "./lead-form";

interface MemberLandingProps {
  member: MarketingMember;
}

export function MemberLanding({ member }: MemberLandingProps) {
  const firstName = member.name.split(" ")[0];
  const defaultWhatsappMessage = `Halo Kak ${firstName}, saya ingin konsultasi seputar layanan Buku Tahunan & Media Satukelas Projects (Ref: ${member.id} - ${member.name}).`;
  const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(defaultWhatsappMessage)}`;

  return (
    <div className="marketing-public-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <MemberHeader member={member} whatsappUrl={whatsappUrl} />

      <main id="konten" tabIndex={-1} style={{ flexGrow: 1 }}>
        <MemberHero member={member} whatsappUrl={whatsappUrl} />
        <ProductsCatalog />
        <WorkflowSection member={member} />
        <LeadForm member={{ id: member.id, name: member.name }} />
      </main>

      <MemberFooter member={member} whatsappUrl={whatsappUrl} />
    </div>
  );
}
