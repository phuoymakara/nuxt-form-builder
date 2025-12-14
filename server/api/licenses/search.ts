export default defineEventHandler(async (event) => {
  const query = getQuery(event).q as string;

  if (!query || query.length < 2) {
    return [];
  }

  // Mock database
  const allLicenses = [
    {
      id: 1,
      name: "កសិដ្ឋានគីរី",
      code: "S0054",
    },
    {
      id: 2,
      name: "កសិដ្ឋានប៉ែតប្រុង",
      code: "S0055",
    },
    {
      id: 3,
      name: "អាជ្ញាប័ណ្ណជីកសិកម្ម",
      code: "S0059",
    },
    {
      id: 4,
      name: "អាជ្ញាប័ណ្ណគម្របកសិកម្ម",
      code: "S0060",
    },
    {
      id: 5,
      name: "អាជ្ញាប័ណ្ណសមុទ្ឋបាលចម្ការ",
      code: "S0061",
    },
    {
      id: 6,
      name: "ប្រតិបត្តិការចាក់វាក់ស៊ីន",
      code: "V0001",
    },
    {
      id: 7,
      name: "ប្រតិបត្តិការព្យាបាល",
      code: "V0002",
    },
  ];

  try {
    const searchLower = query.toLowerCase();
    const results = allLicenses.filter(
      (license) =>
        license.name.toLowerCase().includes(searchLower) ||
        license.code.toLowerCase().includes(searchLower),
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return results.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error("Search error:", error);
    throw createError({ statusCode: 500, message: "Search failed" });
  }
});
