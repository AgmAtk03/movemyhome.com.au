export interface DieselPriceClient {
  audPerLitre: number | null;
  source?: string;
  station?: string;
}

export async function fetchDieselPrice(): Promise<DieselPriceClient> {
  try {
    const response = await fetch('/api/diesel-price', { method: 'GET' });
    if (!response.ok) return { audPerLitre: null };
    const data = await response.json() as {
      ok?: boolean;
      audPerLitre?: number;
      source?: string;
      station?: string;
    };
    if (data?.ok && typeof data.audPerLitre === 'number' && data.audPerLitre > 0) {
      return {
        audPerLitre: data.audPerLitre,
        source: data.source,
        station: data.station,
      };
    }
    return { audPerLitre: null };
  } catch {
    return { audPerLitre: null };
  }
}
