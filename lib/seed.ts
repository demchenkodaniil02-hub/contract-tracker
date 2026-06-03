import { Contract, Counterparty, WorkObject, WorkStage } from './types'

export const seedCounterparties: Counterparty[] = [
  { id: 'c1', name: 'Иванов Сергей Николаевич', company: 'ООО СтройГрупп', phone: '+79161234567', email: 'ivanov@stroygroup.ru', type: 'customer' },
  { id: 'c2', name: 'Петров Олег Викторович', company: 'МКУ Городское хозяйство', phone: '+79502345678', email: 'petrov@city.ru', type: 'customer' },
  { id: 'c3', name: 'Морозова Наталья Андреевна', company: 'ООО Девелопмент Плюс', phone: '+79933456789', email: 'morozova@devplus.ru', type: 'customer' },
  { id: 'c4', name: 'Мельников Василий Иванович', company: 'ИП Мельников В.И.', phone: '+79674567890', email: 'melnikov@mail.ru', type: 'contractor' },
  { id: 'c5', name: 'Бондарев Тарас Сергеевич', company: 'ООО МеталСтрой', phone: '+79505678901', email: 'bondarev@metalstroy.ru', type: 'contractor' },
  { id: 'c6', name: 'Волков Андрей Михайлович', company: 'ИП Волков А.М.', phone: '+79936789012', email: 'volkov@mail.ru', type: 'contractor' },
]

export const seedObjects: WorkObject[] = [
  { id: 'o1', name: 'Парк "Дружба"', address: 'ул. Центральная, 12', direction: 'maf', customerId: 'c1', status: 'active', notes: 'Установка скамеек, урн, фонарей', createdAt: '2024-01-15' },
  { id: 'o2', name: 'ЖК "Солнечный"', address: 'ул. Ленина, 45', direction: 'finishing', customerId: 'c3', status: 'active', notes: 'Отделка фасада и внутренних помещений', createdAt: '2024-02-01' },
  { id: 'o3', name: 'Школа №14', address: 'ул. Мира, 8', direction: 'maf', customerId: 'c2', status: 'active', notes: 'Спортивное оборудование и забор', createdAt: '2024-03-10' },
  { id: 'o4', name: 'БЦ "Арена"', address: 'просп. Победы, 100', direction: 'finishing', customerId: 'c3', status: 'completed', notes: 'Офисные помещения 3-5 этажи', createdAt: '2024-01-05' },
  { id: 'o5', name: 'Сквер им. Пушкина', address: 'ул. Садовая, 1', direction: 'maf', customerId: 'c2', status: 'active', notes: 'Реконструкция', createdAt: '2024-04-01' },
]

export const seedContracts: Contract[] = [
  {
    id: 'ct1', number: 'МАФ-2024-001', objectId: 'o1', direction: 'maf',
    customerId: 'c1', contractorId: 'c5',
    amount: 450000, amountPaid: 225000,
    startDate: '2024-03-01', endDate: '2024-07-31',
    status: 'active', paymentStatus: 'partial',
    notes: 'Первый транш оплачен. Второй — после сдачи секции А.',
    createdAt: '2024-02-20',
  },
  {
    id: 'ct2', number: 'ОТД-2024-015', objectId: 'o2', direction: 'finishing',
    customerId: 'c3', contractorId: 'c6',
    amount: 1200000, amountPaid: 600000,
    startDate: '2024-04-01', endDate: '2024-10-31',
    status: 'active', paymentStatus: 'partial',
    notes: 'Работы идут по графику.',
    createdAt: '2024-03-15',
  },
  {
    id: 'ct3', number: 'МАФ-2024-003', objectId: 'o3', direction: 'maf',
    customerId: 'c2', contractorId: 'c4',
    amount: 320000, amountPaid: 320000,
    startDate: '2024-05-01', endDate: '2024-06-30',
    status: 'completed', paymentStatus: 'paid',
    notes: 'Выполнено в срок.',
    createdAt: '2024-04-10',
  },
  {
    id: 'ct4', number: 'ОТД-2023-042', objectId: 'o4', direction: 'finishing',
    customerId: 'c3', contractorId: 'c6',
    amount: 890000, amountPaid: 890000,
    startDate: '2024-01-15', endDate: '2024-05-15',
    status: 'completed', paymentStatus: 'paid',
    notes: 'Сдано заказчику 10.05.2024.',
    createdAt: '2024-01-10',
  },
  {
    id: 'ct5', number: 'МАФ-2024-007', objectId: 'o5', direction: 'maf',
    customerId: 'c2', contractorId: 'c5',
    amount: 275000, amountPaid: 0,
    startDate: '2024-06-01', endDate: '2024-08-31',
    status: 'planning', paymentStatus: 'not_paid',
    notes: 'Договор подписан, аванс не поступил.',
    createdAt: '2024-05-20',
  },
  {
    id: 'ct6', number: 'ОТД-2024-018', objectId: 'o2', direction: 'finishing',
    customerId: 'c3', contractorId: 'c4',
    amount: 540000, amountPaid: 180000,
    startDate: '2024-07-01', endDate: '2024-12-31',
    status: 'active', paymentStatus: 'partial',
    notes: 'Секция Б.',
    createdAt: '2024-06-15',
  },
]

export const seedStages: WorkStage[] = [
  { id: 's1', contractId: 'ct1', title: 'Демонтаж старого оборудования', plannedStart: '2024-03-01', plannedEnd: '2024-03-15', actualStart: '2024-03-01', actualEnd: '2024-03-14', progressPercent: 100, amount: 50000, status: 'completed' },
  { id: 's2', contractId: 'ct1', title: 'Фундаментные работы', plannedStart: '2024-03-16', plannedEnd: '2024-04-15', actualStart: '2024-03-16', actualEnd: '', progressPercent: 80, amount: 120000, status: 'in_progress' },
  { id: 's3', contractId: 'ct1', title: 'Монтаж МАФ секция А', plannedStart: '2024-04-16', plannedEnd: '2024-05-31', actualStart: '', actualEnd: '', progressPercent: 0, amount: 180000, status: 'pending' },
  { id: 's4', contractId: 'ct1', title: 'Монтаж МАФ секция Б', plannedStart: '2024-06-01', plannedEnd: '2024-07-15', actualStart: '', actualEnd: '', progressPercent: 0, amount: 100000, status: 'pending' },
  { id: 's5', contractId: 'ct2', title: 'Подготовка поверхности фасада', plannedStart: '2024-04-01', plannedEnd: '2024-05-15', actualStart: '2024-04-03', actualEnd: '2024-05-20', progressPercent: 100, amount: 250000, status: 'completed' },
  { id: 's6', contractId: 'ct2', title: 'Утепление и штукатурка', plannedStart: '2024-05-16', plannedEnd: '2024-07-31', actualStart: '2024-05-21', actualEnd: '', progressPercent: 65, amount: 480000, status: 'in_progress' },
  { id: 's7', contractId: 'ct2', title: 'Финишная отделка', plannedStart: '2024-08-01', plannedEnd: '2024-10-31', actualStart: '', actualEnd: '', progressPercent: 0, amount: 470000, status: 'pending' },
]
