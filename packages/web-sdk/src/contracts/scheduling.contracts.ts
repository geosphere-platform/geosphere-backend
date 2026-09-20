/**
 * GeoSphere Scheduling & Calendar SDK Core Contracts
 * Framework-Neutral Calendars, Events, Appointments, Time Slots, Availability, Recurrence & Conflict Engine
 */

export type GeoSphereAppointmentStatus =
  | "TENTATIVE"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type GeoSphereAvailabilityStatus =
  | "AVAILABLE"
  | "PARTIALLY_AVAILABLE"
  | "UNAVAILABLE"
  | "RESERVED"
  | "BOOKED"
  | "BLOCKED";

export type GeoSphereRecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

export type GeoSphereConflictType =
  | "OVERLAPPING_EVENT"
  | "RESOURCE_CONFLICT"
  | "PARTICIPANT_CONFLICT"
  | "BLACKOUT_CONFLICT"
  | "CAPACITY_VIOLATION"
  | "WORKING_HOURS_VIOLATION";

export type GeoSphereConflictSeverity = "LOW" | "WARNING" | "CRITICAL";

export interface GeoSphereCalendar {
  calendarId: string;
  name: string;
  description?: string;
  timezone: string;
  locale?: string;
  visibility: "PUBLIC" | "PRIVATE" | "TENANT";
  metadata?: Record<string, unknown>;
}

export interface GeoSphereWorkingHoursInterval {
  start: string;
  end: string;
}

export interface GeoSphereWorkingHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  intervals: GeoSphereWorkingHoursInterval[];
  timezone: string;
}

export interface GeoSphereHoliday {
  holidayId: string;
  name: string;
  date: string;
  isRecurring?: boolean;
  calendarId?: string;
}

export interface GeoSphereBlackoutPeriod {
  blackoutId: string;
  title: string;
  startAt: string;
  endAt: string;
  calendarId?: string;
  reason?: string;
}

export interface GeoSphereRecurrenceRule {
  frequency: GeoSphereRecurrenceFrequency;
  interval: number;
  count?: number;
  untilDate?: string;
  byWeekdays?: number[];
  byMonthDays?: number[];
}

export interface GeoSphereScheduleException {
  exceptionId: string;
  originalStartAt: string;
  action: "SKIP" | "MOVE" | "MODIFY" | "CANCEL";
  newStartAt?: string;
  newEndAt?: string;
}

export interface GeoSphereScheduleResource {
  resourceId: string;
  resourceType: "ASSET" | "USER" | "TEAM" | "EXTERNAL";
  referenceId: string;
}

export interface GeoSphereScheduleParticipant {
  participantId: string;
  type: "USER" | "TEAM" | "EXTERNAL";
  name?: string;
}

export interface GeoSphereScheduleLocation {
  latitude?: number;
  longitude?: number;
  addressReference?: string;
  geofenceReference?: string;
  placeReference?: string;
}

export interface GeoSphereScheduleCapacity {
  capacityValue: number;
  currentUsage: number;
  remainingCapacity: number;
  unit: string;
}

export interface GeoSphereTimeSlot {
  slotId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  availability: GeoSphereAvailabilityStatus;
  capacity?: GeoSphereScheduleCapacity;
  resourceIds?: string[];
}

export interface GeoSphereTimeWindow {
  earliestStart: string;
  latestStart: string;
  minimumDurationMinutes: number;
  maximumDurationMinutes: number;
}

export interface GeoSphereScheduleEvent {
  eventId: string;
  calendarId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: "ACTIVE" | "CANCELLED" | "COMPLETED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  participants?: GeoSphereScheduleParticipant[];
  resources?: GeoSphereScheduleResource[];
  location?: GeoSphereScheduleLocation;
  recurrenceRule?: GeoSphereRecurrenceRule;
  exceptions?: GeoSphereScheduleException[];
  metadata?: Record<string, unknown>;
  versionNumber: number;
}

