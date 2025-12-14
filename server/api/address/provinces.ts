export default defineEventHandler(async (event) => {
  const provinces = [
    { code: "01", name_en: "Phnom Penh", name_kh: "រាជធានីភ្នំពេញ" },
    { code: "02", name_en: "Preah Sihanouk", name_kh: "ព្រះសីហនុ" },
    { code: "03", name_en: "Kampot", name_kh: "កំពត" },
    { code: "04", name_en: "Siem Reap", name_kh: "សៀមរាប" },
    { code: "05", name_en: "Battambang", name_kh: "បាត់ដំបង" },
    { code: "06", name_en: "Banteay Meanchey", name_kh: "បន្ទាយមានជ័យ" },
    { code: "07", name_en: "Kampong Cham", name_kh: "កំពង់ចាម" },
    { code: "08", name_en: "Kampong Chhnang", name_kh: "កំពង់ឆ្នាំង" },
    { code: "09", name_en: "Kampong Speu", name_kh: "កំពង់ស្ពឺ" },
    { code: "10", name_en: "Kampong Thom", name_kh: "កំពង់ធំ" },
    { code: "11", name_en: "Kandal", name_kh: "កណ្ដាល" },
    { code: "12", name_en: "Kep", name_kh: "កែប" },
    { code: "13", name_en: "Koh Kong", name_kh: "កោះកុង" },
    { code: "14", name_en: "Kratie", name_kh: "ក្រចេះ" },
    { code: "15", name_en: "Mondulkiri", name_kh: "មណ្ឌលគិរី" },
    { code: "16", name_en: "Oddar Meanchey", name_kh: "ឧត្តរមានជ័យ" },
    { code: "17", name_en: "Pailin", name_kh: "ប៉ៃលិន" },
    { code: "18", name_en: "Preah Vihear", name_kh: "ព្រះវិហារ" },
    { code: "19", name_en: "Pursat", name_kh: "ពោធិ៍សាត់" },
    { code: "20", name_en: "Ratanakiri", name_kh: "រតនគិរី" },
    { code: "21", name_en: "Stung Treng", name_kh: "ស្ទឹងត្រែង" },
    { code: "22", name_en: "Svay Rieng", name_kh: "ស្វាយរៀង" },
    { code: "23", name_en: "Takeo", name_kh: "តាកែវ" },
    { code: "24", name_en: "Tboung Khmum", name_kh: "ត្បូងឃ្មុំ" },
    { code: "25", name_en: "Prey Veng", name_kh: "ព្រៃវែង" },
  ];

  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return provinces; // Limit to 10 results
  } catch (error) {
    console.error("Search error:", error);
    throw createError({ statusCode: 500, message: "Search failed" });
  }
});
