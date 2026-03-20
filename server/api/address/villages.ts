export default defineEventHandler(async (event) => {
  const query = getQuery(event).commune_code as string;

  if (!query || query.length < 2) return [];

  const villages = [
    // Phnom Penh → Doun Penh → Phsar Kandal I (010101)
    { code: "01010101", commune_code: "010101", name_en: "Phsar Kandal Village 1",  name_kh: "ភូមិផ្សារកណ្ដាលទី១" },
    { code: "01010102", commune_code: "010101", name_en: "Phsar Kandal Village 2",  name_kh: "ភូមិផ្សារកណ្ដាលទី២" },
    { code: "01010103", commune_code: "010101", name_en: "Phsar Kandal Village 3",  name_kh: "ភូមិផ្សារកណ្ដាលទី៣" },

    // Phnom Penh → Doun Penh → Phsar Kandal II (010102)
    { code: "01010201", commune_code: "010102", name_en: "Phsar Thom Village 1",    name_kh: "ភូមិផ្សារធំទី១" },
    { code: "01010202", commune_code: "010102", name_en: "Phsar Thom Village 2",    name_kh: "ភូមិផ្សារធំទី២" },

    // Phnom Penh → Doun Penh → Phsar Chas (010103)
    { code: "01010301", commune_code: "010103", name_en: "Phsar Chas Village 1",    name_kh: "ភូមិផ្សារចាស់ទី១" },
    { code: "01010302", commune_code: "010103", name_en: "Phsar Chas Village 2",    name_kh: "ភូមិផ្សារចាស់ទី២" },

    // Phnom Penh → Doun Penh → Phsar Thmei I (010104)
    { code: "01010401", commune_code: "010104", name_en: "Central Market Village 1",name_kh: "ភូមិផ្សារថ្មីទី១" },
    { code: "01010402", commune_code: "010104", name_en: "Central Market Village 2",name_kh: "ភូមិផ្សារថ្មីទី២" },

    // Phnom Penh → Doun Penh → Voat Phnum (010107)
    { code: "01010701", commune_code: "010107", name_en: "Voat Phnum Village 1",    name_kh: "ភូមិវត្តភ្នំទី១" },
    { code: "01010702", commune_code: "010107", name_en: "Voat Phnum Village 2",    name_kh: "ភូមិវត្តភ្នំទី២" },

    // Phnom Penh → Chamkar Mon → Tonle Bassac (010201)
    { code: "01020101", commune_code: "010201", name_en: "Tonle Bassac Village 1",  name_kh: "ភូមិទន្លេបាសាក់ទី១" },
    { code: "01020102", commune_code: "010201", name_en: "Tonle Bassac Village 2",  name_kh: "ភូមិទន្លេបាសាក់ទី២" },
    { code: "01020103", commune_code: "010201", name_en: "Tonle Bassac Village 3",  name_kh: "ភូមិទន្លេបាសាក់ទី៣" },

    // Phnom Penh → Chamkar Mon → BKK I (010202)
    { code: "01020201", commune_code: "010202", name_en: "BKK I Village 1",         name_kh: "ភូមិបឹងកេងកងទី១" },
    { code: "01020202", commune_code: "010202", name_en: "BKK I Village 2",         name_kh: "ភូមិបឹងកេងកងទី២" },

    // Phnom Penh → Chamkar Mon → BKK II (010203)
    { code: "01020301", commune_code: "010203", name_en: "BKK II Village 1",        name_kh: "ភូមិBKKទី២-ភូមិ១" },
    { code: "01020302", commune_code: "010203", name_en: "BKK II Village 2",        name_kh: "ភូមិBKKទី២-ភូមិ២" },

    // Phnom Penh → Chroy Changvar → Chroy Changvar (010301)
    { code: "01030101", commune_code: "010301", name_en: "Chroy Changvar Village 1",name_kh: "ភូមិជ្រោយចង្វារទី១" },
    { code: "01030102", commune_code: "010301", name_en: "Chroy Changvar Village 2",name_kh: "ភូមិជ្រោយចង្វារទី២" },
    { code: "01030103", commune_code: "010301", name_en: "Chroy Changvar Village 3",name_kh: "ភូមិជ្រោយចង្វារទី៣" },

    // Phnom Penh → Toul Kork → Toul Svay Prey I (010401)
    { code: "01040101", commune_code: "010401", name_en: "Toul Svay Prey Village 1",name_kh: "ភូមិទួលស្វាយព្រៃទី១" },
    { code: "01040102", commune_code: "010401", name_en: "Toul Svay Prey Village 2",name_kh: "ភូមិទួលស្វាយព្រៃទី២" },

    // Phnom Penh → Sen Sok → Phnom Penh Thmey (010501)
    { code: "01050101", commune_code: "010501", name_en: "PP Thmey Village 1",      name_kh: "ភូមិភ្នំពេញថ្មីទី១" },
    { code: "01050102", commune_code: "010501", name_en: "PP Thmey Village 2",      name_kh: "ភូមិភ្នំពេញថ្មីទី២" },
    { code: "01050103", commune_code: "010501", name_en: "PP Thmey Village 3",      name_kh: "ភូមិភ្នំពេញថ្មីទី៣" },

    // Phnom Penh → Sen Sok → Tuol Sangke (010502)
    { code: "01050201", commune_code: "010502", name_en: "Tuol Sangke Village 1",   name_kh: "ភូមិទួលសង្កែទី១" },
    { code: "01050202", commune_code: "010502", name_en: "Tuol Sangke Village 2",   name_kh: "ភូមិទួលសង្កែទី២" },

    // Phnom Penh → Mean Chey → Chak Angrae Kraom (010601)
    { code: "01060101", commune_code: "010601", name_en: "Chak Angrae Village 1",   name_kh: "ភូមិចាក់អង្រែទី១" },
    { code: "01060102", commune_code: "010601", name_en: "Chak Angrae Village 2",   name_kh: "ភូមិចាក់អង្រែទី២" },

    // Phnom Penh → Dangkao → Cheung Aek (011001)
    { code: "01100101", commune_code: "011001", name_en: "Cheung Aek Village 1",    name_kh: "ភូមិជើងឯកទី១" },
    { code: "01100102", commune_code: "011001", name_en: "Cheung Aek Village 2",    name_kh: "ភូមិជើងឯកទី២" },
    { code: "01100103", commune_code: "011001", name_en: "Cheung Aek Village 3",    name_kh: "ភូមិជើងឯកទី៣" },

    // Preah Sihanouk → Sihanoukville → Buon (020101)
    { code: "02010101", commune_code: "020101", name_en: "Buon Village 1",          name_kh: "ភូមិបួនទី១" },
    { code: "02010102", commune_code: "020101", name_en: "Buon Village 2",          name_kh: "ភូមិបួនទី២" },

    // Preah Sihanouk → Sihanoukville → Pir (020102)
    { code: "02010201", commune_code: "020102", name_en: "Pir Village 1",           name_kh: "ភូមិពីរទី១" },
    { code: "02010202", commune_code: "020102", name_en: "Pir Village 2",           name_kh: "ភូមិពីរទី២" },

    // Preah Sihanouk → Sihanoukville → Mittapheap (020103)
    { code: "02010301", commune_code: "020103", name_en: "Mittapheap Village 1",    name_kh: "ភូមិមិត្តភាពទី១" },
    { code: "02010302", commune_code: "020103", name_en: "Mittapheap Village 2",    name_kh: "ភូមិមិត្តភាពទី២" },

    // Kampot → Kampot City → Kampong Bay (030101)
    { code: "03010101", commune_code: "030101", name_en: "Kampong Bay Village 1",   name_kh: "ភូមិកំពង់បាយទី១" },
    { code: "03010102", commune_code: "030101", name_en: "Kampong Bay Village 2",   name_kh: "ភូមិកំពង់បាយទី២" },
    { code: "03010103", commune_code: "030101", name_en: "Kampong Bay Village 3",   name_kh: "ភូមិកំពង់បាយទី៣" },

    // Kampot → Kampot City → Andoung Khmer (030102)
    { code: "03010201", commune_code: "030102", name_en: "Andoung Khmer Village 1", name_kh: "ភូមិអណ្ដូងខ្មែរទី១" },
    { code: "03010202", commune_code: "030102", name_en: "Andoung Khmer Village 2", name_kh: "ភូមិអណ្ដូងខ្មែរទី២" },

    // Siem Reap → Siem Reap City → Svay Dangkum (040101)
    { code: "04010101", commune_code: "040101", name_en: "Svay Dangkum Village 1",  name_kh: "ភូមិស្វាយដង្គំទី១" },
    { code: "04010102", commune_code: "040101", name_en: "Svay Dangkum Village 2",  name_kh: "ភូមិស្វាយដង្គំទី២" },
    { code: "04010103", commune_code: "040101", name_en: "Svay Dangkum Village 3",  name_kh: "ភូមិស្វាយដង្គំទី៣" },

    // Siem Reap → Siem Reap City → Sala Kamreuk (040102)
    { code: "04010201", commune_code: "040102", name_en: "Sala Kamreuk Village 1",  name_kh: "ភូmiសាលាកំរើកទី១" },
    { code: "04010202", commune_code: "040102", name_en: "Sala Kamreuk Village 2",  name_kh: "ភូmiសាលាកំរើកទី២" },

    // Siem Reap → Siem Reap City → Kouk Chak (040103)
    { code: "04010301", commune_code: "040103", name_en: "Kouk Chak Village 1",     name_kh: "ភូmiគោកចកទី១" },
    { code: "04010302", commune_code: "040103", name_en: "Kouk Chak Village 2",     name_kh: "ភូmiគោកចកទី២" },

    // Siem Reap → Puok → Puok (040201)
    { code: "04020101", commune_code: "040201", name_en: "Puok Village 1",          name_kh: "ភូmiពួកទី១" },
    { code: "04020102", commune_code: "040201", name_en: "Puok Village 2",          name_kh: "ភូmiពួកទី២" },

    // Battambang → Battambang City → Svay Por (050101)
    { code: "05010101", commune_code: "050101", name_en: "Svay Por Village 1",      name_kh: "ភូmiស្វាយពរទី១" },
    { code: "05010102", commune_code: "050101", name_en: "Svay Por Village 2",      name_kh: "ភូmiស្វាយពរទី២" },
    { code: "05010103", commune_code: "050101", name_en: "Svay Por Village 3",      name_kh: "ភូmiស្វាយពរទី៣" },

    // Battambang → Battambang City → Phnom Sampov (050102)
    { code: "05010201", commune_code: "050102", name_en: "Phnom Sampov Village 1",  name_kh: "ភូmiភ្នំសំពៅទី១" },
    { code: "05010202", commune_code: "050102", name_en: "Phnom Sampov Village 2",  name_kh: "ភូmiភ្នំសំពៅទី២" },

    // Battambang → Battambang City → Ratanak (050103)
    { code: "05010301", commune_code: "050103", name_en: "Ratanak Village 1",       name_kh: "ភូmiraton Village 1" },
    { code: "05010302", commune_code: "050103", name_en: "Ratanak Village 2",       name_kh: "ភូmiraton Village 2" },

    // Banteay Meanchey → Serei Saophoan → Serei Saophoan (060101)
    { code: "06010101", commune_code: "060101", name_en: "Serei Saophoan Village 1",name_kh: "ភូmiserei Village 1" },
    { code: "06010102", commune_code: "060101", name_en: "Serei Saophoan Village 2",name_kh: "ភូmiserei Village 2" },

    // Kampong Cham → Kampong Cham City → Kampong Cham (070101)
    { code: "07010101", commune_code: "070101", name_en: "Kampong Cham Village 1",  name_kh: "ភូmikampong cham 1" },
    { code: "07010102", commune_code: "070101", name_en: "Kampong Cham Village 2",  name_kh: "ភូmikampong cham 2" },
    { code: "07010103", commune_code: "070101", name_en: "Kampong Cham Village 3",  name_kh: "ភូmikampong cham 3" },

    // Kampong Chhnang → Kampong Chhnang City → Kampong Chhnang (080101)
    { code: "08010101", commune_code: "080101", name_en: "Chhnang Village 1",       name_kh: "ភូmichhnang 1" },
    { code: "08010102", commune_code: "080101", name_en: "Chhnang Village 2",       name_kh: "ភូmichhnang 2" },

    // Kampong Speu → Chbar Mon → Chbar Mon (090101)
    { code: "09010101", commune_code: "090101", name_en: "Chbar Mon Village 1",     name_kh: "ភូmiច្បារមនទី១" },
    { code: "09010102", commune_code: "090101", name_en: "Chbar Mon Village 2",     name_kh: "ភូmiច្បារមនទី២" },
    { code: "09010103", commune_code: "090101", name_en: "Chbar Mon Village 3",     name_kh: "ភូmiច្បារមនទី៣" },

    // Kampong Thom → Stueng Saen → Kampong Thom (100101)
    { code: "10010101", commune_code: "100101", name_en: "Kampong Thom Village 1",  name_kh: "ភូmikampong thom 1" },
    { code: "10010102", commune_code: "100101", name_en: "Kampong Thom Village 2",  name_kh: "ភូmikampong thom 2" },

    // Kandal → Takhmao → Takhmao (110101)
    { code: "11010101", commune_code: "110101", name_en: "Takhmao Village 1",       name_kh: "ភូmiតាខ្មៅទី១" },
    { code: "11010102", commune_code: "110101", name_en: "Takhmao Village 2",       name_kh: "ភូmiតាខ្មៅទី២" },
    { code: "11010103", commune_code: "110101", name_en: "Takhmao Village 3",       name_kh: "ភូmiតាខ្មៅទី៣" },

    // Kandal → Takhmao → Prek Ho (110102)
    { code: "11010201", commune_code: "110102", name_en: "Prek Ho Village 1",       name_kh: "ភូmiPrek Ho 1" },
    { code: "11010202", commune_code: "110102", name_en: "Prek Ho Village 2",       name_kh: "ភូmiPrek Ho 2" },

    // Kandal → Angk Snuol → Angk Snuol (110201)
    { code: "11020101", commune_code: "110201", name_en: "Angk Snuol Village 1",    name_kh: "ភូmiAngk Snuol 1" },
    { code: "11020102", commune_code: "110201", name_en: "Angk Snuol Village 2",    name_kh: "ភូmiAngk Snuol 2" },

    // Kandal → Kien Svay → Kien Svay (110301)
    { code: "11030101", commune_code: "110301", name_en: "Kien Svay Village 1",     name_kh: "ភូmiKien Svay 1" },
    { code: "11030102", commune_code: "110301", name_en: "Kien Svay Village 2",     name_kh: "ភូmiKien Svay 2" },

    // Kep → Kep City → Kep (120101)
    { code: "12010101", commune_code: "120101", name_en: "Kep Village 1",           name_kh: "ភូmiKep 1" },
    { code: "12010102", commune_code: "120101", name_en: "Kep Village 2",           name_kh: "ភូmiKep 2" },

    // Koh Kong → Koh Kong City → Koh Kong (130101)
    { code: "13010101", commune_code: "130101", name_en: "Koh Kong Village 1",      name_kh: "ភូmiKoh Kong 1" },
    { code: "13010102", commune_code: "130101", name_en: "Koh Kong Village 2",      name_kh: "ភូmiKoh Kong 2" },

    // Kratie → Kratie City → Kratie (140101)
    { code: "14010101", commune_code: "140101", name_en: "Kratie Village 1",        name_kh: "ភូmiKratie 1" },
    { code: "14010102", commune_code: "140101", name_en: "Kratie Village 2",        name_kh: "ភូmiKratie 2" },
    { code: "14010103", commune_code: "140101", name_en: "Kratie Village 3",        name_kh: "ភូmiKratie 3" },

    // Mondulkiri → Sen Monorom → Sen Monorom (150101)
    { code: "15010101", commune_code: "150101", name_en: "Sen Monorom Village 1",   name_kh: "ភូmiSen Monorom 1" },
    { code: "15010102", commune_code: "150101", name_en: "Sen Monorom Village 2",   name_kh: "ភូmiSen Monorom 2" },

    // Oddar Meanchey → Samraong City → Samraong (160101)
    { code: "16010101", commune_code: "160101", name_en: "Samraong Village 1",      name_kh: "ភូmiSamraong 1" },
    { code: "16010102", commune_code: "160101", name_en: "Samraong Village 2",      name_kh: "ភូmiSamraong 2" },

    // Pailin → Pailin City → Pailin (170101)
    { code: "17010101", commune_code: "170101", name_en: "Pailin Village 1",        name_kh: "ភូmiPailin 1" },
    { code: "17010102", commune_code: "170101", name_en: "Pailin Village 2",        name_kh: "ភូmiPailin 2" },

    // Preah Vihear → Tbeng Meanchey → Kampong Pranak (180101)
    { code: "18010101", commune_code: "180101", name_en: "Pranak Village 1",        name_kh: "ភូmiPranak 1" },
    { code: "18010102", commune_code: "180101", name_en: "Pranak Village 2",        name_kh: "ភូmiPranak 2" },

    // Pursat → Pursat City → Pursat (190101)
    { code: "19010101", commune_code: "190101", name_en: "Pursat Village 1",        name_kh: "ភូmiPursat 1" },
    { code: "19010102", commune_code: "190101", name_en: "Pursat Village 2",        name_kh: "ភូmiPursat 2" },
    { code: "19010103", commune_code: "190101", name_en: "Pursat Village 3",        name_kh: "ភូmiPursat 3" },

    // Ratanakiri → Ban Lung City → Labansiek (200101)
    { code: "20010101", commune_code: "200101", name_en: "Labansiek Village 1",     name_kh: "ភូmiLabansiek 1" },
    { code: "20010102", commune_code: "200101", name_en: "Labansiek Village 2",     name_kh: "ភូmiLabansiek 2" },

    // Stung Treng → Stung Treng City → Stung Treng (210101)
    { code: "21010101", commune_code: "210101", name_en: "Stung Treng Village 1",   name_kh: "ភូmiStung Treng 1" },
    { code: "21010102", commune_code: "210101", name_en: "Stung Treng Village 2",   name_kh: "ភូmiStung Treng 2" },

    // Svay Rieng → Svay Rieng City → Svay Rieng (220101)
    { code: "22010101", commune_code: "220101", name_en: "Svay Rieng Village 1",    name_kh: "ភូmiSvay Rieng 1" },
    { code: "22010102", commune_code: "220101", name_en: "Svay Rieng Village 2",    name_kh: "ភូmiSvay Rieng 2" },

    // Takeo → Doun Kaev City → Doun Kaev (230101)
    { code: "23010101", commune_code: "230101", name_en: "Doun Kaev Village 1",     name_kh: "ភូmiDoun Kaev 1" },
    { code: "23010102", commune_code: "230101", name_en: "Doun Kaev Village 2",     name_kh: "ភូmiDoun Kaev 2" },
    { code: "23010103", commune_code: "230101", name_en: "Doun Kaev Village 3",     name_kh: "ភូmiDoun Kaev 3" },

    // Takeo → Bati → Bati (230301)
    { code: "23030101", commune_code: "230301", name_en: "Bati Village 1",          name_kh: "ភូmiBati 1" },
    { code: "23030102", commune_code: "230301", name_en: "Bati Village 2",          name_kh: "ភូmiBati 2" },

    // Tboung Khmum → Suong City → Suong (240101)
    { code: "24010101", commune_code: "240101", name_en: "Suong Village 1",         name_kh: "ភូmiSuong 1" },
    { code: "24010102", commune_code: "240101", name_en: "Suong Village 2",         name_kh: "ភូmiSuong 2" },

    // Prey Veng → Prey Veng City → Prey Veng (250101)
    { code: "25010101", commune_code: "250101", name_en: "Prey Veng Village 1",     name_kh: "ភូmiPrey Veng 1" },
    { code: "25010102", commune_code: "250101", name_en: "Prey Veng Village 2",     name_kh: "ភូmiPrey Veng 2" },
    { code: "25010103", commune_code: "250101", name_en: "Prey Veng Village 3",     name_kh: "ភូmiPrey Veng 3" },

    // Prey Veng → Ba Phnum → Ba Phnum (250201)
    { code: "25020101", commune_code: "250201", name_en: "Ba Phnum Village 1",      name_kh: "ភូmiBa Phnum 1" },
    { code: "25020102", commune_code: "250201", name_en: "Ba Phnum Village 2",      name_kh: "ភូmiBa Phnum 2" },
  ];

  await new Promise((resolve) => setTimeout(resolve, 200));
  return villages.filter((v) => v.commune_code === query);
});
