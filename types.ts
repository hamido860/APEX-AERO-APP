




export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Completed = 'Completed',
  OnHold = 'On Hold',
  QualityOK = 'Quality OK',
}

export enum Rank {
  Master = 'Master',
  Senior = 'Senior',
  Junior = 'Junior',
  Trainee = 'Trainee',
  Unranked = 'Unranked',
}

export interface RankSettings {
  master: number;
  senior: number;
  junior: number;
  trainee: number;
}

export const getRank = (count: number, settings: RankSettings): Rank => {
    if (count >= settings.master) return Rank.Master;
    if (count >= settings.senior) return Rank.Senior;
    if (count >= settings.junior) return Rank.Junior;
    if (count > 0) return Rank.Trainee; // Trainee is always 1 or more
    return Rank.Unranked;
};

export interface Task {
  id: number;
  orderId: string;
  name: string;
  shortName: string;
  day: number; // 0 for Sunday, 1 for Monday, etc.
  startHour: number; // 0-8, representing the 9 hours of the workday
  duration: number; // in hours
  assignedTo: string;
  status: TaskStatus;
  description: string;
  dueDay: number; // Day the task is due
  dueHour: number; // The hour index by which the task must be completed (e.g., end of hour 5)
  progress: number; // Completion percentage, 0-100
  notes?: string | null;
  dependencies?: number[]; // IDs of tasks that must be completed first
  isCritical?: boolean;
  displayOrder: number;
}

export interface MasterTask {
  name: string;
  shortName: string;
  program: string;
  subProgram: string;
  defaultDuration: number;
}

export type ProficiencyOverrides = {
  [operatorName: string]: {
    [taskName:string]: number;
  };
};