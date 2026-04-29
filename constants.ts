
import { Task, TaskStatus, Rank, MasterTask, RankSettings } from './types';

export const WORK_HOURS = Array.from({ length: 9 }, (_, i) => {
    const hour = i + 8; // Assuming 8 AM start time
    return `${hour}:00`;
});

export const WORK_DAY_HOURS = 9;

export const TASK_STATUS_COLORS: { [key in TaskStatus]: { background: string; text: string; } } = {
    [TaskStatus.ToDo]: { background: 'bg-slate-600', text: 'text-slate-100' },
    [TaskStatus.InProgress]: { background: 'bg-sky-500', text: 'text-white' },
    [TaskStatus.Completed]: { background: 'bg-green-500', text: 'text-white' },
    [TaskStatus.OnHold]: { background: 'bg-orange-500', text: 'text-white' },
    [TaskStatus.QualityOK]: { background: 'bg-purple-600', text: 'text-white' },
};

export const RANK_THEME: { [key in Rank]: { bg: string; text: string; } } = {
  [Rank.Master]:   { bg: 'bg-purple-600', text: 'text-purple-400' },
  [Rank.Senior]:   { bg: 'bg-cyan-600', text: 'text-cyan-400' },
  [Rank.Junior]:   { bg: 'bg-green-600', text: 'text-green-400' },
  [Rank.Trainee]:  { bg: 'bg-yellow-600', text: 'text-yellow-400' },
  [Rank.Unranked]: { bg: 'bg-slate-700', text: 'text-slate-400' },
};

export const rankToScore: { [key in Rank]: number } = {
  [Rank.Master]: 5,
  [Rank.Senior]: 4,
  [Rank.Junior]: 3,
  [Rank.Trainee]: 2,
  [Rank.Unranked]: 1,
};

export const DEFAULT_RANK_SETTINGS: RankSettings = {
  master: 10,
  senior: 7,
  junior: 5,
  trainee: 1,
};

export const INITIAL_OPERATOR_NAMES = [ 'Alex Ray', 'Brian Holt', 'Casey Jones', 'Devon Smith', 'Eli Vance', 'Fiona Glen', 'George Martin', 'Hannah Zoe', 'Ian Knight', 'Jenna Ortis', 'Kyle Brookes', 'Liam Neeson', 'Mia Wong', 'Nora Flynn', 'Oscar Paul', 'Pat Riley', 'Quinn Fabray', 'Rachel Zane', 'Sam Fisher', 'Talia Hale', 'Uma Vance', 'Victor Creed', 'Will Turner', 'Xena Warrior', 'Yara Grey' ];

