import {
  buildChatModelParams,
  getCmsOpenAIRuntime,
  withOpenAIRetry,
} from "@/lib/openai-client";

function renderPromptVars(
  template: string | undefined,
  vars: Record<string, string>
): string | null {
  if (!template || !template.trim()) return null;
  let out = template.trim();
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, val);
  }
  return out;
}
import { ART_STYLE_META, TONE_LABELS } from "@/lib/i18n";
import {
  getStorybookRuntimeConfig,
  resolveStorybookStyle,
  type StorybookRuntimeConfig,
} from "./config";
import type { AiCostTracker } from "@/lib/ai-cost";
import type { PhotoVisualPassports } from "./vision";
import type {
  StoryVisualBible,
  StorybookOrderPayload,
  StoryPageItem,
} from "@/lib/types";

export interface WrittenStoryDraft {
  title: string;
  subtitle: string;
  visualBible: StoryVisualBible;
  coverPrompt: string;
  pages: StoryPageItem[];
  modeUsed: "openai" | "demo";
  writerNotes: string[];
}

function getWordRangeByAge(
  ageGroup: StorybookOrderPayload["ageGroup"],
  sbConfig?: StorybookRuntimeConfig
): string {
  const fromCms = sbConfig?.ageGroups.find((a) => a.code === ageGroup)?.wordRange?.trim();
  if (fromCms) return fromCms;
  switch (ageGroup) {
    case "2-3":
      return "25–40";
    case "4-5":
      return "50–70";
    case "6-8":
    default:
      return "75–105";
  }
}

function extractJsonObject<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return valid JSON");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

function buildAppearanceSummary(
  payload: StorybookOrderPayload,
  childVisualPassport?: string
): string {
  const genderWord =
    payload.lang === "uk"
      ? payload.gender === "girl"
        ? "дівчинка"
        : "хлопчик"
      : payload.gender === "girl"
      ? "девочка"
      : "мальчик";

  const parts = [`${genderWord} (${payload.gender}), ageGroup=${payload.ageGroup}`];
  if (payload.hairColor) parts.push(`hair: ${payload.hairColor}`);
  if (payload.eyeColor) parts.push(`eyes: ${payload.eyeColor}`);
  if (payload.hasGlasses) parts.push("wearing round glasses");
  if (childVisualPassport) {
    parts.push(`Vision traits from uploaded photo: ${childVisualPassport}`);
  } else if (payload.photoUploadId) {
    parts.push("visual likeness grounded in uploaded reference portrait");
  }
  return parts.join("; ");
}

function buildCompanionSummary(
  payload: StorybookOrderPayload,
  companionVisualPassport?: string
): string {
  if (payload.companionType === "none") {
    return "none selected by user (NOT required — keep the story centered on the child; do NOT force a locked companion)";
  }

  const parts: string[] = [`type=${payload.companionType}`];
  if (payload.companionType === "pet" && payload.companionSpecies) {
    parts.push(`AUTHORITATIVE species=${payload.companionSpecies}`);
  }
  if (payload.companionType === "family" && payload.companionRelation) {
    parts.push(`AUTHORITATIVE family relation=${payload.companionRelation}`);
  }
  if (payload.companionGender) {
    const pronoun = payload.companionGender === "male" ? "male (he/him)" : "female (she/her)";
    parts.push(`AUTHORITATIVE gender=${pronoun}`);
  }
  if (payload.companionName?.trim()) {
    parts.push(`name=${payload.companionName.trim()}`);
  }
  if (payload.companionDescription?.trim()) {
    parts.push(`userDescription="${payload.companionDescription.trim()}"`);
  }
  if (companionVisualPassport) {
    parts.push(`Vision appearance from uploaded photo: ${companionVisualPassport}`);
  }
  return parts.join("; ");
}

