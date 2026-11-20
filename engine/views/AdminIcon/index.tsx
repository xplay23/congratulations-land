import { getPayload } from "@engine/lib/payload";

export default async function AdminIcon() {
  try {
    const payload = await getPayload();
    const settings = (await payload.findGlobal({
      slug: "site-settings",
      depth: 1,
    })) as {
      siteName?: string | null;
      favicon?: { url?: string | null } | number | null;
    };

    const siteName = settings.siteName ?? "VideoVitannya";
    const firstLetter = siteName.charAt(0).toUpperCase() || "V";
    const favicon = settings.favicon;

    if (favicon && typeof favicon === "object" && favicon.url) {
      return (
        <img
          src={favicon.url}
          alt={siteName}
          style={{ width: "32px", height: "32px", objectFit: "contain" }}
        />
      );
    }

    return (
      <span style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1 }}>
        {firstLetter}
      </span>
    );
  } catch {
    return (
      <span style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1 }}>
        V
      </span>
    );
  }
}
