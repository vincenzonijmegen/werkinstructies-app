import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import DashboardWrapper from "@/components/medewerker/DashboardWrapper";

export default function AdminMedewerkerDashboard({ params }) {
  const email = decodeURIComponent(params.email);
  return <DashboardShell email={email} />;
}

async function DashboardShell({ email }) {
  const { rows } = await db.query(
    `SELECT id, naam, functie FROM medewerkers WHERE email = $1`,
    [email]
  );
  const medewerker = rows?.[0];
  if (!medewerker) return notFound();

  return (
    <main className="p-6">
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          👀 Je bekijkt het dashboard van <strong>{medewerker.naam}</strong> in readonly-modus.
        </p>
      </div>

      <DashboardWrapper
        email={email}
        functie={medewerker.functie}
        naam={medewerker.naam}
        readonly={true}
      />
    </main>
  );
}
