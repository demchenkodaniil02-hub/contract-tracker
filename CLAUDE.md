# Система контрактов — CLAUDE.md

## Что это

SaaS для управления строительными контрактами. Два направления: МАФ/Металл и Отделка.

**Продакшн:** https://contract-tracker-peach.vercel.app  
**GitHub:** https://github.com/demchenkodaniil02-hub/contract-tracker  
**Supabase проект:** https://thnswsvbywspnwuauwab.supabase.co

## Быстрый старт

```bash
npm install
npm run dev   # http://localhost:3000
```

Перед запуском создать `.env.local` (см. секцию ниже).

## Переменные окружения (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://thnswsvbywspnwuauwab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_K8ng-QCrq-kUlQawA4WF2Q_IXWwH5bN
SUPABASE_SERVICE_ROLE_KEY=<взять из Supabase Dashboard → Settings → API → service_role>
YANDEX_DISK_TOKEN=<из .env.local на старом компе>
RESEND_API_KEY=<опционально, для email-уведомлений о задачах>
```

На Vercel все переменные уже настроены. `SUPABASE_SERVICE_ROLE_KEY` нужен для: загрузки/удаления документов, приглашения пользователей.

## Стек

- **Next.js 14** App Router + TypeScript
- **Supabase** — PostgreSQL + Auth + Storage + Realtime
- **Vercel** — деплой (автодеплой из main ветки GitHub)
- **Resend** — email уведомления (тестовый режим — только на demchenkodaniil02@gmail.com)

## Структура данных (Supabase таблицы)

- `contracts` — контракты
- `objects` — объекты/стройки
- `counterparties` — заказчики и исполнители
- `work_stages` — этапы работ по контракту
- `payments` — платежи по контрактам
- `documents` — метаданные документов (файлы в Storage bucket `documents`)
- `comments` — комментарии к контрактам
- `tasks` — задачи по контрактам
- `contract_history` — история изменений
- `profiles` — профили пользователей (расширение auth.users)

## Ключевые файлы

```
app/
  page.tsx              — Главная/дашборд (KPI, график оплат, прогноз)
  contracts/page.tsx    — Список контрактов (таблица, фильтры, пагинация)
  contracts/[id]/page.tsx — Карточка контракта
  reports/page.tsx      — Отчёты (оборот по году + задолженность)
  profile/page.tsx      — Профиль + инвайт + скачать калькулятор
  objects/page.tsx      — Объекты
  counterparties/page.tsx — Контрагенты

components/
  layout/Sidebar.tsx    — Сайдбар с навигацией и глобальным поиском
  layout/FirstLoginModal.tsx — Модалка первого входа (имя + фамилия обязательно)
  contracts/ContractDocuments.tsx — Загрузка документов (pdf, office, архивы, изображения)
  contracts/ContractPayments.tsx  — Платежи
  contracts/ContractTasks.tsx     — Задачи
  GlobalSearch.tsx      — Глобальный поиск (Ctrl+K)

lib/
  store.ts    — Zustand store, все API вызовы через /api/mutate
  types.ts    — TypeScript типы
  useProfile.ts — хук профиля пользователя
  usePresence.ts — онлайн-пользователи (Supabase Realtime)

app/api/
  mutate/route.ts        — Универсальный CRUD (insert/update/delete/upsert)
  invite/route.ts        — Приглашение пользователей (service_role)
  get-upload-url/route.ts — Presigned URL для загрузки в Storage
  finalize-upload/route.ts — Сохранение метаданных после загрузки
  delete-doc/route.ts    — Удаление документа из Storage + БД
  sync-docs/route.ts     — Синхронизация документов из Storage
  send-task-reminder/route.ts — Email при создании задачи
```

## Уже реализовано

- Полный CRUD контрактов, объектов, контрагентов
- Этапы работ с Ганттом
- Платежи с прогресс-барами
- Загрузка документов (PDF, Word, Excel, изображения, архивы zip/rar/7z)
- Просмотр PDF и Office через iframe
- Комментарии и история изменений
- Задачи с email-уведомлениями
- Отчёты: оборот по году / задолженность по исполнителям
- Дашборд: KPI, график оплат (Recharts), прогноз поступлений, дедлайны
- Глобальный поиск Ctrl+K (контракты + объекты + контрагенты)
- Инвайт пользователей по email (Supabase invite link)
- Страница установки пароля для приглашённых (/set-password)
- Онлайн-пользователи в сайдбаре (Supabase Realtime Presence)
- Мобильная адаптация
- Фильтрация контрактов по статусу/направлению + URL-параметры

## Важные детали

- Все мутации идут через `/api/mutate` (не напрямую через supabase client) — так обходятся RLS-блокировки у обычных пользователей
- `SUPABASE_SERVICE_ROLE_KEY` нужен серверным route handlers для admin-операций
- Таблица `documents` использует `filePath` для Storage и `fileUrl` для публичного URL
- Первый вход требует ввода Имени И Фамилии через пробел (уникальность проверяется)
- Инвайт отправляет стандартное Supabase письмо — шаблон нужно менять в Supabase Dashboard → Auth → Email Templates → Invite User
- Resend работает только в тестовом режиме → только на demchenkodaniil02@gmail.com

## Деплой

Push в `main` → автодеплой на Vercel. Всегда запускать перед пушем:
```bash
npx tsc --noEmit
```
