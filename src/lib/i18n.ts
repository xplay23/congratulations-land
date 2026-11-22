import type { ArtStyle, CompanionGender, LayoutMode, Lang, StoryTone } from "./types";

export interface StorybookPreset {
  tone: StoryTone;
  settingId: string;
  plotId: string;
}

export interface CuratedOption {
  id: string;
  icon:
    | "wand"
    | "rocket"
    | "waves"
    | "paw"
    | "cpu"
    | "home"
    | "snowflake"
    | "compass"
    | "heart"
    | "shield"
    | "sparkles"
    | "map";
  title: { uk: string; ru: string };
  desc: { uk: string; ru: string };
  value: { uk: string; ru: string };
}

/** 7 broad genre worlds (+ 8th "custom" card in UI = balanced 4x2 grid) */
export const SETTING_OPTIONS: CuratedOption[] = [
  {
    id: "fantasy",
    icon: "wand",
    title: { uk: "Чарівне фентезі", ru: "Волшебное фэнтези" },
    desc: { uk: "Магія, замки, ліси й добрі дракони", ru: "Магия, замки, леса и добрые драконы" },
    value: {
      uk: "Чарівний світ фентезі з давнім лісом, замками та доброю магією",
      ru: "Волшебный мир фэнтези с древним лесом, замками и доброй магией",
    },
  },
  {
    id: "space",
    icon: "rocket",
    title: { uk: "Космос і планети", ru: "Космос и планеты" },
    desc: { uk: "Ракети, сузір'я й нові світи", ru: "Ракеты, созвездия и далёкие миры" },
    value: {
      uk: "Безмежний космос із яскравими планетами, зорями та дружніми станціями",
      ru: "Бескрайний космос с яркими планетами, звёздами и космическими станциями",
    },
  },
  {
    id: "underwater",
    icon: "waves",
    title: { uk: "Підводний світ", ru: "Подводный мир" },
    desc: { uk: "Коралові міста, дельфіни й перлини", ru: "Коралловые города, дельфины и тайны" },
    value: {
      uk: "Казковий підводний океан із кораловими містами, дельфінами та світлячками",
      ru: "Сказочный подводный океан с коралловыми городами и дружелюбными обитателями",
    },
  },
  {
    id: "dinosaurs",
    icon: "paw",
    title: { uk: "Світ динозаврів", ru: "Мир динозавров" },
    desc: { uk: "Джунглі, давні долини та пригоди", ru: "Джунгли, древние долины и приключения" },
    value: {
      uk: "Загублена сонячна долина добрих динозаврів серед тропічних джунглів",
      ru: "Затерянная солнечная долина добрых динозавров среди тропических джунглей",
    },
  },
  {
    id: "scifi",
    icon: "cpu",
    title: { uk: "Фантастика й роботи", ru: "Фантастика и роботы" },
    desc: { uk: "Розумні помічники й чудо-механізми", ru: "Умные роботы-помощники и изобретения" },
    value: {
      uk: "Фантастичний світ добрих роботів, літаючих кораблів і винахідників",
      ru: "Фантастический мир добрых роботов, летающих кораблей и изобретателей",
    },
  },
  {
    id: "cozy_city",
    icon: "home",
    title: { uk: "Затишне місто й дім", ru: "Уютный город и дом" },
    desc: { uk: "Магія в буденності: парк, горище, двір", ru: "Магия в обычной жизни: парк, дом, пекарня" },
    value: {
      uk: "Затишне рідне місто, парк і теплий дім, де несподівано оживає маленьке диво",
      ru: "Уютный родной город, парк и тёплый дом, где неожиданно оживает чудо",
    },
  },
  {
    id: "winter_holiday",
    icon: "snowflake",
    title: { uk: "Зимова казка", ru: "Зимняя сказка" },
    desc: { uk: "Сніг, сяйво й передсвяткове тепло", ru: "Снег, сияние и предпраздничное чудо" },
    value: {
      uk: "Святкова зимова країна з пухнастим снігом, вогниками та північним сяйвом",
      ru: "Праздничная зимняя страна с пушистым снегом, огоньками и северным сиянием",
    },
  },
];

