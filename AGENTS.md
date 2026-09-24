# Система контрактов — AGENTS.md

## Что это

SaaS для управления строительными контрактами. Два направления: МАФ/Металл и Отделка.

**Продакшн:** https://contract-tracker-peach.vercel.app
**GitHub:** https://github.com/demchenkodaniil02-hub/contract-tracker
**Supabase проект:** https://thnswsvbywspnwuauwab.supabase.co
**Админ:** demchenkodaniil02@gmail.com — единственный аккаунт с доступом к разделу "Журнал изменений" и управлению именами других пользователей.

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
YANDEX_DISK_TOKEN=<токен OAuth Яндекс.Диска — хранение всех загруженных документов>
BREVO_API_KEY=<для email-уведомлений о задачах>
```

На Vercel все переменные уже настроены. `SUPABASE_SERVICE_ROLE_KEY` нужен для: приглашения пользователей и части admin-операций. Загрузка/хранение документов идёт через `YANDEX_DISK_TOKEN`, не через Supabase Storage.

## Стек

- **Next.js 16** App Router + TypeScript
- **Supabase** — PostgreSQL + Auth + Realtime (Storage не используется — файлы хранятся на Яндекс.Диске)
- **Vercel** — деплой (автодеплой из main ветки GitHub)
- **Яндекс.Диск API** — хранение документов по контрактам (`lib/yandex-disk.ts`)
- **Brevo** — email-уведомления о задачах (не Resend, несмотря на старые упоминания в истории проекта)

## Структура данных (Supabase таблицы)

- `contracts` — контракты
- `objects` — объекты/стройки
- `counterparties` — заказчики и исполнители
- `work_stages` — этапы работ по контракту
- `payments` — платежи по контрактам
- `ks_forms` — формы КС
- `documents` — метаданные документов (сами файлы — на Яндекс.Диске, тут только `fileUrl`/`filePath`)
- `comments` — комментарии к контрактам
- `tasks` — задачи по контрактам (поля `assigneeId` — кому назначена, `assignedById` — кто назначил)
- `contract_history` — история изменений
- `profiles` — профили пользователей (расширение auth.users), RLS включён — доступ через `supabaseAdmin` на сервере
- `app_settings` — универсальная key/value таблица без RLS (сейчас используется для отметки версии/ссылки калькулятора расчётов: ключи `calculator_version`, `calculator_url`)

## Ключевые файлы

```
app/
  page.tsx              — Главная/дашборд (KPI, график оплат, прогноз, последние поступления)
  tasks/page.tsx         — Мои задачи (вкладки "Мне назначены" / "Поставленные мной", карточка задачи)
  contracts/page.tsx    — Список контрактов (таблица, фильтры, пагинация, фильтры в URL)
  contracts/[id]/page.tsx — Карточка контракта
  reports/page.tsx      — Отчёты (сводная таблица "Исполнители": оборот за год + задолженность)
  profile/page.tsx      — Профиль + инвайт + скачать калькулятор + (админ) управление именами и версией калькулятора
  activity/page.tsx     — Журнал изменений (доступ только demchenkodaniil02@gmail.com)
  objects/page.tsx      — Объекты
  counterparties/page.tsx — Контрагенты

components/
  layout/Sidebar.tsx    — Сайдбар: навигация, глобальный поиск, бейдж активных задач, онлайн-пользователи
  layout/FirstLoginModal.tsx — Модалка первого входа (имя + фамилия обязательно)
  layout/MyTasksModal.tsx    — Модалка "Ваши задачи" при входе на сайт (один раз за сессию)
  layout/CalculatorUpdateToast.tsx — Тост в углу экрана о новой версии калькулятора
  ui/UserAvatar.tsx      — Аватар пользователя: иконка стройтематики, детерминированная по id (не буквы)
  contracts/ContractDocuments.tsx — Загрузка документов (pdf, office, архивы, изображения) на Яндекс.Диск
  contracts/ContractPayments.tsx  — Платежи
  contracts/ContractTasks.tsx     — Задачи внутри карточки контракта, email при назначении
  GlobalSearch.tsx      — Глобальный поиск (Ctrl+K)

lib/
  store.ts       — Zustand store, все API вызовы через /api/mutate
  types.ts       — TypeScript типы
  useProfile.ts  — хук профиля пользователя + updateUserName (admin-only)
  usePresence.ts — онлайн-пользователи (Supabase Realtime)
  useCalculatorVersion.ts — отслеживание новой версии калькулятора (опрос раз в 4 мин + localStorage)
  yandex-disk.ts — клиент Яндекс.Диска (загрузка/удаление/публикация файлов)