export interface GeoSphereAppointment {
  appointmentId: string;
  eventId?: string;
  calendarId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  status: GeoSphereAppointmentStatus;
  participants?: GeoSphereScheduleParticipant[];
  resources?: GeoSphereScheduleResource[];
  location?: GeoSphereScheduleLocation;
  formReference?: { formId: string; version: string };
  workflowReference?: { workflowId: string; version: string };
  taskReference?: { taskId: string };
  metadata?: Record<string, unknown>;
  versionNumber: number;
}

export interface GeoSphereScheduleConflict {
  conflictId: string;
  type: GeoSphereConflictType;
  severity: GeoSphereConflictSeverity;
  conflictingRecordIds: string[];
  startAt: string;
  endAt: string;
  resolutionState: "UNRESOLVED" | "REJECTED" | "ALLOWED_WITH_WARNING" | "RESCHEDULED" | "OVERRIDDEN";
}

export type GeoSphereSchedulingCapability =
  | "CALENDAR_MANAGEMENT"
  | "SCHEDULE_GENERATION"
  | "APPOINTMENT_BOOKING"
  | "TIME_SLOT_PICKER"
  | "AVAILABILITY_CALCULATION"
  | "RESOURCE_SCHEDULING"
  | "TASK_SCHEDULING"
  | "ASSET_SCHEDULING"
  | "CONFLICT_DETECTION"
  | "TIMEZONE_ENGINE"
  | "WORKING_HOURS"
  | "HOLIDAYS_BLACKOUTS"
  | "RECURRENCE_BOUNDED"
  | "MAP_VISUALIZATION"
  | "OFFLINE_SYNC"
  | "REALTIME_NOTIFICATIONS";

export interface GeoSphereSchedulingProviderInfo {
  name: string;
  version: string;
}

export interface GeoSphereSchedulingProvider {
  getProviderInfo(): GeoSphereSchedulingProviderInfo;
  getCapabilities(): GeoSphereSchedulingCapability[];
  createCalendar(calendar: Partial<GeoSphereCalendar>): Promise<GeoSphereCalendar>;
  getCalendar(calendarId: string): Promise<GeoSphereCalendar>;
  createEvent(eventData: Partial<GeoSphereScheduleEvent>): Promise<GeoSphereScheduleEvent>;
  getEvent(eventId: string): Promise<GeoSphereScheduleEvent>;
  listEvents(filter?: { calendarId?: string; startAt?: string; endAt?: string }): Promise<GeoSphereScheduleEvent[]>;
  createAppointment(appointmentData: Partial<GeoSphereAppointment>): Promise<GeoSphereAppointment>;
  getAppointment(appointmentId: string): Promise<GeoSphereAppointment>;
  generateTimeSlots(calendarId: string, date: string, durationMinutes: number): Promise<GeoSphereTimeSlot[]>;
  detectConflicts(calendarId: string, startAt: string, endAt: string, resourceIds?: string[]): Promise<GeoSphereScheduleConflict[]>;
  resolveConflict(conflictId: string, strategy: "REJECT" | "ALLOW_WITH_WARNING" | "RESCHEDULE" | "OVERRIDE"): Promise<GeoSphereScheduleConflict>;
}

