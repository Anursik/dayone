# DAYONE

Персональное Telegram Mini App для привычек, питания, тренировок и здоровья.
Работает без backend-сервера, данные хранятся только на устройстве пользователя.

## Команды

```bash
npm install        # зависимости
npm run dev        # режим разработки: http://localhost:3000 (работает в обычном браузере)
npm run build      # статическая сборка в папку out/
npx tsc --noEmit   # проверка TypeScript
npm run lint       # ESLint
```

Сборка под GitHub Pages (если репозиторий называется `dayone`):

```bash
NEXT_PUBLIC_BASE_PATH=/dayone npm run build
```

## Стек

Next.js 16 (static export) · TypeScript · Tailwind CSS 4 · компоненты в стиле shadcn/ui (`components.json`) ·
Lucide · Framer Motion · Zod · Dexie.js (этап 2) · Recharts (этап 7) · официальный Telegram Web App SDK (`telegram-web-app.js`).

## Структура

```
src/
  app/                 маршруты (каждый экран — отдельная статическая страница)
  components/
    ui/                дизайн-система: Card, Button, ProgressRing, SegmentedControl, Switch, ListRow…
    layout/            AppShell, нижняя навигация, PageHeader
    dashboard/ habits/ nutrition/ workouts/ health/ journal/ analytics/ profile/ settings/
  features/            логика разделов (хуки, связывающие UI и репозитории)
  lib/
    telegram/          SDK-обёртка: провайдер, BackButton, HapticFeedback, типы
    theme/             темы (авто/светлая/тёмная), скрипт без «вспышки» темы
    settings/          настройки в LocalStorage с проверкой Zod
    calculations/      чистые функции расчётов
    date.ts, format.ts, navigation.ts
  hooks/  types/
```

## Telegram

Внутри Telegram используются: `ready()`, `expand()`, `disableVerticalSwipes()`, нативная кнопка «Назад»,
тема Telegram (в режиме «Авто»), цвета шапки и фона, safe area (`--tg-safe-area-inset-*`), вибрация.
В обычном браузере приложение работает в браузерном режиме с собственной кнопкой «Назад».
Данные пользователя Telegram (`initDataUnsafe`) используются только для имени и аватара и не считаются проверенной идентификацией.
