/**
 * GeoSphere Scheduling & Calendar SDK Core Contracts
 * Framework-Neutral Calendars, Events, Appointments, Time Slots, Availability, Recurrence & Conflict Engine
 */
export class GeoSphereSchedulingError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[SCHEDULING_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereSchedulingError";
    }
}
export class GeoSphereMockSchedulingProvider {
    calendars = new Map();
    events = new Map();
    appointments = new Map();
    conflicts = new Map();
    constructor() {
        const seedCal = {
            calendarId: "cal_seed_001",
            name: "Generic Asset & Task Operation Calendar",
            description: "Standard platform master scheduling calendar.",
            timezone: "UTC",
            locale: "en-US",
            visibility: "TENANT"
        };
        this.calendars.set(seedCal.calendarId, seedCal);
        const seedEvt = {
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
    getProviderInfo() {
        return { name: "GeoSphereMockSchedulingProvider", version: "1.0.0" };
    }
    getCapabilities() {
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
    async createCalendar(calendar) {
        const cal = {
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
    async getCalendar(calendarId) {
        const cal = this.calendars.get(calendarId);
        if (!cal)
            throw new GeoSphereSchedulingError("CALENDAR_NOT_FOUND", `Calendar ID ${calendarId} not found.`);
        return JSON.parse(JSON.stringify(cal));
    }
    async createEvent(eventData) {
        const evt = {
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
    async getEvent(eventId) {
        const evt = this.events.get(eventId);
        if (!evt)
            throw new GeoSphereSchedulingError("EVENT_NOT_FOUND", `Event ID ${eventId} not found.`);
        return JSON.parse(JSON.stringify(evt));
    }
    async listEvents(filter) {
        let list = Array.from(this.events.values());
        if (filter?.calendarId)
            list = list.filter((e) => e.calendarId === filter.calendarId);
        return JSON.parse(JSON.stringify(list));
    }
    async createAppointment(appointmentData) {
        const startIso = appointmentData.startAt || new Date().toISOString();
        const endIso = appointmentData.endAt || new Date(Date.now() + 1800000).toISOString();
        const duration = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
        const appt = {
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
    async getAppointment(appointmentId) {
        const appt = this.appointments.get(appointmentId);
        if (!appt)
            throw new GeoSphereSchedulingError("EVENT_NOT_FOUND", `Appointment ID ${appointmentId} not found.`);
        return JSON.parse(JSON.stringify(appt));
    }
    async generateTimeSlots(calendarId, date, durationMinutes) {
        const baseTime = new Date(date).getTime();
        const slots = [];
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
    async detectConflicts(calendarId, startAt, endAt, resourceIds) {
        const conflicts = [];
        const startMs = new Date(startAt).getTime();
        const endMs = new Date(endAt).getTime();
        for (const evt of this.events.values()) {
            if (evt.calendarId !== calendarId)
                continue;
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
    async resolveConflict(conflictId, strategy) {
        const cnf = this.conflicts.get(conflictId) || {
            conflictId,
            type: "OVERLAPPING_EVENT",
            severity: "WARNING",
            conflictingRecordIds: [],
            startAt: new Date().toISOString(),
            endAt: new Date().toISOString(),
            resolutionState: "UNRESOLVED"
        };
        if (strategy === "ALLOW_WITH_WARNING")
            cnf.resolutionState = "ALLOWED_WITH_WARNING";
        if (strategy === "OVERRIDE")
            cnf.resolutionState = "OVERRIDDEN";
        if (strategy === "REJECT")
            cnf.resolutionState = "REJECTED";
        if (strategy === "RESCHEDULE")
            cnf.resolutionState = "RESCHEDULED";
        this.conflicts.set(conflictId, cnf);
        return JSON.parse(JSON.stringify(cnf));
    }
}
export class GeoSphereSchedulingSDK {
    config;
    provider;
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockSchedulingProvider();
    }
    async initialize() { }
    getProviderInfo() {
        return this.provider.getProviderInfo();
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async createCalendar(calendar) {
        const cal = await this.provider.createCalendar(calendar);
        this.notifyListeners("scheduling.calendarCreated", { calendar: cal });
        return cal;
    }
    async getCalendar(calendarId) {
        return this.provider.getCalendar(calendarId);
    }
    async createEvent(eventData) {
        const evt = await this.provider.createEvent(eventData);
        this.notifyListeners("scheduling.eventCreated", { event: evt });
        return evt;
    }
    async getEvent(eventId) {
        return this.provider.getEvent(eventId);
    }
    async listEvents(filter) {
        return this.provider.listEvents(filter);
    }
    async createAppointment(appointmentData) {
        const appt = await this.provider.createAppointment(appointmentData);
        this.notifyListeners("scheduling.appointmentCreated", { appointment: appt });
        return appt;
    }
    async getAppointment(appointmentId) {
        return this.provider.getAppointment(appointmentId);
    }
    async generateTimeSlots(calendarId, date, durationMinutes) {
        return this.provider.generateTimeSlots(calendarId, date, durationMinutes);
    }
    async detectConflicts(calendarId, startAt, endAt, resourceIds) {
        return this.provider.detectConflicts(calendarId, startAt, endAt, resourceIds);
    }
    async resolveConflict(conflictId, strategy) {
        const cnf = await this.provider.resolveConflict(conflictId, strategy);
        this.notifyListeners("scheduling.conflictResolved", { conflict: cnf });
        return cnf;
    }
    // Embedded Mode Presentation Methods
    presentCalendar() {
        return { componentId: "scheduling.calendar-screen", props: {} };
    }
    presentSchedule() {
        return { componentId: "scheduling.day-screen", props: {} };
    }
    presentAppointment(appointmentId) {
        return { componentId: "scheduling.appointment-screen", props: { appointmentId } };
    }
    presentTimeSlotPicker() {
        return { componentId: "scheduling.time-slot-screen", props: {} };
    }
    presentAvailability() {
        return { componentId: "scheduling.availability-screen", props: {} };
    }
    presentScheduleMap() {
        return { componentId: "scheduling.map-screen", props: {} };
    }
    subscribe(onEvent) {
        const subId = `sched_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.listeners.clear();
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[SCHEDULING_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=scheduling.contracts.js.map