/** 5 universal plot arcs (+ 6th "custom" card in UI = balanced 3x2 grid) */
export const PLOT_OPTIONS: CuratedOption[] = [
  {
    id: "mystery_treasure",
    icon: "compass",
    title: { uk: "Пошук таємниці чи скарбу", ru: "Поиск тайны или сокровища" },
    desc: { uk: "Загадки, старовинна карта й дивовижна знахідка", ru: "Загадки, карта и удивительная находка" },
    value: {
      uk: "Герой знаходить загадкову підказку й розкриває таємницю незвичайного скарбу",
      ru: "Герой находит загадочную подсказку и раскрывает тайну удивительного сокровища",
    },
  },
  {
    id: "help_friend",
    icon: "heart",
    title: { uk: "Допомога другу", ru: "Помощь другу" },
    desc: { uk: "Турбота, командна робота та добре серце", ru: "Забота, взаимовыручка и доброе сердце" },
    value: {
      uk: "Хтось із мешканців світу потребує допомоги, і герой вирушає рятувати нового друга",
      ru: "Кто-то из жителей мира нуждается в помощи, и герой отправляется выручать нового друга",
    },
  },
  {
    id: "courage",
    icon: "shield",
    title: { uk: "Шлях до сміливості", ru: "Путь к смелости" },
    desc: { uk: "М'яке подолання страху й віра в себе", ru: "Мягкое преодоление страха и уверенность" },
    value: {
      uk: "Спочатку герой трохи хвилюється перед новим або темрявою, але крок за кроком стає сміливим",
      ru: "Сначала герой немного боится нового или темноты, но шаг за шагом открывает в себе смелость",
    },
  },
  {
    id: "discovery",
    icon: "sparkles",
    title: { uk: "Чарівне відкриття", ru: "Волшебное открытие" },
    desc: { uk: "Незвичний винахід, дослід і допитливість", ru: "Необычное изобретение и любознательность" },
    value: {
      uk: "Допитливий герой створює чи знаходить дивовижну річ, яка змінює усе навколо на краще",
      ru: "Любознательный герой создаёт или находит удивительную вещь, которая меняет мир вокруг к лучшему",
    },
  },
  {
    id: "big_journey",
    icon: "map",
    title: { uk: "Велика подорож до мрії", ru: "Большое путешествие к мечте" },
    desc: { uk: "Дорога крізь випробування до завітної мети", ru: "Дорога через приключения к заветной цели" },
    value: {
      uk: "Захоплива мандрівка до далекої мети, де кожна зупинка вчить чомусь новому",
      ru: "Увлекательное путешествие к далёкой цели, где каждая остановка дарит новое открытие",
    },
  },
];

export const STORYBOOK_PRESETS: StorybookPreset[] = [
  { tone: "magical", settingId: "fantasy", plotId: "mystery_treasure" },
  { tone: "cozy", settingId: "cozy_city", plotId: "courage" },
  { tone: "adventure", settingId: "space", plotId: "big_journey" },
  { tone: "funny", settingId: "dinosaurs", plotId: "discovery" },
];

export const ART_STYLE_META: Record<
  ArtStyle,
  {
    label: { uk: string; ru: string };
    desc: { uk: string; ru: string };
    previewImage: string;
    prompt: string;
  }
