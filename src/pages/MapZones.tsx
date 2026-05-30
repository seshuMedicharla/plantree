import { useEffect, useState } from "react";
import Card from "../components/Card";
import Pill from "../components/Pill";
import { fetchZones } from "../services/backendApi";
import type { Zone } from "../services/types";

export default function MapZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchZones()
      .then((payload) => {
        if (active) setZones(payload.zones);
      })
      .catch(() => {
        if (active) setZones([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-4 p-4">
      <Card>
        <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
          Zone map will appear when zone geometry is configured.
        </div>
      </Card>

      <Card>
        <div className="space-y-2">
          {loading ? (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
              Loading zones...
            </p>
          ) : zones.length > 0 ? (
            zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {zone.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Multiplier x{zone.multiplier.toFixed(1)}
                  </p>
                </div>
                <Pill
                  text={zone.type}
                  className={
                    zone.type === "NEGATIVE"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : ""
                  }
                />
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
              No zones configured yet.
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}
