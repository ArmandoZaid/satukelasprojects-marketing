export const marketingContact = {
  // Retained from the reviewed mockup; ownership must be confirmed before publication.
  whatsappNumber: "6281234567890",
  displayNumber: "+62 812-3456-7890",
  message: "Halo Satukelas Projects, saya tertarik mendaftar sebagai mitra marketing. Mohon informasi pendaftaran dan persyaratannya.",
} as const;

export const marketingChatUrl = `https://wa.me/${marketingContact.whatsappNumber}?text=${encodeURIComponent(marketingContact.message)}`;