export const INITIAL_TASKS: Task[] = [
  { id: 1, orderId: 'WO-78101', name: 'Fuselage Section 1A', shortName: 'FUS-1A', day: 1, startHour: 0, duration: 4, assignedTo: INITIAL_OPERATOR_NAMES[0], status: TaskStatus.InProgress, description: 'Assemble the primary fuselage section 1A. Requires crane operation.', dueDay: 1, dueHour: 5, progress: 65, notes: null, displayOrder: 0, isCritical: true },
  { id: 2, orderId: 'WO-78102', name: 'Wing Spar Fabrication', shortName: 'W-SPAR-FAB', day: 1, startHour: 4, duration: 5, assignedTo: INITIAL_OPERATOR_NAMES[18], status: TaskStatus.ToDo, description: 'Fabricate the main wing spar from titanium stock.', dueDay: 2, dueHour: 2, progress: 0, notes: null, displayOrder: 1, isCritical: false },
  { id: 3, orderId: 'PO-22518', name: 'Order Raw Materials', shortName: 'ORD-RAW-MAT', day: 0, startHour: 1, duration: 2, assignedTo: INITIAL_OPERATOR_NAMES[15], status: TaskStatus.Completed, description: 'Place orders for aluminum alloys and composite materials for Q3.', dueDay: 0, dueHour: 3, progress: 100, notes: null, displayOrder: 2, isCritical: false },
  { id: 4, orderId: 'WO-78103', name: 'Landing Gear Assembly', shortName: 'LG-ASSY', day: 2, startHour: 2, duration: 6, assignedTo: INITIAL_OPERATOR_NAMES[1], status: TaskStatus.ToDo, description: 'Assemble and test the main landing gear hydraulics.', dueDay: 2, dueHour: 8, progress: 0, notes: null, displayOrder: 3, isCritical: true },
  { id: 5, orderId: 'WO-78104', name: 'Tail Fin Fabrication', shortName: 'T-FIN-FAB', day: 3, startHour: 0, duration: 3, assignedTo: INITIAL_OPERATOR_NAMES[4], status: TaskStatus.InProgress, description: 'Layup and cure the carbon fiber tail fin.', dueDay: 3, dueHour: 4, progress: 30, notes: null, displayOrder: 4, isCritical: false },
  { id: 6, orderId: 'PO-22519', name: 'Engine Mount Order', shortName: 'ORD-ENG-MNT', day: 3, startHour: 3, duration: 1, assignedTo: INITIAL_OPERATOR_NAMES[15], status: TaskStatus.OnHold, description: 'Order specialized high-tensile bolts for engine mounts. Supplier issue.', dueDay: 3, dueHour: 5, progress: 0, notes: 'Supplier issue', displayOrder: 5, isCritical: false },
  { id: 7, orderId: 'WO-78105', name: 'Cockpit Wiring', shortName: 'CPT-WIRE', day: 4, startHour: 1, duration: 7, assignedTo: INITIAL_OPERATOR_NAMES[8], status: TaskStatus.InProgress, description: 'Install and connect the main avionics wiring harness in the cockpit.', dueDay: 5, dueHour: 1, progress: 85, notes: null, dependencies: [8], displayOrder: 6, isCritical: true },
  { id: 8, orderId: 'WO-78106', name: 'Bulkhead Machining', shortName: 'BLK-MACH', day: 5, startHour: 0, duration: 9, assignedTo: INITIAL_OPERATOR_NAMES[18], status: TaskStatus.Completed, description: 'CNC machining of the forward pressure bulkhead.', dueDay: 5, dueHour: 8, progress: 100, notes: null, displayOrder: 7, isCritical: false },
  { id: 9, orderId: 'WO-78107', name: 'Final Inspection Prep', shortName: 'INSP-PREP', day: 6, startHour: 0, duration: 4, assignedTo: INITIAL_OPERATOR_NAMES[16], status: TaskStatus.ToDo, description: 'Prepare the airframe for final quality assurance inspection.', dueDay: 6, dueHour: 4, progress: 10, notes: null, dependencies: [8, 17], displayOrder: 8, isCritical: false },
  { id: 10, orderId: 'WO-78108', name: 'Galley Frame Welding', shortName: 'GAL-WELD', day: 0, startHour: 3, duration: 5, assignedTo: INITIAL_OPERATOR_NAMES[2], status: TaskStatus.InProgress, description: 'Weld the main frame for the aft galley.', dueDay: 0, dueHour: 8, progress: 40, notes: null, displayOrder: 9, isCritical: false },
  { id: 11, orderId: 'WO-78109', name: 'Passenger Seat Installation', shortName: 'SEAT-INST', day: 1, startHour: 1, duration: 8, assignedTo: INITIAL_OPERATOR_NAMES[3], status: TaskStatus.InProgress, description: 'Install passenger seats in cabin section 2.', dueDay: 1, dueHour: 8, progress: 50, notes: null, displayOrder: 10, isCritical: false },
  { id: 12, orderId: 'PO-22520', name: 'Order Cabin Insulation', shortName: 'ORD-INSUL', day: 2, startHour: 0, duration: 1, assignedTo: INITIAL_OPERATOR_NAMES[15], status: TaskStatus.ToDo, description: 'Order thermal and acoustic insulation panels.', dueDay: 2, dueHour: 1, progress: 0, notes: null, displayOrder: 11, isCritical: false },
  { id: 13, orderId: 'WO-78110', name: 'Floor Panel Lamination', shortName: 'FLR-LAM', day: 2, startHour: 1, duration: 8, assignedTo: INITIAL_OPERATOR_NAMES[5], status: TaskStatus.InProgress, description: 'Laminate honeycomb core floor panels.', dueDay: 3, dueHour: 3, progress: 20, notes: null, displayOrder: 12, isCritical: false },
  { id: 14, orderId: 'WO-78111', name: 'APU Fuel Line Assembly', shortName: 'APU-FUEL', day: 3, startHour: 5, duration: 4, assignedTo: INITIAL_OPERATOR_NAMES[6], status: TaskStatus.ToDo, description: 'Assemble and pressure test APU fuel lines.', dueDay: 4, dueHour: 0, progress: 0, notes: null, displayOrder: 13, isCritical: false },
  { id: 15, orderId: 'WO-78112', name: 'Nose Cone Sanding', shortName: 'NOSE-SAND', day: 4, startHour: 6, duration: 3, assignedTo: INITIAL_OPERATOR_NAMES[7], status: TaskStatus.Completed, description: 'Final sanding and prep for nose cone painting.', dueDay: 4, dueHour: 8, progress: 100, notes: null, displayOrder: 14, isCritical: false },
  { id: 16, orderId: 'PO-22521', name: 'Order Avionics Components', shortName: 'ORD-AVIO', day: 4, startHour: 0, duration: 2, assignedTo: INITIAL_OPERATOR_NAMES[15], status: TaskStatus.Completed, description: 'Place PO for flight management system components.', dueDay: 4, dueHour: 2, progress: 100, notes: null, displayOrder: 15, isCritical: false },
  { id: 17, orderId: 'WO-78113', name: 'Cargo Door Hydraulics', shortName: 'CARGO-HYD', day: 5, startHour: 2, duration: 5, assignedTo: INITIAL_OPERATOR_NAMES[9], status: TaskStatus.InProgress, description: 'Install hydraulic actuators for the forward cargo door.', dueDay: 5, dueHour: 8, progress: 75, notes: null, displayOrder: 16, isCritical: false },
  { id: 18, orderId: 'WO-78114', name: 'Rudder Pedal Fabrication', shortName: 'RUD-PED-FAB', day: 6, startHour: 2, duration: 6, assignedTo: INITIAL_OPERATOR_NAMES[10], status: TaskStatus.OnHold, description: 'Fabricate rudder pedal assemblies. Awaiting new schematics.', dueDay: 6, dueHour: 8, progress: 15, notes: 'Awaiting new schematics', displayOrder: 17, isCritical: false },
  { id: 19, orderId: 'WO-78115', name: 'Instrument Panel Assembly', shortName: 'INST-PNL', day: 0, startHour: 6, duration: 3, assignedTo: INITIAL_OPERATOR_NAMES[11], status: TaskStatus.ToDo, description: 'Assemble primary flight instrument panel.', dueDay: 1, dueHour: 2, progress: 0, notes: null, dependencies: [7], displayOrder: 18, isCritical: false },
  { id: 20, orderId: 'WO-78116', name: 'Winglet Machining', shortName: 'WGLT-MACH', day: 1, startHour: 6, duration: 3, assignedTo: INITIAL_OPERATOR_NAMES[12], status: TaskStatus.InProgress, description: 'CNC machining for winglet attachment points.', dueDay: 2, dueHour: 0, progress: 55, notes: null, dependencies: [2], displayOrder: 19, isCritical: false },
  { id: 21, orderId: 'WO-78117', name: 'Cabin Lighting Installation', shortName: 'CAB-LIGHT', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Install LED cabin lighting strips.', dueDay: 3, dueHour: 1, progress: 0, notes: null, displayOrder: 20, isCritical: false },
  { id: 22, orderId: 'PO-22522', name: 'Order Fasteners & Rivets', shortName: 'ORD-FAST', day: -1, startHour: -1, duration: 2, assignedTo: '', status: TaskStatus.ToDo, description: 'Bulk order of standard airframe fasteners and rivets.', dueDay: 3, dueHour: 2, progress: 0, notes: null, displayOrder: 21, isCritical: false },
  { id: 23, orderId: 'WO-78118', name: 'Empennage Rib Forming', shortName: 'EMP-RIB-FORM', day: -1, startHour: -1, duration: 7, assignedTo: '', status: TaskStatus.ToDo, description: 'Press forming of empennage structural ribs.', dueDay: 5, dueHour: 3, progress: 0, notes: null, displayOrder: 22, isCritical: false },
  { id: 24, orderId: 'WO-78119', name: 'Galley Module Installation', shortName: 'GAL-INST', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Install pre-assembled galley module into aft fuselage.', dueDay: 6, dueHour: 1, progress: 0, notes: null, dependencies: [10], displayOrder: 23, isCritical: false },
  { id: 25, orderId: 'WO-78120', name: 'Final Systems Check', shortName: 'SYS-CHK', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Comprehensive check of all integrated systems before rollout.', dueDay: 6, dueHour: 8, progress: 0, notes: null, dependencies: [9, 19], displayOrder: 24, isCritical: false },
  { id: 26, orderId: 'WO-78121', name: 'Fuselage Section 1A', shortName: 'FUS-1A', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Fuselage Section 1A assembly.', dueDay: 2, dueHour: 4, progress: 0, notes: null, displayOrder: 25, isCritical: false },
  { id: 27, orderId: 'WO-78122', name: 'Bulkhead Machining', shortName: 'BLK-MACH', day: -1, startHour: -1, duration: 9, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Bulkhead Machining.', dueDay: 4, dueHour: 8, progress: 0, notes: null, displayOrder: 26, isCritical: false },
  { id: 28, orderId: 'WO-78123', name: 'Wing Spar Fabrication', shortName: 'W-SPAR-FAB', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Wing Spar Fabrication.', dueDay: 3, dueHour: 1, progress: 0, notes: null, displayOrder: 27, isCritical: false },
  { id: 29, orderId: 'WO-78124', name: 'Winglet Machining', shortName: 'WGLT-MACH', day: -1, startHour: -1, duration: 3, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Winglet Machining.', dueDay: 1, dueHour: 6, progress: 0, notes: null, dependencies: [28], displayOrder: 28, isCritical: false },
  { id: 30, orderId: 'WO-78125', name: 'Tail Fin Fabrication', shortName: 'T-FIN-FAB', day: -1, startHour: -1, duration: 3, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Tail Fin Fabrication.', dueDay: 5, dueHour: 0, progress: 0, notes: null, displayOrder: 29, isCritical: false },
  { id: 31, orderId: 'WO-78126', name: 'Rudder Pedal Fabrication', shortName: 'RUD-PED-FAB', day: -1, startHour: -1, duration: 6, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Rudder Pedal Fabrication.', dueDay: 6, dueHour: 2, progress: 0, notes: null, displayOrder: 30, isCritical: false },
  { id: 32, orderId: 'WO-78127', name: 'Empennage Rib Forming', shortName: 'EMP-RIB-FORM', day: -1, startHour: -1, duration: 7, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Empennage Rib Forming.', dueDay: 4, dueHour: 5, progress: 0, notes: null, displayOrder: 31, isCritical: false },
  { id: 33, orderId: 'WO-78128', name: 'Landing Gear Assembly', shortName: 'LG-ASSY', day: -1, startHour: -1, duration: 6, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Landing Gear Assembly.', dueDay: 3, dueHour: 8, progress: 0, notes: null, displayOrder: 32, isCritical: false },
  { id: 34, orderId: 'WO-78129', name: 'Cockpit Wiring', shortName: 'CPT-WIRE', day: -1, startHour: -1, duration: 7, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Cockpit Wiring.', dueDay: 5, dueHour: 3, progress: 0, notes: null, dependencies: [27], displayOrder: 33, isCritical: false },
  { id: 35, orderId: 'WO-78130', name: 'Instrument Panel Assembly', shortName: 'INST-PNL', day: -1, startHour: -1, duration: 3, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Instrument Panel Assembly.', dueDay: 1, dueHour: 2, progress: 0, notes: null, dependencies: [34], displayOrder: 34, isCritical: false },
  { id: 36, orderId: 'WO-78131', name: 'APU Fuel Line Assembly', shortName: 'APU-FUEL', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: APU Fuel Line Assembly.', dueDay: 2, dueHour: 7, progress: 0, notes: null, displayOrder: 35, isCritical: false },
  { id: 37, orderId: 'WO-78132', name: 'Galley Frame Welding', shortName: 'GAL-WELD', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Galley Frame Welding.', dueDay: 0, dueHour: 8, progress: 0, notes: null, displayOrder: 36, isCritical: false },
  { id: 38, orderId: 'WO-78133', name: 'Galley Module Installation', shortName: 'GAL-INST', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Galley Module Installation.', dueDay: 6, dueHour: 4, progress: 0, notes: null, dependencies: [37], displayOrder: 37, isCritical: false },
  { id: 39, orderId: 'WO-78134', name: 'Passenger Seat Installation', shortName: 'SEAT-INST', day: -1, startHour: -1, duration: 8, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Passenger Seat Installation.', dueDay: 2, dueHour: 1, progress: 0, notes: null, displayOrder: 38, isCritical: false },
  { id: 40, orderId: 'WO-78135', name: 'Floor Panel Lamination', shortName: 'FLR-LAM', day: -1, startHour: -1, duration: 8, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Floor Panel Lamination.', dueDay: 3, dueHour: 3, progress: 0, notes: null, displayOrder: 39, isCritical: false },
  { id: 41, orderId: 'WO-78136', name: 'Cabin Lighting Installation', shortName: 'CAB-LIGHT', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Cabin Lighting Installation.', dueDay: 4, dueHour: 0, progress: 0, notes: null, dependencies: [35], displayOrder: 40, isCritical: false },
  { id: 42, orderId: 'WO-78137', name: 'Nose Cone Sanding', shortName: 'NOSE-SAND', day: -1, startHour: -1, duration: 3, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Nose Cone Sanding.', dueDay: 1, dueHour: 5, progress: 0, notes: null, displayOrder: 41, isCritical: false },
  { id: 43, orderId: 'WO-78138', name: 'Cargo Door Hydraulics', shortName: 'CARGO-HYD', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Cargo Door Hydraulics.', dueDay: 5, dueHour: 6, progress: 0, notes: null, displayOrder: 42, isCritical: false },
  { id: 44, orderId: 'WO-78139', name: 'Final Inspection Prep', shortName: 'INSP-PREP', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Final Inspection Prep.', dueDay: 6, dueHour: 7, progress: 0, notes: null, dependencies: [43, 41, 38], displayOrder: 43, isCritical: false },
  { id: 45, orderId: 'WO-78140', name: 'Final Systems Check', shortName: 'SYS-CHK', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Final Systems Check.', dueDay: 6, dueHour: 8, progress: 0, notes: null, dependencies: [44], displayOrder: 44, isCritical: false },
  { id: 46, orderId: 'PO-22523', name: 'Order Raw Materials', shortName: 'ORD-RAW-MAT', day: -1, startHour: -1, duration: 2, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Raw Materials for Q4.', dueDay: 0, dueHour: 3, progress: 0, notes: null, displayOrder: 45, isCritical: false },
  { id: 47, orderId: 'PO-22524', name: 'Engine Mount Order', shortName: 'ORD-ENG-MNT', day: -1, startHour: -1, duration: 1, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Engine Mounts.', dueDay: 1, dueHour: 0, progress: 0, notes: null, displayOrder: 46, isCritical: false },
  { id: 48, orderId: 'PO-22525', name: 'Order Cabin Insulation', shortName: 'ORD-INSUL', day: -1, startHour: -1, duration: 1, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Cabin Insulation.', dueDay: 2, dueHour: 1, progress: 0, notes: null, displayOrder: 47, isCritical: false },
  { id: 49, orderId: 'PO-22526', name: 'Order Avionics Components', shortName: 'ORD-AVIO', day: -1, startHour: -1, duration: 2, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Avionics Components.', dueDay: 3, dueHour: 2, progress: 0, notes: null, displayOrder: 48, isCritical: false },
  { id: 50, orderId: 'PO-22527', name: 'Order Fasteners & Rivets', shortName: 'ORD-FAST', day: -1, startHour: -1, duration: 2, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Fasteners & Rivets.', dueDay: 4, dueHour: 3, progress: 0, notes: null, displayOrder: 49, isCritical: false },
  { id: 51, orderId: 'WO-78141', name: 'Fuselage Section 1A', shortName: 'FUS-1A', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Fuselage Section 1A assembly.', dueDay: 3, dueHour: 4, progress: 0, notes: null, displayOrder: 50, isCritical: false },
  { id: 52, orderId: 'WO-78142', name: 'Bulkhead Machining', shortName: 'BLK-MACH', day: -1, startHour: -1, duration: 9, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Bulkhead Machining.', dueDay: 5, dueHour: 8, progress: 0, notes: null, displayOrder: 51, isCritical: false },
  { id: 53, orderId: 'WO-78143', name: 'Wing Spar Fabrication', shortName: 'W-SPAR-FAB', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Wing Spar Fabrication.', dueDay: 4, dueHour: 1, progress: 0, notes: null, displayOrder: 52, isCritical: false },
  { id: 54, orderId: 'WO-78144', name: 'Winglet Machining', shortName: 'WGLT-MACH', day: -1, startHour: -1, duration: 3, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Winglet Machining.', dueDay: 2, dueHour: 6, progress: 0, notes: null, dependencies: [53], displayOrder: 53, isCritical: false },
  { id: 55, orderId: 'WO-78145', name: 'Tail Fin Fabrication', shortName: 'T-FIN-FAB', day: -1, startHour: -1, duration: 3, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Tail Fin Fabrication.', dueDay: 6, dueHour: 0, progress: 0, notes: null, displayOrder: 54, isCritical: false },
  { id: 56, orderId: 'WO-78146', name: 'Rudder Pedal Fabrication', shortName: 'RUD-PED-FAB', day: -1, startHour: -1, duration: 6, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Rudder Pedal Fabrication.', dueDay: 0, dueHour: 2, progress: 0, notes: null, displayOrder: 55, isCritical: false },
  { id: 57, orderId: 'WO-78147', name: 'Empennage Rib Forming', shortName: 'EMP-RIB-FORM', day: -1, startHour: -1, duration: 7, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Empennage Rib Forming.', dueDay: 5, dueHour: 5, progress: 0, notes: null, displayOrder: 56, isCritical: false },
  { id: 58, orderId: 'WO-78148', name: 'Landing Gear Assembly', shortName: 'LG-ASSY', day: -1, startHour: -1, duration: 6, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Landing Gear Assembly.', dueDay: 4, dueHour: 8, progress: 0, notes: null, displayOrder: 57, isCritical: false },
  { id: 59, orderId: 'WO-78149', name: 'Cockpit Wiring', shortName: 'CPT-WIRE', day: -1, startHour: -1, duration: 7, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Cockpit Wiring.', dueDay: 6, dueHour: 3, progress: 0, notes: null, dependencies: [52], displayOrder: 58, isCritical: false },
  { id: 60, orderId: 'WO-78150', name: 'Instrument Panel Assembly', shortName: 'INST-PNL', day: -1, startHour: -1, duration: 3, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Instrument Panel Assembly.', dueDay: 2, dueHour: 2, progress: 0, notes: null, dependencies: [59], displayOrder: 59, isCritical: false },
  { id: 61, orderId: 'WO-78151', name: 'APU Fuel Line Assembly', shortName: 'APU-FUEL', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: APU Fuel Line Assembly.', dueDay: 3, dueHour: 7, progress: 0, notes: null, displayOrder: 60, isCritical: false },
  { id: 62, orderId: 'WO-78152', name: 'Galley Frame Welding', shortName: 'GAL-WELD', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Galley Frame Welding.', dueDay: 1, dueHour: 8, progress: 0, notes: null, displayOrder: 61, isCritical: false },
  { id: 63, orderId: 'WO-78153', name: 'Galley Module Installation', shortName: 'GAL-INST', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Galley Module Installation.', dueDay: 0, dueHour: 4, progress: 0, notes: null, dependencies: [62], displayOrder: 62, isCritical: false },
  { id: 64, orderId: 'WO-78154', name: 'Passenger Seat Installation', shortName: 'SEAT-INST', day: -1, startHour: -1, duration: 8, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Passenger Seat Installation.', dueDay: 3, dueHour: 1, progress: 0, notes: null, displayOrder: 63, isCritical: false },
  { id: 65, orderId: 'WO-78155', name: 'Floor Panel Lamination', shortName: 'FLR-LAM', day: -1, startHour: -1, duration: 8, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Floor Panel Lamination.', dueDay: 4, dueHour: 3, progress: 0, notes: null, displayOrder: 64, isCritical: false },
  { id: 66, orderId: 'WO-78156', name: 'Cabin Lighting Installation', shortName: 'CAB-LIGHT', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Cabin Lighting Installation.', dueDay: 5, dueHour: 0, progress: 0, notes: null, dependencies: [60], displayOrder: 65, isCritical: false },
  { id: 67, orderId: 'WO-78157', name: 'Nose Cone Sanding', shortName: 'NOSE-SAND', day: -1, startHour: -1, duration: 3, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Nose Cone Sanding.', dueDay: 2, dueHour: 5, progress: 0, notes: null, displayOrder: 66, isCritical: false },
  { id: 68, orderId: 'WO-78158', name: 'Cargo Door Hydraulics', shortName: 'CARGO-HYD', day: -1, startHour: -1, duration: 5, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Cargo Door Hydraulics.', dueDay: 6, dueHour: 6, progress: 0, notes: null, displayOrder: 67, isCritical: false },
  { id: 69, orderId: 'WO-78159', name: 'Final Inspection Prep', shortName: 'INSP-PREP', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Final Inspection Prep.', dueDay: 0, dueHour: 7, progress: 0, notes: null, dependencies: [68, 66, 63], displayOrder: 68, isCritical: false },
  { id: 70, orderId: 'WO-78160', name: 'Final Systems Check', shortName: 'SYS-CHK', day: -1, startHour: -1, duration: 4, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Final Systems Check.', dueDay: 1, dueHour: 8, progress: 0, notes: null, dependencies: [69], displayOrder: 69, isCritical: false },
  { id: 71, orderId: 'PO-22528', name: 'Order Raw Materials', shortName: 'ORD-RAW-MAT', day: -1, startHour: -1, duration: 2, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Raw Materials for Q1 Next Year.', dueDay: 2, dueHour: 3, progress: 0, notes: null, displayOrder: 70, isCritical: false },
  { id: 72, orderId: 'PO-22529', name: 'Engine Mount Order', shortName: 'ORD-ENG-MNT', day: -1, startHour: -1, duration: 1, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Engine Mounts.', dueDay: 3, dueHour: 0, progress: 0, notes: null, displayOrder: 71, isCritical: false },
  { id: 73, orderId: 'PO-22530', name: 'Order Cabin Insulation', shortName: 'ORD-INSUL', day: -1, startHour: -1, duration: 1, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Cabin Insulation.', dueDay: 4, dueHour: 1, progress: 0, notes: null, displayOrder: 72, isCritical: false },
  { id: 74, orderId: 'PO-22531', name: 'Order Avionics Components', shortName: 'ORD-AVIO', day: -1, startHour: -1, duration: 2, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Avionics Components.', dueDay: 5, dueHour: 2, progress: 0, notes: null, displayOrder: 73, isCritical: false },
  { id: 75, orderId: 'PO-22532', name: 'Order Fasteners & Rivets', shortName: 'ORD-FAST', day: -1, startHour: -1, duration: 2, assignedTo: '', status: TaskStatus.ToDo, description: 'Unplanned: Order Fasteners & Rivets.', dueDay: 6, dueHour: 3, progress: 0, notes: null, displayOrder: 74, isCritical: false }
];

export const INITIAL_MASTER_TASKS: MasterTask[] = [
  // Airframe - Fuselage
  { name: 'Fuselage Section 1A', shortName: 'FUS-1A', program: 'Airframe Structures', subProgram: 'Fuselage', defaultDuration: 4 },
  { name: 'Bulkhead Machining', shortName: 'BLK-MACH', program: 'Airframe Structures', subProgram: 'Fuselage', defaultDuration: 9 },
  
  // Airframe - Wings
  { name: 'Wing Spar Fabrication', shortName: 'W-SPAR-FAB', program: 'Airframe Structures', subProgram: 'Wings', defaultDuration: 5 },
  { name: 'Winglet Machining', shortName: 'WGLT-MACH', program: 'Airframe Structures', subProgram: 'Wings', defaultDuration: 3 },
  
  // Airframe - Empennage
  { name: 'Tail Fin Fabrication', shortName: 'T-FIN-FAB', program: 'Airframe Structures', subProgram: 'Empennage', defaultDuration: 3 },
  { name: 'Rudder Pedal Fabrication', shortName: 'RUD-PED-FAB', program: 'Airframe Structures', subProgram: 'Empennage', defaultDuration: 6 },
  { name: 'Empennage Rib Forming', shortName: 'EMP-RIB-FORM', program: 'Airframe Structures', subProgram: 'Empennage', defaultDuration: 7 },
  
  // Systems - Landing Gear
  { name: 'Landing Gear Assembly', shortName: 'LG-ASSY', program: 'Aircraft Systems', subProgram: 'Landing Gear', defaultDuration: 6 },
  
  // Systems - Avionics
  { name: 'Cockpit Wiring', shortName: 'CPT-WIRE', program: 'Aircraft Systems', subProgram: 'Avionics', defaultDuration: 7 },
  { name: 'Instrument Panel Assembly', shortName: 'INST-PNL', program: 'Aircraft Systems', subProgram: 'Avionics', defaultDuration: 3 },
  
  // Systems - Fuel
  { name: 'APU Fuel Line Assembly', shortName: 'APU-FUEL', program: 'Aircraft Systems', subProgram: 'Fuel System', defaultDuration: 4 },
  
  // Interior
  { name: 'Galley Frame Welding', shortName: 'GAL-WELD', program: 'Cabin & Interior', subProgram: 'Galley', defaultDuration: 5 },
  { name: 'Galley Module Installation', shortName: 'GAL-INST', program: 'Cabin & Interior', subProgram: 'Galley', defaultDuration: 4 },
  { name: 'Passenger Seat Installation', shortName: 'SEAT-INST', program: 'Cabin & Interior', subProgram: 'Seating', defaultDuration: 8 },
  { name: 'Floor Panel Lamination', shortName: 'FLR-LAM', program: 'Cabin & Interior', subProgram: 'Flooring', defaultDuration: 8 },
  { name: 'Cabin Lighting Installation', shortName: 'CAB-LIGHT', program: 'Cabin & Interior', subProgram: 'Lighting', defaultDuration: 5 },
  
  // Exterior & Finish
  { name: 'Nose Cone Sanding', shortName: 'NOSE-SAND', program: 'Exterior & Finish', subProgram: 'Nose Assembly', defaultDuration: 3 },
  { name: 'Cargo Door Hydraulics', shortName: 'CARGO-HYD', program: 'Exterior & Finish', subProgram: 'Doors', defaultDuration: 5 },
  
  // Quality & Inspection
  { name: 'Final Inspection Prep', shortName: 'INSP-PREP', program: 'Quality & Inspection', subProgram: 'Final Assembly', defaultDuration: 4 },
  { name: 'Final Systems Check', shortName: 'SYS-CHK', program: 'Quality & Inspection', subProgram: 'Final Assembly', defaultDuration: 4 },
  
  // Procurement & Logistics
  { name: 'Order Raw Materials', shortName: 'ORD-RAW-MAT', program: 'Logistics', subProgram: 'Procurement', defaultDuration: 2 },
  { name: 'Engine Mount Order', shortName: 'ORD-ENG-MNT', program: 'Logistics', subProgram: 'Procurement', defaultDuration: 1 },
  { name: 'Order Cabin Insulation', shortName: 'ORD-INSUL', program: 'Logistics', subProgram: 'Procurement', defaultDuration: 1 },
  { name: 'Order Avionics Components', shortName: 'ORD-AVIO', program: 'Logistics', subProgram: 'Procurement', defaultDuration: 2 },
  { name: 'Order Fasteners & Rivets', shortName: 'ORD-FAST', program: 'Logistics', subProgram: 'Procurement', defaultDuration: 2 },
];