export class GeoSphereSchedulingError extends Error {
  constructor(
    public readonly code:
      | "CALENDAR_NOT_FOUND"
      | "EVENT_NOT_FOUND"
      | "SLOT_UNAVAILABLE"
      | "CONFLICT_DETECTED"
      | "RECURRENCE_INVALID"
      | "TIMEZONE_INVALID"
      | "PERMISSION_DENIED"
      | "CONCURRENCY_CONFLICT"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[SCHEDULING_ERROR:${code}] ${message}`);
    this.name = "GeoSphereSchedulingError";
  }
}

export class GeoSphereMockSchedulingProvider implements GeoSphereSchedulingProvider {
  private calendars = new Map<string, GeoSphereCalendar>();
  private events = new Map<string, GeoSphereScheduleEvent>();
  private appointments = new Map<string, GeoSphereAppointment>();
  private conflicts = new Map<string, GeoSphereScheduleConflict>();

  constructor() {
    const seedCal: GeoSphereCalendar = {
      calendarId: "cal_seed_001",
      name: "Generic Asset & Task Operation Calendar",
      description: "Standard platform master scheduling calendar.",
      timezone: "UTC",
      locale: "en-US",
      visibility: "TENANT"
    };
    this.calendars.set(seedCal.calendarId, seedCal);

    const seedEvt: GeoSphereScheduleEvent = {
      eventId: "evt_seed_001",
      calendarId: seedCal.calendarId,
      title: "Routine Maintenance Window",
      description: "Scheduled asset maintenance & inspection.",
      startAt: new Date(Date.now() + 3600000).toISOString(),
      endAt: new Date(Date.now() + 7200000).toISOString(),
      timezone: "UTC",
      status: "ACTIVE",
      priority: "HIGH",
      resources: [{ resourceId: "res_01", resourceType: "ASSET", referenceId: "asset_seed_001" }],
      versionNumber: 1
    };
    this.events.set(seedEvt.eventId, seedEvt);
  }

  public getProviderInfo(): GeoSphereSchedulingProviderInfo {
    return { name: "GeoSphereMockSchedulingProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereSchedulingCapability[] {
    return [
      "CALENDAR_MANAGEMENT",
      "SCHEDULE_GENERATION",
      "APPOINTMENT_BOOKING",
      "TIME_SLOT_PICKER",
      "AVAILABILITY_CALCULATION",
      "RESOURCE_SCHEDULING",
      "TASK_SCHEDULING",
      "ASSET_SCHEDULING",
      "CONFLICT_DETECTION",
      "TIMEZONE_ENGINE",
      "WORKING_HOURS",
      "HOLIDAYS_BLACKOUTS",
      "RECURRENCE_BOUNDED",
      "MAP_VISUALIZATION",
      "OFFLINE_SYNC",
      "REALTIME_NOTIFICATIONS"
    ];
  }

  public async createCalendar(calendar: Partial<GeoSphereCalendar>): Promise<GeoSphereCalendar> {
    const cal: GeoSphereCalendar = {
      calendarId: `cal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: calendar.name || "Untitled Calendar",
      description: calendar.description,
      timezone: calendar.timezone || "UTC",
      locale: calendar.locale || "en-US",
      visibility: calendar.visibility || "TENANT"
    };
    this.calendars.set(cal.calendarId, cal);
    return JSON.parse(JSON.stringify(cal));
  }

  public async getCalendar(calendarId: string): Promise<GeoSphereCalendar> {
    const cal = this.calendars.get(calendarId);
    if (!cal) throw new GeoSphereSchedulingError("CALENDAR_NOT_FOUND", `Calendar ID ${calendarId} not found.`);
    return JSON.parse(JSON.stringify(cal));
  }

  public async createEvent(eventData: Partial<GeoSphereScheduleEvent>): Promise<GeoSphereScheduleEvent> {
    const evt: GeoSphereScheduleEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      calendarId: eventData.calendarId || "cal_seed_001",
      title: eventData.title || "Untitled Event",
      description: eventData.description,
      startAt: eventData.startAt || new Date().toISOString(),
      endAt: eventData.endAt || new Date(Date.now() + 3600000).toISOString(),
      timezone: eventData.timezone || "UTC",
      status: eventData.status || "ACTIVE",
      priority: eventData.priority || "NORMAL",
      participants: eventData.participants,
      resources: eventData.resources,
      location: eventData.location,
      versionNumber: 1
    };
    this.events.set(evt.eventId, evt);
    return JSON.parse(JSON.stringify(evt));
  }

  public async getEvent(eventId: string): Promise<GeoSphereScheduleEvent> {
    const evt = this.events.get(eventId);
    if (!evt) throw new GeoSphereSchedulingError("EVENT_NOT_FOUND", `Event ID ${eventId} not found.`);
    return JSON.parse(JSON.stringify(evt));
  }

  public async listEvents(filter?: { calendarId?: string; startAt?: string; endAt?: string }): Promise<GeoSphereScheduleEvent[]> {
    let list = Array.from(this.events.values());
    if (filter?.calendarId) list = list.filter((e) => e.calendarId === filter.calendarId);
    return JSON.parse(JSON.stringify(list));
  }

  public async createAppointment(appointmentData: Partial<GeoSphereAppointment>): Promise<GeoSphereAppointment> {
    const startIso = appointmentData.startAt || new Date().toISOString();
    const endIso = appointmentData.endAt || new Date(Date.now() + 1800000).toISOString();
    const duration = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);

    const appt: GeoSphereAppointment = {
      appointmentId: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      calendarId: appointmentData.calendarId || "cal_seed_001",
      startAt: startIso,
      endAt: endIso,
      durationMinutes: duration,
      status: appointmentData.status || "CONFIRMED",
      participants: appointmentData.participants,
      resources: appointmentData.resources,
      location: appointmentData.location,
      versionNumber: 1
    };
    this.appointments.set(appt.appointmentId, appt);
    return JSON.parse(JSON.stringify(appt));
  }

  public async getAppointment(appointmentId: string): Promise<GeoSphereAppointment> {
    const appt = this.appointments.get(appointmentId);
    if (!appt) throw new GeoSphereSchedulingError("EVENT_NOT_FOUND", `Appointment ID ${appointmentId} not found.`);
    return JSON.parse(JSON.stringify(appt));
  }

  public async generateTimeSlots(calendarId: string, date: string, durationMinutes: number): Promise<GeoSphereTimeSlot[]> {
    const baseTime = new Date(date).getTime();
    const slots: GeoSphereTimeSlot[] = [];

    for (let i = 9; i < 17; i++) {
      const slotStart = new Date(baseTime + i * 3600000).toISOString();
      const slotEnd = new Date(baseTime + (i + durationMinutes / 60) * 3600000).toISOString();
      slots.push({
        slotId: `slot_${date}_${i}`,
        startAt: slotStart,
        endAt: slotEnd,
        durationMinutes,
        availability: "AVAILABLE"
      });
    }
    return slots;
  }

  public async detectConflicts(calendarId: string, startAt: string, endAt: string, resourceIds?: string[]): Promise<GeoSphereScheduleConflict[]> {
    const conflicts: GeoSphereScheduleConflict[] = [];
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();

    for (const evt of this.events.values()) {
      if (evt.calendarId !== calendarId) continue;
      const evtStart = new Date(evt.startAt).getTime();
      const evtEnd = new Date(evt.endAt).getTime();

      if (startMs < evtEnd && endMs > evtStart) {
        conflicts.push({
          conflictId: `cnf_${Date.now()}`,
          type: "OVERLAPPING_EVENT",
          severity: "WARNING",
          conflictingRecordIds: [evt.eventId],
          startAt: evt.startAt,
          endAt: evt.endAt,
          resolutionState: "UNRESOLVED"
        });
      }
    }
    return conflicts;
  }

  public async resolveConflict(conflictId: string, strategy: "REJECT" | "ALLOW_WITH_WARNING" | "RESCHEDULE" | "OVERRIDE"): Promise<GeoSphereScheduleConflict> {
    const cnf = this.conflicts.get(conflictId) || {
      conflictId,
      type: "OVERLAPPING_EVENT",
      severity: "WARNING",
      conflictingRecordIds: [],
      startAt: new Date().toISOString(),
      endAt: new Date().toISOString(),
      resolutionState: "UNRESOLVED"
    };

    if (strategy === "ALLOW_WITH_WARNING") cnf.resolutionState = "ALLOWED_WITH_WARNING";
    if (strategy === "OVERRIDE") cnf.resolutionState = "OVERRIDDEN";
    if (strategy === "REJECT") cnf.resolutionState = "REJECTED";
    if (strategy === "RESCHEDULE") cnf.resolutionState = "RESCHEDULED";

    this.conflicts.set(conflictId, cnf);
    return JSON.parse(JSON.stringify(cnf));
  }
}

