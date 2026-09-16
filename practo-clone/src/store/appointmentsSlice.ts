import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Appointment } from "@/lib/types";
import {
  getAppointments,
  getAppointmentsForPatient,
  getAppointmentsForDoctor,
  cancelAppointment as cancelAppointmentDb,
  createAppointment as createAppointmentDb,
  rescheduleAppointment as rescheduleAppointmentDb,
  completeAppointment as completeAppointmentDb,
} from "@/lib/mock-db";

interface AppointmentsState {
  all: Appointment[];
  loaded: boolean;
}

const initialState: AppointmentsState = {
  all: [],
  loaded: false,
};

/**
 * These thunks talk to localStorage (via mock-db.ts) exactly once per
 * mutation, then the matching extraReducer updates Redux state directly.
 * localStorage stays the persistence layer; Redux stays the single source
 * of truth the UI reads from during the session — nobody needs to
 * re-fetch the whole list after a single cancel/book/reschedule.
 */

// Every appointment across all patients (rarely needed directly).
export const loadAppointments = createAsyncThunk("appointments/loadAll", async () =>
  getAppointments()
);

// Patient-side: just this patient's appointments.
export const loadAppointmentsForPatient = createAsyncThunk(
  "appointments/loadForPatient",
  async (email: string) => getAppointmentsForPatient(email)
);

// Doctor-side: just this doctor's appointments.
export const loadAppointmentsForDoctor = createAsyncThunk(
  "appointments/loadForDoctor",
  async (doctorName: string) => getAppointmentsForDoctor(doctorName)
);

export const cancelAppointmentThunk = createAsyncThunk(
  "appointments/cancel",
  async ({ id, cancelledBy = "patient" }: { id: string; cancelledBy?: "patient" | "doctor" }) => {
    cancelAppointmentDb(id, cancelledBy);
    return id;
  }
);

export const createAppointmentThunk = createAsyncThunk(
  "appointments/create",
  async (appt: Parameters<typeof createAppointmentDb>[0]) => createAppointmentDb(appt)
);

export const rescheduleAppointmentThunk = createAsyncThunk(
  "appointments/reschedule",
  async ({ id, newDate }: { id: string; newDate: string }) => rescheduleAppointmentDb(id, newDate)
);

export const completeAppointmentThunk = createAsyncThunk(
  "appointments/complete",
  async ({
    id,
    data,
  }: {
    id: string;
    data: { diagnosis: string; report: string; medicines: string };
  }) => completeAppointmentDb(id, data)
);

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    // Use when you already have a fresh list in hand (e.g. from a thunk
    // you wrote yourself, or a one-off fetch).
    setAppointments(state, action: PayloadAction<Appointment[]>) {
      state.all = action.payload;
      state.loaded = true;
    },
    // Use right after booking a new appointment — no re-fetch needed.
    appointmentAdded(state, action: PayloadAction<Appointment>) {
      state.all.push(action.payload);
    },
    // Use after any change where you already have the updated object
    // (reschedule, mark complete, add prescription, etc.).
    appointmentUpdated(state, action: PayloadAction<Appointment>) {
      const i = state.all.findIndex((a) => a.id === action.payload.id);
      if (i !== -1) state.all[i] = action.payload;
    },
    // Use when you only have the id (mirrors cancelAppointmentThunk below,
    // for call sites that don't want to dispatch a thunk).
    appointmentCancelled(state, action: PayloadAction<string>) {
      const appt = state.all.find((a) => a.id === action.payload);
      if (appt) appt.status = "cancelled";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAppointments.fulfilled, (state, action) => {
        state.all = action.payload;
        state.loaded = true;
      })
      .addCase(loadAppointmentsForPatient.fulfilled, (state, action) => {
        state.all = action.payload;
        state.loaded = true;
      })
      .addCase(loadAppointmentsForDoctor.fulfilled, (state, action) => {
        state.all = action.payload;
        state.loaded = true;
      })
      .addCase(cancelAppointmentThunk.fulfilled, (state, action) => {
        const appt = state.all.find((a) => a.id === action.payload);
        if (appt) appt.status = "cancelled";
      })
      .addCase(createAppointmentThunk.fulfilled, (state, action) => {
        state.all.push(action.payload);
      })
      .addCase(rescheduleAppointmentThunk.fulfilled, (state, action) => {
        if (!action.payload) return; // slot was taken — mock-db returned null
        const i = state.all.findIndex((a) => a.id === action.payload!.id);
        if (i !== -1) state.all[i] = action.payload;
      })
      .addCase(completeAppointmentThunk.fulfilled, (state, action) => {
        if (!action.payload) return;
        const i = state.all.findIndex((a) => a.id === action.payload!.id);
        if (i !== -1) state.all[i] = action.payload;
      });
  },
});

export const { setAppointments, appointmentAdded, appointmentUpdated, appointmentCancelled } =
  appointmentsSlice.actions;
export default appointmentsSlice.reducer;