> = {
  watercolor: {
    label: { uk: "Акварель та гуаш", ru: "Акварель и гуашь" },
    desc: {
      uk: "Живі мазки пензля на фактурному папері",
      ru: "Живые мазки кисти на фактурной бумаге",
    },
    previewImage: "/samples/style_watercolor.jpg",
    prompt:
      "Classic European watercolor and ink children's book illustration with luminous translucent washes, delicate sepia linework, gentle paper grain, and warm sunlit depth",
  },
  "3d_pixar": {
    label: { uk: "3D-мультфільм", ru: "3D-мультфильм" },
    desc: {
      uk: "Сучасна об'ємна 3D-анімація з кіносвітлом",
      ru: "Современная объёмная 3D-анимация с киносветом",
    },
    previewImage: "/samples/style_3d.jpg",
    prompt:
      "High-craft stylized 3D animated feature film still, smooth stylized facial proportions, expressive large eyes, soft subsurface scattering, clean sculpted hair strands, cinematic volumetric rim lighting, shallow depth of field",
  },
  folk_storybook: {
    label: { uk: "Казкова книжкова графіка", ru: "Сказочная книжная графика" },
    desc: {
      uk: "Детальні орнаменти та затишні візерунки",
      ru: "Детальные орнаменты и уютные узоры",
    },
    previewImage: "/samples/style_folk.jpg",
    prompt:
      "Eastern European folk gouache children's book illustration with rich matte paint, visible painterly brushwork, warm atmospheric lighting, stylized storybook proportions, and embroidered folk motifs",
  },
  pencil_gouache: {
    label: { uk: "Олівець та пастель", ru: "Карандаш и пастель" },
    desc: {
      uk: "Ніжні штрихи олівців на теплому папері",
      ru: "Нежные штрихи карандашей на тёплой бумаге",
    },
    previewImage: "/samples/style_pencil.jpg",
    prompt:
      "Gentle children's picture-book illustration in soft colored pencils and velvety pastel shading on smooth warm cream vellum, sweet simplified storybook character proportions, soft powdery light gradients, delicate pencil outlines, clean smooth matte finish with ZERO noisy canvas bump, ZERO moire, ZERO wavy cross-hatch artifacts, ZERO 3D CGI",
  },
  "2d_animation": {
    label: { uk: "Тепла 2D-анімація", ru: "Тёплый 2D-мультфильм" },
    desc: {
      uk: "Класичний рисований мультфільм з сонячним світлом",
      ru: "Классический рисованный мультфильм с мягким светом",
    },
    previewImage: "/samples/style_2d.jpg",
    prompt:
      "Warm hand-drawn 2D animated feature film frame (classic theatrical Studio Ghibli-inspired 2D cel animation aesthetic), crisp clean dark ink cel linework, clean flat cel-shading with soft sunlit highlights, clean smooth hand-painted background scenery, ZERO 3D CGI rendering, ZERO noisy canvas weave, ZERO wavy paper ripple",
  },
  claymation: {
    label: { uk: "Пластилін і повсть", ru: "Пластилин и войлок" },
    desc: {
      uk: "Тактильна лялькова мініатюра ручної роботи",
      ru: "Тактильная кукольная миниатюра ручной работы",
    },
    previewImage: "/samples/style_clay.jpg",
    prompt:
      "Charming stop-motion claymation and needle-felted wool miniature diorama still, characters MUST have simplified stylized sculpted matte plasticine clay heads and hands (smooth matte clay skin, round glossy bead-like doll eyes, simple sculpted clay nose and rosy cheeks, never photorealistic human skin), miniature knitted and stitched felt outfits, cozy handcrafted tabletop miniature set, warm softbox studio lighting, shallow depth of field",
  },
};

export const LAYOUT_META: Record<
  LayoutMode,
  {
    label: { uk: string; ru: string };
    desc: { uk: string; ru: string };
    previewImage: string;
    badge?: { uk: string; ru: string };
  }
> = {
  classic: {
    label: { uk: "Класична книга", ru: "Классическая книга" },
    desc: {
      uk: "Окрема сторінка з ілюстрацією в рамці + кремова сторінка з текстом і віньєткою",
      ru: "Отдельная страница с иллюстрацией в рамке + кремовая страница с текстом и виньеткой",
    },
    previewImage: "/samples/layout_classic.jpg",
    badge: { uk: "За замовчуванням", ru: "По умолчанию" },
  },
  panorama: {
    label: { uk: "Панорамний розворот", ru: "Панорамный разворот" },
    desc: {
      uk: "Єдина широка ілюстрація на обидві сторінки зі спокійною зоною під текст",
      ru: "Единая широкая иллюстрация на обе страницы со спокойной зоной под текст",
    },
    previewImage: "/samples/layout_panorama.jpg",
  },
};

export const TONE_LABELS: Record<StoryTone, { uk: string; ru: string }> = {
  cozy: { uk: "Тепла перед сном", ru: "Тёплая перед сном" },
  magical: { uk: "Чарівна казка", ru: "Волшебная сказка" },
  adventure: { uk: "Динамічна пригода", ru: "Динамичное приключение" },
  funny: { uk: "Весела й кумедна", ru: "Весёлая и смешная" },
};

export const TONE_SUBTITLES: Record<StoryTone, { uk: string; ru: string }> = {
  cozy: { uk: "Спокійний ритм на ніч", ru: "Спокойный ритм на ночь" },
  magical: { uk: "Дива та казкове світло", ru: "Чудеса и сказочный свет" },
  adventure: { uk: "Загадки й активні події", ru: "Загадки и движение" },
  funny: { uk: "Добрий гумор і сміх", ru: "Добрый юмор и улыбки" },
};