app/api/
  mutate/route.ts          — Универсальный CRUD (insert/update/delete/upsert), анонимный ключ, RLS отключён на большинстве таблиц
  invite/route.ts          — Приглашение пользователей (service_role)
  profile/route.ts         — GET/POST/PATCH профиля; PATCH чужого профиля — только для админа
  calculator-info/route.ts — GET версии/ссылки калькулятора; POST — только для админа (Bearer токен)
  upload-doc/route.ts, get-upload-url/route.ts, finalize-upload/route.ts — загрузка документов на Яндекс.Диск
  delete-doc/route.ts, sync-docs/route.ts — удаление и синхронизация документов
  preview-doc/route.ts, preview-public/route.ts, office-url/route.ts — просмотр PDF/Office в iframe
  send-task-reminder/route.ts — Email через Brevo при создании/напоминании задачи
  load-all/route.ts        — Массовая выгрузка данных для store при загрузке приложения
  presence/route.ts        — Пинг "онлайн" для Realtime Presence
```

## Уже реализовано

- Полный CRUD контрактов, объектов, контрагентов
- Этапы работ с Ганттом
- Платежи с прогресс-барами, формы КС (с учётом переплаты)
- Загрузка документов на Яндекс.Диск (PDF, Word, Excel, изображения, архивы zip/rar/7z), просмотр PDF/Office через iframe
- Комментарии и история изменений
- Задачи: создание с назначением исполнителя, email-уведомления (Brevo), страница "Мои задачи" (назначенные мне / поставленные мной), детальная карточка задачи, модалка при входе, бейдж в сайдбаре
- Отчёты: сводная таблица по исполнителям (оборот за год + задолженность + "всего")
- Дашборд: KPI, график оплат (Recharts), прогноз поступлений, дедлайны, последние поступления
- Глобальный поиск Ctrl+K (контракты + объекты + контрагенты)
- Инвайт пользователей по email (Supabase invite link)
- Страница установки пароля для приглашённых (/set-password)
- Онлайн-пользователи в сайдбаре (Supabase Realtime Presence), аватары — иконки стройтематики по id
- Уведомление о новой версии калькулятора расчётов: бейдж на карточке, тост в углу экрана, автосохранение новой ссылки при вставке (админ), периодическая проверка
- Раздел "Журнал изменений" — виден и доступен только demchenkodaniil02@gmail.com
- Мобильная адаптация, строгое левое выравнивание всех таблиц/сеток
- Фильтрация контрактов по статусу/направлению + URL-параметры (сохраняются при навигации назад)

## Важные детали

- Все мутации идут через `/api/mutate` (не напрямую через supabase client) — так обходятся RLS-блокировки у обычных пользователей
- `profiles` — единственная таблица с включённым RLS среди основных; чтение/запись только через `supabaseAdmin` на сервере
- `SUPABASE_SERVICE_ROLE_KEY` нужен серверным route handlers для admin-операций (инвайт и т.п.)
- Документы: реальные файлы на Яндекс.Диске, в Supabase — только метаданные (`documents.fileUrl`/`filePath`)
- Первый вход требует ввода Имени И Фамилии через пробел (уникальность проверяется)
- Инвайт отправляет стандартное Supabase письмо — шаблон нужно менять в Supabase Dashboard → Auth → Email Templates → Invite User
- Brevo может блокировать запросы с незнакомых IP ("Block unknown IP addresses" в настройках безопасности) — если письма вдруг перестали приходить, это первое, что нужно проверить
- Все таблицы/сетки: строго левое выравнивание (заголовки и данные), без исключений — устоявшееся требование по всему проекту
- Правильный паттерн для "растянутых на всю ширину" таблиц без внутренних разрывов: фиксированная ширина колонок + `justify-content: space-between` — не `fr`, не `minmax()+justify-content:start`
- CSS Grid по умолчанию растягивает элементы одной строки до высоты самого высокого — иногда это нужно (например, ряд KPI-карточек с похожим контентом), а иногда наоборот ломает вёрстку (панели с сильно разным количеством строк) — решать `alignItems: 'start'` по ситуации, не автоматически

## Деплой

Push в `main` → автодеплой на Vercel. Всегда запускать перед пушем:
```bash
npx tsc --noEmit
```
