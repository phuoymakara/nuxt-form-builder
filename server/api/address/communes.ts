export default defineEventHandler(async (event) => {
  const query = getQuery(event).district_code as string;

  if (!query || query.length < 2) return [];

  const communes = [
    // 01 - Phnom Penh → Doun Penh (0101)
    { code: "010101", district_code: "0101", name_en: "Phsar Kandal I",      name_kh: "សង្កាត់ផ្សារកណ្ដាលទី១" },
    { code: "010102", district_code: "0101", name_en: "Phsar Kandal II",     name_kh: "សង្កាត់ផ្សារកណ្ដាលទី២" },
    { code: "010103", district_code: "0101", name_en: "Phsar Chas",          name_kh: "សង្កាត់ផ្សារចាស់" },
    { code: "010104", district_code: "0101", name_en: "Phsar Thmei I",       name_kh: "សង្កាត់ផ្សារថ្មីទី១" },
    { code: "010105", district_code: "0101", name_en: "Phsar Thmei II",      name_kh: "សង្កាត់ផ្សារថ្មីទី២" },
    { code: "010106", district_code: "0101", name_en: "Phsar Thmei III",     name_kh: "សង្កាត់ផ្សារថ្មីទី៣" },
    { code: "010107", district_code: "0101", name_en: "Voat Phnum",          name_kh: "សង្កាត់វត្តភ្នំ" },

    // 01 - Phnom Penh → Chamkar Mon (0102)
    { code: "010201", district_code: "0102", name_en: "Tonle Bassac",        name_kh: "សង្កាត់ទន្លេបាសាក់" },
    { code: "010202", district_code: "0102", name_en: "Boeung Keng Kang I",  name_kh: "សង្កាត់បឹងកេងកងទី១" },
    { code: "010203", district_code: "0102", name_en: "Boeung Keng Kang II", name_kh: "សង្កាត់បឹងកេងកងទី២" },
    { code: "010204", district_code: "0102", name_en: "Boeung Keng Kang III",name_kh: "សង្កាត់បឹងកេងកងទី៣" },
    { code: "010205", district_code: "0102", name_en: "Olympic",             name_kh: "សង្កាត់អូឡាំពិក" },
    { code: "010206", district_code: "0102", name_en: "Tumnob Tuek",         name_kh: "សង្កាត់តំបន់ទឹក" },

    // 01 - Phnom Penh → Chroy Changvar (0103)
    { code: "010301", district_code: "0103", name_en: "Chroy Changvar",      name_kh: "សង្កាត់ជ្រោយចង្វារ" },
    { code: "010302", district_code: "0103", name_en: "Prek Leap",           name_kh: "សង្កាត់ព្រែកលៀប" },
    { code: "010303", district_code: "0103", name_en: "Prek Ta Sek",         name_kh: "សង្កាត់ព្រែកតាសែក" },

    // 01 - Phnom Penh → Toul Kork (0104)
    { code: "010401", district_code: "0104", name_en: "Toul Svay Prey I",    name_kh: "សង្កាត់ទួលស្វាយព្រៃទី១" },
    { code: "010402", district_code: "0104", name_en: "Toul Svay Prey II",   name_kh: "សង្កាត់ទួលស្វាយព្រៃទី២" },
    { code: "010403", district_code: "0104", name_en: "Tumnob Teuk",         name_kh: "សង្កាត់តំបន់ទឹក" },
    { code: "010404", district_code: "0104", name_en: "Boeng Kok I",         name_kh: "សង្កាត់បឹងកក់ទី១" },
    { code: "010405", district_code: "0104", name_en: "Boeng Kok II",        name_kh: "សង្កាត់បឹងកក់ទី២" },

    // 01 - Phnom Penh → Sen Sok (0105)
    { code: "010501", district_code: "0105", name_en: "Phnom Penh Thmey",    name_kh: "សង្កាត់ភ្នំពេញថ្មី" },
    { code: "010502", district_code: "0105", name_en: "Tuol Sangke",         name_kh: "សង្កាត់ទួលសង្កែ" },
    { code: "010503", district_code: "0105", name_en: "Khmuonh",             name_kh: "សង្កាត់ខ្មួញ" },
    { code: "010504", district_code: "0105", name_en: "Km 6",                name_kh: "សង្កាត់គីឡូម៉ែតទី៦" },

    // 01 - Phnom Penh → Mean Chey (0106)
    { code: "010601", district_code: "0106", name_en: "Chak Angrae Kraom",   name_kh: "សង្កាត់ចាក់អង្រែក្រោម" },
    { code: "010602", district_code: "0106", name_en: "Chak Angrae Leu",     name_kh: "សង្កាត់ចាក់អង្រែលើ" },
    { code: "010603", district_code: "0106", name_en: "Stueng Mean Chey",    name_kh: "សង្កាត់ស្ទឹងមានជ័យ" },

    // 01 - Phnom Penh → Russey Keo (0107)
    { code: "010701", district_code: "0107", name_en: "Kilometre 6",         name_kh: "សង្កាត់គីឡូម៉ែតទី៦" },
    { code: "010702", district_code: "0107", name_en: "Russey Keo",          name_kh: "សង្កាត់រស្សីកែវ" },
    { code: "010703", district_code: "0107", name_en: "Tuol Sangke",         name_kh: "សង្កាត់ទួលសង្កែ" },

    // 01 - Phnom Penh → Por Sen Chey (0108)
    { code: "010801", district_code: "0108", name_en: "Kakab I",             name_kh: "សង្កាត់កាកាបទី១" },
    { code: "010802", district_code: "0108", name_en: "Kakab II",            name_kh: "សង្កាត់កាកាបទី២" },
    { code: "010803", district_code: "0108", name_en: "Chaom Chau I",        name_kh: "សង្កាត់ចោមចៅទី១" },
    { code: "010804", district_code: "0108", name_en: "Chaom Chau II",       name_kh: "សង្កាត់ចោមចៅទី២" },

    // 01 - Phnom Penh → Chbar Ampov (0109)
    { code: "010901", district_code: "0109", name_en: "Chbar Ampov I",       name_kh: "សង្កាត់ច្បារអំពៅទី១" },
    { code: "010902", district_code: "0109", name_en: "Chbar Ampov II",      name_kh: "សង្កាត់ច្បារអំពៅទី២" },
    { code: "010903", district_code: "0109", name_en: "Nirouth",             name_kh: "សង្កាត់និរោត" },

    // 01 - Phnom Penh → Dangkao (0110)
    { code: "011001", district_code: "0110", name_en: "Cheung Aek",          name_kh: "ឃុំជើងឯក" },
    { code: "011002", district_code: "0110", name_en: "Prey Sa",             name_kh: "ឃុំព្រៃស" },
    { code: "011003", district_code: "0110", name_en: "Krang Thnong",        name_kh: "ឃុំក្រាំងធ្នង់" },

    // 01 - Phnom Penh → Prek Pnov (0111)
    { code: "011101", district_code: "0111", name_en: "Prek Pnov",           name_kh: "ឃុំព្រែកព្នៅ" },
    { code: "011102", district_code: "0111", name_en: "Anlong Vil",          name_kh: "ឃុំអន្លង់វិល" },

    // 01 - Phnom Penh → Kamboul (0112)
    { code: "011201", district_code: "0112", name_en: "Kamboul",             name_kh: "ឃុំកំបូល" },
    { code: "011202", district_code: "0112", name_en: "Prey Khpos",          name_kh: "ឃុំព្រៃខ្ពស់" },

    // 02 - Preah Sihanouk → Sihanoukville (0201)
    { code: "020101", district_code: "0201", name_en: "Buon",                name_kh: "សង្កាត់បួន" },
    { code: "020102", district_code: "0201", name_en: "Pir",                 name_kh: "សង្កាត់ពីរ" },
    { code: "020103", district_code: "0201", name_en: "Mittapheap",          name_kh: "សង្កាត់មិត្តភាព" },
    { code: "020104", district_code: "0201", name_en: "Muoy",                name_kh: "សង្កាត់មួយ" },
    { code: "020105", district_code: "0201", name_en: "Bei",                 name_kh: "សង្កាត់បី" },

    // 02 - Preah Sihanouk → Prey Nob (0202)
    { code: "020201", district_code: "0202", name_en: "Prey Nob",            name_kh: "ឃុំព្រៃនប់" },
    { code: "020202", district_code: "0202", name_en: "Andoung Thmey",       name_kh: "ឃុំអណ្ដូងថ្មី" },
    { code: "020203", district_code: "0202", name_en: "Cham Pa",             name_kh: "ឃុំចាំប៉ា" },

    // 02 - Preah Sihanouk → Stueng Hav (0203)
    { code: "020301", district_code: "0203", name_en: "Stueng Hav",          name_kh: "ឃុំស្ទឹងហាវ" },
    { code: "020302", district_code: "0203", name_en: "Ou Oknha Heng",       name_kh: "ឃuំអូអ្នកហ្ស" },

    // 02 - Preah Sihanouk → Kampong Seila (0204)
    { code: "020401", district_code: "0204", name_en: "Kampong Seila",       name_kh: "ឃuំកំពង់សីlា" },
    { code: "020402", district_code: "0204", name_en: "Andoung Teuk",        name_kh: "ឃuំអណ្ដូងទឹក" },

    // 03 - Kampot → Kampot City (0301)
    { code: "030101", district_code: "0301", name_en: "Kampong Bay",         name_kh: "សង្កាត់កំពង់បាយ" },
    { code: "030102", district_code: "0301", name_en: "Andoung Khmer",       name_kh: "សង្កាត់អណ្ដូងខ្មែរ" },
    { code: "030103", district_code: "0301", name_en: "Kampong Kandal",      name_kh: "សង្កាត់កំពង់កណ្ដាល" },
    { code: "030104", district_code: "0301", name_en: "Prey Thom",           name_kh: "ឃuំព្រៃធំ" },

    // 03 - Kampot → Chhuk (0302)
    { code: "030201", district_code: "0302", name_en: "Chhuk",               name_kh: "ឃuំឈូក" },
    { code: "030202", district_code: "0302", name_en: "Damnak",              name_kh: "ឃuំដំណាក" },
    { code: "030203", district_code: "0302", name_en: "Ou Krabau",           name_kh: "ឃuំអូក្របៅ" },

    // 03 - Kampot → Tuek Chhou (0304)
    { code: "030401", district_code: "0304", name_en: "Tuek Chhou",          name_kh: "ឃuំទឹកឈូ" },
    { code: "030402", district_code: "0304", name_en: "Prey Khpos",          name_kh: "ឃuំព្រៃខ្ពស់" },

    // 04 - Siem Reap → Siem Reap City (0401)
    { code: "040101", district_code: "0401", name_en: "Svay Dangkum",        name_kh: "សង្កាត់ស្វាយដង្គំ" },
    { code: "040102", district_code: "0401", name_en: "Sala Kamreuk",        name_kh: "សង្កាត់សាលាកំរើក" },
    { code: "040103", district_code: "0401", name_en: "Kouk Chak",           name_kh: "សង្កាត់គោកចក" },
    { code: "040104", district_code: "0401", name_en: "Nokor Thum",          name_kh: "ឃuំនគរធំ" },
    { code: "040105", district_code: "0401", name_en: "Slar Kram",           name_kh: "ឃuំស្លរ ក្រម" },

    // 04 - Siem Reap → Puok (0402)
    { code: "040201", district_code: "0402", name_en: "Puok",                name_kh: "ឃuំពួក" },
    { code: "040202", district_code: "0402", name_en: "Prasat",              name_kh: "ឃuំប្រាសាទ" },
    { code: "040203", district_code: "0402", name_en: "Ta Nget",             name_kh: "ឃuំតានហ្គ" },

    // 04 - Siem Reap → Prasat Bakong (0403)
    { code: "040301", district_code: "0403", name_en: "Bakong",              name_kh: "ឃuំបាគង" },
    { code: "040302", district_code: "0403", name_en: "Kdei Rungroeung",     name_kh: "ឃuំក្ដីរុងរឿង" },

    // 04 - Siem Reap → Angkor Thom (0404)
    { code: "040401", district_code: "0404", name_en: "Angkor Thom",         name_kh: "ឃuំអង្គរធំ" },
    { code: "040402", district_code: "0404", name_en: "Nokor Krau",          name_kh: "ឃuំនគរក្រៅ" },

    // 04 - Siem Reap → Banteay Srei (0405)
    { code: "040501", district_code: "0405", name_en: "Banteay Srei",        name_kh: "ឃuំបន្ទាយស្រី" },
    { code: "040502", district_code: "0405", name_en: "Khnach Romeas",       name_kh: "ឃuំឃ្នាច់រំaes" },

    // 05 - Battambang → Battambang City (0501)
    { code: "050101", district_code: "0501", name_en: "Svay Por",            name_kh: "សង្កាត់ស្វាយពរ" },
    { code: "050102", district_code: "0501", name_en: "Phnom Sampov",        name_kh: "សង្កាត់ភ្នំសំពៅ" },
    { code: "050103", district_code: "0501", name_en: "Ratanak",             name_kh: "សង្កាត់រតនៈ" },
    { code: "050104", district_code: "0501", name_en: "Kdei Tahen",          name_kh: "សង្កាត់ក្ដីតាហែន" },

    // 05 - Battambang → Moung Ruessei (0502)
    { code: "050201", district_code: "0502", name_en: "Moung",               name_kh: "ឃuំមោង" },
    { code: "050202", district_code: "0502", name_en: "Ruessei Chrum",       name_kh: "ឃuំឫស្សីជ្រំ" },

    // 05 - Battambang → Bavel (0505)
    { code: "050501", district_code: "0505", name_en: "Bavel",               name_kh: "ឃuំបាវិល" },
    { code: "050502", district_code: "0505", name_en: "Kdol",                name_kh: "ឃuំក្ដោល" },
    { code: "050503", district_code: "0505", name_en: "Koas Krala",          name_kh: "ឃuំគោះក្រឡ" },

    // 06 - Banteay Meanchey → Serei Saophoan (0601)
    { code: "060101", district_code: "0601", name_en: "Serei Saophoan",      name_kh: "សង្កាត់សិរីសោភ័ណ" },
    { code: "060102", district_code: "0601", name_en: "Ou Char",             name_kh: "សង្កាត់អូចា" },
    { code: "060103", district_code: "0601", name_en: "Reusey Keo",          name_kh: "ឃuំឫស្សីkèo" },

    // 06 - Banteay Meanchey → Mongkol Borei (0602)
    { code: "060201", district_code: "0602", name_en: "Mongkol Borei",       name_kh: "ឃuំមង្គលបូរី" },
    { code: "060202", district_code: "0602", name_en: "Prey Totaeng",        name_kh: "ឃuំព្រៃត aTaeng" },

    // 07 - Kampong Cham → Kampong Cham City (0701)
    { code: "070101", district_code: "0701", name_en: "Kampong Cham",        name_kh: "សង្កាត់កំពង់ចាម" },
    { code: "070102", district_code: "0701", name_en: "Veal Vong",           name_kh: "សង្កាត់វាលវង" },
    { code: "070103", district_code: "0701", name_en: "Sath Krachap",        name_kh: "ឃuំស ath ក្រចាប" },

    // 07 - Kampong Cham → Batheay (0702)
    { code: "070201", district_code: "0702", name_en: "Batheay",             name_kh: "ឃuំបាធាយ" },
    { code: "070202", district_code: "0702", name_en: "Kdei Char",           name_kh: "ឃuំក្ដីចារ" },

    // 08 - Kampong Chhnang → Kampong Chhnang City (0801)
    { code: "080101", district_code: "0801", name_en: "Kampong Chhnang",     name_kh: "សង្កាត់កំពង់ឆ្នាំង" },
    { code: "080102", district_code: "0801", name_en: "Kampong Tralach Leu", name_kh: "ឃuំកំពង់ t rlach leu" },
    { code: "080103", district_code: "0801", name_en: "Sambuor",             name_kh: "ឃuំសំបួរ" },

    // 08 - Kampong Chhnang → Kampong Leaeng (0803)
    { code: "080301", district_code: "0803", name_en: "Kampong Leaeng",      name_kh: "ឃuំកំពង់លែង" },
    { code: "080302", district_code: "0803", name_en: "Chrouy Changvar",     name_kh: "ឃuំជ្រោយចង្វារ" },

    // 09 - Kampong Speu → Chbar Mon City (0901)
    { code: "090101", district_code: "0901", name_en: "Chbar Mon",           name_kh: "សង្កាត់ច្បារមន" },
    { code: "090102", district_code: "0901", name_en: "Kraing Leav",         name_kh: "ឃuំក្រែងleav" },
    { code: "090103", district_code: "0901", name_en: "Rokar Thum",          name_kh: "ឃuំរការធំ" },

    // 09 - Kampong Speu → Kong Pisey (0903)
    { code: "090301", district_code: "0903", name_en: "Kong Pisey",          name_kh: "ឃuំកោងពីសី" },
    { code: "090302", district_code: "0903", name_en: "Prey Kuy",            name_kh: "ឃuំព្រៃគួ" },

    // 10 - Kampong Thom → Stueng Saen City (1001)
    { code: "100101", district_code: "1001", name_en: "Kampong Thom",        name_kh: "សង្កាត់កំពង់ធំ" },
    { code: "100102", district_code: "1001", name_en: "Sambuor",             name_kh: "ឃuំសំបួរ" },
    { code: "100103", district_code: "1001", name_en: "Kdei Dong",           name_kh: "ឃuំក្ដីដង" },

    // 10 - Kampong Thom → Baray (1002)
    { code: "100201", district_code: "1002", name_en: "Baray",               name_kh: "ឃuំបារាយណ" },
    { code: "100202", district_code: "1002", name_en: "Tbaeng",              name_kh: "ឃuំត្បែង" },

    // 11 - Kandal → Takhmao City (1101)
    { code: "110101", district_code: "1101", name_en: "Takhmao",             name_kh: "សង្កាត់តាខ្មៅ" },
    { code: "110102", district_code: "1101", name_en: "Prek Ho",             name_kh: "សង្កាត់ព្រែកហូ" },
    { code: "110103", district_code: "1101", name_en: "Prek Ruessei",        name_kh: "ឃuំព្រែកឫស្សី" },

    // 11 - Kandal → Kien Svay (1103)
    { code: "110301", district_code: "1103", name_en: "Kien Svay",           name_kh: "ឃuំkien svay" },
    { code: "110302", district_code: "1103", name_en: "Prek Ambel",          name_kh: "ឃuំprek ambel" },
    { code: "110303", district_code: "1103", name_en: "Nirouth",             name_kh: "ឃuំNirouth" },

    // 11 - Kandal → Angk Snuol (1102)
    { code: "110201", district_code: "1102", name_en: "Angk Snuol",          name_kh: "ឃuំអង្គស្នួល" },
    { code: "110202", district_code: "1102", name_en: "Ta Khmau",            name_kh: "ឃuំតាខ្មៅ" },
    { code: "110203", district_code: "1102", name_en: "Prey Kmeng",          name_kh: "ឃuំព្រែកក្មេង" },

    // 12 - Kep → Kep City (1201)
    { code: "120101", district_code: "1201", name_en: "Kep",                 name_kh: "សង្កាត់កែប" },
    { code: "120102", district_code: "1201", name_en: "Prey Thom",           name_kh: "ឃuំព្រៃធំ" },

    // 13 - Koh Kong → Koh Kong City (1301)
    { code: "130101", district_code: "1301", name_en: "Koh Kong",            name_kh: "ឃuំkoh kong" },
    { code: "130102", district_code: "1301", name_en: "Smach Mean Chey",     name_kh: "ឃuំsmach mean chey" },

    // 14 - Kratie → Kratie City (1401)
    { code: "140101", district_code: "1401", name_en: "Kratie",              name_kh: "ឃuំk r cheh" },
    { code: "140102", district_code: "1401", name_en: "Kampong Rokar",       name_kh: "ឃuំkampong rokar" },
    { code: "140103", district_code: "1401", name_en: "Preaek Prasab",       name_kh: "ឃuំpraek prasab" },

    // 14 - Kratie → Chhloung (1402)
    { code: "140201", district_code: "1402", name_en: "Chhloung",            name_kh: "ឃuំChhloung" },
    { code: "140202", district_code: "1402", name_en: "Sambour",             name_kh: "ឃuំSambour" },

    // 15 - Mondulkiri → Sen Monorom City (1501)
    { code: "150101", district_code: "1501", name_en: "Sen Monorom",         name_kh: "ឃuំSen Monorom" },
    { code: "150102", district_code: "1501", name_en: "Pou Treay",           name_kh: "ឃuំPou Treay" },

    // 16 - Oddar Meanchey → Samraong City (1601)
    { code: "160101", district_code: "1601", name_en: "Samraong",            name_kh: "ឃuំSamraong" },
    { code: "160102", district_code: "1601", name_en: "Trapeang Tav",        name_kh: "ឃuំTrapeang Tav" },

    // 16 - Oddar Meanchey → Anlong Veng (1602)
    { code: "160201", district_code: "1602", name_en: "Anlong Veng",         name_kh: "ឃuំAnlong Veng" },
    { code: "160202", district_code: "1602", name_en: "Ta Moan",             name_kh: "ឃuំTa Moan" },

    // 17 - Pailin → Pailin City (1701)
    { code: "170101", district_code: "1701", name_en: "Pailin",              name_kh: "ឃuំPailin" },
    { code: "170102", district_code: "1701", name_en: "O Tasoam",            name_kh: "ឃuំO Tasoam" },

    // 18 - Preah Vihear → Tbeng Meanchey City (1801)
    { code: "180101", district_code: "1801", name_en: "Kampong Pranak",      name_kh: "ឃuំKampong Pranak" },
    { code: "180102", district_code: "1801", name_en: "Srayov",              name_kh: "ឃuំSrayov" },

    // 19 - Pursat → Pursat City (1901)
    { code: "190101", district_code: "1901", name_en: "Pursat",              name_kh: "ឃuំPosat" },
    { code: "190102", district_code: "1901", name_en: "Ou Ta Paong",         name_kh: "ឃuំOu Ta Paong" },
    { code: "190103", district_code: "1901", name_en: "Phteah Roung",        name_kh: "ឃuំPhteah Roung" },

    // 19 - Pursat → Bakan (1902)
    { code: "190201", district_code: "1902", name_en: "Bakan",               name_kh: "ឃuំBakan" },
    { code: "190202", district_code: "1902", name_en: "Anlong Tnaot",        name_kh: "ឃuំAnlong Tnaot" },

    // 20 - Ratanakiri → Ban Lung City (2001)
    { code: "200101", district_code: "2001", name_en: "Labansiek",           name_kh: "ឃuំLabansiek" },
    { code: "200102", district_code: "2001", name_en: "Kachon",              name_kh: "ឃuំKachon" },

    // 21 - Stung Treng → Stung Treng City (2101)
    { code: "210101", district_code: "2101", name_en: "Stung Treng",         name_kh: "ឃuំStung Treng" },
    { code: "210102", district_code: "2101", name_en: "Preah Bat Choan Toch",name_kh: "ឃuំPreah Bat" },

    // 22 - Svay Rieng → Svay Rieng City (2201)
    { code: "220101", district_code: "2201", name_en: "Svay Rieng",          name_kh: "ឃuំSvay Rieng" },
    { code: "220102", district_code: "2201", name_en: "Prasaut",             name_kh: "ឃuំPrasaut" },

    // 22 - Svay Rieng → Chantrea (2202)
    { code: "220201", district_code: "2202", name_en: "Chantrea",            name_kh: "ឃuំChantrea" },
    { code: "220202", district_code: "2202", name_en: "Preah Ponlea",        name_kh: "ឃuំPreah Ponlea" },

    // 23 - Takeo → Doun Kaev City (2301)
    { code: "230101", district_code: "2301", name_en: "Doun Kaev",           name_kh: "ឃuំDoun Kaev" },
    { code: "230102", district_code: "2301", name_en: "Roka",                name_kh: "ឃuំRoka" },
    { code: "230103", district_code: "2301", name_en: "Prey Chisak",         name_kh: "ឃuំPrey Chisak" },

    // 23 - Takeo → Bati (2303)
    { code: "230301", district_code: "2303", name_en: "Bati",                name_kh: "ឃuំBati" },
    { code: "230302", district_code: "2303", name_en: "Yeang",               name_kh: "ឃuំYeang" },

    // 24 - Tboung Khmum → Suong City (2401)
    { code: "240101", district_code: "2401", name_en: "Suong",               name_kh: "ឃuំSuong" },
    { code: "240102", district_code: "2401", name_en: "Cheung Prey",         name_kh: "ឃuំCheung Prey" },

    // 24 - Tboung Khmum → Memot (2404)
    { code: "240401", district_code: "2404", name_en: "Memot",               name_kh: "ឃuំMemot" },
    { code: "240402", district_code: "2404", name_en: "Krek",                name_kh: "ឃuំKrek" },

    // 25 - Prey Veng → Prey Veng City (2501)
    { code: "250101", district_code: "2501", name_en: "Prey Veng",           name_kh: "ឃuំPrey Veng" },
    { code: "250102", district_code: "2501", name_en: "Chrey Vien",          name_kh: "ឃuំChrey Vien" },
    { code: "250103", district_code: "2501", name_en: "Peam Ro",             name_kh: "ឃuំPeam Ro" },

    // 25 - Prey Veng → Ba Phnum (2502)
    { code: "250201", district_code: "2502", name_en: "Ba Phnum",            name_kh: "ឃuំBa Phnum" },
    { code: "250202", district_code: "2502", name_en: "Kampong Leaeng",      name_kh: "ឃuំKampong Leaeng" },
  ];

  await new Promise((resolve) => setTimeout(resolve, 200));
  return communes.filter((c) => c.district_code === query);
});