export const HAIR_SWATCHES = [
  { id: "blonde", color: "#e6c373", uk: "Світле", ru: "Светлые" },
  { id: "brown", color: "#8c5832", uk: "Русяве", ru: "Русые" },
  { id: "dark", color: "#2b211c", uk: "Темне", ru: "Тёмные" },
  { id: "red", color: "#c9582b", uk: "Руде", ru: "Рыжие" },
];

export const EYE_SWATCHES = [
  { id: "blue", color: "#4f8fd6", uk: "Блакитні", ru: "Голубые" },
  { id: "green", color: "#4d936c", uk: "Зелені", ru: "Зелёные" },
  { id: "brown", color: "#754c29", uk: "Карі", ru: "Карие" },
  { id: "gray", color: "#8d99ae", uk: "Сірі", ru: "Серые" },
];

export const TOY_PRESETS = [
  { uk: "Плюшевий ведмедик у шарфику", ru: "Плюшевый мишка в шарфике" },
  { uk: "Срібний компас", ru: "Серебряный компас" },
  { uk: "Дерев'яний літачок", ru: "Деревянный самолётик" },
  { uk: "В'язаний зайчик", ru: "Вязаный зайчик" },
];

export interface PetSpeciesOption {
  id: string;
  uk: string;
  ru: string;
  en: string;
}

export const PET_SPECIES_OPTIONS: PetSpeciesOption[] = [
  { id: "dog", uk: "Собака", ru: "Собака", en: "dog" },
  { id: "cat", uk: "Кіт / Кішка", ru: "Кот / Кошка", en: "cat" },
  { id: "parrot", uk: "Папуга / Птах", ru: "Попугай / Птица", en: "parrot" },
  { id: "rabbit", uk: "Кролик", ru: "Кролик", en: "rabbit" },
  { id: "hamster", uk: "Хом'як / Свинка", ru: "Хомяк / Свинка", en: "hamster" },
  { id: "turtle", uk: "Черепаха", ru: "Черепаха", en: "turtle" },
];

export interface FamilyRelationOption {
  id: string;
  uk: string;
  ru: string;
  en: string;
  impliedGender: CompanionGender;
}

export const FAMILY_RELATION_OPTIONS: FamilyRelationOption[] = [
  { id: "mom", uk: "Мама", ru: "Мама", en: "mother", impliedGender: "female" },
  { id: "dad", uk: "Тато", ru: "Папа", en: "father", impliedGender: "male" },
  { id: "grandma", uk: "Бабуся", ru: "Бабушка", en: "grandmother", impliedGender: "female" },
  { id: "grandpa", uk: "Дідусь", ru: "Дедушка", en: "grandfather", impliedGender: "male" },
  { id: "sister", uk: "Сестра", ru: "Сестра", en: "sister", impliedGender: "female" },
  { id: "brother", uk: "Брат", ru: "Брат", en: "brother", impliedGender: "male" },
  { id: "aunt", uk: "Тітка", ru: "Тётя", en: "aunt", impliedGender: "female" },
  { id: "uncle", uk: "Дядько", ru: "Дядя", en: "uncle", impliedGender: "male" },
];

export interface VideoPraiseOption {
  id: string;
  icon: "book" | "home" | "bike" | "palette" | "heart";
  title: { uk: string; ru: string };
  desc: { uk: string; ru: string };
  phrase: {
    uk: { boy: string; girl: string };
    ru: { boy: string; girl: string };
  };
}

