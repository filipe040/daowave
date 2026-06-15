import { isLotAlmostSoldOut } from "@/lib/events/lot-availability";

describe("isLotAlmostSoldOut", () => {
  it("não mostra em lote pequeno sem vendas", () => {
    expect(isLotAlmostSoldOut(2, 2, 0)).toBe(false);
  });

  it("mostra em lote grande com pouco stock restante após vendas", () => {
    expect(isLotAlmostSoldOut(15, 100, 85)).toBe(true);
  });

  it("não mostra em lote grande sem vendas", () => {
    expect(isLotAlmostSoldOut(15, 100, 0)).toBe(false);
  });

  it("mostra quando falta 1 bilhete num lote muito pequeno já com vendas", () => {
    expect(isLotAlmostSoldOut(1, 2, 1)).toBe(true);
  });
});
