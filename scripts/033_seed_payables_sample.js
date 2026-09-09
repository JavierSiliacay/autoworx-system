  const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL in .env.local");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const payablesData = [
  {
    date: '2026-08-10',
    supplier_name: 'NIPPON PAINT CEBU CORP.',
    amount: 145800.00,
    check_number: 'BDO-091823',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-09',
    status: 'PENDING',
    remarks: 'Invoice #NP-9921 / 2K Clear coat & automotive urethane primer paints'
  },
  {
    date: '2026-08-15',
    supplier_name: 'TOYOTA CEBU CITY GENUINE PARTS',
    amount: 88500.00,
    check_number: 'MB-441029',
    pdc_term: 'PDC 15 days',
    pdc_date: '2026-08-30',
    status: 'PAID',
    paid_at: '2026-08-30T10:00:00Z',
    remarks: 'Invoice #TCC-55102 / Fortuner front bumper cover & radiator support'
  },
  {
    date: '2026-08-20',
    supplier_name: 'AXALTA COATING SYSTEMS PHILS.',
    amount: 62400.00,
    check_number: 'BPI-229103',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-19',
    status: 'PENDING',
    remarks: 'Invoice #AX-8812 / Standox Cromax basecoat pigments & thinners'
  },
  {
    date: '2026-08-01',
    supplier_name: 'CALTEX DELO LUBRICANTS DISTRIBUTOR',
    amount: 195000.00,
    check_number: 'BDO-091801',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-08-31',
    status: 'PAID',
    paid_at: '2026-08-31T14:30:00Z',
    remarks: 'Invoice #CTX-1092 / 5 Barrels Delo 400 MGX 15W-40 & Havoline synthetic'
  },
  {
    date: '2026-08-25',
    supplier_name: '3M PHILIPPINES INC.',
    amount: 34500.00,
    check_number: 'SEC-882190',
    pdc_term: 'PDC 15 days',
    pdc_date: '2026-09-09',
    status: 'PENDING',
    remarks: 'Invoice #3M-4419 / Trizact sanding discs, masking tapes & compounds'
  },
  {
    date: '2026-07-28',
    supplier_name: 'ISUZU CEBU INC.',
    amount: 112000.00,
    check_number: 'MB-440911',
    pdc_term: 'PDC 45 days',
    pdc_date: '2026-09-11',
    status: 'PENDING',
    remarks: 'Invoice #ICI-7712 / D-Max 4JJ1 engine overhaul gasket kit & clutch disc'
  },
  {
    date: '2026-08-12',
    supplier_name: 'BRIDGESTONE TIRE CENTER CEBU',
    amount: 78000.00,
    check_number: 'BDO-091835',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-11',
    status: 'PENDING',
    remarks: 'Invoice #BS-2026-08 / 12 sets Dueler A/T 265/65R17 SUV tires'
  },
  {
    date: '2026-08-05',
    supplier_name: 'AGUILA AUTO GLASS CEBU BRANCH',
    amount: 28500.00,
    check_number: 'BPI-229045',
    pdc_term: 'PDC 15 days',
    pdc_date: '2026-08-20',
    status: 'PAID',
    paid_at: '2026-08-20T11:15:00Z',
    remarks: 'Invoice #AAG-6612 / Vios front windshield laminated glass & sealant'
  },
  {
    date: '2026-08-22',
    supplier_name: 'MITSUBISHI FAST AUTO PARTS',
    amount: 94200.00,
    check_number: 'RCBC-771029',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-21',
    status: 'PENDING',
    remarks: 'Invoice #FAP-3391 / Montero Sport tail lamp assemblies & quarter panel'
  },
  {
    date: '2026-08-18',
    supplier_name: 'WURTH PHILIPPINES INC.',
    amount: 41800.00,
    check_number: 'BDO-091844',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-17',
    status: 'PENDING',
    remarks: 'Invoice #WUR-8801 / Brake cleaner spray, cavity wax & copper paste'
  },
  {
    date: '2026-07-20',
    supplier_name: 'DENSO PHILIPPINES CORP.',
    amount: 125000.00,
    check_number: 'MB-440850',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-08-19',
    status: 'PAID',
    paid_at: '2026-08-19T09:30:00Z',
    remarks: 'Invoice #DN-1029 / AC Compressors 10S15C & condenser assemblies'
  },
  {
    date: '2026-08-28',
    supplier_name: 'CASTROL PHILIPPINES INC.',
    amount: 55000.00,
    check_number: 'SEC-882240',
    pdc_term: 'PDC 15 days',
    pdc_date: '2026-09-12',
    status: 'PENDING',
    remarks: 'Invoice #CAS-7741 / Castrol Magnatec 5W-30 & Edge 0W-40 cases'
  },
  {
    date: '2026-08-14',
    supplier_name: 'BREMBO BRAKES DISTRIBUTOR PH',
    amount: 48900.00,
    check_number: 'BPI-229090',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-13',
    status: 'PENDING',
    remarks: 'Invoice #BRM-5521 / Front brake rotor discs & ceramic brake pads'
  },
  {
    date: '2026-08-02',
    supplier_name: 'MOTOLITE BATTERY CENTER CEBU',
    amount: 67200.00,
    check_number: 'BDO-091811',
    pdc_term: 'PDC 15 days',
    pdc_date: '2026-08-17',
    status: 'PAID',
    paid_at: '2026-08-17T15:00:00Z',
    remarks: 'Invoice #MTL-3310 / 10 pcs Motolite Gold 2SM & 3SM maintenance-free batteries'
  },
  {
    date: '2026-08-30',
    supplier_name: 'KYB SHOCKS & STRUTS CEBU',
    amount: 72500.00,
    check_number: 'MB-441150',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-29',
    status: 'PENDING',
    remarks: 'Invoice #KYB-8820 / Excel-G gas shock absorbers for Hilux & Innova'
  },
  {
    date: '2026-08-08',
    supplier_name: 'KANSAI PAINT PHILS. INC.',
    amount: 83400.00,
    check_number: 'BDO-091829',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-07',
    status: 'PENDING',
    remarks: 'Invoice #KP-4402 / Retan PG hybrid urethane topcoats & hardeners'
  },
  {
    date: '2026-08-24',
    supplier_name: 'FORD CEBU AUTO PARTS DEPT',
    amount: 118000.00,
    check_number: 'RCBC-771055',
    pdc_term: 'PDC 45 days',
    pdc_date: '2026-10-08',
    status: 'PENDING',
    remarks: 'Invoice #FC-9912 / Ranger 2.0 Bi-Turbo intercooler & turbo boost hose'
  },
  {
    date: '2026-07-25',
    supplier_name: 'YOKOHAMA TIRES PHILIPPINES',
    amount: 92000.00,
    check_number: 'SEC-882099',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-08-24',
    status: 'PAID',
    paid_at: '2026-08-24T16:00:00Z',
    remarks: 'Invoice #YOK-5519 / Geolandar A/T G015 265/60R18 tires'
  },
  {
    date: '2026-08-16',
    supplier_name: 'MIRKA ABRASIVES CEBU DISTRIBUTOR',
    amount: 18500.00,
    check_number: null,
    pdc_term: 'No PDC',
    pdc_date: null,
    status: 'PAID',
    paid_at: '2026-08-16T12:00:00Z',
    remarks: 'Invoice #MRK-1102 / Abranet mesh grip abrasive rolls & hand blocks - Paid Cash'
  },
  {
    date: '2026-09-01',
    supplier_name: 'NISSAN CEBU MOTOR DISTRIBUTOR',
    amount: 64800.00,
    check_number: 'BPI-229201',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-10-01',
    status: 'PENDING',
    remarks: 'Invoice #NIS-3301 / Navara NP300 front grille & headlamp assemblies'
  },
  {
    date: '2026-08-11',
    supplier_name: 'HYUNDAI GENUINE PARTS SUPPLY',
    amount: 51200.00,
    check_number: 'BDO-091838',
    pdc_term: 'PDC 15 days',
    pdc_date: '2026-08-26',
    status: 'PAID',
    paid_at: '2026-08-26T14:00:00Z',
    remarks: 'Invoice #HYU-8819 / Staria front bumper lip & steering rack end kit'
  },
  {
    date: '2026-08-27',
    supplier_name: 'CEBU AIRCON SUPPLIES & FREON',
    amount: 36000.00,
    check_number: 'MB-441112',
    pdc_term: 'PDC 15 days',
    pdc_date: '2026-09-11',
    status: 'PENDING',
    remarks: 'Invoice #CAS-9901 / 3 Tanks R134a refrigerant freon gas & PAG 46 oil'
  },
  {
    date: '2026-08-04',
    supplier_name: 'HONDA GENUINE PARTS CEBU',
    amount: 79500.00,
    check_number: 'BDO-091815',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-03',
    status: 'PAID',
    paid_at: '2026-09-03T11:00:00Z',
    remarks: 'Invoice #HGP-7721 / Civic RS front fender & radiator lower support'
  },
  {
    date: '2026-09-02',
    supplier_name: 'MEGUIAR\'S PHILIPPINES CAR CARE',
    amount: 29800.00,
    check_number: 'SEC-882280',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-10-02',
    status: 'PENDING',
    remarks: 'Invoice #MEG-4401 / M105 Ultra-cut compound & M205 finishing polish'
  },
  {
    date: '2026-08-19',
    supplier_name: 'MOBIL 1 DISTRIBUTOR CEBU',
    amount: 86000.00,
    check_number: 'BPI-229115',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-18',
    status: 'PENDING',
    remarks: 'Invoice #MOB-5509 / Mobil 1 Triple Action 5W-30 full synthetic cases'
  },
  {
    date: '2026-07-29',
    supplier_name: 'SNAP-ON TOOLS CEBU INDENT',
    amount: 142000.00,
    check_number: 'MB-440930',
    pdc_term: 'PDC 60 days',
    pdc_date: '2026-09-27',
    status: 'PENDING',
    remarks: 'Invoice #SNT-2026 / Master mechanical socket set & digital torque wrenches'
  },
  {
    date: '2026-08-17',
    supplier_name: 'MICHELIN TRUCK & CAR TIRES CEBU',
    amount: 104500.00,
    check_number: 'BDO-091849',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-16',
    status: 'PENDING',
    remarks: 'Invoice #MCH-8833 / Primacy 4 SUV 225/65R17 tires 8 pcs'
  },
  {
    date: '2026-08-06',
    supplier_name: 'BOSCH AUTOMOTIVE DIAGNOSTICS PH',
    amount: 68500.00,
    check_number: 'RCBC-770980',
    pdc_term: 'PDC 30 days',
    pdc_date: '2026-09-05',
    status: 'PAID',
    paid_at: '2026-09-05T13:30:00Z',
    remarks: 'Invoice #BSH-3390 / OBD2 scanner update subscription & ignition coil packs'
  },
  {
    date: '2026-08-29',
    supplier_name: 'SAINT-GOBAIN SEKURIT GLASS PH',
    amount: 38200.00,
    check_number: 'SEC-882260',
    pdc_term: 'PDC 15 days',
    pdc_date: '2026-09-13',
    status: 'PENDING',
    remarks: 'Invoice #SGS-5510 / Ranger rear sliding window glass & weatherstrips'
  },
  {
    date: '2026-09-03',
    supplier_name: 'WURTH FASTENERS & INDUSTRIAL BOLTS',
    amount: 21500.00,
    check_number: null,
    pdc_term: 'No PDC',
    pdc_date: null,
    status: 'PENDING',
    remarks: 'Invoice #WUR-9912 / High-tensile body bolts, fender clips & nylon rivets'
  }
];

async function seedPayables() {
  console.log("Connecting to PostgreSQL...");
  await client.connect();
  console.log("Connected successfully!");

  console.log("Seeding 30 payables records...");
  for (const item of payablesData) {
    await client.query(
      `INSERT INTO public.payables (date, supplier_name, amount, check_number, pdc_term, pdc_date, status, paid_at, remarks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        item.date,
        item.supplier_name,
        item.amount,
        item.check_number,
        item.pdc_term,
        item.pdc_date,
        item.status,
        item.paid_at || null,
        item.remarks,
        'system_seed'
      ]
    );
  }

  const countRes = await client.query("SELECT COUNT(*) FROM public.payables");
  const sumRes = await client.query("SELECT SUM(amount) as total, status FROM public.payables GROUP BY status");
  
  console.log(`Successfully seeded! Total payables count: ${countRes.rows[0].count}`);
  console.log("Breakdown by status:", sumRes.rows);

  await client.end();
}

seedPayables().catch((err) => {
  console.error("Error seeding payables:", err);
  process.exit(1);
});