export const VIDEO_PRAISE_OPTIONS: VideoPraiseOption[] = [
  {
    id: "sport",
    icon: "bike",
    title: { uk: "Спорт і нові вміння", ru: "Спорт и новые навыки" },
    desc: { uk: "Велосипед, спорт чи активність", ru: "Велосипед, спорт или секция" },
    phrase: {
      uk: {
        boy: "навчився кататися на велосипеді й помагаєш мамі",
        girl: "навчилася кататися на велосипеді й помагаєш мамі",
      },
      ru: {
        boy: "научился кататься на велосипеде и помогаешь маме",
        girl: "научилась кататься на велосипеде и помогаешь маме",
      },
    },
  },
  {
    id: "study",
    icon: "book",
    title: { uk: "Навчання та читання", ru: "Учёба и чтение" },
    desc: { uk: "Школа, садочок і перші книжки", ru: "Школа, садик и первые книжки" },
    phrase: {
      uk: {
        boy: "старанно вчишся в школі та багато читаєш",
        girl: "старанно вчишся в школі та багато читаєш",
      },
      ru: {
        boy: "старательно читаешь книжки и радуешь успехами",
        girl: "старательно читаешь книжки и радуешь успехами",
      },
    },
  },
  {
    id: "help",
    icon: "home",
    title: { uk: "Допомога вдома", ru: "Помощь по дому" },
    desc: { uk: "Порядок і турбота про близьких", ru: "Порядок и забота о родных" },
    phrase: {
      uk: {
        boy: "став справжнім помічником для мами й тата",
        girl: "стала справжньою помічницею для мами й тата",
      },
      ru: {
        boy: "стал настоящим помощником для мамы и папы",
        girl: "стала настоящей помощницей для мамы и папы",
      },
    },
  },
  {
    id: "art",
    icon: "palette",
    title: { uk: "Творчість і таланти", ru: "Творчество и таланты" },
    desc: { uk: "Малювання, музика чи ліплення", ru: "Рисование, музыка или поделки" },
    phrase: {
      uk: {
        boy: "дуже гарно малюєш і тішиш рідних своїми роботами",
        girl: "дуже гарно малюєш і тішиш рідних своїми роботами",
      },
      ru: {
        boy: "очень красиво рисуешь и радуешь родных поделками",
        girl: "очень красиво рисуешь и радуешь родных поделками",
      },
    },
  },
  {
    id: "kindness",
    icon: "heart",
    title: { uk: "Доброта й сміливість", ru: "Доброта и смелость" },
    desc: { uk: "Щире серце та гарні вчинки", ru: "Доброе сердце и смелые поступки" },
    phrase: {
      uk: {
        boy: "маєш дуже добре серце й піклуєшся про молодших",
        girl: "маєш дуже добре серце й піклуєшся про молодших",
      },
      ru: {
        boy: "заботишься о близких и даришь всем добрые улыбки",
        girl: "заботишься о близких и даришь всем добрые улыбки",
      },
    },
  },
];

