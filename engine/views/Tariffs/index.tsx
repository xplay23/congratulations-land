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
        <h1
          style={{
            marginBottom: "20px",
            fontSize: "var(--adm-fs-page-h1)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--theme-text)",
          }}
        >
          Тарифи, Ліміти та Курси ШІ
        </h1>
        <AdminClientWrapper>
          <AdminSettingsTab />
        </AdminClientWrapper>
      </div>
    </DefaultTemplate>
  );
}

export default TariffsPageView;
