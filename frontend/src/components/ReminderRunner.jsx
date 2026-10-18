import { useEffect, useState } from "react";
import client from "../api/client";

// Checks reminders every 30 seconds while the app is open
export default function ReminderRunner() {
  const [banner, setBanner] = useState("");

  useEffect(() => {
    async function tick() {
      try {
        const res = await client.get("/reminders");
        const reminders = res.data.data || [];
        const now = new Date();
        const day = now.getDay();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const timeNow = `${hh}:${mm}`;

        for (const r of reminders) {
          if (!r.enabled) continue;
          if (!r.days.includes(day)) continue;
          if (r.time !== timeNow) continue;

          const fire = await client.post(`/reminders/${r._id}/fire`);
          const msg = fire.data.message || r.title;
          setBanner(`⏰ ${msg}`);
          if (Notification.permission === "granted") {
            new Notification("FitTrack reminder", { body: r.title });
          }
          setTimeout(() => setBanner(""), 8000);
        }
      } catch {
        // ignore polling errors
      }
    }

    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  if (!banner) return null;

  return <div className="reminder-banner">{banner}</div>;
}
