import { useEffect, useState } from "react";
import Card from "../components/Card";
import Pill from "../components/Pill";
import { fetchBadges } from "../services/backendApi";
import type { Badge } from "../services/types";

export default function Badges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchBadges()
      .then((payload) => {
        if (active) setBadges(payload.badges);
      })
      .catch(() => {
        if (active) setBadges([]);
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
      {loading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading badges...</p>
        </Card>
      ) : badges.length > 0 ? (
        badges.map((badge) => (
          <Card key={badge.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {badge.name}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{badge.desc}</p>
              </div>
              <Pill text={badge.level} />
            </div>
          </Card>
        ))
      ) : (
        <Card>
          <p className="text-sm text-slate-500">No badges are available yet.</p>
        </Card>
      )}
    </section>
  );
}
