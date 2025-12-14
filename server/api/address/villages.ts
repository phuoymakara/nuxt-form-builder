export default defineEventHandler(async (event) => {
  const query = getQuery(event).commune_code as string;

  if (!query || query.length < 2) {
    return [];
  }

  const villages = [
    // Phnom Penh → Doun Penh → Phsar Kandal I
    {
      code: "01010101",
      province_code: "01",
      district_code: "0101",
      commune_code: "010101",
      name_en: "Village 1",
      name_kh: "ភូមិទី១",
    },
    {
      code: "01010102",
      province_code: "01",
      district_code: "0101",
      commune_code: "010101",
      name_en: "Village 2",
      name_kh: "ភូមិទី២",
    },

    // Phnom Penh → Chamkar Mon → Tonle Bassac
    {
      code: "01020101",
      province_code: "01",
      district_code: "0102",
      commune_code: "010201",
      name_en: "Tonle Bassac Village",
      name_kh: "ភូមិទន្លេបាសាក់",
    },

    // Preah Sihanouk → Buon
    {
      code: "02010101",
      province_code: "02",
      district_code: "0201",
      commune_code: "020101",
      name_en: "Buon Village",
      name_kh: "ភូមិបួន",
    },

    // Kampot → Kampong Bay
    {
      code: "03010101",
      province_code: "03",
      district_code: "0301",
      commune_code: "030101",
      name_en: "Kampong Bay Village",
      name_kh: "ភូមិកំពង់បាយ",
    },

    // Siem Reap → Svay Dangkum
    {
      code: "04010101",
      province_code: "04",
      district_code: "0401",
      commune_code: "040101",
      name_en: "Svay Dangkum Village",
      name_kh: "ភូមិស្វាយដង្គំ",
    },

    // Battambang → Svay Por
    {
      code: "05010101",
      province_code: "05",
      district_code: "0501",
      commune_code: "050101",
      name_en: "Svay Por Village",
      name_kh: "ភូមិស្វាយពរ",
    },
  ];

  try {
    const results = villages.filter((d) => d.commune_code === query);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return results; // Limit to 10 results
  } catch (error) {
    console.error("Search error:", error);
    throw createError({ statusCode: 500, message: "Search failed" });
  }
});
