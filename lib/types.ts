export type Direction = 'maf' | 'finishing'

export type ContractStatus =
  | 'planning'
  | 'active'
  | 'completed'
  | 'paused'
  | 'cancelled'
  | 'overdue'

export type PaymentStatus = 'not_paid' | 'partial' | 'paid'

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'delayed'

export interface Counterparty {
  id: string
  name: string
  company: string
  phone: string
  email: string
  type: 'customer' | 'contractor'
}

export interface WorkObject {
  id: string
  name: string
  address: string
  direction: Direction
  customerId: string
  status: 'active' | 'completed' | 'archived'
  notes: string
  createdAt: string
}

export interface WorkStage {
  id: string
  contractId: string
  title: string
  plannedStart: string
  plannedEnd: string
  actualStart: string
  actualEnd: string
  progressPercent: number
  amount: number
  status: StageStatus
}

export interface Contract {
  id: string
  number: string
  objectId: string
  direction: Direction
  customerId: string
  contractorId: string
  amount: number
  amountPaid: number
  startDate: string
  endDate: string
  status: ContractStatus
  paymentStatus: PaymentStatus
  notes: string
  createdAt: string
}

export interface Comment {
  id: string
  contractId: string
  author: string
  text: string
  createdAt: string
}

export type DocumentCategory = 'contract' | 'ks2' | 'ks3' | 'estimate' | 'act' | 'project' | 'other'

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'contract', label: 'Договор' },
  { value: 'ks2',      label: 'КС-2' },
  { value: 'ks3',      label: 'КС-3' },
  { value: 'estimate', label: 'Смета' },
  { value: 'act',      label: 'Акт' },
  { value: 'project',  label: 'Проект' },
  { value: 'other',    label: 'Другое' },
]

export interface Document {
  id: string
  contractId: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  filePath?: string
  uploadedAt: string
  category: DocumentCategory
}

export interface ContractHistory {
  id: string
  contractId: string
  action: string
  field?: string
  oldValue?: string
  newValue?: string
  author: string
  createdAt: string
}

export interface Profile {
  id: string
  email: string
  name: string
  role: string
  avatarColor: string
  createdAt: string
}

export interface Payment {
  id: string
  contractId: string
  amount: number
  paidAt: string
  note: string
  createdAt: string
}

export interface Task {
  id: string
  contractId: string
  title: string
  description: string
  dueDate: string
  dueTime: string
  status: 'pending' | 'completed' | 'cancelled'
  reminderEmail: string
  reminderSent: boolean
  assigneeId?: string
  reminderDate?: string
  createdAt: string
}