function buildDemoStory(
  payload: StorybookOrderPayload,
  sbConfig?: StorybookRuntimeConfig
): WrittenStoryDraft {
  const isUk = payload.lang === "uk";
  const name = payload.childName.trim();
  const voc = payload.childNameVocative?.trim() || name;
  const isGirl = payload.gender === "girl";
  const hasCompanion = payload.companionType !== "none";
  const fallbackCompanionLabel =
    payload.companionType === "pet" && payload.companionSpecies
      ? payload.companionSpecies
      : payload.companionType === "family" && payload.companionRelation
      ? payload.companionRelation
      : isUk
      ? "вірний супутник"
      : "верный спутник";
  const companion = hasCompanion
    ? `${payload.companionName?.trim() || fallbackCompanionLabel}${
        payload.companionDescription?.trim() ? ` (${payload.companionDescription.trim()})` : ""
      }`
    : isUk
    ? "лісове світлячко"
    : "лесной огонёк";
  const requestedToy = payload.favoriteToy?.trim() || "";
  const toy = requestedToy || (isUk ? "теплий ліхтарик" : "тёплый фонарик");
  const styleDesc = sbConfig
    ? resolveStorybookStyle(sbConfig, payload.artStyle).stylePrompt
    : ART_STYLE_META[payload.artStyle]?.prompt ||
      ART_STYLE_META.watercolor.prompt;

  const visualBible: StoryVisualBible = {
    characterLock: `Consistent young child ${name} (${buildAppearanceSummary(payload)})`,
    clothingLock: "Warm teal wool coat with wooden buttons, knitted raspberry scarf, dark boots",
    companionLock: hasCompanion ? companion : undefined,
    recurringToyLock: requestedToy || undefined,
    styleLock: styleDesc,
    paletteLock: "Deep twilight indigo, warm amber lantern gold, soft cream snow, teal & raspberry accents",
  };

  const title = isUk
    ? `${name} та таємниця Сяючого Маяка`
    : `${name} и тайна Сияющего Маяка`;
  const subtitle = isUk
    ? "Іменна зимова казка для читання вголос"
    : "Именная зимняя сказка для чтения вслух";

  const pagesUk: Omit<StoryPageItem, "cleanImageFile" | "previewImageFile">[] = [
    {
      pageNumber: 1,
      heading: "Знайдений знак",
      text: `Вечірній сніг тихо лягав на підвіконня, коли ${name} помітила на старій полиці те, чого не бачила раніше, — ${toy}. Варто було ${isGirl ? "їй" : "йому"} торкнутися холодного металу, як стрілка м'яко затремтіла і вказала прямо за вікно, туди, де срібляста стежка вела у ${payload.setting.toLowerCase()}.`,
      imagePrompt: `Child ${name} discovering ${toy} on a cozy wooden attic windowsill with snow falling outside at dusk, warm golden lamp light`,
      textZone: "left",
    },
    {
      pageNumber: 2,
      heading: "Зустріч на стежці",
      text: `Біля входу до засніженої галявини на ${name} уже чекав ${companion}. Хрумтів пухкий сніг, а між ялинками виблискували крихітні золоті іскри. «Не бійся, ${voc}, ми впораємося разом!» — наче прошепотів вітер у гілках, і мандрівники рушили вперед.`,
      imagePrompt: `Child ${name} holding ${toy} meeting ${companion} on a snowy pine forest trail bathed in soft blue twilight and golden sparkles`,
      textZone: "right",
    },
    {
      pageNumber: 3,
      heading: "Завмерлий місток",
      text: `Попереду через дзвінкий струмок тягнувся старий дерев'яний місток, вкритий тонким льодом. ${name} не стала поспішати: ${isGirl ? "вона" : "він"} приклала долоню до поруччя, перевірила кожен крок і допомогла перебратися на той бік. Сміливість виявилася не гучною, а дуже уважною.`,
      imagePrompt: `Child ${name} carefully guiding ${companion} across a frosted wooden bridge over a moonlit stream, holding ${toy}`,
      textZone: "left",
    },
    {
      pageNumber: 4,
      heading: "Згаслий ліхтар",
      text: `На високому пагорбі стояв старий маяк. Його кришталеве вікно не світилося, бо всередині застигла зимова тиша. ${name} обережно примостила ${toy} біля центру лінзи, а ${companion} зігрів скло теплим подихом.`,
      imagePrompt: `Inside the glass lantern room of an antique winter lighthouse, child ${name} placing ${toy} near the crystal prism beside ${companion}`,
      textZone: "right",
    },
    {
      pageNumber: 5,
      heading: "Золота іскра",
      text: `Спершу з'явився один тоненький промінь — теплий, немов свічка в долонях. За мить він підхопив срібне сяйво неба, і над верхівками сосен розлилися зелені та золоті стрічки північного дива. Навіть старі сови на гілках затамували подих.`,
      imagePrompt: `Golden and emerald aurora borealis bursting upward from the lighthouse top into the starry night sky while child ${name} and ${companion} watch in wonder`,
      textZone: "left",
    },
    {
      pageNumber: 6,
      heading: "Дорога додому",
      text: `Повертаючись знайомою стежкою, ${name} тримала ${toy} у кишені, але знала напевне: найяскравіший вогник живе не в металі, а в доброму серці. Удома пахло корицею й теплом, а зорі за вікном лагідно підморгували: «Добраніч, ${voc}!»`,
      imagePrompt: `Child ${name} and ${companion} walking back toward a warmly lit cozy cottage in the snow under northern lights`,
      textZone: "right",
    },
  ];

  const pagesRu: Omit<StoryPageItem, "cleanImageFile" | "previewImageFile">[] = [
    {
      pageNumber: 1,
      heading: "Неожиданная находка",
      text: `Вечерний снег тихо ложился на подоконник, когда ${name} ${isGirl ? "заметила" : "заметил"} на старой полке удивительную вещь — ${toy}. Стоило ${isGirl ? "ей" : "ему"} коснуться тёплой поверхности, как в воздухе вспыхнул мягкий золотой отблеск и позвал прямо туда, где начиналась дорога в ${payload.setting.toLowerCase()}.`,
      imagePrompt: `Child ${name} discovering ${toy} on a cozy wooden attic windowsill with snow falling outside at dusk, warm golden lamp light`,
      textZone: "left",
    },
    {
      pageNumber: 2,
      heading: "Спутник на тропе",
      text: `У края заснеженной поляны уже ждал ${companion}. Под ногами похрустывал пушистый снег, а между елями кружились крошечные огоньки. «Вместе мы обязательно справимся!» — улыбнулся ${name}, поправляя тёплый шарф, и они шагнули под высокий звёздный купол.`,
      imagePrompt: `Child ${name} holding ${toy} meeting ${companion} on a snowy pine forest trail bathed in soft blue twilight and golden sparkles`,
      textZone: "right",
    },
    {
      pageNumber: 3,
      heading: "Хрустальный мостик",
      text: `Впереди через звонкий ручей тянулся старый деревянный мостик, покрытый тонким инеем. ${name} не ${isGirl ? "стала" : "стал"} спешить: ${isGirl ? "она" : "он"} осторожно проверил каждую ступеньку и помог своему спутнику перебраться на другой берег. Настоящая смелость всегда оказывается чуткой и бережной.`,
      imagePrompt: `Child ${name} carefully guiding ${companion} across a frosted wooden bridge over a moonlit stream, holding ${toy}`,
      textZone: "left",
    },
    {
      pageNumber: 4,
      heading: "Спящий маяк",
      text: `На вершине холма стоял старинный маяк. Его большое стекло молчало, будто забыло, как дарить свет. ${name} бережно ${isGirl ? "поднесла" : "поднёс"} ${toy} к самому центру хрустальной призмы, а ${companion} прислушался к тихому звону внутри башни.`,
      imagePrompt: `Inside the glass lantern room of an antique winter lighthouse, child ${name} placing ${toy} near the crystal prism beside ${companion}`,
      textZone: "right",
    },
    {
      pageNumber: 5,
      heading: "Пробуждение сияния",
      text: `Сначала вспыхнул один тонкий лучик — тёплый, словно свеча в ладонях. Через секунду он подхватил небесный ветер, и над верхушками сосен затанцевали золотые и изумрудные ленты северного сияния. Весь лес озарился мягким праздничным светом.`,
      imagePrompt: `Golden and emerald aurora borealis bursting upward from the lighthouse top into the starry night sky while child ${name} and ${companion} watch in wonder`,
      textZone: "left",
    },
    {
      pageNumber: 6,
      heading: "Возвращение домой",
      text: `На обратном пути ${name} бережно ${isGirl ? "сжимала" : "сжимал"} ${toy}, но точно ${isGirl ? "знала" : "знал"}: самое главное чудо зажигается от доброты и внимания. Дома уже пахло корицей и уютом, а огни в окнах встречали маленьких героев.`,
      imagePrompt: `Child ${name} and ${companion} walking back toward a warmly lit cozy cottage in the snow under northern lights`,
      textZone: "right",
    },
  ];

  const basePages = (isUk ? pagesUk : pagesRu).slice(0, payload.pageCount);
  if (isUk && !isGirl) {
    // Adjust verb endings for boy in demo template regardless of pageCount
    for (const page of basePages) {
      page.text = page.text
        .replaceAll("помітила", "помітив")
        .replaceAll("не стала", "не став")
        .replaceAll("приклала", "приклав")
        .replaceAll("перевірила", "перевірив")
        .replaceAll("допомогла", "допоміг")
        .replaceAll("примостила", "примостив")
        .replaceAll("тримала", "тримав");
    }
  }

  return {
    title,
    subtitle,
    visualBible,
    coverPrompt: `Enchanting storybook cover featuring child ${name} wearing a teal wool coat and raspberry scarf beside ${companion} holding ${toy} in ${payload.setting}`,
    pages: basePages,
    modeUsed: "demo",
    writerNotes: [
      isUk
        ? "Згенеровано в локальному демо-режимі (додайте OPENAI_API_KEY у .env.local для повної 3-крокової AI-генерації)."
        : "Сгенерировано в локальном демо-режиме (добавьте OPENAI_API_KEY в .env.local для полной 3-шаговой AI-генерации).",
    ],
  };
}

