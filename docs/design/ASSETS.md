# Изображения

## Текущие медиа — 2026-11-18

Фон: предоставленный владельцем `pilot_andriiko_ua_720p.mp4` из `Downloads/Telegram Desktop`. Веб-копии `hero-andriiko-{480,720}.mp4`: H.264, без аудиодорожек, 49,04 с. WebM удалён по запросу владельца. Плейсхолдер `hero-andriiko-poster-{640,960,1280}.{avif,webp,jpg}` — первый нечёрный кадр (№ 1). Исходник сохранён. Размеры, параметры и результаты проверки приведены в [PERFORMANCE.md](../PERFORMANCE.md); команды кодирования — `scripts/prepare-background.py`.

Фото каталога `christmas-{gifts,birthday,photo,song}` имеют производные AVIF/WebP/JPEG шириной 360, 640 и 720 px. Пользовательское фото `mykolay-station` — 360, 640, 960 и 1280 px. Подготовка: `scripts/prepare-images.py`. SVG-знак `video-gift.svg` используется без текстового названия; шрифт интерфейса — Rubik Variable.

## Предыдущий тестовый фон (больше не подключён)

По запросу владельца подключено его локальное видео `pilot_mishanya_ua_720p_v1.mp4` из `Downloads/Telegram Desktop`. Рабочая копия — `public/assets/hero-pilot-muted.mp4`: 1280×720, H.264/yuv420p, 49.17 секунды, 44.57 МБ. Весь видеоряд сохранён без перекодирования, аудиодорожка удалена, MP4 подготовлен для быстрого старта (`moov` перед `mdat`). Исходный файл не изменён. Это тестовый фон, предоставленный владельцем, а не изображение ImageGen.

`public/assets/hero-pilot-poster.webp` — кадр этого видео на 0.5 секунды, 1280×720, для первого отображения и статичного фона. Параметры подготовки записаны в `tmp/hero-pilot-metadata.json`.

Фотографические изображения сгенерированы встроенным ImageGen для этого проекта. В них нет реальных клиентов, лиц детей или сторонних брендовых персонажей. Это статичные концепты атмосферы, а не демонстрация генерируемого видеопродукта.

## Текущее рождественское оформление

По последующему запросу владельца оформление стало тёплым красно-белым: кремовые фоны, красные ленты и подарки, мягкий свет, небольшие еловые акценты. Исходный Mercury-референс остаётся в `DESIGN.md`; изменение палитры описано в `REFERENCE-IMPLEMENTATION.md`.

- `public/assets/christmas-hero.webp` — светлая комната с елью, камином и подарками, свободный центр для заголовка; 1792×1024.
- `public/assets/christmas-gifts.webp` — красные и кремовые подарки с еловой веткой; 720×480.
- `public/assets/christmas-letter.webp` — праздничный конверт и подарок к Дню Святого Николая; 720×480.
- `public/assets/christmas-birthday.webp` — торт со свечами и красной лентой; 720×480.
- `public/assets/christmas-photo.webp` — пейзажная фотография в деревянной рамке и красный бант; 720×480.
- `public/assets/christmas-song.webp` — виниловая пластинка, наушники и красная лента; 720×480.
- `public/assets/og-christmas-{home,newyear,mykolay,birthday,photo,song,cartoon}.jpg` — обложки страниц в тёплой палитре; 1200×630, подготовлены из исходных генераций. `og-christmas-home.jpg` использует новую рождественскую сцену; метаданные страниц ссылаются на новые имена.
- `public/assets/christmas-mark.svg` — векторный знак для favicon: прежняя геометрия в кремовом и клюквенном цветах; не фотография ImageGen.
- `public/assets/logo.png` — растровый знак организации для метаданных.

Карточки получены из отдельных исходных изображений 1536×1024, уменьшены до 720×480 с Pillow Lanczos и сохранены в WebP с quality 88, method 6. Изображения поставляются локально; карточки имеют width/height и lazy loading. Исходные PNG находятся в каталоге generated_images Codex. Локальные записи происхождения: `tmp/christmas-hero-asset.json` и `tmp/christmas-card-assets.json`; точные промпты также сохранены ниже, чтобы документация не зависела от временных файлов.

## Промпт рождественского первого экрана

