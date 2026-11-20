import { getPayload } from "@engine/lib/payload";

export default async function AdminLogo() {
  try {
    const payload = await getPayload();
    const settings = (await payload.findGlobal({
      slug: "site-settings",
      depth: 1,
    })) as {
      siteName?: string | null;
      logo?: { url?: string | null } | number | null;
    };

    const siteName = settings.siteName ?? "VideoVitannya";
    const logo = settings.logo;

    if (logo && typeof logo === "object" && logo.url) {
      return (
        <img
          src={logo.url}
          alt={siteName}
          style={{ maxHeight: "40px", maxWidth: "160px", objectFit: "contain" }}
        />
      );
    }

    return (
      <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>{siteName}</span>
    );
  } catch {
    return (
      <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>
        VideoVitannya
      </span>
    );
  }
}
