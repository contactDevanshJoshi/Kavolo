/**
 * Kavolo Fixture Dataset for Testing and Emulator Seeding
 * Conforms strictly to schema definitions in functions/schema.js (SRS §6)
 */

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

export const MOCK_TENANT = {
  uid: "mock-tenant-ugbs-001",
  email: "devansh@ugbs.in",
  service_profile: "web_development",
  service_profile_locked: true,
  email_template: {
    greeting: "Hi {{name}},",
    signature: "Best regards,\nDevansh Joshi\nFounder, UGBS"
  },
  smtp_config: {
    host: "smtp.mockmail.com",
    port: 587,
    username: "devansh@ugbs.in",
    password_encrypted: "iv123:tag123:enc123",
    from_address: "devansh@ugbs.in"
  },
  imap_config: {
    host: "imap.mockmail.com",
    port: 993,
    username: "devansh@ugbs.in",
    password_encrypted: "iv123:tag123:enc123"
  },
  whatsapp_session_ref: "sessions/mock-tenant-ugbs-001",
  limits: {
    leads_per_click: 10,
    leads_per_day: 15,
    followup_threshold_days: 4,
    send_delay_min_sec: 8,
    send_delay_max_sec: 20
  },
  created_at: new Date(NOW - 30 * DAY)
};

