import { redirect } from "next/navigation";
import { DefaultTemplate } from "@payloadcms/next/templates";
import type {
  PayloadRequest,
  SanitizedPermissions,
  ServerProps,
  VisibleEntities,
} from "payload";
import { AdminClientWrapper } from "../AdminClientWrapper";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";

interface ExtendedServerProps extends ServerProps {
  viewActions?: string[];
  initPageResult?: {
    req?: PayloadRequest;
    permissions?: SanitizedPermissions;
    visibleEntities?: VisibleEntities;
  };
}

export function TariffsPageView(props: ExtendedServerProps) {
  const user = props.user ?? props.initPageResult?.req?.user;
  if (!user) redirect("/admin/login");

  const { viewActions, initPageResult } = props;
  const visibleEntities = initPageResult?.visibleEntities ??
    props.visibleEntities ?? {
      collections: [],
      globals: [],
    };
  const req = initPageResult?.req;
  const permissions = initPageResult?.permissions ?? props.permissions;
  const isUk = props.i18n?.language === "uk";

  return (
    <DefaultTemplate
      i18n={props.i18n}
      locale={props.locale}
      params={props.params}
      payload={props.payload}
      permissions={permissions}
      req={req}
      searchParams={props.searchParams}
      user={user}
      viewActions={viewActions}
      visibleEntities={visibleEntities}
    >
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
            {isUk ? "Тарифи" : "Тарифы"}
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "var(--adm-fs-body)",
              color: "var(--adm-color-muted)",
            }}
          >
            {isUk
              ? "Ціни, видимість, тексти послуг та курси розрахунку маржі ШІ"
              : "Цены, видимость, тексты услуг и курсы расчёта маржи ИИ"}
          </p>
        </div>

        <AdminClientWrapper>
          <AdminSettingsTab />
        </AdminClientWrapper>
      </div>
    </DefaultTemplate>
  );
}

export default TariffsPageView;
