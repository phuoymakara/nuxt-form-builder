export default defineEventHandler(async (event) => {
  const query = getQuery(event).district_code as string;

  if (!query || query.length < 2) {
    return [];
  }

  const communes = [
    // Phnom Penh → Doun Penh (0101)
    {
      code: "010101",
      province_code: "01",
      district_code: "0101",
      name_en: "Phsar Kandal I",
      name_kh: "សង្កាត់ផ្សារកណ្ដាលទី១",
    },
    {
      code: "010102",
      province_code: "01",
      district_code: "0101",
      name_en: "Phsar Kandal II",
      name_kh: "សង្កាត់ផ្សារកណ្ដាលទី២",
    },

    // Phnom Penh → Chamkar Mon (0102)
    {
      code: "010201",
      province_code: "01",
      district_code: "0102",
      name_en: "Tonle Bassac",
      name_kh: "សង្កាត់ទន្លេបាសាក់",
    },
    {
      code: "010202",
      province_code: "01",
      district_code: "0102",
      name_en: "Boeung Keng Kang I",
      name_kh: "សង្កាត់បឹងកេងកងទី១",
    },

    // Preah Sihanouk → Sihanoukville (0201)
    {
      code: "020101",
      province_code: "02",
      district_code: "0201",
      name_en: "Buon",
      name_kh: "សង្កាត់បួន",
    },
    {
      code: "020102",
      province_code: "02",
      district_code: "0201",
      name_en: "Pir",
      name_kh: "សង្កាត់ពីរ",
    },

    // Kampot → Kampot City (0301)
    {
      code: "030101",
      province_code: "03",
      district_code: "0301",
      name_en: "Kampong Bay",
      name_kh: "សង្កាត់កំពង់បាយ",
    },
    {
      code: "030102",
      province_code: "03",
      district_code: "0301",
      name_en: "Andoung Khmer",
      name_kh: "សង្កាត់អណ្ដូងខ្មែរ",
    },

    // Siem Reap → Siem Reap City (0401)
    {
      code: "040101",
      province_code: "04",
      district_code: "0401",
      name_en: "Svay Dangkum",
      name_kh: "សង្កាត់ស្វាយដង្គំ",
    },
    {
      code: "040102",
      province_code: "04",
      district_code: "0401",
      name_en: "Sala Kamreuk",
      name_kh: "សង្កាត់សាលាកំរើក",
    },

    // Battambang → Battambang City (0501)
    {
      code: "050101",
      province_code: "05",
      district_code: "0501",
      name_en: "Svay Por",
      name_kh: "សង្កាត់ស្វាយពរ",
    },
    {
      code: "050102",
      province_code: "05",
      district_code: "0501",
      name_en: "Phnom Sampov",
      name_kh: "សង្កាត់ភ្នំសំពៅ",
    },
  ];

  try {
    const results = communes.filter((d) => d.district_code === query);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return results; // Limit to 10 results
  } catch (error) {
    console.error("Search error:", error);
    throw createError({ statusCode: 500, message: "Search failed" });
  }
});
