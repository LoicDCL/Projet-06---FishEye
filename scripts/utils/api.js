// API - Récupération des données photographes

export async function getDB() {
    const res = await fetch("data/photographers.json");
    if (!res.ok) throw new Error("Chargement des données impossible");
    return res.json();
}