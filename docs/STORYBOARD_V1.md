# 🎬 Пилот V1 — «Тёплая резиденция и Книга добрых дел» (16:9, ~35–40 сек)

> **Статус:** Собрано и проверено (RU/UA `720p`, ~49 с; CLI-параметризация в [assemble_pilot.py](file:///g:/WwW/work/gifts-project/video-pipeline/scripts/assemble_pilot.py))  
> **Формат:** `16:9` (1920×1080), кинореализм 35mm, премиальный Reels/киномонтаж  
> **Хронометраж:** **~35–40 секунд** (**9 монтажных планов** из 8-секундных исходников Google Flow / Veo 3.1 Lite)  
> **Языки озвучки:** Украинский (`UA`) и Русский (`RU`) — единый голос через **ElevenLabs**  
> **Базовый референс персонажа:** [character_sheet.jpg](file:///g:/WwW/work/gifts-project/video-pipeline/refs/character_sheet.jpg)

---

## 1. Логика драматургии и персонализации

1. **Контраст и атмосфера:** холодная сказочная зимняя ночь с падающим снегом снаружи (`Шот 01`) → тёплая, залитая светом камина и свечей деревянная резиденция внутри (`Шоты 02–07`).
2. **Трёхтактная киношная связка «Книга» (`04a → 04b → 04c`):**
   - **Шот 04a (Фронтальный, чтение за книгой):** герой держит настоящую старинную раскрытую книгу перед собой так, что она полностью перекрывает нижнюю часть лица (рот и бороду), а над верхним краем книги видны только его тёплые читающие глаза и венец. Никаких рамок на внешней обложке — книга выглядит на 100% настоящей.
   - **Шот 04b (POV «из глаз героя», переменная длина 3–7 с):** короткая перебивка от первого лица — взгляд вниз на раскрытую книгу в руках героя (видны его кремовые вышитые манжеты и тёплый свет свечей). На правой странице — чистый пергамент с золотой каймой для локальной врезки **`{photo_1}` + `{name}`**. Здесь озвучивается **`{age}` + `{achievement}`** без видимых губ; клип держится ровно и подрезается **точно под длину речи ElevenLabs**.
   - **Шот 04c (Фикс. 3.0 с, `[LIP-SYNC]`):** возврат на фронтальный план — герой плавно кладёт книгу на дубовый стол, открывая доброе улыбающееся лицо, и говорит в камеру: *«Я справді пишаюся тобою!»* / *«Я искренне горжусь тобой!»*.
3. **Удобство озвучки и lip-sync:**
   - Личные обращения по `{name}` и финальное напутствие звучат в **lip-sync** (`Шоты 03, 04c, 05, 07`).
   - Вариативные данные (`{age}`, `{achievement}`) полностью вынесены на беслипсинковую пару `04a + 04b` (скрытый рот + POV книги).

---

## 2. Покадровый план (9 шотов, ~35–40 сек)

| Шот | Длит. (в монтаже) | Исходник Veo | План и действие | Роль аудио / персонализации |
| :---: | :---: | :---: | :--- | :--- |
| **01** | **3.0 с** | `8s` (берём 1–4 с) | **Внешний хук:** Заснеженный хвойный лес ночью, сказочный деревянный терем с тёплыми золотыми окнами под полной луной; камера плавно летит к светящемуся окну сквозь мягкий снег и золотые искры. | `[VOICEOVER]` Оркестровый вход, звон бубенцов, закадровый тёплый голос. |
| **02** | **3.0 с** | `8s` (берём 2–5 с) | **Вход в резиденцию:** Уютный кабинет: слева камин с живым огнём, справа высокая ёлка в золотых огнях и стопки бордово-золотых подарков. Герой сидит за резным дубовым столом, положив руки на ровно раскрытую старинную книгу, и тёпло улыбается зрителю при плавном наезде камеры. | `[AMBIENT + SFX]` Треск камина, мягкий звон колокольчика, тёплая улыбка. |
| **03** | **5.5 с** | `8s` (берём 0.5–6 с) | **Личное приветствие:** Средне-крупный план героя за дубовым столом, взгляд прямо в камеру, добродушная улыбка, лёгкий тёплый жест рукой (и движение к книге). | `[ELEVENLABS + LIP-SYNC]` Приветствие лично по **`{name}`** (звательный падеж для UA). |
| **04a** | **2.5–3.5 с** (можно чуть подрезать) | `8s` (берём 1–4.5 с) | **Чтение книги спереди:** Фронтальный крупный план: герой держит настоящую старинную раскрытую книгу в тёмном кожаном переплёте с золотым тиснением перед собой так, что она перекрывает нижнюю часть лица (рот и бороду), а над обрезом страниц видны его живые улыбающиеся глаза. | `[VOICEOVER]` Губы скрыты за книгой! Подводка: *«В моей Книге добрых дел уже есть твоя страница…»*. |
| **04b** | **Переменная (3.0–7.0 с)** | `8s` (подрезка ровно под аудио!) | **POV «из глаз героя» — фото в книге:** Взгляд сверху вниз на раскрытую книгу в руках героя (видны его руки в кремовых вышитых манжетах на краях книги). На правой странице — чистый ровный пергамент с золотым орнаментом под **`{photo_1}` + `{name}`**. Плавный микро-дрейф и парящие золотые пылинки. | `[VFX ФОТО + ELEVENLABS VOICEOVER]` Без губ в кадре! Озвучка **`{age}`** и **`{achievement}`**. |
| **04c** | **3.0 с** (фикс.) | `8s` (берём 0.5–3.5 с) | **Кладёт книгу и гордится:** Средне-крупный план: герой плавно опускает и кладёт книгу на дубовый стол, открывая своё доброе улыбающееся лицо, и тепло кивает в камеру. | `[ELEVENLABS + LIP-SYNC]` Фиксированная фраза: *«Я справді пишаюся тобою!»* / *«Я искренне горжусь тобой!»*. |
| **05a** | **3.5 с** | `8s` (берём 0.5–4.0 с) | **Достаёт и ставит подарок:** Фронтальный план: книга закрыта слева на столе; герой достаёт из-за правого края бордово-золотую коробку с кремовым бантом и аккуратно ставит её на стол. | `[AMBIENT + SFX]` Шелест ленты и мягкий стук коробки о дерево (без речи). |
| **05b** | **4.5 с** | `8s` (берём 0.5–5.0 с) | **Новый 3/4-ракурс — напутствие о подарке:** Камера смещена на ~35° вправо к углу стола; коробка крупнее на переднем плане, за ней герой тепло смотрит в камеру. | `[ELEVENLABS + LIP-SYNC]` Похвала за доброе сердце + подводка к особому подарку. |
| **06** | **3.0 с** | `8s` (берём 1–4 с) | **Волшебный жест:** Крупный план рук героя, легко касающихся банта на бордово-золотой подарочной коробке; из-под ленты вверх взлетает вихрь тёплых золотых искр. | `[SFX + MUSIC SWELL]` Арфа, перелив магии, шелест ленты. |
| **07** | **6.0 с** | `8s` (берём 0.5–6.5 с) | **Финал и благословение на праздник:** Тёплый крупный портрет героя на фоне огней ёлки и снега за окном. Он сердечно поздравляет ребёнка, мягко машет/желает добра, кадр уходит в тёплое золотое сияние. | `[ELEVENLABS + LIP-SYNC]` Финальное обращение по **`{name}`** + доброе пожелание. |

**Итого:** `32.0 сек (фиксированные/базовые планы)` + `3–7 сек (переменный POV 04b)` = **~35–39 секунд** (идеально в целевых **35–40 с**).

---

## 3. Текст озвучки (под ElevenLabs)

> **Примечание:** В UA-версии `{name_voc}` — имя в звательном падеже (*Софійко, Максиме, Артемку*), а глаголы/прилагательные склоняются под `{gender}`.

### Украинский вариант (`UA`)
- **Шот 01 (Закадр):** «У цю чарівну зимову ніч диво вже на порозі…»
- **Шот 02 (SFX):** *(Треск камина, звон колокольчиков, тёплая улыбка)*
- **Шот 03 (`[LIP-SYNC]`):** «Вітаю тебе, **{name_voc}**! Я так радий нарешті завітати до тебе особисто!»
- **Шот 04a (`[VOICEOVER — за книгой]`):** «У моїй Книзі добрих справ уже є твоя сторінка…»
- **Шот 04b (`[VOICEOVER — POV фото, ПЕРЕМЕННАЯ ДЛИНА]`):** «У свої **{age}** ти **{achievement}**…»
  *(Вариант без возраста: «Цього року ти **{achievement}**…»)*
- **Шот 04c (`[LIP-SYNC, ФИКС. 3с]`):** «Я справді пишаюся тобою!»
- **Шот 05a (`[SFX]`):** *(Шелест ленты, ставит коробку на стол)*
- **Шот 05b (`[LIP-SYNC]`):** «Бережи це світле серце й не бійся мріяти. На тебе вже чекає особливий подарунок!»
- **Шот 06 (`[SFX]`):** *(Музыка, звон магии)*
- **Шот 07 (`[LIP-SYNC]`):** «Щасливих свят, **{name_voc}**! Нехай у твоєму домі завжди панують тепло, радість і дива. До зустрічі!»

### Русский вариант (`RU`)
- **Шот 01 (Закадр):** «В эту волшебную зимнюю ночь чудо уже на пороге…»
- **Шот 02 (SFX):** *(Треск камина, звон колокольчиков, тёплая улыбка)*
- **Шот 03 (`[LIP-SYNC]`):** «Здравствуй, **{name}**! Как же я рад заглянуть к тебе лично!»
- **Шот 04a (`[VOICEOVER — за книгой]`):** «В моей Книге добрых дел уже есть твоя страница…»
- **Шот 04b (`[VOICEOVER — POV фото, ПЕРЕМЕННАЯ ДЛИНА]`):** «В свои **{age}** ты **{achievement}**…»
  *(Вариант без возраста: «В этом году ты **{achievement}**…»)*
- **Шот 04c (`[LIP-SYNC, ФИКС. 3с]`):** «Я искренне горжусь тобой!»
- **Шот 05a (`[SFX]`):** *(Шелест ленты, ставит коробку на стол)*
- **Шот 05b (`[LIP-SYNC]`):** «Береги это доброе сердце и не переставай мечтать. Тебя уже ждёт особенный подарок!»
- **Шот 06 (`[SFX]`):** *(Музыка, звон магии)*
- **Шот 07 (`[LIP-SYNC]`):** «Счастливых праздников, **{name}**! Пусть в твоём доме всегда живут тепло, радость и чудеса. До встречи!»

---

## 4. Стартовые кадры и чистые motion-промпты для Google Flow (Veo 3.1 Lite, `8s`)

> **Напоминание по `AGENTS.md`:** в Google Flow загружаем **только стартовый PNG** + **чистый motion-промпт конкретного шота** (без имён святых, без религиозных терминов облачения и без лишних комментариев). Готовые 8-сек MP4 сохраняем в [videos/](file:///g:/WwW/work/gifts-project/video-pipeline/videos).

1. **Shot 01** — [shot_01_forest_chalet.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_01_forest_chalet.png)  
   `Slow cinematic aerial push-in through gently falling snow and tiny floating golden sparkles toward the warm glowing arched window of the stone-and-timber chalet in the snowy alpine forest at night. Soft moonlight, subtle warm candlelight flicker inside the tall arched window, peaceful magical winter atmosphere, 35mm cinema film look.`

2. **Shot 02** — [shot_02_study_entrance.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_02_study_entrance.png)  
   `Animate the supplied image with a smooth, steady cinematic dolly-in through the cozy candlelit wooden study toward the carved oak desk. The kindly elderly man with curly silver hair and white beard in the burgundy velvet and gold-embroidered festive winter robe keeps his hands resting gently and naturally on the open antique book, blinking warmly, giving a subtle welcoming nod, and brightening his gentle smile toward the camera. The large dark-leather antique book remains completely flat, steady, and undistorted open on the desk. Flickering firelight in the stone fireplace, softly dancing candle flames, twinkling golden tree lights, gentle snowfall outside the arched window, no spoken dialogue.`

3. **Shot 03** — [shot_03_greeting.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_03_greeting.png)  
   `Steady medium close-up of the kindly elderly man with curly silver hair and white beard wearing the burgundy velvet robe with gold embroidery, ivory stole, and matching burgundy-gold domed crown shown in the image. Sitting behind the oak desk with warm firelight and glowing tree bokeh behind him, he looks warmly into the camera, speaks gently with natural calm facial expressions and subtle welcoming hand gestures, soft twinkling eyes. Quiet warm room tone, no background music.`

4. **Shot 04a** — [shot_04a_book_reading.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_04a_book_reading.png)  
   `Front-facing medium close-up in warm candlelight. The kindly elderly man holds the large open antique dark-leather book steady in front of his lower face so his mouth and beard remain hidden behind the book. Above the top edge of the open pages, his warm twinkling eyes blink naturally and glance gently left to right as if reading with a fond smile. Subtle flickering firelight and tiny golden dust motes.`

5. **Shot 04b (POV)** — [shot_04b_book_pov.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_04b_book_pov.png)  
   `Steady first-person point-of-view shot looking down at the open antique book held in the elderly man's hands (cream embroidered cuffs holding the sides of the book) over the warm candlelit oak desk. Very gentle breathing stillness and tiny golden dust motes drifting softly over the blank softly glowing cream parchment page on the right. No sudden camera tilt, clean flat page surface.`

6. **Shot 04c** — [shot_04c_proud.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_04c_proud.png)  
   `Smooth medium close-up in the warm candlelit study. The kindly elderly man with curly silver hair and white beard in the burgundy velvet and gold-embroidered festive outfit rests his hands gently on the open antique leather book on the oak desk, looking straight into the camera with a warm, proud, affectionate smile. He nods softly and speaks a short heartfelt sentence. Warm amber lighting, shallow depth of field, no background music.`

7a. **Shot 05a** — [shot_05_gift_intro.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_05_gift_intro.png)  
   `Animate the supplied image as one continuous 8-second, 16:9 photorealistic shot. In the first two seconds, the seated character smoothly lifts the wrapped burgundy gift box upward and moves it to the left toward the center of the wooden desk, setting its flat bottom firmly down onto the tabletop right beside the closed leather book. Once the box rests completely still on the desk surface, he releases both hands from the box and turns warmly toward the camera with a closed-mouth smile. Keep the box stationary on the desk after it is placed. Warm amber candlelight, shallow depth of field, quiet room tone, no background music.`

7b. **Shot 05b** — [shot_05b_gift_speech.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_05b_gift_speech.png)  
   `Animate the supplied image as one continuous 8-second, 16:9 photorealistic shot. The seated character shown in the starting frame looks warmly straight into the camera, leans slightly forward with an encouraging grandfatherly smile, and speaks gently with calm natural facial expressions and subtle head nods while resting one hand lightly on the wooden desk beside the burgundy gift box. Keep the gift box, closed book, brass pen, candlesticks, and cozy fireplace room completely steady. Quiet room tone, no background music.`

8. **Shot 06** — [shot_06_gift_magic.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_06_gift_magic.png)  
   `Macro close-up of the elderly man's aged hand in the cream embroidered cuff gently touching the cream silk bow on the burgundy velvet gift box on the oak table. Soft swirling golden magical sparkles rise gently upward from the ribbon, casting a warm amber glow across the wood grain. Subtle candle flicker, crisp focus on hand and bow.`

9. **Shot 07** — [shot_07_farewell.png](file:///g:/WwW/work/gifts-project/video-pipeline/keyframes/shot_07_farewell.png)  
   `Intimate warm close-up portrait of the kindly elderly man with curly silver hair and white beard in the burgundy velvet and gold-embroidered festive outfit against soft golden tree bokeh and gentle snowfall outside the arched window. He smiles affectionately into the camera, speaks a warm holiday farewell, and gives a gentle comforting nod and slow wave with his raised hand, as warm golden light softly brightens the scene.`

---

## 5. Сборка персонализированного ролика (CLI)

Скрипт [assemble_pilot.py](file:///g:/WwW/work/gifts-project/video-pipeline/scripts/assemble_pilot.py) принимает персональные параметры заказа:
1. Подготовить 3 персональные реплики ElevenLabs (`NOpBlnGInO9m6vDvFkFC`, `eleven_v4`, `mp3_44100_128`, `stability=0.5`) в отдельной папке `video-pipeline/build/<audio_dir>/`:
   - `line_03.mp3` (RU: `line_03_v2.mp3`) — приветствие по имени (звательный падеж для UA);
   - `line_04b.mp3` — возраст и достижение (до `90` символов);
   - `line_07_1.mp3` — прощальное обращение по имени.
2. Запустить сборку (пример для UA-заказа `Андрійко`, `6 років`, `пішов до школи`):

```powershell
python video-pipeline/scripts/assemble_pilot.py `
  --lang uk `
  --tag andriiko_ua `
  --name "Андрійко" `
  --photo "<путь_к_фото>" `
  --custom-audio "video-pipeline/build/audio_ua_andriiko" `
  --out "video-pipeline/output/pilot_andriiko_ua_720p.mp4"
```

При запуске без аргументов собираются эталонные сборки `pilot_mishanya_ru_720p_v9.mp4` и `pilot_mishanya_ua_720p_v2.mp4` (временные `work_*` директории удаляются автоматически, если не передан `--keep-work`).
