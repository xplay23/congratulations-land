import { redirect } from "next/navigation";
import type { ServerProps } from "payload";
import { AdminClientWrapper } from "../AdminClientWrapper";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";

export default async function Dashboard(props: ServerProps) {
  if (!props.user) redirect("/admin/login");

  const isUk = props.i18n?.language === "uk";

  return (
    <div className="adm-page">
      <div style={{ marginBottom: "22px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--adm-fs-page-h1)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--theme-text)",
          }}
        >
          Дашборд
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "var(--adm-fs-body)",
            color: "var(--adm-color-muted)",
          }}
        >
          {isUk
            ? "Операційна аналітика замовлень, витрат ШІ та маржинальності платформи"
            : "Операционная аналитика заказов, расходов ИИ и маржинальности платформы"}
        </p>
      </div>

      {/* Quick actions bar (future content links will be added after Stage B) */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <a href="/admin/orders" className="aui-btn aui-btn--primary">
          {isUk ? "Замовлення" : "Заказы"}
        </a>
        <a href="/admin/tariffs" className="aui-btn aui-btn--ghost">
          {isUk ? "Тарифи" : "Тарифы"}
        </a>
      </div>

      <div
        style={{
          height: "1px",
          background: "var(--adm-card-border)",
          marginBottom: "24px",
        }}
      />

      <AdminClientWrapper>
        <AdminAnalyticsTab />
      </AdminClientWrapper>
    </div>
  );
}
