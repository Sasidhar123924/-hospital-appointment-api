import prisma from './lib/prisma';
import {
  bookAppointment,
  cancelAllPatientAppointments,
  deleteAppointment,
  getAppointmentFull,
  getDoctorUpcomingAppointments,
  setAppointmentStatus,
} from './appointments';
import { createDoctor, deleteDoctor, getDoctor, listDoctorsBySpecialty } from './doctors';
import { createPatient, deletePatient, getPatient, searchPatients, updatePatientPhone } from './patients';

async function main() {
  console.log('\n── Patients ──────────────────────────');

  const patient = await createPatient({
    name: 'Test Patient',
    email: `test.patient.${Date.now()}@example.com`,
    phone: '9999999999',
  });
  console.log('Created:', patient.name, patient.id);

  const foundPatient = await getPatient(patient.id);
  console.log('Found:', foundPatient.name);

  const updatedPatient = await updatePatientPhone(patient.id, '8888888888');
  console.log('Updated phone:', updatedPatient.phone);

  const patientMatches = await searchPatients('Test Patient');
  console.log('Search results:', patientMatches.length);

  console.log('\n── Doctors ───────────────────────────');

  const doctor = await createDoctor({
    name: 'Dr. Test',
    specialty: 'General Medicine',
    email: `dr.test.${Date.now()}@hospital.io`,
  });
  console.log('Created:', doctor.name, doctor.id);

  const foundDoctor = await getDoctor(doctor.id);
  console.log('Found:', foundDoctor.name);

  const specialists = await listDoctorsBySpecialty('General');
  console.log('General Medicine doctors:', specialists.length);

  console.log('\n── Appointments ──────────────────────');

  const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nextDayLater = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const appointment = await bookAppointment(
    patient.id,
    doctor.id,
    nextDay,
    'Initial consultation',
  );
  console.log('Booked:', appointment.id, 'for', appointment.patient.name);

  const secondAppointment = await bookAppointment(
    patient.id,
    doctor.id,
    nextDayLater,
    'Follow-up consultation',
  );

  const fullAppointment = await getAppointmentFull(appointment.id);
  console.log('Full fetch:', fullAppointment.patient.name, 'with', fullAppointment.doctor.name);

  const schedule = await getDoctorUpcomingAppointments(doctor.id);
  console.log('Doctor schedule:', schedule.length, 'appointment(s)');

  const completedAppointment = await setAppointmentStatus(appointment.id, 'completed');
  console.log('Status updated to:', completedAppointment.status);

  const cancelledCount = await cancelAllPatientAppointments(patient.id);
  console.log('Cancelled appointments:', cancelledCount);

  try {
    await deleteDoctor(doctor.id);
  } catch (error: unknown) {
    if (!(error instanceof Error)) throw error;
    console.log('Doctor delete guard:', error.message);
  }

  console.log('\n── Cleanup ───────────────────────────');
  await deleteAppointment(appointment.id);
  await deletePatient(patient.id);
  await deleteDoctor(doctor.id);
  console.log('Test data cleaned up (patient deletion cascaded to the remaining appointment).');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