Photorealistic premium Christmas editorial background for a Ukrainian personalized greeting gift website. Wide landscape 1792x1024 composition. A warmly lit elegant living room decorated for Christmas in an ivory-white, warm cream and deep cranberry red palette, subtle fir green. Quiet beautiful celebration, soft December morning sunlight, delicate natural materials. Most important composition: the entire upper and central 70 percent is clean pale warm ivory plaster wall with soft natural light, ample uncluttered negative space for large centered DARK BURGUNDY website text, no objects or strong shadows behind text. At FAR LEFT edge, partially cropped Christmas tree with tasteful red glass ornaments and very small warm lights. At FAR RIGHT edge, creamy fireplace mantel with restrained fir garland, deep red velvet ribbon and a few ivory candles. In the bottom 20 percent, a small low oak coffee table with handwritten-looking blank envelope with red ribbon, surrounded by two or three ivory and cranberry wrapped gifts on an ivory wool rug. All objects live at edges or bottom. Elegant cozy photographic craftsmanship, warm whites dominate, vivid but tasteful burgundy red accents, a little fir green, realistic soft shadows. Keep center clear even when cropped into portrait mobile format, but some small red gift boxes near bottom center so mobile still feels Christmas. No text, no typography, no logo, no watermark, no people, no illustrations, no blue tones, no dark atmosphere. Real interior magazine photography, beautiful soft warm exposure, restrained luxury Christmas at home.

## Промпт christmas-gifts.webp

Use case: photorealistic-natural. Asset type: editorial product card for a Ukrainian personal greeting website. Create ONE horizontal 3:2 still-life photograph. Warm cream and ivory background, natural soft amber window light, deep Christmas red textile and paper accents, restrained evergreen detail. Tasteful real photography, tactile paper/linen/wood, fully visible complete objects with generous breathing room and a level composition. No text, no lettering, no logos, no watermarks, no people, no hands, no UI, no collage, no dark blue, no purple. Rich but soft red-and-white Christmas color direction, not oversaturated. Subject: a beautiful pair of wrapped Christmas gifts, one deep crimson red with cream cotton ribbon, one warm ivory with red velvet ribbon; fresh fir branch framing the lower right; one small antique brass bell. Gifts centered on an ivory linen tabletop against a simple cream plaster wall. Cozy and warmly celebratory.

## Промпт christmas-letter.webp

Use case: photorealistic-natural. Asset type: editorial product card for a Ukrainian personal greeting website. Create ONE horizontal 3:2 still-life photograph. Warm cream and ivory background, natural soft amber window light, deep Christmas red textile and paper accents, restrained evergreen detail. Tasteful real photography, tactile paper/linen/wood, fully visible complete objects with generous breathing room and a level composition. No text, no lettering, no logos, no watermarks, no people, no hands, no UI, no collage, no dark blue, no purple. Rich but soft red-and-white Christmas color direction, not oversaturated. Subject: a closed deep red envelope with a small plain round red wax seal and an unmarked cream card tucked under it, beside a small ivory gift parcel tied with deep red ribbon. A sprig of natural fir and a tiny candle in a brass holder. The envelope is the main focus, postcard-like St Nicholas gift atmosphere, no visible writing or symbols. Camera slightly above the table, all objects completely in frame.

## Промпт christmas-birthday.webp

Use case: photorealistic-natural. Asset type: editorial product card for a Ukrainian personal greeting website. Create ONE horizontal 3:2 still-life photograph. Warm cream and ivory background, natural soft amber window light, deep Christmas red textile and paper accents, restrained evergreen detail. Tasteful real photography, tactile paper/linen/wood, fully visible complete objects with generous breathing room and a level composition. No text, no lettering, no logos, no watermarks, no people, no hands, no UI, no collage, no dark blue, no purple. Rich but soft red-and-white Christmas color direction, not oversaturated. Subject: a small beautiful round birthday cake with ivory buttercream frosting, three thin lit candles and a deep red velvet ribbon tied at its base. Simple cream ceramic cake stand on ivory linen tabletop. A few red ribbon loops at the side. A subtle evergreen tip at edge only. Cake centered and completely visible. Gentle winter birthday atmosphere.

## Промпт christmas-photo.webp

Use case: photorealistic-natural. Asset type: editorial product card for a Ukrainian personal greeting website. Create ONE horizontal 3:2 still-life photograph. Warm cream and ivory background, natural soft amber window light, deep Christmas red textile and paper accents, restrained evergreen detail. Tasteful real photography, tactile paper/linen/wood, fully visible complete objects with generous breathing room and a level composition. No text, no lettering, no logos, no watermarks, no people, no hands, no UI, no collage, no dark blue, no purple. Rich but soft red-and-white Christmas color direction, not oversaturated. Subject: a warm walnut photograph frame holding an old slightly faded landscape photograph of mountains and a lake, NO human faces. The upright frame is centered on an ivory linen tabletop with two loose cream-bordered analog landscape prints at its base and a tasteful red velvet bow draped beside it. A small fir sprig at the edge. Entire frame and photos fully visible. Nostalgic warm holiday gift atmosphere.

## Промпт christmas-song.webp

