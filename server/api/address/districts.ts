export default defineEventHandler(async (event) => {
  const query = getQuery(event).province_code as string;

  if (!query || query.length < 2) {
    return [];
  }

  const districts = [
    // Phnom Penh (01)
    {
      code: "0101",
      province_code: "01",
      name_en: "Doun Penh",
      name_kh: "ខណ្ឌដូនពេញ",
    },
    {
      code: "0102",
      province_code: "01",
      name_en: "Chamkar Mon",
      name_kh: "ខណ្ឌចំការមន",
    },
    {
      code: "0103",
      province_code: "01",
      name_en: "Chroy Changvar",
      name_kh: "ខណ្ឌជ្រោយចង្វារ",
    },
    {
      code: "0104",
      province_code: "01",
      name_en: "Toul Kork",
      name_kh: "ខណ្ឌទួលគោក",
    },
    {
      code: "0105",
      province_code: "01",
      name_en: "Sen Sok",
      name_kh: "ខណ្ឌសែនសុខ",
    },

    // Preah Sihanouk (02)
    {
      code: "0201",
      province_code: "02",
      name_en: "Sihanoukville",
      name_kh: "ក្រុងព្រះសីហនុ",
    },
    {
      code: "0202",
      province_code: "02",
      name_en: "Prey Nob",
      name_kh: "ស្រុកព្រៃនប់",
    },
    {
      code: "0203",
      province_code: "02",
      name_en: "Stueng Hav",
      name_kh: "ស្រុកស្ទឹងហាវ",
    },
    {
      code: "0204",
      province_code: "02",
      name_en: "Kampong Seila",
      name_kh: "ស្រុកកំពង់សីលា",
    },

    // Kampot (03)
    {
      code: "0301",
      province_code: "03",
      name_en: "Kampot City",
      name_kh: "ក្រុងកំពត",
    },
    {
      code: "0302",
      province_code: "03",
      name_en: "Chhuk",
      name_kh: "ស្រុកឈូក",
    },
    {
      code: "0303",
      province_code: "03",
      name_en: "Dang Tong",
      name_kh: "ស្រុកដងទង់",
    },
    {
      code: "0304",
      province_code: "03",
      name_en: "Tuek Chhou",
      name_kh: "ស្រុកទឹកឈូ",
    },

    // Siem Reap (04)
    {
      code: "0401",
      province_code: "04",
      name_en: "Siem Reap",
      name_kh: "ក្រុងសៀមរាប",
    },
    { code: "0402", province_code: "04", name_en: "Puok", name_kh: "ស្រុកពួក" },
    {
      code: "0403",
      province_code: "04",
      name_en: "Prasat Bakong",
      name_kh: "ស្រុកប្រាសាទបាគង",
    },
    {
      code: "0404",
      province_code: "04",
      name_en: "Angkor Thom",
      name_kh: "ស្រុកអង្គរធំ",
    },

    // Battambang (05)
    {
      code: "0501",
      province_code: "05",
      name_en: "Battambang",
      name_kh: "ក្រុងបាត់ដំបង",
    },
    {
      code: "0502",
      province_code: "05",
      name_en: "Moung Ruessei",
      name_kh: "ស្រុកមោងឫស្សី",
    },
    {
      code: "0503",
      province_code: "05",
      name_en: "Rotanak Mondol",
      name_kh: "ស្រុករតនមណ្ឌល",
    },
    {
      code: "0504",
      province_code: "05",
      name_en: "Thma Koul",
      name_kh: "ស្រុកថ្មគោល",
    },
  ];

  try {
    const results = districts.filter((d) => d.province_code === query);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return results; // Limit to 10 results
  } catch (error) {
    console.error("Search error:", error);
    throw createError({ statusCode: 500, message: "Search failed" });
  }
});
