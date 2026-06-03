-- Таблица объектов
CREATE TABLE IF NOT EXISTS objects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  direction TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT DEFAULT '',
  "createdAt" TEXT NOT NULL
);

-- Таблица контрагентов
CREATE TABLE IF NOT EXISTS counterparties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL
);

-- Таблица контрактов
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  direction TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "contractorId" TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  "amountPaid" INTEGER NOT NULL DEFAULT 0,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  status TEXT NOT NULL,
  "paymentStatus" TEXT NOT NULL,
  notes TEXT DEFAULT '',
  "createdAt" TEXT NOT NULL
);

-- Таблица этапов работ
CREATE TABLE IF NOT EXISTS stages (
  id TEXT PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  title TEXT NOT NULL,
  "plannedStart" TEXT NOT NULL,
  "plannedEnd" TEXT NOT NULL,
  "actualStart" TEXT DEFAULT '',
  "actualEnd" TEXT DEFAULT '',
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL
);

-- Таблица комментариев
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

-- Таблица документов
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL DEFAULT 0,
  "fileUrl" TEXT NOT NULL,
  "uploadedAt" TEXT NOT NULL
);

-- Отключаем RLS чтобы всё работало без авторизации
ALTER TABLE objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE counterparties DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