export function formatAgeWithUnit(age: number, lang: Lang): string {
  if (lang === "uk") {
    if (age === 1) return "1 рік";
    if (age >= 2 && age <= 4) return `${age} роки`;
    return `${age} років`;
  }
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

export const VIDEO_ACHIEVEMENT_PRESETS = {
  uk: [
    "навчився кататися на велосипеді й помагаєш мамі",
    "старанно вчишся в школі та піклуєшся про рідних",
    "дуже любиш малювати й даруєш усім щирі усмішки",
  ],
  ru: [
    "научился кататься на велосипеде и помогаешь маме",
    "старательно читаешь книжки и заботишься о близких",
    "очень любишь рисовать и даришь родным тёплые улыбки",
  ],
};

export const UI_TEXT = {
  uk: {
    brand: "VideoVitannya",
    tagline: "Персональні цифрові подарунки",
    navHome: "Головна",
    navStorybook: "Казка PDF",
    navVideo: "Відеопривітання",
    heroTitle: "Персоналізовані відеопривітання та казки-книги PDF для дітей",
    heroSub:
      "Заповніть прості кроки персоналізації — перегляньте прев'ю з водяним знаком (для казки можна підправити текст чи ілюстрацію) — оплатіть через Plata by mono та завантажте чистий HD MP4 або друкований PDF.",
    ctaStorybook: "Створити казку PDF",
    ctaVideo: "Замовити відеопривітання",
    assistantBtn: "ІІ-помічник",
    howItWorks: "Єдиний прозорий шлях до дива",
    steps: [
      { title: "1. Персоналізація", desc: "Ім'я, вік, досягнення для відео або сюжет і стиль казки (фото — опціонально для книг)" },
      { title: "2. Створення", desc: "Штучний інтелект готує сценарій, живу озвучку або серію ілюстрацій в єдиному стилі" },
      { title: "3. Прев'ю до оплати", desc: "Ви заздалегідь дивитесь і слухаєте результат із водяним знаком та можете внести правки" },
      { title: "4. Оплата й видача", desc: "Разова оплата через Plata by mono + чистий файл без водяних знаків у кабінеті та Telegram" },
    ],
  },
  ru: {
    brand: "VideoVitannya",
    tagline: "Персональные цифровые подарки",
    navHome: "Главная",
    navStorybook: "Сказка PDF",
    navVideo: "Видеопоздравление",
    heroTitle: "Персонализированные видеопоздравления и сказки-книги PDF для детей",
    heroSub:
      "Заполните простые шаги персонализации — посмотрите превью с водяным знаком (для сказки можно поправить текст или иллюстрацию) — оплатите через Plata by mono и скачайте чистый HD MP4 или печатный PDF.",
    ctaStorybook: "Создать сказку PDF",
    ctaVideo: "Заказать видеопоздравление",
    assistantBtn: "ИИ-помощник",
    howItWorks: "Единый прозрачный путь к чуду",
    steps: [
      { title: "1. Персонализация", desc: "Имя, возраст, достижение для видео или сюжет и стиль сказки (фото — опционально для книг)" },
      { title: "2. Создание", desc: "ИИ готовит историю, живую озвучку или серию иллюстраций в едином стиле" },
      { title: "3. Превью до оплаты", desc: "Вы заранее видите и слышите результат с водяным знаком и можете внести правки" },
      { title: "4. Оплата и выдача", desc: "Разовая оплата через Plata by mono + чистый файл без водяных знаков в кабинете и Telegram" },
    ],
  },
} as const;

export function getStorybookPriceUah(pageCount?: number): number {
  const base = Number(process.env.STORYBOOK_PRICE_UAH || "199");
  const longExtra = Number(process.env.STORYBOOK_LONG_EXTRA_UAH || "50");
  if (typeof pageCount === "number" && pageCount >= 8) {
    return base + longExtra;
  }
  return base;
}

export function getPriceKopiykas(productType: "storybook" | "video", pageCount?: number): number {
  const uah =
    productType === "storybook"
      ? getStorybookPriceUah(pageCount)
      : Number(process.env.VIDEO_PRICE_UAH || "249");
  return Math.round(uah * 100);
}

export function getProgressLabel(step: string, lang: Lang): string {
  const map: Record<string, { uk: string; ru: string }> = {
    queued: { uk: "У черзі на створення...", ru: "В очереди на создание..." },
    photo_vision: { uk: "Вивчаємо деталі фото для портретної схожості...", ru: "Изучаем детали фото для портретного сходства..." },
    story_beats: { uk: "Крок 1/4: будуємо сюжетні біти...", ru: "Шаг 1/4: строим сюжетные биты..." },
    story_draft: { uk: "Крок 2/4: пишемо й оживляємо текст...", ru: "Шаг 2/4: пишем и оживляем текст..." },
    story_proofread: { uk: "Крок 3/4: коректор перевіряє відмінки...", ru: "Шаг 3/4: корректор проверяет падежи..." },
    story_director: { uk: "Крок 4/4: режисуємо ракурси та сцени...", ru: "Шаг 4/4: режиссируем ракурсы и сцены..." },
    anchor_portrait: { uk: "Створюємо канонічний портрет героя...", ru: "Создаём канонический портрет героя..." },
    illustrations: { uk: "Малюємо обкладинку та сторінки...", ru: "Рисуем обложку и страницы..." },
    illustrations_preview: { uk: "Малюємо обкладинку та перші сторінки прев'ю...", ru: "Рисуем обложку и первые страницы превью..." },
    illustrations_final: { uk: "Домальовуємо решту сторінок та збираємо чистий PDF...", ru: "Дорисовываем оставшиеся страницы и собираем чистый PDF..." },
    pdf_compile: { uk: "Верстаємо прев'ю та друкований PDF...", ru: "Верстаем превью и печатный PDF..." },
    video_tts: { uk: "Озвучуємо персональні репліки (ElevenLabs)...", ru: "Озвучиваем персональные реплики (ElevenLabs)..." },
    video_render: { uk: "Монтуємо HD-відео й врізаємо фото в книгу...", ru: "Монтируем HD-видео и врезаем фото в книгу..." },
    video_preview: { uk: "Готуємо захищене прев'ю відео...", ru: "Готовим защищённое превью видео..." },
    preview_ready: { uk: "Прев'ю готове до перегляду!", ru: "Превью готово к просмотру!" },
    failed: { uk: "Виникла помилка генерації", ru: "Возникла ошибка генерации" },
  };
  return map[step]?.[lang] ?? step;
}