export const MOCK_LEADS = [
  {
    id: "lead-01-new-high",
    place_id: "ChIJ_apex_dental_01",
    business_name: "Apex Dental Care",
    phone: "+919876543210",
    email: "contact@apexdental.com",
    address: "Shop 12, City Center, Palanpur, Gujarat 385001",
    opportunity_score: 92,
    ai_score: 9,
    problem_summary: "No website listed on Maps profile; high review volume (4.8 stars, 140 reviews) but no online appointment booking.",
    status: "New",
    unread_count: 0,
    created_at: new Date(NOW - 1 * DAY)
  },
  {
    id: "lead-02-contacted",
    place_id: "ChIJ_siddhi_hospital_02",
    business_name: "Siddhi Multispecialty Hospital",
    phone: "+919876543211",
    email: "info@siddhihospital.com",
    address: "Station Road, Palanpur, Gujarat 385001",
    opportunity_score: 78,
    ai_score: 8,
    problem_summary: "Existing website is HTTP only, broken on mobile devices, and missing doctor roster.",
    status: "Contacted",
    last_message_preview: "Hi Dr. Patel, noticed your clinic website lacks mobile responsiveness...",
    last_message_at: new Date(NOW - 2 * DAY),
    last_message_channel: "whatsapp",
    unread_count: 0,
    created_at: new Date(NOW - 3 * DAY),
    conversations: [
      {
        id: "msg-02-1",
        direction: "outbound",
        channel: "whatsapp",
        body: "Hi Dr. Patel, noticed your clinic website lacks mobile responsiveness...",
        sent_at: new Date(NOW - 2 * DAY),
        status: "sent"
      }
    ]
  },
  {
    id: "lead-03-stale-followup",
    place_id: "ChIJ_elite_fitness_03",
    business_name: "Elite Fitness Club",
    phone: "+919876543212",
    email: "manager@elitefitness.in",
    address: "Highway Cross Road, Palanpur, Gujarat 385001",
    opportunity_score: 85,
    ai_score: 8,
    problem_summary: "Website has broken lead capture form and slow load time (>5s); active Instagram presence.",
    status: "Contacted",
    // 5 days ago > 4 days followup_threshold_days -> qualifies for FR-27 follow-up reminder!
    last_message_preview: "Hi Rahul, following up on modernizing Elite Fitness's landing page...",
    last_message_at: new Date(NOW - 5 * DAY),
    last_message_channel: "whatsapp",
    unread_count: 0,
    created_at: new Date(NOW - 6 * DAY),
    conversations: [
      {
        id: "msg-03-1",
        direction: "outbound",
        channel: "whatsapp",
        body: "Hi Rahul, following up on modernizing Elite Fitness's landing page...",
        sent_at: new Date(NOW - 5 * DAY),
        status: "sent"
      }
    ]
  },
  {
    id: "lead-04-replied-unread",
    place_id: "ChIJ_city_bakers_04",
    business_name: "City Bakery & Confectionery",
    phone: "+919876543213",
    email: "order@citybakers.in",
    address: "College Road, Palanpur, Gujarat 385001",
    opportunity_score: 88,
    ai_score: 9,
    problem_summary: "Maps listing has no online catalog/menu; competitors nearby have online ordering.",
    status: "Replied",
    last_message_preview: "Yes we need an online cake ordering catalog. How much do you charge?",
    last_message_at: new Date(NOW - 2 * HOUR),
    last_message_channel: "whatsapp",
    unread_count: 1, // Has unread reply (FR-23, FR-24)
    created_at: new Date(NOW - 4 * DAY),
    conversations: [
      {
        id: "msg-04-1",
        direction: "outbound",
        channel: "whatsapp",
        body: "Hi Rajesh, loved your bakery's reviews. Have you considered an online catalog for cake orders?",
        sent_at: new Date(NOW - 1 * DAY),
        status: "sent"
      },
      {
        id: "msg-04-2",
        direction: "inbound",
        channel: "whatsapp",
        body: "Yes we need an online cake ordering catalog. How much do you charge?",
        received_at: new Date(NOW - 2 * HOUR)
      }
    ]
  },
  {
    id: "lead-05-interested",
    place_id: "ChIJ_modern_arch_05",
    business_name: "Modern Design Architects",
    phone: "+919876543214",
    email: "studio@modernarch.com",
    address: "Architect Enclave, Palanpur, Gujarat 385001",
    opportunity_score: 95,
    ai_score: 10,
    problem_summary: "Portfolio contains stunning projects but existing site is built on Wix with slow portfolio gallery.",
    status: "Interested",
    last_message_preview: "Can we schedule a 15-minute Google Meet tomorrow afternoon?",
    last_message_at: new Date(NOW - 1 * DAY),
    last_message_channel: "email",
    unread_count: 0,
    created_at: new Date(NOW - 5 * DAY),
    conversations: [
      {
        id: "msg-05-1",
        direction: "outbound",
        channel: "email",
        body: "Hi Sneha,\n\nI was browsing your residential architecture portfolio...",
        sent_at: new Date(NOW - 2 * DAY),
        status: "sent"
      },
      {
        id: "msg-05-2",
        direction: "inbound",
        channel: "email",
        body: "Can we schedule a 15-minute Google Meet tomorrow afternoon?",
        received_at: new Date(NOW - 1 * DAY)
      }
    ]
  },
  {
    id: "lead-06-converted",
    place_id: "ChIJ_shreeji_auto_06",
    business_name: "Shreeji Auto Spares",
    phone: "+919876543215",
    email: "shreejiauto@gmail.com",
    address: "GIDC Area, Palanpur, Gujarat 385001",
    opportunity_score: 80,
    ai_score: 7,
    problem_summary: "No parts catalog online; relies 100% on phone queries.",
    status: "Converted", // Terminal status (FR-25)
    last_message_preview: "Advance payment transferred, let's start the project.",
    last_message_at: new Date(NOW - 10 * DAY),
    last_message_channel: "email",
    unread_count: 0,
    created_at: new Date(NOW - 15 * DAY),
    conversations: [
      {
        id: "msg-06-1",
        direction: "outbound",
        channel: "email",
        body: "Hi Amit, here is the proposal for your auto parts digital catalog...",
        sent_at: new Date(NOW - 12 * DAY),
        status: "sent"
      },
      {
        id: "msg-06-2",
        direction: "inbound",
        channel: "email",
        body: "Advance payment transferred, let's start the project.",
        received_at: new Date(NOW - 10 * DAY)
      }
    ]
  },
  {
    id: "lead-07-lost",
    place_id: "ChIJ_palanpur_hardware_07",
    business_name: "Palanpur Hardware & Tools",
    phone: "+919876543216",
    email: null,
    address: "Bazaar Road, Palanpur, Gujarat 385001",
    opportunity_score: 50,
    ai_score: 4,
    problem_summary: "Local retail only, owner does not seek online sales.",
    status: "Lost", // Terminal status (FR-25)
    last_message_preview: "Not interested right now, thanks.",
    last_message_at: new Date(NOW - 7 * DAY),
    last_message_channel: "whatsapp",
    unread_count: 0,
    created_at: new Date(NOW - 8 * DAY),
    conversations: [
      {
        id: "msg-07-1",
        direction: "outbound",
        channel: "whatsapp",
        body: "Hi, would you like a digital product catalog for your hardware supplies?",
        sent_at: new Date(NOW - 8 * DAY),
        status: "sent"
      },
      {
        id: "msg-07-2",
        direction: "inbound",
        channel: "whatsapp",
        body: "Not interested right now, thanks.",
        received_at: new Date(NOW - 7 * DAY)
      }
    ]
  },
  {
    id: "lead-08-no-contact-edgecase",
    place_id: "ChIJ_ambika_stationery_08",
    business_name: "Ambika Stationery Mart",
    phone: null, // EC-2: No phone
    email: null, // EC-2: No email (address only)
    address: "Opp. Commerce College, Palanpur, Gujarat 385001",
    opportunity_score: 65,
    ai_score: 6,
    problem_summary: "Physical address only; zero website or digital presence found on Maps.",
    status: "New",
    unread_count: 0,
    created_at: new Date(NOW - 1 * DAY)
  }
];

export const MOCK_CAMPAIGN = {
  id: "campaign-01-palanpur-dentists",
  area: "Palanpur",
  niche: "Dentists",
  service_profile: "web_development",
  keywords_generated: [
    "dentists in Palanpur",
    "dental clinics Palanpur",
    "teeth cleaning Palanpur",
    "dental hospital Palanpur"
  ],
  lead_count: MOCK_LEADS.length,
  created_at: new Date(NOW - 3 * DAY)
};
