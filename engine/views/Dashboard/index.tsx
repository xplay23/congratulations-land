import { redirect } from "next/navigation";
import type { ServerProps } from "payload";
import { AdminClientWrapper } from "../AdminClientWrapper";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";

export default async function Dashboard(props: ServerProps) {
  if (!props.user) redirect("/admin/login");

  const quickLinks = [
    {
      href: "/admin/orders",
      title: "Замовлення і Підтримка",
      desc: "Інспектор замовлень, Resume, Sync Mono, повернення холду та +1 AI-правка.",
    },
    {
      href: "/admin/tariffs",
      title: "Тарифи та Ліміти",
      desc: "Ціни казок та відео, видимість послуг, ліміти прев'ю і курси витрат ШІ.",
    },
    {
      href: "/admin/globals/ai-settings",
      title: "Налаштування OpenAI та ElevenLabs",
      desc: "Моделі тексту/картинок, Vision QA, API-ключі та голос ElevenLabs.",
    },
  ];

  return (
    <div className="adm-page">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--adm-fs-page-h1)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--theme-text)",
            }}
          >
            Dashboard · VideoVitannya
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "var(--adm-fs-caption)",
              color: "var(--adm-color-muted)",
            }}
          >
            Операційна аналітика замовлень, витрат ШІ та маржинальності платформи
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {quickLinks.map((card) => (
          <a
            key={card.href}
            href={card.href}
            style={{
              display: "block",
              padding: "16px 18px",
              borderRadius: "var(--adm-radius-lg)",
              background: "var(--adm-card-bg)",
              border: "1px solid var(--adm-card-border)",
              textDecoration: "none",
              color: "var(--theme-text)",
            }}
          >
            <div
              style={{
                fontSize: "var(--adm-fs-body)",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              {card.title} →
            </div>
            <div
              style={{
                fontSize: "var(--adm-fs-caption)",
                color: "var(--adm-color-muted)",
                lineHeight: 1.4,
              }}
            >
              {card.desc}
            </div>
          </a>
        ))}
      </div>

      <AdminClientWrapper>
        <AdminAnalyticsTab />
      </AdminClientWrapper>
    </div>
  );
}
