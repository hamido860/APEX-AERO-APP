
import { Task, MasterTask, ProficiencyOverrides, RankSettings } from '@/types';
import { INITIAL_MASTER_TASKS, INITIAL_OPERATOR_NAMES, INITIAL_TASKS, DEFAULT_RANK_SETTINGS } from '@/constants';

declare var initSqlJs: any;

const DB_NAME = 'scheduler.db';
const DB_STORE_NAME = 'db_store';
const DB_VERSION = 2;

let dbInstance: any | null = null;
let saveTimeout: number | null = null;
let idbInstance: IDBDatabase | null = null;

// --- IndexedDB Persistence ---
const getIDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    if (idbInstance) return resolve(idbInstance);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
            db.createObjectStore(DB_STORE_NAME);
        }
    };
    request.onsuccess = (e: any) => {
        idbInstance = e.target.result;
        resolve(idbInstance);
    };
    request.onerror = (e) => reject(e);
});

const idb = {
    get: async (): Promise<Uint8Array | undefined> => {
        const db = await getIDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE_NAME, 'readonly');
            const store = tx.objectStore(DB_STORE_NAME);
            const getReq = store.get('db_file');
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = (e) => reject(e);
        });
    },
    set: async (value: Uint8Array): Promise<void> => {
        const db = await getIDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(DB_STORE_NAME);
            const setReq = store.put(value, 'db_file');
            setReq.onsuccess = () => resolve();
            setReq.onerror = (e) => reject(e);
        });
    },
};

// --- DB Initialization and Seeding ---

const createTables = (db: any) => {
    db.run(`
        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY,
            orderId TEXT,
            name TEXT,
            shortName TEXT,
            day INTEGER,
            startHour INTEGER,
            duration INTEGER,
            assignedTo TEXT,
            status TEXT,
            description TEXT,
            dueDay INTEGER,
            dueHour INTEGER,
            progress INTEGER,
            notes TEXT,
            dependencies TEXT,
            isCritical BOOLEAN,
            displayOrder INTEGER
        );
        CREATE TABLE operators ( name TEXT PRIMARY KEY );
        CREATE TABLE master_tasks (
            name TEXT PRIMARY KEY,
            shortName TEXT,
            program TEXT,
            subProgram TEXT,
            defaultDuration INTEGER
        );
        CREATE TABLE rank_settings (
            id INTEGER PRIMARY KEY,
            master INTEGER,
            senior INTEGER,
            junior INTEGER,
            trainee INTEGER
        );
        CREATE TABLE proficiency_overrides (
            operatorName TEXT,
            taskName TEXT,
            count INTEGER,
            PRIMARY KEY (operatorName, taskName)
        );
    `);
};

