// src/app/admin/rapportages/ziekteverzuim/page.tsx

"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "d MMMM yyyy", { locale: nl });
  } catch {
    return dateStr;
  }
};

interface VerzuimItem {
  id: number;
  medewerker_naam: string;
  van: string;
  tot: string | null;
  opmerking: string;
}

export default function ZiekteverzuimRapportage() {
  const { data: verzuim } = useSWR<VerzuimItem[]>(
    "/api/admin/rapportage/ziekteverzuim",
    fetcher
  );

  const gegroepeerd: { [naam: string]: VerzuimItem[] } = {};
  verzuim?.forEach((v) => {
    if (!gegroepeerd[v.medewerker_naam]) gegroepeerd[v.medewerker_naam] = [];
    gegroepeerd[v.medewerker_naam].push(v);
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Ziekteverzuimrapportage</h1>

      {!verzuim ? (
        <p>Laden...</p>
      ) : verzuim.length === 0 ? (
        <p>Geen meldingen gevonden.</p>
      ) : (
        Object.entries(gegroepeerd).sort(([aNaam, aM], [bNaam, bM]) => {
          const aOpen = aM.some((m) => !m.tot);
          const bOpen = bM.some((m) => !m.tot);
          if (aOpen === bOpen) return aNaam.localeCompare(bNaam);
          return aOpen ? -1 : 1;
        }).map(([naam, meldingen]) => (
          <div key={naam} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{naam} ({meldingen.length})</h2>
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Van</th>
                  <th className="text-left p-2">Tot</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Opmerking</th>
                </tr>
              </thead>
              <tbody>
                {meldingen.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="p-2">{formatDate(v.van)}</td>
                    <td className="p-2">{v.tot ? formatDate(v.tot) : "-"}</td>
                    <td className="p-2">
                      {!v.tot ? "🟥 Nog ziekgemeld" : "✅ Afgerond"}
                    </td>
                    <td className="p-2">{v.opmerking}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
