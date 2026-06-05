import { listLocations, listPatients, listAppointments, patientLocation } from "@/lib/clinic";
import { PageHeader } from "@/components/shell/page-header";
import { LocationsClient } from "@/components/clinic/locations-client";

export default function LocationsPage() {
  const patients = listPatients();
  const appts = listAppointments();

  const locations = listLocations().map((l) => {
    const locPatients = patients.filter((p) => patientLocation(p.id) === l.id);
    const apptsToday = appts.filter((a) => patientLocation(a.patientId) === l.id).length;
    const outstanding = locPatients.reduce((s, p) => s + p.balance, 0);
    return { ...l, patients: locPatients.length, apptsToday, outstanding };
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Locations" subtitle="Clinic branches — addresses & details" />
      <LocationsClient locations={locations} />
    </div>
  );
}
