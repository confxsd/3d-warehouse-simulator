const depots = [{ DepoId: "DEMO-01" }];

const layout = [
  { LocId: "4A001K1", Stok: 18, LocWeight: 1, ProWeight: 1, MaxQuan: 40, ProId: "P-1001" },
  { LocId: "4A010K1", Stok: 9, LocWeight: 2, ProWeight: 2, MaxQuan: 30, ProId: "P-1002" },
  { LocId: "4B005K1", Stok: 24, LocWeight: 3, ProWeight: 3, MaxQuan: 50, ProId: "P-1003" },
  { LocId: "4B045K1", Stok: 12, LocWeight: 1, ProWeight: 1, MaxQuan: 40, ProId: "P-1004" },
  { LocId: "4C020K1", Stok: 6, LocWeight: 2, ProWeight: 2, MaxQuan: 30, ProId: "P-1005" },
  { LocId: "4D010K1", Stok: 15, LocWeight: 3, ProWeight: 3, MaxQuan: 50, ProId: "P-1006" },
  { LocId: "4E050K1", Stok: 21, LocWeight: 1, ProWeight: 1, MaxQuan: 40, ProId: "P-1007" },
  { LocId: "4F030K1", Stok: 11, LocWeight: 2, ProWeight: 2, MaxQuan: 30, ProId: "P-1008" },
  { LocId: "4G060K1", Stok: 28, LocWeight: 3, ProWeight: 3, MaxQuan: 50, ProId: "P-1009" },
  { LocId: "4H010K1", Stok: 7, LocWeight: 1, ProWeight: 1, MaxQuan: 40, ProId: "P-1010" },
  { LocId: "4I020K1", Stok: 17, LocWeight: 2, ProWeight: 2, MaxQuan: 30, ProId: "P-1011" },
  { LocId: "4J040K1", Stok: 13, LocWeight: 3, ProWeight: 3, MaxQuan: 50, ProId: "P-1012" },
].map((item, index) => ({
  ...item,
  Category: ["Food", "Tools", "Apparel"][index % 3],
  InsertedAt: "2026-01-15",
}));

const categories = {
  Categories: {
    Food: [1],
    Tools: [2],
    Apparel: [3],
  },
  Weigths: {
    1: ["Food"],
    2: ["Tools"],
    3: ["Apparel"],
  },
};

class DemoDataController {
  async getDepots() {
    return depots.map((depot) => ({ ...depot }));
  }

  async getLayout(depotId) {
    this.validateDepot(depotId);
    return {
      fillRate: 42.5,
      data: layout.map((item) => ({
        ...item,
        ProCategory: item.Category,
      })),
    };
  }

  async getCategories(depotId) {
    this.validateDepot(depotId);
    return {
      Categories: { ...categories.Categories },
      Weigths: { ...categories.Weigths },
    };
  }

  async filterLayout(depotId, filters, weightFilters, productFilters) {
    this.validateDepot(depotId);
    const filteredLayout = layout.filter((item) => {
      if (weightFilters.length && !weightFilters.includes(String(item.ProWeight))) {
        return false;
      }
      if (productFilters.length && !productFilters.includes(item.Category)) {
        return false;
      }
      if (filters.includes("3") && item.LocWeight < 2) {
        return false;
      }
      return true;
    });

    return {
      fillRate: Number(((filteredLayout.length / layout.length) * 100).toFixed(1)),
      data: filteredLayout.map((item) => ({
        Lokasyon: item.LocId,
        "Koli Miktari": item.Stok,
        "Lokasyon Agirlik Grubu": item.LocWeight,
        "Urun Agirlik Grubu": item.ProWeight,
        Kategori: item.Category,
        "Max Quantity": item.MaxQuan,
        Inserted_At: item.InsertedAt,
        "Product ID": item.ProId,
      })),
    };
  }

  validateDepot(depotId) {
    if (depotId !== depots[0].DepoId) {
      throw new Error(`Unknown demo depot: ${depotId}`);
    }
  }
}

export default DemoDataController;
