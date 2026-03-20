export default defineEventHandler(async (event) => {
  const query = getQuery(event).province_code as string;

  if (!query || query.length < 2) return [];

  const districts = [
    // 01 - Phnom Penh
    { code: "0101", province_code: "01", name_en: "Doun Penh",       name_kh: "ខណ្ឌដូនពេញ" },
    { code: "0102", province_code: "01", name_en: "Chamkar Mon",     name_kh: "ខណ្ឌចំការមន" },
    { code: "0103", province_code: "01", name_en: "Chroy Changvar",  name_kh: "ខណ្ឌជ្រោយចង្វារ" },
    { code: "0104", province_code: "01", name_en: "Toul Kork",       name_kh: "ខណ្ឌទួលគោក" },
    { code: "0105", province_code: "01", name_en: "Sen Sok",         name_kh: "ខណ្ឌសែនសុខ" },
    { code: "0106", province_code: "01", name_en: "Mean Chey",       name_kh: "ខណ្ឌមានជ័យ" },
    { code: "0107", province_code: "01", name_en: "Russey Keo",      name_kh: "ខណ្ឌរស្សីកែវ" },
    { code: "0108", province_code: "01", name_en: "Por Sen Chey",    name_kh: "ខណ្ឌពោធិ៍សែនជ័យ" },
    { code: "0109", province_code: "01", name_en: "Chbar Ampov",     name_kh: "ខណ្ឌច្បារអំពៅ" },
    { code: "0110", province_code: "01", name_en: "Dangkao",         name_kh: "ខណ្ឌដង្កោ" },
    { code: "0111", province_code: "01", name_en: "Prek Pnov",       name_kh: "ខណ្ឌព្រែកព្នៅ" },
    { code: "0112", province_code: "01", name_en: "Kamboul",         name_kh: "ខណ្ឌកំបូល" },

    // 02 - Preah Sihanouk
    { code: "0201", province_code: "02", name_en: "Sihanoukville",   name_kh: "ក្រុងព្រះសីហនុ" },
    { code: "0202", province_code: "02", name_en: "Prey Nob",        name_kh: "ស្រុកព្រៃនប់" },
    { code: "0203", province_code: "02", name_en: "Stueng Hav",      name_kh: "ស្រុកស្ទឹងហាវ" },
    { code: "0204", province_code: "02", name_en: "Kampong Seila",   name_kh: "ស្រុកកំពង់សីលា" },
    { code: "0205", province_code: "02", name_en: "Koh Rong",        name_kh: "ស្រុកកោះរ៉ុង" },

    // 03 - Kampot
    { code: "0301", province_code: "03", name_en: "Kampot City",     name_kh: "ក្រុងកំពត" },
    { code: "0302", province_code: "03", name_en: "Chhuk",           name_kh: "ស្រុកឈូក" },
    { code: "0303", province_code: "03", name_en: "Dang Tong",       name_kh: "ស្រុកដងទង់" },
    { code: "0304", province_code: "03", name_en: "Tuek Chhou",      name_kh: "ស្រុកទឹកឈូ" },
    { code: "0305", province_code: "03", name_en: "Banteay Meas",    name_kh: "ស្រុកបន្ទាយមាស" },
    { code: "0306", province_code: "03", name_en: "Chum Kiri",       name_kh: "ស្រុកជំពីរ" },
    { code: "0307", province_code: "03", name_en: "Kampong Trach",   name_kh: "ស្រុកកំពង់ត្រាច" },

    // 04 - Siem Reap
    { code: "0401", province_code: "04", name_en: "Siem Reap City",  name_kh: "ក្រុងសៀមរាប" },
    { code: "0402", province_code: "04", name_en: "Puok",            name_kh: "ស្រុកពួក" },
    { code: "0403", province_code: "04", name_en: "Prasat Bakong",   name_kh: "ស្រុកប្រាសាទបាគង" },
    { code: "0404", province_code: "04", name_en: "Angkor Thom",     name_kh: "ស្រុកអង្គរធំ" },
    { code: "0405", province_code: "04", name_en: "Banteay Srei",    name_kh: "ស្រុកបន្ទាយស្រី" },
    { code: "0406", province_code: "04", name_en: "Srei Snam",       name_kh: "ស្រុកស្រីស្នំ" },
    { code: "0407", province_code: "04", name_en: "Varin",           name_kh: "ស្រុកវ៉ារីន" },
    { code: "0408", province_code: "04", name_en: "Chi Kreng",       name_kh: "ស្រុកជីក្រែង" },
    { code: "0409", province_code: "04", name_en: "Kralanh",         name_kh: "ស្រុកក្រឡាញ់" },

    // 05 - Battambang
    { code: "0501", province_code: "05", name_en: "Battambang City", name_kh: "ក្រុងបាត់ដំបង" },
    { code: "0502", province_code: "05", name_en: "Moung Ruessei",   name_kh: "ស្រុកមោងឫស្សី" },
    { code: "0503", province_code: "05", name_en: "Rotanak Mondol",  name_kh: "ស្រុករតនមណ្ឌល" },
    { code: "0504", province_code: "05", name_en: "Thma Koul",       name_kh: "ស្រុកថ្មគោល" },
    { code: "0505", province_code: "05", name_en: "Bavel",           name_kh: "ស្រុកបាវិល" },
    { code: "0506", province_code: "05", name_en: "Ek Phnom",        name_kh: "ស្រុកឯកភ្នំ" },
    { code: "0507", province_code: "05", name_en: "Kamrieng",        name_kh: "ស្រុកកំរៀង" },
    { code: "0508", province_code: "05", name_en: "Samlout",         name_kh: "ស្រុកសំឡូត" },
    { code: "0509", province_code: "05", name_en: "Sangkae",         name_kh: "ស្រុកសង្កែ" },

    // 06 - Banteay Meanchey
    { code: "0601", province_code: "06", name_en: "Serei Saophoan",  name_kh: "ក្រុងសិរីសោភ័ណ" },
    { code: "0602", province_code: "06", name_en: "Mongkol Borei",   name_kh: "ស្រុកមង្គលបូរី" },
    { code: "0603", province_code: "06", name_en: "Malai",           name_kh: "ស្រុកម៉ាឡៃ" },
    { code: "0604", province_code: "06", name_en: "Phnum Srok",      name_kh: "ស្រុកភ្នំស្រុក" },
    { code: "0605", province_code: "06", name_en: "Preah Netr Preah",name_kh: "ស្រុកព្រះនេត្រព្រះ" },
    { code: "0606", province_code: "06", name_en: "Svay Chek",       name_kh: "ស្រុកស្វាយជាក" },
    { code: "0607", province_code: "06", name_en: "Thma Puok",       name_kh: "ស្រុកថ្មពួក" },

    // 07 - Kampong Cham
    { code: "0701", province_code: "07", name_en: "Kampong Cham City", name_kh: "ក្រុងកំពង់ចាម" },
    { code: "0702", province_code: "07", name_en: "Batheay",          name_kh: "ស្រុកបាធាយ" },
    { code: "0703", province_code: "07", name_en: "Chamkar Leu",      name_kh: "ស្រុកចំការលើ" },
    { code: "0704", province_code: "07", name_en: "Cheung Prey",      name_kh: "ស្រុកជើងព្រៃ" },
    { code: "0705", province_code: "07", name_en: "Kampong Siem",     name_kh: "ស្រុកកំពង់សៀម" },
    { code: "0706", province_code: "07", name_en: "Prey Chhor",       name_kh: "ស្រុកព្រៃឈរ" },
    { code: "0707", province_code: "07", name_en: "Stueng Trang",     name_kh: "ស្រុកស្ទឹងត្រង" },

    // 08 - Kampong Chhnang
    { code: "0801", province_code: "08", name_en: "Kampong Chhnang City", name_kh: "ក្រុងកំពង់ឆ្នាំង" },
    { code: "0802", province_code: "08", name_en: "Chol Kiri",            name_kh: "ស្រុកជលគិរី" },
    { code: "0803", province_code: "08", name_en: "Kampong Leaeng",       name_kh: "ស្រុកកំពង់លែង" },
    { code: "0804", province_code: "08", name_en: "Kampong Tralach",      name_kh: "ស្រុកកំពង់ត្រឡាច" },
    { code: "0805", province_code: "08", name_en: "Rolea Bier",           name_kh: "ស្រុករលាភៀរ" },
    { code: "0806", province_code: "08", name_en: "Sameakki Mean Chey",   name_kh: "ស្រុកសាមគ្គីមានជ័យ" },

    // 09 - Kampong Speu
    { code: "0901", province_code: "09", name_en: "Chbar Mon City",  name_kh: "ក្រុងច្បារមន" },
    { code: "0902", province_code: "09", name_en: "Aoral",           name_kh: "ស្រុកអូរាល" },
    { code: "0903", province_code: "09", name_en: "Kong Pisey",      name_kh: "ស្រុកកោងពីសី" },
    { code: "0904", province_code: "09", name_en: "Phnom Sruoch",    name_kh: "ស្រុកភ្នំស្រូច" },
    { code: "0905", province_code: "09", name_en: "Sam Raong Tong",  name_kh: "ស្រុកសំរោងទង" },
    { code: "0906", province_code: "09", name_en: "Thpong",          name_kh: "ស្រុកថ្ពង" },

    // 10 - Kampong Thom
    { code: "1001", province_code: "10", name_en: "Stueng Saen City", name_kh: "ក្រុងស្ទឹងសែន" },
    { code: "1002", province_code: "10", name_en: "Baray",            name_kh: "ស្រុកបារាយណ៍" },
    { code: "1003", province_code: "10", name_en: "Kampong Svay",     name_kh: "ស្រុកកំពង់ស្វាយ" },
    { code: "1004", province_code: "10", name_en: "Prasat Balangk",   name_kh: "ស្រុកប្រាសាទបាល្លង្គ" },
    { code: "1005", province_code: "10", name_en: "Prasat Sambour",   name_kh: "ស្រុកប្រាសាទសំបូរ" },
    { code: "1006", province_code: "10", name_en: "Sandan",           name_kh: "ស្រុកសន្ទាន" },
    { code: "1007", province_code: "10", name_en: "Stoung",           name_kh: "ស្រុកស្ទោង" },

    // 11 - Kandal
    { code: "1101", province_code: "11", name_en: "Takhmao City",    name_kh: "ក្រុងតាខ្មៅ" },
    { code: "1102", province_code: "11", name_en: "Angk Snuol",      name_kh: "ស្រុកអង្គស្នួល" },
    { code: "1103", province_code: "11", name_en: "Kien Svay",       name_kh: "ស្រុកកៀនស្វាយ" },
    { code: "1104", province_code: "11", name_en: "Khsach Kandal",   name_kh: "ស្រុកខ្សាច់កណ្ដាល" },
    { code: "1105", province_code: "11", name_en: "Leuk Daek",       name_kh: "ស្រុកល្អើកដែក" },
    { code: "1106", province_code: "11", name_en: "Ponhea Leu",      name_kh: "ស្រុកពញាលើ" },
    { code: "1107", province_code: "11", name_en: "Sa'ang",          name_kh: "ស្រុកស្អាង" },
    { code: "1108", province_code: "11", name_en: "Koh Thom",        name_kh: "ស្រុកកោះធំ" },
    { code: "1109", province_code: "11", name_en: "Mukh Kampul",     name_kh: "ស្រុកមុខកំពូល" },

    // 12 - Kep
    { code: "1201", province_code: "12", name_en: "Kep City",             name_kh: "ក្រុងកែប" },
    { code: "1202", province_code: "12", name_en: "Damnak Chang'aeur",    name_kh: "ស្រុកដំណាក់ចង្អើរ" },

    // 13 - Koh Kong
    { code: "1301", province_code: "13", name_en: "Koh Kong City",  name_kh: "ក្រុងកោះកុង" },
    { code: "1302", province_code: "13", name_en: "Botum Sakor",    name_kh: "ស្រុកបទុមស្ករ" },
    { code: "1303", province_code: "13", name_en: "Kiri Sakor",     name_kh: "ស្រុកគិរីស្ករ" },
    { code: "1304", province_code: "13", name_en: "Mondol Seima",   name_kh: "ស្រុកមណ្ឌលសីមា" },
    { code: "1305", province_code: "13", name_en: "Srae Ambel",     name_kh: "ស្រុកស្រែអំបើល" },
    { code: "1306", province_code: "13", name_en: "Thma Bang",      name_kh: "ស្រុកថ្មបាំង" },

    // 14 - Kratie
    { code: "1401", province_code: "14", name_en: "Kratie City",      name_kh: "ក្រុងក្រចេះ" },
    { code: "1402", province_code: "14", name_en: "Chhloung",         name_kh: "ស្រុកឆ្លូង" },
    { code: "1403", province_code: "14", name_en: "Kampong Trabek",   name_kh: "ស្រុកកំពង់ត្របែក" },
    { code: "1404", province_code: "14", name_en: "Sambour",          name_kh: "ស្រុកសំបូរ" },
    { code: "1405", province_code: "14", name_en: "Snuol",            name_kh: "ស្រុកស្នួល" },

    // 15 - Mondulkiri
    { code: "1501", province_code: "15", name_en: "Sen Monorom City", name_kh: "ក្រុងសែនមនោរម្យ" },
    { code: "1502", province_code: "15", name_en: "Kaev Seima",       name_kh: "ស្រុកកែវស៊ីម៉ា" },
    { code: "1503", province_code: "15", name_en: "Koh Nhek",         name_kh: "ស្រុកកោះញែក" },
    { code: "1504", province_code: "15", name_en: "O'Reang",          name_kh: "ស្រុកអូរ៉ែង" },
    { code: "1505", province_code: "15", name_en: "Pech Chreada",     name_kh: "ស្រុកភេជ្ឆ្រាដា" },

    // 16 - Oddar Meanchey
    { code: "1601", province_code: "16", name_en: "Samraong City",      name_kh: "ក្រុងសំរោង" },
    { code: "1602", province_code: "16", name_en: "Anlong Veng",        name_kh: "ស្រុកអន្លង់វែង" },
    { code: "1603", province_code: "16", name_en: "Banteay Ampil",      name_kh: "ស្រុកបន្ទាយអំពិល" },
    { code: "1604", province_code: "16", name_en: "Chong Kal",          name_kh: "ស្រុកជោងកាល" },
    { code: "1605", province_code: "16", name_en: "Trapeang Prasat",    name_kh: "ស្រុកត្រពាំងប្រាសាទ" },

    // 17 - Pailin
    { code: "1701", province_code: "17", name_en: "Pailin City", name_kh: "ក្រុងប៉ៃលិន" },
    { code: "1702", province_code: "17", name_en: "Sala Krau",   name_kh: "ស្រុកសាលាក្រៅ" },

    // 18 - Preah Vihear
    { code: "1801", province_code: "18", name_en: "Tbeng Meanchey City", name_kh: "ក្រុងត្បែងមានជ័យ" },
    { code: "1802", province_code: "18", name_en: "Chey Saen",           name_kh: "ស្រុកជ័យសែន" },
    { code: "1803", province_code: "18", name_en: "Chhaeb",              name_kh: "ស្រុកឆែប" },
    { code: "1804", province_code: "18", name_en: "Kulen",               name_kh: "ស្រុកគូលែន" },
    { code: "1805", province_code: "18", name_en: "Rovieng",             name_kh: "ស្រុករ៉ូវៀង" },
    { code: "1806", province_code: "18", name_en: "Sangkom Thmei",       name_kh: "ស្រុកសង្គមថ្មី" },

    // 19 - Pursat
    { code: "1901", province_code: "19", name_en: "Pursat City",      name_kh: "ក្រុងពោធិ៍សាត់" },
    { code: "1902", province_code: "19", name_en: "Bakan",            name_kh: "ស្រុកបាកាន" },
    { code: "1903", province_code: "19", name_en: "Kandieng",         name_kh: "ស្រុកកំឌៀង" },
    { code: "1904", province_code: "19", name_en: "Krakor",           name_kh: "ស្រុកក្រគរ" },
    { code: "1905", province_code: "19", name_en: "Phnom Kravanh",    name_kh: "ស្រុកភ្នំក្រវាញ" },
    { code: "1906", province_code: "19", name_en: "Veal Veng",        name_kh: "ស្រុកវាលវែង" },

    // 20 - Ratanakiri
    { code: "2001", province_code: "20", name_en: "Ban Lung City", name_kh: "ក្រុងបានលុង" },
    { code: "2002", province_code: "20", name_en: "Andong Meas",   name_kh: "ស្រុកអណ្ដូងមាស" },
    { code: "2003", province_code: "20", name_en: "Bar Kaev",      name_kh: "ស្រុកបរកែវ" },
    { code: "2004", province_code: "20", name_en: "Koun Mom",      name_kh: "ស្រុកកូនម៉ម" },
    { code: "2005", province_code: "20", name_en: "Lumphat",       name_kh: "ស្រុកលំផាត់" },
    { code: "2006", province_code: "20", name_en: "O'Chum",        name_kh: "ស្រុកអូជុំ" },
    { code: "2007", province_code: "20", name_en: "O'Yadav",       name_kh: "ស្រុកអូយ៉ាដ" },
    { code: "2008", province_code: "20", name_en: "Veun Sai",      name_kh: "ស្រុកវើនសៃ" },

    // 21 - Stung Treng
    { code: "2101", province_code: "21", name_en: "Stung Treng City", name_kh: "ក្រុងស្ទឹងត្រែង" },
    { code: "2102", province_code: "21", name_en: "Sesan",            name_kh: "ស្រុកសេសាន" },
    { code: "2103", province_code: "21", name_en: "Siem Bouk",        name_kh: "ស្រុកសៀមបូក" },
    { code: "2104", province_code: "21", name_en: "Siem Pang",        name_kh: "ស្រុកសៀមប៉ាង" },
    { code: "2105", province_code: "21", name_en: "Thala Barivat",    name_kh: "ស្រុកថ្លាបរិវ៉ាត" },

    // 22 - Svay Rieng
    { code: "2201", province_code: "22", name_en: "Svay Rieng City", name_kh: "ក្រុងស្វាយរៀង" },
    { code: "2202", province_code: "22", name_en: "Chantrea",        name_kh: "ស្រុកចន្ទ្រា" },
    { code: "2203", province_code: "22", name_en: "Kampong Rou",     name_kh: "ស្រុកកំពង់រោ" },
    { code: "2204", province_code: "22", name_en: "Romeas Hek",      name_kh: "ស្រុករំាសហែក" },
    { code: "2205", province_code: "22", name_en: "Svay Chrum",      name_kh: "ស្រុកស្វាយជ្រំ" },
    { code: "2206", province_code: "22", name_en: "Svay Teab",       name_kh: "ស្រុកស្វាយទាប" },

    // 23 - Takeo
    { code: "2301", province_code: "23", name_en: "Doun Kaev City", name_kh: "ក្រុងដូនកែវ" },
    { code: "2302", province_code: "23", name_en: "Angkor Borei",   name_kh: "ស្រុកអង្គរបូរី" },
    { code: "2303", province_code: "23", name_en: "Bati",           name_kh: "ស្រុកបាទី" },
    { code: "2304", province_code: "23", name_en: "Kiri Vong",      name_kh: "ស្រុកគិរីវង" },
    { code: "2305", province_code: "23", name_en: "Prey Kabbas",    name_kh: "ស្រុកព្រៃកប្បាស" },
    { code: "2306", province_code: "23", name_en: "Samraong",       name_kh: "ស្រុកសំរោង" },
    { code: "2307", province_code: "23", name_en: "Treang",         name_kh: "ស្រុកទ្រាំង" },
    { code: "2308", province_code: "23", name_en: "Kaoh Andaet",    name_kh: "ស្រុកកោះអណ្ដែត" },

    // 24 - Tboung Khmum
    { code: "2401", province_code: "24", name_en: "Suong City",      name_kh: "ក្រុងសួង" },
    { code: "2402", province_code: "24", name_en: "Dambae",          name_kh: "ស្រុកដំបែ" },
    { code: "2403", province_code: "24", name_en: "Kroch Chhmar",    name_kh: "ស្រុកក្រូចឆ្មារ" },
    { code: "2404", province_code: "24", name_en: "Memot",           name_kh: "ស្រុកមេមត" },
    { code: "2405", province_code: "24", name_en: "Ponhea Kraek",    name_kh: "ស្រុកពញាក្រែក" },
    { code: "2406", province_code: "24", name_en: "Tboung Khmum",    name_kh: "ស្រុកត្បូងឃ្មុំ" },

    // 25 - Prey Veng
    { code: "2501", province_code: "25", name_en: "Prey Veng City",  name_kh: "ក្រុងព្រៃវែង" },
    { code: "2502", province_code: "25", name_en: "Ba Phnum",        name_kh: "ស្រុកបាភ្នំ" },
    { code: "2503", province_code: "25", name_en: "Kamchay Mear",    name_kh: "ស្រុកកំចាយមារ" },
    { code: "2504", province_code: "25", name_en: "Mesang",          name_kh: "ស្រុកមេសាង" },
    { code: "2505", province_code: "25", name_en: "Peam Chor",       name_kh: "ស្រុកភាំចរ" },
    { code: "2506", province_code: "25", name_en: "Pea Reang",       name_kh: "ស្រុកពាររាំង" },
    { code: "2507", province_code: "25", name_en: "Svay Antor",      name_kh: "ស្រុកស្វាយអន្ទរ" },
  ];

  await new Promise((resolve) => setTimeout(resolve, 200));
  return districts.filter((d) => d.province_code === query);
});