/**
 * 4-Step RU/UA Writer + Visual Director Pipeline:
 * 1) Beat sheet (завязка -> открытие -> препятствие -> кульминация -> развязка)
 * 2) Literary draft + anti-AI cliché editing pass (prose only)
 * 3) Dedicated RU/UA grammar, gender, species & vocative case proofreader
 * 4) Visual Director (gpt-6.2-sol) on the FINAL text: VisualBible + keyObjectsLock + varied camera angles + 1:1 sync + physics sanity
 */
export async function generateThreeStepStory(
  payload: StorybookOrderPayload,
  onProgress?: (step: string, percent: number) => void,
  visionPassports?: PhotoVisualPassports,
  costTracker?: AiCostTracker
): Promise<WrittenStoryDraft> {
  const [{ writerClient, directorClient, config }, sbConfig] = await Promise.all([
    getCmsOpenAIRuntime(),
    getStorybookRuntimeConfig(),
  ]);
  const client = writerClient;
  const dirClient = directorClient ?? writerClient;
  if (!client || !dirClient) {
    onProgress?.("story_beats", 15);
    onProgress?.("story_draft", 24);
    onProgress?.("story_proofread", 32);
    onProgress?.("story_director", 40);
    return buildDemoStory(payload, sbConfig);
  }

  const writerModel = config.storybookWriterModel;
  const writerEffort = config.storybookWriterReasoningEffort;
  const directorModel = config.storybookDirectorModel;
  const directorEffort = config.storybookDirectorReasoningEffort;
  const langName = payload.lang === "uk" ? "Ukrainian (Українська)" : "Russian (Русский)";
  const ageCfg = sbConfig.ageGroups.find((a) => a.code === payload.ageGroup);
  const wordRange = getWordRangeByAge(payload.ageGroup, sbConfig);
  const ageWriterNote = ageCfg?.writerNote?.trim() ? ` (${ageCfg.writerNote.trim()})` : "";
  const toneCfg = sbConfig.tones.find((t) => t.slug === payload.tone);
  const toneBaseLabel =
    toneCfg?.label[payload.lang] ||
    TONE_LABELS[payload.tone]?.[payload.lang] ||
    payload.tone;
  const toneLabel = toneCfg?.promptHint?.trim()
    ? `${toneBaseLabel} (${toneCfg.promptHint.trim()})`
    : toneBaseLabel;
  const resolvedStyle = resolveStorybookStyle(sbConfig, payload.artStyle);
  const styleDesc = resolvedStyle.stylePrompt;
  const hasCompanion = payload.companionType !== "none";
  const appearanceSummary = buildAppearanceSummary(
    payload,
    visionPassports?.childVisualPassport
  );
  const companionSummary = buildCompanionSummary(
    payload,
    visionPassports?.companionVisualPassport
  );
  const requestedToy = payload.favoriteToy?.trim() || "";
  const toySummary = requestedToy
    ? `${requestedToy} (REQUIRED recurring item across the story & VisualBible)`
    : "none selected by user (NOT required — do NOT force a recurring item; leave recurringToyLock empty, though natural everyday props may appear if the scene calls for them)";

  const defaultBeatsSystem = `You are a master children's book architect writing in ${langName}. Build concrete, warm, sensory story beats (never preachy). Strictly respect the declared child gender and companion species/relation/gender (for example, never turn a dog into a cat or change a companion's gender).`;
  const customBeatsSystem = renderPromptVars(
    sbConfig.prompts.beatsSystem || config.prompts["storybook-beats-system"],
    { langName }
  );
  const beatsSystemPrompt = `${customBeatsSystem || defaultBeatsSystem}\nReturn strict JSON only.`;

  // Step 1: Story beats
  onProgress?.("story_beats", 12);
  const beatsRes = await withOpenAIRetry("story_beats", () =>
    client.chat.completions.create({
      ...buildChatModelParams(0.8, 1400, writerModel, writerEffort),
      messages: [
        {
          role: "system",
          content: beatsSystemPrompt,
        },
        {
          role: "user",
          content: `Create a ${payload.pageCount}-page story beat outline for:
- Child: ${payload.childName} (vocative if UA: ${payload.childNameVocative || payload.childName}), ${appearanceSummary}${ageWriterNote}
- Tone: ${toneLabel}
- Setting: ${payload.setting}
- Plot idea: ${payload.plotIdea}
- Second character / companion: ${companionSummary}
- Special toy / item: ${toySummary}

Structure the ${payload.pageCount} pages across: inciting wonder -> discovery -> gentle obstacle -> teamwork climax -> cozy resolution.
Keep any recurring vehicle/creature/prop design concrete so it stays visually consistent across pages.
Return JSON: { "title": "...", "subtitle": "...", "beats": [{ "pageNumber": 1, "beatSummary": "...", "sceneAction": "..." }] }`,
        },
      ],
    })
  );

  costTracker?.addChatUsage("story_beats", writerModel, beatsRes.usage);
  const beatsRaw = beatsRes.choices[0]?.message?.content || "{}";
  const beatsJson = extractJsonObject<{
    title: string;
    subtitle: string;
    beats: Array<{ pageNumber: number; beatSummary: string; sceneAction: string }>;
  }>(beatsRaw);

  const defaultDraftSystem = `You are an acclaimed children's author in ${langName}.
Write warm, rhythmic read-aloud prose (${wordRange} words per page), concrete sensory details matching the chosen setting's season and world (e.g., rustle of leaves, warm bread, creak of wood — never inject snow or winter unless the setting calls for it), zero robotic AI clichés ("вдруг понял, что главное сокровище — дружба"), zero moralizing lectures.
Never put emojis, stars (★), or decorative symbols in titles, headings, or text — use plain Cyrillic prose and standard punctuation only.
Strictly preserve the child's gender and the companion's exact species/relation and gender (e.g. male dog MUST act, sound, and take masculine verbs like a dog — NEVER meow or purr!).
If layoutMode is "panorama", assign alternating "textZone": "left" or "right".`;
  const customDraftSystem = renderPromptVars(
    sbConfig.prompts.draftSystem || config.prompts["storybook-draft-system"],
    { langName, wordRange }
  );
  const draftSystemPrompt = `${customDraftSystem || defaultDraftSystem}\nReturn strict JSON only.`;

  // Step 2: Literary Draft + Anti-AI Liveliness (Prose only, decoupled from visual prompts)
  onProgress?.("story_draft", 22);
  const draftRes = await withOpenAIRetry("story_draft", () =>
    client.chat.completions.create({
      ...buildChatModelParams(0.8, 2600, writerModel, writerEffort),
      messages: [
        {
          role: "system",
          content: draftSystemPrompt,
        },
        {
          role: "user",
          content: `Expand these beats into the complete ${payload.pageCount}-page book text in ${langName}:
Layout mode: ${payload.layoutMode}
Child: ${payload.childName}, ${appearanceSummary}
Companion: ${companionSummary}
Recurring toy: ${toySummary}
Beats JSON: ${JSON.stringify(beatsJson)}

Return JSON:
{
  "title": "...",
  "subtitle": "...",
  "pages": [
    {
      "pageNumber": 1,
      "heading": "Short chapter heading in ${langName}",
      "text": "Vivid read-aloud paragraph (${wordRange} words) in ${langName}",
      "textZone": "left"
    }
  ]
}`,
        },
      ],
    })
  );

  costTracker?.addChatUsage("story_draft", writerModel, draftRes.usage);
  const draftJson = extractJsonObject<{
    title: string;
    subtitle: string;
    pages: Array<{
      pageNumber: number;
      heading: string;
      text: string;
      textZone?: "left" | "right";
    }>;
  }>(draftRes.choices[0]?.message?.content || "{}");

  const defaultProofSystem = `You are a meticulous native ${langName} literary proofreader for children's books.
Check and fix:
1) Case endings and declensions of the child's name "${payload.childName}" (e.g., avoid errors like "вёл Мила" -> "вёл Милу").
2) In Ukrainian: use proper кличний відмінок (${payload.childNameVocative || payload.childName}) in direct speech.
3) Consistent verb/adjective gender for child (${payload.gender === "girl" ? "feminine" : "masculine"}) AND for the companion (${companionSummary}). Fix any species mismatch (e.g. if companion is a dog, remove cat sounds like "муркоче"/"мурлычет").
4) Natural punctuation, em-dashes, and warm read-aloud rhythm without changing the plot or shortening pages below ${wordRange} words. Remove any emojis or decorative symbols like ★/✦.`;
  const customProofSystem = renderPromptVars(
    sbConfig.prompts.proofreadSystem || config.prompts["storybook-proofread-system"],
    {
      langName,
      childName: payload.childName,
      childNameVocative: payload.childNameVocative || payload.childName,
      genderPronoun: payload.gender === "girl" ? "feminine" : "masculine",
      companionSummary,
      wordRange,
    }
  );
  const proofSystemPrompt = `${customProofSystem || defaultProofSystem}\nReturn strict JSON with the exact structure: { "title": "...", "subtitle": "...", "pages": [{ "pageNumber": 1, "heading": "...", "text": "..." }], "fixesApplied": ["brief note"] }`;

  // Step 3: Dedicated RU/UA Proofreader (before visual directing so visuals sync 1:1 with final text!)
  onProgress?.("story_proofread", 32);
  const proofRes = await withOpenAIRetry("story_proofread", () =>
    client.chat.completions.create({
      ...buildChatModelParams(0.2, 2600, writerModel, writerEffort),
      messages: [
        {
          role: "system",
          content: proofSystemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            title: draftJson.title,
            subtitle: draftJson.subtitle,
            pages: draftJson.pages.map((p) => ({
              pageNumber: p.pageNumber,
              heading: p.heading,
              text: p.text,
            })),
          }),
        },
      ],
    })
  );

  costTracker?.addChatUsage("story_proofread", writerModel, proofRes.usage);
  const proofJson = extractJsonObject<{
    title: string;
    subtitle: string;
    pages: Array<{ pageNumber: number; heading: string; text: string }>;
    fixesApplied?: string[];
  }>(proofRes.choices[0]?.message?.content || "{}");

  const finalTitle = proofJson.title || draftJson.title;
  const finalSubtitle = proofJson.subtitle || draftJson.subtitle;
  const finalTextPages = draftJson.pages.map((p, idx) => {
    const fixed =
      proofJson.pages?.find((fp) => fp.pageNumber === p.pageNumber) ||
      proofJson.pages?.[idx];
    return {
      pageNumber: p.pageNumber || idx + 1,
      heading: fixed?.heading || p.heading,
      text: fixed?.text || p.text,
      textZone: p.textZone || (idx % 2 === 0 ? "left" : "right"),
    };
  });

  const defaultDirectorSystem = `You are a master children's book Visual Director and Continuity Supervisor.
You receive FINAL proofread book pages and must design the VisualBible + per-page camera/composition/physics directing briefs so every illustration matches the text 1-to-1, avoids anatomical/physics glitches, keeps recurring story objects identical across pages, and NEVER repeats front-facing camera stares.

STRICT DIRECTING RULES (apply universally across any story world):
1. Camera variety & realistic scale: across pages, vary shot types and camera angles (wide over-the-shoulder three-quarter rear view, low-angle side-profile action, high-angle diagonal path view, intimate profile close-up on activity, wide environmental establishing shot). Keep foreground characters in realistic human scale relative to nearby midground paths, stalls, furniture, or bystanders, and never have characters stare blankly into the camera lens.
2. Strict spatial & character separation: match WHO is physically WHERE in the finalized page text. If a companion is far away in the background while the main child is in the foreground, set "companionPresent": true, "companionInForeground": false and place the companion strictly once at that distant spot — never duplicate them in the foreground. If absent from that page's text, set "companionPresent": false, "companionInForeground": false.
3. Permanent locks & recurring objects: keep "companionLock" and "clothingLock" free of transient one-off props. Any recurring story vehicle, vessel, creature, or landmark appearing on multiple pages MUST be locked in "keyObjectsLock" with rich silhouette, structure, and color palette so its design stays consistent across pages. Omit one-off props from earlier pages on later pages unless the current page text uses them.
4. Layered depth & strict Z-order occlusion: structure every "imagePrompt" explicitly in rich, atmospheric layers: [Shot & Camera Angle] -> [Foreground framing/details] -> [Midground subjects & actions] -> [Background scenery] -> [Constraints]. Whenever a scene looks through a window, doorway, arch, or railing, explicitly keep the frame and mullions/bars unbroken in the foreground in front of all exterior scenery so distant objects stay strictly behind glass and framing.
5. 3D perspective alignment: describe angled vehicles, sails, banners, flags, or signs aligned naturally with the object's heading and wind direction in 3D perspective — never flatten a side-viewed surface toward the viewer.
6. Isolated hands, natural creature poses & trails: never stage two characters' hands touching or handing over the same small object simultaneously (give each character an independent object or clear gesture). Non-human creatures interact naturally without extra paws or human thumbs (never force closed snouts flush against food). Any footprints, paw prints, or tracks trail strictly behind the walker with toes/tips pointing forward in the direction of travel, leaving ground ahead unmarked.
7. Style & Layout fidelity:
   - Art style is "${styleDesc}". Maintain rich painterly storybook detail, lighting, and atmosphere while keeping 2D illustrated proportions (never photorealistic skin pores or fabric macro).
   - For "coverPrompt": compose a warm full-body vertical cover scene (1024x1536) with boots/feet clearly visible on a firm path (~78% down from top), leaving calm sky/canopy in the top 18% and quiet foreground in bottom 20% for title typography.
   - If layoutMode is "panorama", preserve a quiet low-contrast scenic zone on each page's assigned "textZone" ("left" or "right" third) without lining characters up toward the viewer.`;
  const customDirectorSystem = renderPromptVars(
    sbConfig.prompts.directorSystem || config.prompts["storybook-director-system"],
    { styleDesc }
  );
  const directorSystemPrompt = `${customDirectorSystem || defaultDirectorSystem}\n8. Return strict JSON only (English prompts, zero text/letters inside images).`;

  // Step 4: Visual Director & Continuity Supervisor (uses lighter director model gpt-6.2-sol on FINAL text)
  onProgress?.("story_director", 40);
  const directorRes = await withOpenAIRetry("story_director", () =>
    dirClient.chat.completions.create({
      ...buildChatModelParams(0.4, 3400, directorModel, directorEffort),
      messages: [
        {
          role: "system",
          content: directorSystemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            bookTitle: finalTitle,
            layoutMode: payload.layoutMode,
            artStyle: styleDesc,
            child: appearanceSummary,
            companion: companionSummary,
            hasUserCompanion: hasCompanion,
            recurringToy: requestedToy || null,
            finalizedPages: finalTextPages,
            requiredJsonSchema: {
              visualBible: {
                characterLock: "English visual description of main child grounded in child facts/Vision",
                clothingLock: "Consistent world-appropriate outfit across all pages (no temporary props)",
                companionLock: hasCompanion
                  ? "Permanent English visual description of companion (species, gender, markings — NO one-off props)"
                  : "",
                recurringToyLock: requestedToy
                  ? "Exact English visual description of user's favorite toy"
                  : "",
                keyObjectsLock:
                  "Exact locked design of any recurring plot vehicle/ship/creature/landmark across pages (or empty string if none)",
                paletteLock: "Consistent cohesive color palette",
              },
              coverPrompt: "Detailed English full-body cover scene prompt (no text)",
              pages: [
                {
                  pageNumber: 1,
                  shotType: "e.g. Wide over-the-shoulder establishing shot",
                  cameraAngle: "e.g. Child-height 3/4 rear angle looking toward pier",
                  subjectPoseAndGaze: "Exact body orientation and gaze inside the scene (never camera stare)",
                  companionPresent: true,
                  companionInForeground: true,
                  imagePrompt:
                    "Complete, vivid, physically accurate English scene prompt strictly matching this page's finalized text",
                },
              ],
            },
          }),
        },
      ],
    })
  );

  costTracker?.addChatUsage("story_director", directorModel, directorRes.usage);
  const directorJson = extractJsonObject<{
    visualBible: Omit<StoryVisualBible, "styleLock"> & { styleLock?: string };
    coverPrompt: string;
    pages: Array<{
      pageNumber: number;
      shotType?: string;
      cameraAngle?: string;
      subjectPoseAndGaze?: string;
      companionPresent?: boolean;
      companionInForeground?: boolean;
      imagePrompt: string;
    }>;
  }>(directorRes.choices[0]?.message?.content || "{}");

  const mergedPages: StoryPageItem[] = finalTextPages.map((p, idx) => {
    const dir =
      directorJson.pages?.find((dp) => dp.pageNumber === p.pageNumber) ||
      directorJson.pages?.[idx];
    return {
      pageNumber: p.pageNumber,
      heading: p.heading,
      text: p.text,
      imagePrompt:
        dir?.imagePrompt?.trim() ||
        `Scene for page ${p.pageNumber}: ${p.heading}. ${p.text}`,
      shotType: dir?.shotType,
      cameraAngle: dir?.cameraAngle,
      subjectPoseAndGaze: dir?.subjectPoseAndGaze,
      companionPresent: hasCompanion ? dir?.companionPresent ?? true : false,
      companionInForeground: hasCompanion ? dir?.companionInForeground ?? true : false,
      textZone: p.textZone,
      imageRevision: 1,
    };
  });

  const visualBible: StoryVisualBible = {
    characterLock: directorJson.visualBible?.characterLock || appearanceSummary,
    clothingLock:
      directorJson.visualBible?.clothingLock ||
      "Cozy storybook outfit matching the story world",
    companionLock: hasCompanion
      ? directorJson.visualBible?.companionLock || companionSummary
      : undefined,
    recurringToyLock: requestedToy
      ? directorJson.visualBible?.recurringToyLock || requestedToy
      : undefined,
    keyObjectsLock: directorJson.visualBible?.keyObjectsLock?.trim() || undefined,
    styleLock: styleDesc,
    paletteLock:
      directorJson.visualBible?.paletteLock ||
      "Warm harmonious storybook palette",
  };

  return {
    title: finalTitle,
    subtitle: finalSubtitle,
    visualBible,
    coverPrompt:
      directorJson.coverPrompt ||
      `Full-body storybook cover featuring ${payload.childName} in ${payload.setting}`,
    pages: mergedPages,
    modeUsed: "openai",
    writerNotes: proofJson.fixesApplied || [],
  };
}

