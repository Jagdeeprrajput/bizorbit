import { requirePermission } from "@/lib/auth/guards";
import { listOffices } from "@/server/queries/organisation.queries";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { OfficeFormDialog } from "./office-form-dialog";

export default async function OfficesPage() {
  const actor = await requirePermission("office.manage");
  const offices = await listOffices(actor.companyId);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Office locations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each office defines a geofence — the radius attendance clock-ins are checked against.
          </p>
        </div>
        <OfficeFormDialog />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {offices.length === 0 ? (
          <p className="col-span-2 py-10 text-center text-muted-foreground">
            No offices yet — create your first one above.
          </p>
        ) : (
          offices.map((office) => (
            <Card key={office.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{office.name}</CardTitle>
                  <Badge variant="secondary">{office.geofenceRadiusMeters}m radius</Badge>
                </div>
                <CardDescription className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {office.addressLine1}, {office.city}, {office.state} {office.postalCode}
                  </span>
                </CardDescription>
                <div className="mt-2">
                  <OfficeFormDialog
                    office={{
                      id: office.id,
                      name: office.name,
                      addressLine1: office.addressLine1,
                      city: office.city,
                      state: office.state,
                      country: office.country,
                      postalCode: office.postalCode,
                      latitude: Number(office.latitude),
                      longitude: Number(office.longitude),
                      geofenceRadiusMeters: office.geofenceRadiusMeters,
                      timezone: office.timezone,
                    }}
                  />
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
