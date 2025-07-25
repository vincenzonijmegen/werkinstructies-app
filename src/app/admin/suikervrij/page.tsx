"use client";

import { useState, useEffect } from "react";

interface Productie {
  id: number;
  smaak: string;
  datum: string;
  aantal: number;
  kleur: string;
}

export default function SuikervrijPage() {
  const [bewerken, setBewerken] = useState<Productie | null>(null);
  const [lijst, setLijst] = useState<Productie[]>([]);
  const [smakenlijst, setSmakenlijst] = useState<string[]>([]);
  const [kleurenlijst, setKleurenlijst] = useState<{ naam: string; hexcode: string }[]>([]);
  const [smaak, setSmaak] = useState("");
  const [datum, setDatum] = useState(() => new Date().toISOString().substring(0, 10));
  const [aantal, setAantal] = useState(0);
  const [kleur, setKleur] = useState("");

  useEffect(() => {
    // Initial data fetch
    fetchData();
    fetch("/api/suikervrij/smaken").then((res) => res.json()).then((data) => {
      const namen = data.map((d: any) => d.naam);
      setSmakenlijst(namen);
      setSmaak(namen[0] || "");
    });
    fetch("/api/suikervrij/kleuren").then((res) => res.json()).then((data) => {
      setKleurenlijst(data);
      setKleur(data[0]?.naam || "");
    });
  }, []);

  const fetchData = async () => {
    const res = await fetch("/api/suikervrij/productie");
    const data = await res.json();
    setLijst(data);
  };

  const toevoegen = async () => {
    if (!aantal) return;
    await fetch("/api/suikervrij/productie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smaak, datum, aantal, kleur }),
    });
    setAantal(0);
    await fetchData();
  };

  const verwijder = async (id: number) => {
    if (!confirm("Weet je zeker dat je deze productie wilt verwijderen?")) return;
    await fetch("/api/suikervrij/productie", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchData();
  };

  const openEdit = (p: Productie) => setBewerken(p);
  const saveEdit = async () => {
    if (!bewerken) return;
    await fetch("/api/suikervrij/productie", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bewerken),
    });
    setBewerken(null);
    await fetchData();
  };

  // PDF export via html2pdf.js
  const savePdf = async () => {
    // @ts-expect-error html2pdf.js has no types
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.querySelector('.print-area') as HTMLElement;
    if (!element) return;
    html2pdf()
      .from(element)
      .set({ margin: [56.7, 56.7, 0, 0], filename: 'producties.pdf', jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }, html2canvas: { scale: 2 } })
      .save();
  };

  return (
    <div className="p-6">
      {/* Global print styles: show print colors */}
      

      <h1 className="text-xl font-bold mb-4">Productie suikervrij ijs</h1>

      
      <button onClick={savePdf} className="bg-green-600 text-white px-4 py-2 rounded mb-6" id="save-pdf-btn">
        📥 PDF laatste 4 producties
      </button>

      {/* Input section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label>Smaak</label>
          <select value={smaak} onChange={(e) => setSmaak(e.target.value)} className="w-full border rounded p-2">
            {smakenlijst.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Datum</label>
          <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Aantal</label>
          <input type="number" value={aantal} onChange={(e) => setAantal(parseInt(e.target.value) || 0)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Kleur sticker</label>
          <select value={kleur} onChange={(e) => setKleur(e.target.value)} className="w-full border rounded p-2">
            {kleurenlijst.map((k) => <option key={k.naam} value={k.naam}>{k.naam}</option>)}
          </select>
        </div>
      </div>
      <button onClick={toevoegen} className="bg-blue-600 text-white px-4 py-2 rounded mb-6 no-print">+ Toevoegen</button>

      {/* Table of productions */}
      {smakenlijst.map((smaakNaam) => {
        const items = lijst.filter((p) => p.smaak === smaakNaam)
          .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
        if (!items.length) return null;
        return (
          <div key={smaakNaam} className="mb-6">
            <h3 className="font-semibold mb-2">{smaakNaam}</h3>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Datum</th>
                  <th className="border px-2 py-1">Aantal</th>
                  <th className="border px-2 py-1">Kleur</th>
                  <th className="border px-2 py-1">Acties</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="border px-2 py-1">{new Date(p.datum).toLocaleDateString('nl-NL')}</td>
                    <td className="border px-2 py-1">{p.aantal}</td>
                    <td className="border px-2 py-1 flex items-center">
                      <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: kleurenlijst.find((k) => k.naam === p.kleur)?.hexcode || '#ccc' }}></span>
                      <span>{p.kleur}</span>
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => openEdit(p)} className="text-blue-600">✏️</button>
                      <button onClick={() => verwijder(p.id)} className="text-red-600">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Print area */}
      <div className="print-area bg-white">
        <h2 className="font-bold mb-4">Print – laatste 4 producties per smaak</h2>
        {smakenlijst.map((smaakNaam) => {
          const items = lijst.filter((p) => p.smaak === smaakNaam)
            .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
            .slice(0, 4);
          if (!items.length) return null;
          return (
            <div key={smaakNaam} className="mb-4">
              <h3 className="font-semibold mb-1">{smaakNaam}</h3>
              <ul className="list-disc pl-4">
                {items.map((p) => (
                  <li key={p.id} className="mb-1 align-text-baseline">
                    {new Date(p.datum).toLocaleDateString('nl-NL')}, {p.aantal} stuks,
                    <span
                      className="inline-block w-5 h-5 rounded-full ml-2"
                      style={{ backgroundColor: kleurenlijst.find((k) => k.naam === p.kleur)?.hexcode || '#ccc', verticalAlign: 'text-bottom' }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {bewerken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="font-semibold mb-4">Productie bewerken</h2>
            <div className="space-y-4">
              <label className="block">
                Datum
                <input type="date" className="w-full border rounded p-2" value={bewerken.datum} onChange={(e) => setBewerken({ ...bewerken, datum: e.target.value })} />
              </label>
              <label className="block">
                Aantal
                <input type="number" className="w-full border rounded p-2" value={bewerken.aantal} onChange={(e) => setBewerken({ ...bewerken, aantal: parseInt(e.target.value) || 0 })} />
              </label>
              <label className="block">
                Kleur sticker
                <select className="w-full border rounded p-2" value={bewerken.kleur} onChange={(e) => setBewerken({ ...bewerken, kleur: e.target.value })}>
                  {kleurenlijst.map((k) => <option key={k.naam} value={k.naam}>{k.naam}</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setBewerken(null)} className="text-gray-600">Annuleer</button>
              <button onClick={saveEdit} className="bg-blue-600 text-white px-4 py-2 rounded">Opslaan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