/**
 * Rewrites a single page text using AI when user clicks Edit with AI quota.
 */
export async function rewriteSinglePageText(params: {
  lang: StorybookOrderPayload["lang"];
  childName: string;
  gender: StorybookOrderPayload["gender"];
  ageGroup: StorybookOrderPayload["ageGroup"];
  bookTitle: string;
  currentHeading: string;
  currentText: string;
  instruction: string;
  costTracker?: AiCostTracker;
}): Promise<{ heading: string; text: string }> {
  const [{ writerClient: client, config }, sbConfig] = await Promise.all([
    getCmsOpenAIRuntime(),
    getStorybookRuntimeConfig(),
  ]);
  if (!client) {
    return {
      heading: params.currentHeading,
      text: `${params.currentText} (${params.instruction})`,
    };
  }

  const writerModel = config.storybookWriterModel;
  const writerEffort = config.storybookWriterReasoningEffort;
  const langName = params.lang === "uk" ? "Ukrainian (Українська)" : "Russian (Русский)";
  const wordRange = getWordRangeByAge(params.ageGroup, sbConfig);

  const res = await withOpenAIRetry("rewrite_page", () =>
    client.chat.completions.create({
      ...buildChatModelParams(0.6, 1000, writerModel, writerEffort),
      messages: [
        {
          role: "system",
          content: `You are a native ${langName} children's book editor. Rewrite only this page cleanly (${wordRange} words), preserving proper ${langName} grammar, declensions for "${params.childName}", and gender (${params.gender}). Return strict JSON: { "heading": "...", "text": "..." }`,
        },
        {
          role: "user",
          content: `Book: ${params.bookTitle}
Current heading: ${params.currentHeading}
Current text: ${params.currentText}
User edit instruction: ${params.instruction}`,
        },
      ],
    })
  );

  params.costTracker?.addChatUsage("rewrite_page", writerModel, res.usage);
  return extractJsonObject<{ heading: string; text: string }>(
    res.choices[0]?.message?.content || "{}"
  );
}
