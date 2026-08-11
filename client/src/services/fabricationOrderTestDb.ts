export type FabricationOrderStatus =
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'on_hold'
  | 'completed';

export interface FabricationOrder {
  id: string;
  orderNumber: string;
  programCode: string;
  aircraftUnitId: string;
  msn: string;
  assembly: string;
  description: string;
  workCenterCode: string;
  status: FabricationOrderStatus;
  priority: number;
  plannedStart: string;
  plannedEnd: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

const DATABASE_NAME = 'apex-aero-test';
const DATABASE_VERSION = 1;
const STORE_NAME = 'fabrication_orders';

const now = '2026-07-19T08:00:00.000Z';

export const TEST_FABRICATION_ORDERS: FabricationOrder[] = [
  {
    id: 'fo-pc12-0001',
    orderNumber: 'OF-PC12-0001',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2401',
    msn: 'MSN-2401',
    assembly: 'Cockpit',
    description: 'Cockpit structural assembly',
    workCenterCode: 'WC-COCKPIT',
    status: 'in_progress',
    priority: 1,
    plannedStart: '2026-07-20T08:00:00.000Z',
    plannedEnd: '2026-07-22T16:00:00.000Z',
    progress: 62,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0002',
    orderNumber: 'OF-PC12-0002',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2401',
    msn: 'MSN-2401',
    assembly: 'Floor',
    description: 'Cabin floor structural assembly',
    workCenterCode: 'WC-FUSELAGE',
    status: 'released',
    priority: 2,
    plannedStart: '2026-07-21T08:00:00.000Z',
    plannedEnd: '2026-07-23T16:00:00.000Z',
    progress: 10,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0003',
    orderNumber: 'OF-PC12-0003',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2401',
    msn: 'MSN-2401',
    assembly: 'Rear Fuselage',
    description: 'Rear fuselage drilling, riveting and closure',
    workCenterCode: 'WC-FUSELAGE',
    status: 'in_progress',
    priority: 1,
    plannedStart: '2026-07-20T08:00:00.000Z',
    plannedEnd: '2026-07-24T16:00:00.000Z',
    progress: 117,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0004',
    orderNumber: 'OF-PC12-0004',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2402',
    msn: 'MSN-2402',
    assembly: 'Wing LH',
    description: 'Left wing structural assembly',
    workCenterCode: 'WC-WING',
    status: 'planned',
    priority: 2,
    plannedStart: '2026-07-24T08:00:00.000Z',
    plannedEnd: '2026-07-29T16:00:00.000Z',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0005',
    orderNumber: 'OF-PC12-0005',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2402',
    msn: 'MSN-2402',
    assembly: 'Wing RH',
    description: 'Right wing structural assembly',
    workCenterCode: 'WC-WING',
    status: 'planned',
    priority: 2,
    plannedStart: '2026-07-24T08:00:00.000Z',
    plannedEnd: '2026-07-29T16:00:00.000Z',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0006',
    orderNumber: 'OF-PC12-0006',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2402',
    msn: 'MSN-2402',
    assembly: 'Aileron LH',
    description: 'Left aileron assembly',
    workCenterCode: 'WC-CONTROL-SURFACES',
    status: 'released',
    priority: 3,
    plannedStart: '2026-07-27T08:00:00.000Z',
    plannedEnd: '2026-07-28T16:00:00.000Z',
    progress: 5,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0007',
    orderNumber: 'OF-PC12-0007',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2402',
    msn: 'MSN-2402',
    assembly: 'Flap RH',
    description: 'Right flap assembly',
    workCenterCode: 'WC-CONTROL-SURFACES',
    status: 'on_hold',
    priority: 2,
    plannedStart: '2026-07-27T08:00:00.000Z',
    plannedEnd: '2026-07-29T16:00:00.000Z',
    progress: 28,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0008',
    orderNumber: 'OF-PC12-0008',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2403',
    msn: 'MSN-2403',
    assembly: 'Horizontal Stabilizer',
    description: 'Horizontal stabilizer assembly',
    workCenterCode: 'WC-EMPENNAGE',
    status: 'planned',
    priority: 3,
    plannedStart: '2026-07-30T08:00:00.000Z',
    plannedEnd: '2026-08-03T16:00:00.000Z',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0009',
    orderNumber: 'OF-PC12-0009',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2403',
    msn: 'MSN-2403',
    assembly: 'Vertical Stabilizer',
    description: 'Vertical stabilizer assembly',
    workCenterCode: 'WC-EMPENNAGE',
    status: 'planned',
    priority: 3,
    plannedStart: '2026-07-30T08:00:00.000Z',
    plannedEnd: '2026-08-03T16:00:00.000Z',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0010',
    orderNumber: 'OF-PC12-0010',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2403',
    msn: 'MSN-2403',
    assembly: 'Nose Section',
    description: 'Forward nose section assembly',
    workCenterCode: 'WC-FUSELAGE',
    status: 'released',
    priority: 2,
    plannedStart: '2026-08-03T08:00:00.000Z',
    plannedEnd: '2026-08-05T16:00:00.000Z',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0011',
    orderNumber: 'OF-PC12-0011',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2404',
    msn: 'MSN-2404',
    assembly: 'Engine Mount',
    description: 'Engine mount structural assembly',
    workCenterCode: 'WC-ENGINE-MOUNT',
    status: 'planned',
    priority: 1,
    plannedStart: '2026-08-05T08:00:00.000Z',
    plannedEnd: '2026-08-07T16:00:00.000Z',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fo-pc12-0012',
    orderNumber: 'OF-PC12-0012',
    programCode: 'PC12-AERO',
    aircraftUnitId: 'PC12-2404',
    msn: 'MSN-2404',
    assembly: 'Tail Cone',
    description: 'Tail cone structural assembly',
    workCenterCode: 'WC-EMPENNAGE',
    status: 'planned',
    priority: 3,
    plannedStart: '2026-08-06T08:00:00.000Z',
    plannedEnd: '2026-08-10T16:00:00.000Z',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  },
];

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? request.transaction!.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: 'id' });

      if (!store.indexNames.contains('orderNumber')) {
        store.createIndex('orderNumber', 'orderNumber', { unique: true });
      }
      if (!store.indexNames.contains('status')) {
        store.createIndex('status', 'status');
      }
      if (!store.indexNames.contains('aircraftUnitId')) {
        store.createIndex('aircraftUnitId', 'aircraftUnitId');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open test IndexedDB'));
    request.onblocked = () => reject(new Error('Test IndexedDB upgrade is blocked by another tab'));
  });

  return databasePromise;
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export async function seedTestFabricationOrders(force = false): Promise<number> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  if (force) {
    store.clear();
  } else {
    const count = await new Promise<number>((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Unable to count fabrication orders'));
    });

    if (count > 0) {
      await waitForTransaction(transaction);
      return count;
    }
  }

  TEST_FABRICATION_ORDERS.forEach((order) => store.put(order));
  await waitForTransaction(transaction);
  return TEST_FABRICATION_ORDERS.length;
}

export async function getTestFabricationOrders(): Promise<FabricationOrder[]> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  const orders = await new Promise<FabricationOrder[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as FabricationOrder[]);
    request.onerror = () => reject(request.error ?? new Error('Unable to read fabrication orders'));
  });

  await waitForTransaction(transaction);
  return orders.sort((a, b) => a.orderNumber.localeCompare(b.orderNumber));
}

export async function resetTestFabricationOrders(): Promise<number> {
  return seedTestFabricationOrders(true);
}

export async function initializeTestFabricationOrderDb(): Promise<void> {
  const enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_INDEXEDDB === 'true';
  if (!enabled || typeof indexedDB === 'undefined') return;

  const count = await seedTestFabricationOrders();
  console.info(`[APEX test DB] ${count} fabrication orders available in IndexedDB`);
}
