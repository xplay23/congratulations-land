import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: { ru: "Пользователь", uk: "Користувач", en: "User" },
    plural: { ru: "Пользователи", uk: "Користувачі", en: "Users" },
  },
  auth: {
    tokenExpiration: 2592000, // 30 days
  },
  admin: {
    useAsTitle: "email",
    group: { ru: "Система", uk: "Система", en: "System" },
    defaultColumns: ["email", "createdAt"],
  },
  timestamps: true,
  fields: [],
};
