import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 2592000, // 30 days
  },
  admin: {
    useAsTitle: "email",
    group: "System",
    defaultColumns: ["email", "createdAt"],
  },
  timestamps: true,
  fields: [],
};
