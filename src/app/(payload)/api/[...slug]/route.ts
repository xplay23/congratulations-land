import type { NextRequest } from "next/server";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
} from "@payloadcms/next/routes";
import config from "@payload-config";

type RouteArgs = {
  params: Promise<{ slug?: string[] }>;
};

export const GET = (request: NextRequest, args: RouteArgs) =>
  REST_GET(config)(request, args);

export const POST = (request: NextRequest, args: RouteArgs) =>
  REST_POST(config)(request, args);

export const PATCH = (request: NextRequest, args: RouteArgs) =>
  REST_PATCH(config)(request, args);

export const DELETE = (request: NextRequest, args: RouteArgs) =>
  REST_DELETE(config)(request, args);

export const OPTIONS = (request: NextRequest, args: RouteArgs) =>
  REST_OPTIONS(config)(request, args);
