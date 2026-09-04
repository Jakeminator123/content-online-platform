// Public presentation fixtures only. Never read real customer data into this module.
const products = [
  { id: 'ieee-xplore', name: 'IEEE Xplore Digital Library', publisherId: 'ieee', type: 'Databas', description: 'Forskning inom teknik, elektronik och datavetenskap.', renewal: '2026-12-31', usage: 412380 },
  { id: 'springer-nature', name: 'Springer Nature Journals', publisherId: 'springer', type: 'Tidskrifter', description: 'Vetenskapliga tidskrifter för forskning och utbildning.', renewal: '2026-12-31', usage: 286540 },
  { id: 'acm-dl', name: 'ACM Digital Library', publisherId: 'acm', type: 'Databas', description: 'Publikationer inom datavetenskap och informationsteknik.', renewal: '2027-06-30', usage: 198220 },
  { id: 'sciencedirect', name: 'ScienceDirect Freedom Collection', publisherId: 'elsevier', type: 'Tidskrifter', description: 'Tvärvetenskapliga tidskrifter och forskningsinformation.', renewal: '2026-12-31', usage: 521760 },
  { id: 'wiley-online', name: 'Wiley Online Library', publisherId: 'wiley', type: 'Tidskrifter', description: 'En bred samling akademiska publikationer.', renewal: '2026-12-31', usage: 143900 },
  { id: 'sis-standarder', name: 'SIS Abonnemang – Svenska standarder', publisherId: 'sis', type: 'Standarder', description: 'Standarder för bland annat byggande och industri.', renewal: '2027-03-31', usage: 38410 },
  { id: 'oreilly', name: "O'Reilly Learning Platform", publisherId: 'oreilly', type: 'E-böcker', description: 'Teknisk litteratur och digital kompetensutveckling.', renewal: '2026-09-30', usage: 96730 },
  { id: 'knovel', name: 'Knovel Engineering Reference', publisherId: 'elsevier', type: 'Verktyg', description: 'Referensmaterial för ingenjörer.', renewal: '2026-12-31', usage: 42110 },
];
const publishers = [
  { id: 'ieee', name: 'IEEE', initials: 'IEEE', color: '#006b94', route: 'MPS / MPS Insight', status: 'Inte ansluten', description: 'Största publicistpartnern i uppdraget. MPS/MPS Insight är IEEE:s källspecifika väg; åtkomst och rapportformat behöver verifieras.' },
  { id: 'springer', name: 'Springer Nature', initials: 'SN', color: '#235e52', route: 'Källspecifik anslutning', status: 'Ej kartlagd', description: 'Format, åtkomst och leveranssätt kartläggs för denna publicist.' },
  { id: 'acm', name: 'ACM', initials: 'ACM', color: '#2877a7', route: 'Källspecifik anslutning', status: 'Ej kartlagd', description: 'API eller filimport väljs först efter verifiering med publicisten.' },
  { id: 'elsevier', name: 'Elsevier', initials: 'EL', color: '#a95b2e', route: 'Källspecifik anslutning', status: 'Ej kartlagd', description: 'Olika produkter kan behöva olika datakopplingar.' },
  { id: 'wiley', name: 'Wiley', initials: 'W', color: '#493d69', route: 'Källspecifik anslutning', status: 'Ej kartlagd', description: 'Ingen automatisk inhämtning är aktiverad.' },
  { id: 'sis', name: 'SIS', initials: 'SIS', color: '#8e354b', route: 'Källspecifik anslutning', status: 'Ej kartlagd', description: 'Statistik för standarder behöver en egen verifierad definition.' },
  { id: 'oreilly', name: "O'Reilly Media", initials: 'OR', color: '#943e35', route: 'Källspecifik anslutning', status: 'Ej kartlagd', description: 'Kursanvändning och litteraturanvändning ska hållas isär.' },
];
const customers = [
  { id: 'customer-kth-demo', name: 'KTH', fullName: 'Kungliga Tekniska högskolan', unit: 'KTH Biblioteket', initials: 'KTH', color: '#254a80', type: 'Lärosäte', status: 'Pilot · syntetisk data', productIds: products.map(p => p.id), contact: 'Hampus', note: 'Pilotkundens portfölj visar forskning, e-böcker och standarder i samma portal.' },
  { id: 'customer-akademi-demo', name: 'Akademi Nord', fullName: 'Akademi Nord · fiktiv organisation', unit: 'Forskningsbiblioteket', initials: 'AN', color: '#39786d', type: 'Lärosäte', status: 'Fiktiv demokund', productIds: ['ieee-xplore', 'springer-nature', 'acm-dl'], contact: 'Alex (demo)', note: 'Fiktiv organisation som visar hur flera kunder delar publicister genom sina produkttilldelningar.' },
  { id: 'customer-norrvik-demo', name: 'Norrvik Teknik', fullName: 'Norrvik Teknik AB · fiktiv organisation', unit: 'Forskning & utveckling', initials: 'NT', color: '#935d35', type: 'Företag', status: 'Fiktiv demokund', productIds: ['ieee-xplore', 'sis-standarder', 'knovel'], contact: 'Kim (demo)', note: 'Fiktiv B2B-kund med teknik- och standardprodukter.' },
];
const users = [
  { name: 'Hampus', customer: 'KTH', customerId: 'customer-kth-demo', role: 'Kundadministratör', status: 'Demokonto' },
  { name: 'Bibbi', customer: 'KTH', customerId: 'customer-kth-demo', role: 'Läsare', status: 'Demokonto' },
  { name: 'Alex (demo)', customer: 'Akademi Nord', customerId: 'customer-akademi-demo', role: 'Kundadministratör', status: 'Fiktivt exempel' },
  { name: 'Kim (demo)', customer: 'Norrvik Teknik', customerId: 'customer-norrvik-demo', role: 'Kundadministratör', status: 'Fiktivt exempel' },
];
export const demoWorkspace = {
  status: 'synthetic_configuration',
  provenance: { source: 'Content Online · syntetiskt presentationsunderlag', period: '2026-01-01 – 2026-08-31', definition: 'Exempel på produktanvändning. Ingen verifierad COUNTER-rapport eller summering av unika personer.', status: 'Demo – ingen extern import' },
  customers: customers.map(c => ({ ...c, users: users.filter(u => u.customerId === c.id).length, products: c.productIds.length })),
  users, publishers, products,
  assignments: customers.flatMap(c => c.productIds.map(id => {
    const product = products.find(p => p.id === id)!;
    return { customerId: c.id, customer: c.name, productId: id, product: product.name, publisher: publishers.find(p => p.id === product.publisherId)!.name, status: 'Demo-tilldelning' };
  })),
  connections: [
    { name: 'MPS / MPS Insight', owner: 'IEEE', mode: 'Källspecifik anslutning', status: 'Inte ansluten', lastImport: null },
    { name: 'Övriga publicister', owner: 'Flera partners', mode: 'API, fil eller annan lösning', status: 'Ej kartlagda', lastImport: null },
    { name: 'Salesforce', owner: 'Content Online', mode: 'Kund- och avtalsinformation', status: 'Framtida datakälla', lastImport: null },
    { name: 'Fortnox', owner: 'Content Online', mode: 'Ekonomi och fakturaunderlag', status: 'Framtida datakälla', lastImport: null },
  ],
  storage: { status: 'blocked_by_decision', label: 'Visningsläge. Ändringar sparas inte och inga externa licenser påverkas.' },
};