const seedData = (db: any) => {
    // Tasks
    const taskStmt = db.prepare(`INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    INITIAL_TASKS.forEach(task => {
        taskStmt.run([
            task.id, task.orderId, task.name, task.shortName, task.day, task.startHour,
            task.duration, task.assignedTo, task.status, task.description, task.dueDay,
            task.dueHour, task.progress, task.notes, JSON.stringify(task.dependencies || []),
            task.isCritical ? 1 : 0, task.displayOrder
        ]);
    });
    taskStmt.free();

    // Operators
    const opStmt = db.prepare(`INSERT INTO operators VALUES (?)`);
    INITIAL_OPERATOR_NAMES.forEach(name => opStmt.run([name]));
    opStmt.free();
    
    // Master Tasks
    const mtStmt = db.prepare(`INSERT INTO master_tasks VALUES (?, ?, ?, ?, ?)`);
    INITIAL_MASTER_TASKS.forEach(mt => mtStmt.run([mt.name, mt.shortName, mt.program, mt.subProgram, mt.defaultDuration]));
    mtStmt.free();

    // Rank Settings
    db.run(`INSERT INTO rank_settings VALUES (1, ?, ?, ?, ?)`, [
        DEFAULT_RANK_SETTINGS.master, DEFAULT_RANK_SETTINGS.senior,
        DEFAULT_RANK_SETTINGS.junior, DEFAULT_RANK_SETTINGS.trainee
    ]);
};

// --- Helper Functions ---
const objectFromRow = (columns: string[], values: any[]) => {
    const obj: any = {};
    columns.forEach((col, i) => obj[col] = values[i]);
    return obj;
};

const rowsFromObject = (stmt: any) => {
    const rows = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push(row);
    }
    return rows;
}

const saveNow = () => {
    if (!dbInstance) return;
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }
    const data = dbInstance.export();
    idb.set(data).catch(console.error);
};

const debouncedSave = (db: any) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(() => {
        saveNow();
    }, 1000);
};

// Save on page leave
window.addEventListener('beforeunload', saveNow);

const ensureDb = () => {
    if (!dbInstance) {
        throw new Error("Database not initialized. Call initDB() first.");
    }
};

// --- Public DB Service ---
export const db = {
    saveNow,
    initDB: async () => {
        if (dbInstance) return;
        const SQL = await initSqlJs({
            locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
        const savedDb = await idb.get();
        if (savedDb) {
            dbInstance = new SQL.Database(savedDb);
        } else {
            dbInstance = new SQL.Database();
            createTables(dbInstance);
            seedData(dbInstance);
            saveNow(); // Save immediately after seeding
        }
    },

    getAllData: async () => {
        ensureDb();
        return {
            tasks: await db.getTasks(),
            operators: await db.getOperators(),
            masterTasks: await db.getMasterTasks(),
            rankSettings: await db.getRankSettings(),
            proficiencyOverrides: await db.getProficiencyOverrides(),
        };
    },

    getTasks: async (): Promise<Task[]> => {
        ensureDb();
        const rows = dbInstance.exec("SELECT * FROM tasks ORDER BY displayOrder ASC");
        if (!rows[0]) return [];
        return rows[0].values.map((row: any[]) => {
            const obj = objectFromRow(rows[0].columns, row) as any;
            obj.dependencies = JSON.parse(obj.dependencies);
            obj.isCritical = obj.isCritical === 1;
            return obj as Task;
        });
    },

    getOperators: async (): Promise<string[]> => {
        ensureDb();
        const rows = dbInstance.exec("SELECT name FROM operators");
        if (!rows[0]) return [];
        return rows[0].values.map((row: any) => row[0]);
    },

    getMasterTasks: async (): Promise<MasterTask[]> => {
        ensureDb();
        const stmt = dbInstance.prepare("SELECT * FROM master_tasks");
        const tasks = rowsFromObject(stmt);
        stmt.free();
        return tasks;
    },
    
    getRankSettings: async (): Promise<RankSettings> => {
        ensureDb();
        const stmt = dbInstance.prepare("SELECT * FROM rank_settings WHERE id = 1");
        stmt.step();
        const settings = stmt.getAsObject();
        stmt.free();
        return settings as RankSettings;
    },

    getProficiencyOverrides: async (): Promise<ProficiencyOverrides> => {
        ensureDb();
        const stmt = dbInstance.prepare("SELECT * FROM proficiency_overrides");
        const overrides: ProficiencyOverrides = {};
        while(stmt.step()){
            const row = stmt.getAsObject() as { operatorName: string; taskName: string; count: number };
            if(!overrides[row.operatorName]) overrides[row.operatorName] = {};
            overrides[row.operatorName][row.taskName] = row.count;
        }
        stmt.free();
        return overrides;
    },

    updateTask: async (task: Task) => {
        ensureDb();
        dbInstance.run(
            `UPDATE tasks SET orderId=?, name=?, shortName=?, day=?, startHour=?, duration=?, assignedTo=?, status=?, description=?, dueDay=?, dueHour=?, progress=?, notes=?, dependencies=?, isCritical=?, displayOrder=? WHERE id=?`,
            [task.orderId, task.name, task.shortName, task.day, task.startHour, task.duration, task.assignedTo, task.status, task.description, task.dueDay, task.dueHour, task.progress, task.notes, JSON.stringify(task.dependencies || []), task.isCritical, task.displayOrder, task.id]
        );
        debouncedSave(dbInstance);
    },

    replaceTasks: async (tasks: Task[]) => {
        ensureDb();
        dbInstance.exec("BEGIN TRANSACTION;");
        dbInstance.exec("DELETE FROM tasks;");
        const stmt = dbInstance.prepare(`INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        tasks.forEach(task => {
            stmt.run([
                task.id, task.orderId, task.name, task.shortName, task.day, task.startHour,
                task.duration, task.assignedTo, task.status, task.description, task.dueDay,
                task.dueHour, task.progress, task.notes, JSON.stringify(task.dependencies || []),
                task.isCritical ? 1 : 0, task.displayOrder
            ]);
        });
        stmt.free();
        dbInstance.exec("COMMIT;");
        debouncedSave(dbInstance);
    },

    replaceOperators: async (operators: string[]) => {
        ensureDb();
        dbInstance.exec("BEGIN TRANSACTION; DELETE FROM operators;");
        const stmt = dbInstance.prepare("INSERT INTO operators VALUES (?)");
        operators.forEach(op => stmt.run([op]));
        stmt.free();
        dbInstance.exec("COMMIT;");
        debouncedSave(dbInstance);
    },

    replaceMasterTasks: async (tasks: MasterTask[]) => {
        ensureDb();
        dbInstance.exec("BEGIN TRANSACTION; DELETE FROM master_tasks;");
        const stmt = dbInstance.prepare("INSERT INTO master_tasks VALUES (?, ?, ?, ?, ?)");
        tasks.forEach(mt => stmt.run([mt.name, mt.shortName, mt.program, mt.subProgram, mt.defaultDuration]));
        stmt.free();
        dbInstance.exec("COMMIT;");
        debouncedSave(dbInstance);
    },

    updateRankSettings: async (settings: RankSettings) => {
        ensureDb();
        dbInstance.run(`UPDATE rank_settings SET master=?, senior=?, junior=?, trainee=? WHERE id=1`, [
            settings.master, settings.senior, settings.junior, settings.trainee
        ]);
        debouncedSave(dbInstance);
    },

    replaceProficiencyOverrides: async (overrides: ProficiencyOverrides) => {
        ensureDb();
        dbInstance.exec("BEGIN TRANSACTION; DELETE FROM proficiency_overrides;");
        const stmt = dbInstance.prepare("INSERT INTO proficiency_overrides VALUES (?, ?, ?)");
        for (const opName in overrides) {
            for (const taskName in overrides[opName]) {
                stmt.run([opName, taskName, overrides[opName][taskName]]);
            }
        }
        stmt.free();
        dbInstance.exec("COMMIT;");
        debouncedSave(dbInstance);
    }
};
