/**
 * GeoSphere Scheduling & Calendar SDK Core Contracts
 * Framework-Neutral Calendars, Events, Appointments, Time Slots, Availability, Recurrence & Conflict Engine
 */
export type GeoSphereAppointmentStatus = "TENTATIVE" | "CONFIRMED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type GeoSphereAvailabilityStatus = "AVAILABLE" | "PARTIALLY_AVAILABLE" | "UNAVAILABLE" | "RESERVED" | "BOOKED" | "BLOCKED";
export type GeoSphereRecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
export type GeoSphereConflictType = "OVERLAPPING_EVENT" | "RESOURCE_CONFLICT" | "PARTICIPANT_CONFLICT" | "BLACKOUT_CONFLICT" | "CAPACITY_VIOLATION" | "WORKING_HOURS_VIOLATION";
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
    dayOfWeek: number;
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
    formReference?: {
        formId: string;
        version: string;
    };
    workflowReference?: {
        workflowId: string;
        version: string;
    };
    taskReference?: {
        taskId: string;
    };
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
export type GeoSphereSchedulingCapability = "CALENDAR_MANAGEMENT" | "SCHEDULE_GENERATION" | "APPOINTMENT_BOOKING" | "TIME_SLOT_PICKER" | "AVAILABILITY_CALCULATION" | "RESOURCE_SCHEDULING" | "TASK_SCHEDULING" | "ASSET_SCHEDULING" | "CONFLICT_DETECTION" | "TIMEZONE_ENGINE" | "WORKING_HOURS" | "HOLIDAYS_BLACKOUTS" | "RECURRENCE_BOUNDED" | "MAP_VISUALIZATION" | "OFFLINE_SYNC" | "REALTIME_NOTIFICATIONS";
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
    listEvents(filter?: {
        calendarId?: string;
        startAt?: string;
        endAt?: string;
    }): Promise<GeoSphereScheduleEvent[]>;
    createAppointment(appointmentData: Partial<GeoSphereAppointment>): Promise<GeoSphereAppointment>;
    getAppointment(appointmentId: string): Promise<GeoSphereAppointment>;
    generateTimeSlots(calendarId: string, date: string, durationMinutes: number): Promise<GeoSphereTimeSlot[]>;
    detectConflicts(calendarId: string, startAt: string, endAt: string, resourceIds?: string[]): Promise<GeoSphereScheduleConflict[]>;
    resolveConflict(conflictId: string, strategy: "REJECT" | "ALLOW_WITH_WARNING" | "RESCHEDULE" | "OVERRIDE"): Promise<GeoSphereScheduleConflict>;
}
export declare class GeoSphereSchedulingError extends Error {
    readonly code: "CALENDAR_NOT_FOUND" | "EVENT_NOT_FOUND" | "SLOT_UNAVAILABLE" | "CONFLICT_DETECTED" | "RECURRENCE_INVALID" | "TIMEZONE_INVALID" | "PERMISSION_DENIED" | "CONCURRENCY_CONFLICT" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "CALENDAR_NOT_FOUND" | "EVENT_NOT_FOUND" | "SLOT_UNAVAILABLE" | "CONFLICT_DETECTED" | "RECURRENCE_INVALID" | "TIMEZONE_INVALID" | "PERMISSION_DENIED" | "CONCURRENCY_CONFLICT" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockSchedulingProvider implements GeoSphereSchedulingProvider {
    private calendars;
    private events;
    private appointments;
    private conflicts;
    constructor();
    getProviderInfo(): GeoSphereSchedulingProviderInfo;
    getCapabilities(): GeoSphereSchedulingCapability[];
    createCalendar(calendar: Partial<GeoSphereCalendar>): Promise<GeoSphereCalendar>;
    getCalendar(calendarId: string): Promise<GeoSphereCalendar>;
    createEvent(eventData: Partial<GeoSphereScheduleEvent>): Promise<GeoSphereScheduleEvent>;
    getEvent(eventId: string): Promise<GeoSphereScheduleEvent>;
    listEvents(filter?: {
        calendarId?: string;
        startAt?: string;
        endAt?: string;
    }): Promise<GeoSphereScheduleEvent[]>;
    createAppointment(appointmentData: Partial<GeoSphereAppointment>): Promise<GeoSphereAppointment>;
    getAppointment(appointmentId: string): Promise<GeoSphereAppointment>;
    generateTimeSlots(calendarId: string, date: string, durationMinutes: number): Promise<GeoSphereTimeSlot[]>;
    detectConflicts(calendarId: string, startAt: string, endAt: string, resourceIds?: string[]): Promise<GeoSphereScheduleConflict[]>;
    resolveConflict(conflictId: string, strategy: "REJECT" | "ALLOW_WITH_WARNING" | "RESCHEDULE" | "OVERRIDE"): Promise<GeoSphereScheduleConflict>;
}
export interface GeoSphereSchedulingConfig {
    embeddedMode?: boolean;
}
export declare class GeoSphereSchedulingSDK {
    private config;
    private provider;
    private listeners;
    constructor(config?: GeoSphereSchedulingConfig, provider?: GeoSphereSchedulingProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereSchedulingProviderInfo;
    getCapabilities(): GeoSphereSchedulingCapability[];
    hasCapability(capability: GeoSphereSchedulingCapability): boolean;
    createCalendar(calendar: Partial<GeoSphereCalendar>): Promise<GeoSphereCalendar>;
    getCalendar(calendarId: string): Promise<GeoSphereCalendar>;
    createEvent(eventData: Partial<GeoSphereScheduleEvent>): Promise<GeoSphereScheduleEvent>;
    getEvent(eventId: string): Promise<GeoSphereScheduleEvent>;
    listEvents(filter?: {
        calendarId?: string;
        startAt?: string;
        endAt?: string;
    }): Promise<GeoSphereScheduleEvent[]>;
    createAppointment(appointmentData: Partial<GeoSphereAppointment>): Promise<GeoSphereAppointment>;
    getAppointment(appointmentId: string): Promise<GeoSphereAppointment>;
    generateTimeSlots(calendarId: string, date: string, durationMinutes: number): Promise<GeoSphereTimeSlot[]>;
    detectConflicts(calendarId: string, startAt: string, endAt: string, resourceIds?: string[]): Promise<GeoSphereScheduleConflict[]>;
    resolveConflict(conflictId: string, strategy: "REJECT" | "ALLOW_WITH_WARNING" | "RESCHEDULE" | "OVERRIDE"): Promise<GeoSphereScheduleConflict>;
    presentCalendar(): {
        componentId: string;
        props: {};
    };
    presentSchedule(): {
        componentId: string;
        props: {};
    };
    presentAppointment(appointmentId: string): {
        componentId: string;
        props: {
            appointmentId: string;
        };
    };
    presentTimeSlotPicker(): {
        componentId: string;
        props: {};
    };
    presentAvailability(): {
        componentId: string;
        props: {};
    };
    presentScheduleMap(): {
        componentId: string;
        props: {};
    };
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=scheduling.contracts.d.ts.map