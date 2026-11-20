import type { CollectionConfig } from "payload";

export const Authors: CollectionConfig = {
  slug: "authors",
  labels: {
    singular: { ru: "Автор", uk: "Автор", en: "Author" },
    plural: { ru: "Авторы", uk: "Автори", en: "Authors" },
  },
  admin: {
    group: { ru: "Блог", uk: "Блог", en: "Blog" },
    useAsTitle: "name",
    defaultColumns: ["name", "role"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "translateBar",
      type: "ui",
      admin: {
        components: {
          Field: "engine/components/admin/TranslateLocaleButton",
        },
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Имя автора", uk: "Ім'я автора", en: "Author Name" },
          admin: { width: "50%" },
        },
        {
          name: "role",
          type: "text",
          localized: true,
          label: { ru: "Роль / должность", uk: "Роль / посада", en: "Role" },
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "bio",
      type: "textarea",
      localized: true,
      label: { ru: "Кратко об авторе", uk: "Коротко про автора", en: "Bio" },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      label: { ru: "Аватар", uk: "Аватар", en: "Avatar" },
    },
  ],
};