Use case: photorealistic-natural. Asset type: editorial product card for a Ukrainian personal greeting website. Create ONE horizontal 3:2 still-life photograph. Warm cream and ivory background, natural soft amber window light, deep Christmas red textile and paper accents, restrained evergreen detail. Tasteful real photography, tactile paper/linen/wood, fully visible complete objects with generous breathing room and a level composition. No text, no lettering, no logos, no watermarks, no people, no hands, no UI, no collage, no dark blue, no purple. Rich but soft red-and-white Christmas color direction, not oversaturated. Subject: a dark vinyl record with a plain deep red center label partly sliding out of an unmarked ivory record sleeve, elegant cream over-ear headphones resting beside it, and a loosely curled red silk ribbon. Everything completely visible on a warm cream tabletop. One tiny evergreen sprig near edge. Editorial music gift photograph, slightly elevated camera angle.

## Изображения предыдущего оформления

Следующие файлы сохранены от предыдущего тёмного оформления и не задают текущую палитру: `alpine-hero.webp` (1792×1024), `winter-hero.webp` (1536×1024), `winter-card.webp`, `birthday.webp`, `photo.webp`, `song.webp` (720×480), прежние `og-{home,newyear,mykolay,birthday,photo,song,cartoon}.jpg` (1200×630). Их исходные промпты приведены ниже для сохранения происхождения.

## Промпт альпийского изображения

Встроенный ImageGen; изображение создано для новой композиции главной по референсу Mercury.

Wide cinematic photographic landscape background for a premium dark website, 1792x1024 composition. Reference visual direction: Mercury banking Alpine blue hour campaign. Photorealistic majestic alpine mountains receding into soft mist at blue hour, enormous quiet open slate-blue sky occupying upper 55 percent, cool desaturated rocky mountain ridges on far left and far right with distant center valley. A dark green meadow terrace in the lower third. At the exact center bottom, a solitary elegant small walnut writing desk with a chair, a small ivory envelope and tiny desk lamp emitting very subtle warm light. Desk occupies no more than 12 percent of image width and lives below 76 percent height. Editorial architectural photography, contemplative aspirational atmosphere, beautifully detailed mountain rock and atmospheric depth, lighter luminous gray blue mist behind where a central heading will be placed but plenty of dark enough sky for ivory typography. No snow, no cabin, no Christmas decorations, no star field, no people, no text, no logos, no buttons, no UI. Restrained nearly monochromatic blue hour, black graphite foreground, sophisticated real photographic lighting, high quality lens, no artificial gradient blobs. Landscape will extend edge to edge under a centered headline and single form above the desk. Keep center upper and middle areas clear for text.

## Промпт зимнего изображения

Create a cinematic premium photographic website hero background for a Ukrainian personalized video greeting service. Wide landscape 1536x1024 or wider. A magical but realistic winter night in the Carpathian forest, snow covered fir trees, a small beautiful wooden cabin on the RIGHT third with warm ivory glowing windows, a very subtle decorated evergreen nearby with tiny warm white lights, snowy path approaching the cabin from foreground. Deep muted midnight indigo and graphite colors, silver mist between distant mountains. The LEFT half and upper center should be dark atmospheric forest and negative space to place ivory typography. Elegant quiet premium mood, no overly bright saturated colors, no purple, no illustration, no cartoon, no people, no text, no logos, no watermark. Real photographic textures, cinematic low light, subtle snow falling. For a dark onyx Mercury-inspired interface.

## Промпт предметных изображений

Create a wide photographic triptych image containing THREE equal vertical panels side by side with no margins or dividing lines, for cropping into separate website cards. Overall image 3:1 landscape composition. Each panel must independently show a complete centered still life on dark charcoal graphite background with subtle muted warm light, premium understated photo, NOT illustration, no text, no logos, no people. LEFT third: small beautifully made birthday cake with thin lit candles on a charcoal table, cream frosting, warm candle light, tasteful moody celebration. CENTER third: elegant old wooden photograph frame displaying an indistinct vintage landscape photo (no human faces), lying with a few analog photos on a dark desk, contemplative nostalgic light. RIGHT third: black vinyl record and minimal headphones on a midnight graphite desk with soft ivory light, rich texture. Consistent quiet premium editorial photography across panels. No saturated colors. All subjects clearly legible on dark background. Objects stay within each panel and are centered in their own panel.

## Иллюстрация музыкального поздравления на день рождения

Изображение пластинки с семейной фотографией создано в ImageGen для страницы дня рождения. Люди на обложке вымышлены. Файлы `birthday-music-*` содержат адаптивные версии, а `og-birthday-music.jpg` — обложку 1200 × 630 для ссылки.
