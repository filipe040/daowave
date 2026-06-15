/**
 * Indica se um lote deve mostrar o aviso "Quase a esgotar".
 * Evita falsos positivos em lotes pequenos sem vendas (ex.: 2 bilhetes, 0 vendidos).
 */
export function isLotAlmostSoldOut(
  available: number,
  capacity: number,
  soldCount: number
): boolean {
  if (available <= 0 || capacity <= 0 || soldCount <= 0) return false;

  const remainingRatio = available / capacity;

  // Lotes grandes: mostrar quando restam ≤25% e no máximo 20 bilhetes
  if (capacity >= 20) {
    return remainingRatio <= 0.25 && available <= 20;
  }

  // Lotes médios: mostrar quando restam ≤20% e já houve vendas significativas
  if (capacity >= 5) {
    return remainingRatio <= 0.2;
  }

  // Lotes muito pequenos: só quando falta literalmente 1 bilhete
  return available === 1 && soldCount >= 1;
}