export interface GeoSphereSchedulingConfig {
  embeddedMode?: boolean;
}

export class GeoSphereSchedulingSDK {
  private provider: GeoSphereSchedulingProvider;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereSchedulingConfig = {},
    provider?: GeoSphereSchedulingProvider
  ) {
    this.provider = provider || new GeoSphereMockSchedulingProvider();
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereSchedulingProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereSchedulingCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereSchedulingCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async createCalendar(calendar: Partial<GeoSphereCalendar>): Promise<GeoSphereCalendar> {
    const cal = await this.provider.createCalendar(calendar);
    this.notifyListeners("scheduling.calendarCreated", { calendar: cal });
    return cal;
  }

  public async getCalendar(calendarId: string): Promise<GeoSphereCalendar> {
    return this.provider.getCalendar(calendarId);
  }

  public async createEvent(eventData: Partial<GeoSphereScheduleEvent>): Promise<GeoSphereScheduleEvent> {
    const evt = await this.provider.createEvent(eventData);
    this.notifyListeners("scheduling.eventCreated", { event: evt });
    return evt;
  }

  public async getEvent(eventId: string): Promise<GeoSphereScheduleEvent> {
    return this.provider.getEvent(eventId);
  }

  public async listEvents(filter?: { calendarId?: string; startAt?: string; endAt?: string }): Promise<GeoSphereScheduleEvent[]> {
    return this.provider.listEvents(filter);
  }

  public async createAppointment(appointmentData: Partial<GeoSphereAppointment>): Promise<GeoSphereAppointment> {
    const appt = await this.provider.createAppointment(appointmentData);
    this.notifyListeners("scheduling.appointmentCreated", { appointment: appt });
    return appt;
  }

  public async getAppointment(appointmentId: string): Promise<GeoSphereAppointment> {
    return this.provider.getAppointment(appointmentId);
  }

  public async generateTimeSlots(calendarId: string, date: string, durationMinutes: number): Promise<GeoSphereTimeSlot[]> {
    return this.provider.generateTimeSlots(calendarId, date, durationMinutes);
  }

  public async detectConflicts(calendarId: string, startAt: string, endAt: string, resourceIds?: string[]): Promise<GeoSphereScheduleConflict[]> {
    return this.provider.detectConflicts(calendarId, startAt, endAt, resourceIds);
  }

  public async resolveConflict(conflictId: string, strategy: "REJECT" | "ALLOW_WITH_WARNING" | "RESCHEDULE" | "OVERRIDE"): Promise<GeoSphereScheduleConflict> {
    const cnf = await this.provider.resolveConflict(conflictId, strategy);
    this.notifyListeners("scheduling.conflictResolved", { conflict: cnf });
    return cnf;
  }

  // Embedded Mode Presentation Methods
  public presentCalendar(): { componentId: string; props: {} } {
    return { componentId: "scheduling.calendar-screen", props: {} };
  }

  public presentSchedule(): { componentId: string; props: {} } {
    return { componentId: "scheduling.day-screen", props: {} };
  }

  public presentAppointment(appointmentId: string): { componentId: string; props: { appointmentId: string } } {
    return { componentId: "scheduling.appointment-screen", props: { appointmentId } };
  }

  public presentTimeSlotPicker(): { componentId: string; props: {} } {
    return { componentId: "scheduling.time-slot-screen", props: {} };
  }

  public presentAvailability(): { componentId: string; props: {} } {
    return { componentId: "scheduling.availability-screen", props: {} };
  }

  public presentScheduleMap(): { componentId: string; props: {} } {
    return { componentId: "scheduling.map-screen", props: {} };
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `sched_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onEvent);
    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[SCHEDULING_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
