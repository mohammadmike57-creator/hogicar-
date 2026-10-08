/**
 * Help Center content. Each article is short, task-focused and written for HogiCar's real flows
 * (Manage booking, voucher, pay now / pay at desk, change requests). Terms that differ by rental
 * company – exact cancellation windows, deposit amounts, age fees – always point to the booking's
 * own rental conditions instead of quoting a number.
 */
import { CONTACT_EMAIL } from '../lib/config';

export type HelpBlock =
  | { type: 'p'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'list'; items: string[] }
  | { type: 'note'; tone: 'info' | 'tip' | 'warning'; text: string }
  | { type: 'actions'; items: { label: string; to: string }[] };

export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  keywords: string[];
  popular?: boolean;
  body: HelpBlock[];
  related?: string[];
};

export type HelpCategory = {
  slug: string;
  title: string;
  description: string;
  icon: 'calendar' | 'refresh' | 'card' | 'shield' | 'key' | 'user' | 'phone' | 'briefcase';
};

export const HELP_CATEGORIES: HelpCategory[] = [
  { slug: 'booking', title: 'Booking a car', description: 'Searching, choosing and confirming your rental.', icon: 'calendar' },
  { slug: 'manage-booking', title: 'Change or cancel', description: 'Find your booking, change dates or cancel.', icon: 'refresh' },
  { slug: 'payments', title: 'Payments & prices', description: 'Pay now, pay at the desk, refunds and currencies.', icon: 'card' },
  { slug: 'deposit-insurance', title: 'Deposit & insurance', description: 'Security deposit, cover and excess explained.', icon: 'shield' },
  { slug: 'pick-up-drop-off', title: 'Pick-up & drop-off', description: 'What to bring, airport pick-up, fuel and returns.', icon: 'key' },
  { slug: 'drivers', title: 'Drivers & documents', description: 'Age, licences and additional drivers.', icon: 'user' },
  { slug: 'voucher-app', title: 'Voucher, wallet & app', description: 'Your voucher, Apple Wallet, Google Wallet and calendar.', icon: 'phone' },
  { slug: 'business', title: 'Business & partners', description: 'Affiliates, rental suppliers, API and press.', icon: 'briefcase' },
];

const contact = { label: 'Contact us', to: '/contact' };
const manage = { label: 'Manage booking', to: '/my-bookings' };

export const HELP_ARTICLES: HelpArticle[] = [
  // ---------------------------------------------------------------- booking
  {
    slug: 'how-to-book', category: 'booking', popular: true,
    title: 'How do I book a car with HogiCar?',
    summary: 'Search, compare and book in a few minutes – no account needed.',
    keywords: ['book', 'reserve', 'rent', 'how', 'search', 'start'],
    body: [
      { type: 'steps', items: [
        'Enter your pick-up location, dates and times on the homepage. Untick "Return car to the same location" if you drop off somewhere else.',
        'Compare cars from trusted rental companies. Use the filters for car type, transmission, deposit, fuel policy and more.',
        'Open a car to see what is included: insurance cover, mileage, fuel policy, deposit and the rental conditions.',
        'Enter the main driver\'s details, add any extras and choose how to pay.',
        'Confirm. Your booking reference and voucher arrive by email straight away.',
      ] },
      { type: 'note', tone: 'tip', text: 'Prices shown are totals for your dates and include taxes and mandatory fees. Optional extras are listed separately.' },
    ],
    related: ['booking-confirmation', 'instant-vs-on-request', 'whats-included-in-price'],
  },
  {
    slug: 'booking-confirmation', category: 'booking', popular: true,
    title: 'I booked – how do I know it\'s confirmed?',
    summary: 'Your confirmation email, booking reference and voucher.',
    keywords: ['confirmation', 'email', 'reference', 'not received', 'spam', 'confirmed'],
    body: [
      { type: 'p', text: 'As soon as you book you see a confirmation page with your booking reference (for example H12345), and we send a confirmation email with your voucher.' },
      { type: 'list', items: [
        'No email after a few minutes? Check your spam or promotions folder.',
        'Make sure the email address you entered was correct – you can see and update it in Manage booking.',
        'You can always open your voucher in Manage booking with your email and booking reference.',
      ] },
    ],
    related: ['instant-vs-on-request', 'find-my-booking', 'voucher'],
  },
  {
    slug: 'instant-vs-on-request', category: 'booking',
    title: 'What do "confirmed" and "on request" mean?',
    summary: 'Most cars confirm instantly; some rental companies confirm shortly after.',
    keywords: ['pending', 'on request', 'instant', 'waiting', 'supplier confirmation', 'status'],
    body: [
      { type: 'p', text: 'Most cars on HogiCar are confirmed instantly. Some rental companies check availability first – your booking then shows as pending until they confirm it, and we email you as soon as they do.' },
      { type: 'note', tone: 'info', text: 'If a rental company can\'t confirm your request, the booking is cancelled, anything you paid online is refunded, and we\'ll help you find an alternative.' },
    ],
    related: ['booking-confirmation', 'find-my-booking'],
  },
  {
    slug: 'book-for-someone-else', category: 'booking',
    title: 'Can I book a car for someone else?',
    summary: 'Yes – enter the person who will drive as the main driver.',
    keywords: ['someone else', 'friend', 'family', 'main driver', 'name'],
    body: [
      { type: 'p', text: 'You can book for anyone. Enter the person who will pick up and drive the car as the main driver – the rental company checks that their name matches the driving licence and the card used for the deposit.' },
    ],
    related: ['what-to-bring', 'additional-drivers'],
  },
  {
    slug: 'one-way-rental', category: 'booking',
    title: 'Can I return the car to a different location?',
    summary: 'One-way rentals are available with many rental companies.',
    keywords: ['one way', 'different location', 'drop off elsewhere', 'return elsewhere'],
    body: [
      { type: 'p', text: 'Yes. Untick "Return car to the same location" when you search and choose your drop-off location. Only cars that allow one-way rentals are shown, and any one-way fee is included in or listed with the price.' },
    ],
    related: ['how-to-book', 'whats-included-in-price'],
  },

  // ---------------------------------------------------------------- manage
  {
    slug: 'find-my-booking', category: 'manage-booking', popular: true,
    title: 'How do I find and manage my booking?',
    summary: 'Use Manage booking with your email and booking reference.',
    keywords: ['manage', 'find', 'view', 'my booking', 'reference', 'lookup'],
    body: [
      { type: 'steps', items: [
        'Open Manage booking.',
        'Enter the email address you booked with and your booking reference (it starts with H, for example H12345).',
        'View your voucher, update your contact details, request new dates or cancel.',
      ] },
      { type: 'actions', items: [manage] },
    ],
    related: ['cancel-booking', 'change-dates', 'update-details'],
  },
  {
    slug: 'cancel-booking', category: 'manage-booking', popular: true,
    title: 'How do I cancel my booking?',
    summary: 'Cancel online in Manage booking before your pick-up date.',
    keywords: ['cancel', 'cancellation', 'refund', 'stop', 'delete booking'],
    body: [
      { type: 'steps', items: [
        'Open Manage booking and sign in with your email and booking reference.',
        'Choose Cancel booking and tell us why (optional).',
        'You receive a cancellation email right away, and the rental company is informed.',
      ] },
      { type: 'note', tone: 'info', text: 'Online cancellation is available until your pick-up date. If your rental has already started, contact us and we\'ll help you end it early.' },
      { type: 'actions', items: [manage, contact] },
    ],
    related: ['free-cancellation', 'refunds'],
  },
  {
    slug: 'free-cancellation', category: 'manage-booking', popular: true,
    title: 'Is cancellation free?',
    summary: 'Most bookings include free cancellation – check your rental conditions.',
    keywords: ['free cancellation', 'cancellation fee', 'penalty', 'policy', 'charge'],
    body: [
      { type: 'p', text: 'Most bookings on HogiCar include free cancellation. The exact cancellation terms depend on the rental company and are shown in the rental conditions before you book and on your voucher.' },
      { type: 'p', text: 'If you paid part of your rental online, any refund due under those terms is made to the card you paid with.' },
    ],
    related: ['cancel-booking', 'refunds'],
  },
  {
    slug: 'change-dates', category: 'manage-booking',
    title: 'Can I change my dates or times?',
    summary: 'Send a change request – the rental company confirms it.',
    keywords: ['change', 'modify', 'dates', 'time', 'extend', 'shorten', 'amend'],
    body: [
      { type: 'steps', items: [
        'Open Manage booking and choose Change dates.',
        'Pick your new pick-up and drop-off dates and times and send the request.',
        'The rental company accepts or declines it. If the new dates cost more, you\'ll see the difference and can pay it online before the change is confirmed.',
      ] },
      { type: 'note', tone: 'info', text: 'You can have one change request waiting at a time, and rentals can be up to 90 days long.' },
      { type: 'actions', items: [manage] },
    ],
    related: ['find-my-booking', 'cancel-booking'],
  },
  {
    slug: 'update-details', category: 'manage-booking',
    title: 'How do I update my phone number or email?',
    summary: 'Edit your contact details in Manage booking.',
    keywords: ['phone', 'email', 'details', 'update', 'name', 'contact details', 'flight number'],
    body: [
      { type: 'p', text: 'In Manage booking choose Update details. Your new details are saved and shared with the rental company immediately.' },
      { type: 'note', tone: 'warning', text: 'The main driver\'s name can\'t be changed online. If it\'s wrong, contact us with your booking reference.' },
      { type: 'actions', items: [manage, contact] },
    ],
    related: ['find-my-booking', 'late-flight'],
  },

  // ---------------------------------------------------------------- payments
  {
    slug: 'pay-now-or-at-desk', category: 'payments', popular: true,
    title: 'Do I pay now or at the rental desk?',
    summary: 'Depending on the car, you pay online, at the desk, or part of each.',
    keywords: ['pay', 'payment', 'pay later', 'pay at desk', 'prepaid', 'when do i pay'],
    body: [
      { type: 'p', text: 'Each offer shows how it is paid. Some cars are paid in full online, some are paid at the rental desk, and some combine a small online payment with the rest at pick-up.' },
      { type: 'list', items: [
        'Online payments are processed securely by Stripe. We never see or store your full card number.',
        'Amounts due at the desk are paid to the rental company at pick-up.',
        'The security deposit is separate and is held by the rental company at pick-up.',
      ] },
    ],
    related: ['accepted-cards', 'security-deposit', 'whats-included-in-price'],
  },
  {
    slug: 'accepted-cards', category: 'payments',
    title: 'Which payment cards are accepted?',
    summary: 'Major credit and debit cards online; check the deposit card rules.',
    keywords: ['card', 'visa', 'mastercard', 'amex', 'debit', 'credit card', 'apple pay'],
    body: [
      { type: 'p', text: 'Online payments accept major credit and debit cards. At the rental desk, most companies need a credit card in the main driver\'s name for the security deposit – the accepted cards are listed in the rental conditions of each car.' },
      { type: 'note', tone: 'warning', text: 'Debit, prepaid and virtual cards are often not accepted for the deposit. Check the rental conditions before you travel.' },
    ],
    related: ['security-deposit', 'pay-now-or-at-desk'],
  },
  {
    slug: 'whats-included-in-price', category: 'payments', popular: true,
    title: 'What is included in the price?',
    summary: 'The total includes taxes and mandatory fees – no hidden costs.',
    keywords: ['price', 'included', 'hidden fees', 'taxes', 'total', 'cost', 'airport fee'],
    body: [
      { type: 'p', text: 'The total price shown is for your whole rental and includes the car, taxes and mandatory fees such as airport surcharges where they apply.' },
      { type: 'list', items: [
        'Included insurance cover, mileage and fuel policy are shown on each car.',
        'Optional extras (child seats, GPS, additional driver…) are added only if you choose them.',
        'Costs that depend on how you use the car – fuel, tolls, fines, young-driver fees – are explained in the rental conditions.',
      ] },
    ],
    related: ['pay-now-or-at-desk', 'insurance-cover', 'fuel-policy'],
  },
  {
    slug: 'currencies', category: 'payments',
    title: 'Which currency will I be charged in?',
    summary: 'Prices can be shown in your currency; you pay in the currency stated at checkout.',
    keywords: ['currency', 'exchange', 'usd', 'jod', 'aed', 'convert'],
    body: [
      { type: 'p', text: 'You can display prices in your preferred currency with the currency selector at the top of the page. Converted prices are for guidance – you pay in the currency stated at checkout, and your bank may apply its own exchange rate.' },
    ],
    related: ['pay-now-or-at-desk', 'refunds'],
  },
  {
    slug: 'promo-codes', category: 'payments',
    title: 'How do I use a promo code?',
    summary: 'Enter it on the booking page before you pay.',
    keywords: ['promo', 'discount', 'voucher code', 'coupon', 'offer'],
    body: [
      { type: 'p', text: 'Enter your promo code in the price summary on the booking page and apply it. The discount is shown before you confirm. Each code has its own conditions, such as locations, dates or a minimum rental length.' },
    ],
    related: ['whats-included-in-price'],
  },
  {
    slug: 'refunds', category: 'payments', popular: true,
    title: 'When will I get my refund?',
    summary: 'Refunds go back to the card you paid with.',
    keywords: ['refund', 'money back', 'reimburse', 'returned', 'how long'],
    body: [
      { type: 'p', text: 'When a refund is due, we return it to the card you paid with online. Once we\'ve processed it, banks usually take 5–10 business days to show it on your statement.' },
      { type: 'p', text: 'Amounts paid at the rental desk, and security deposits, are refunded or released by the rental company.' },
      { type: 'actions', items: [contact] },
    ],
    related: ['free-cancellation', 'security-deposit'],
  },

  // ---------------------------------------------------------------- deposit & insurance
  {
    slug: 'security-deposit', category: 'deposit-insurance', popular: true,
    title: 'What is the security deposit?',
    summary: 'An amount held on your card at pick-up and released after return.',
    keywords: ['deposit', 'hold', 'block', 'security', 'preauthorization', 'released'],
    body: [
      { type: 'p', text: 'The rental company holds a security deposit on the main driver\'s card at pick-up. It covers fuel, damage or fines during the rental and is released after you return the car in line with the rental conditions.' },
      { type: 'list', items: [
        'The deposit amount is shown on each car before you book.',
        'It\'s a hold, not a charge – but it reduces your available card limit until it\'s released.',
        'Your bank decides how quickly a released hold disappears from your statement.',
      ] },
    ],
    related: ['accepted-cards', 'insurance-cover', 'excess'],
  },
  {
    slug: 'insurance-cover', category: 'deposit-insurance',
    title: 'What insurance is included?',
    summary: 'Every car shows its included cover before you book.',
    keywords: ['insurance', 'cdw', 'collision damage waiver', 'theft protection', 'cover', 'third party'],
    body: [
      { type: 'p', text: 'The included cover – for example Collision Damage Waiver and Theft Protection – is listed on each car and in its rental conditions. Third-party liability required by local law is always included by the rental company.' },
      { type: 'note', tone: 'tip', text: 'At the desk you may be offered extra cover to reduce your excess. It\'s optional – read what you already have before deciding.' },
    ],
    related: ['excess', 'security-deposit'],
  },
  {
    slug: 'excess', category: 'deposit-insurance',
    title: 'What is the excess?',
    summary: 'The most you pay towards damage or theft covered by your insurance.',
    keywords: ['excess', 'deductible', 'damage', 'accident', 'liability'],
    body: [
      { type: 'p', text: 'The excess is the maximum amount you pay if the car is damaged or stolen, even with Collision Damage Waiver and Theft Protection. It\'s shown in the rental conditions and is often linked to the deposit.' },
      { type: 'steps', items: [
        'Check the car carefully at pick-up and make sure existing damage is noted.',
        'Take photos of the car at pick-up and return.',
        'Report any accident to the rental company and the police straight away.',
      ] },
    ],
    related: ['insurance-cover', 'security-deposit'],
  },

  // ---------------------------------------------------------------- pick-up & drop-off
  {
    slug: 'what-to-bring', category: 'pick-up-drop-off', popular: true,
    title: 'What do I need to bring to pick up the car?',
    summary: 'Driving licence, ID or passport, a card for the deposit and your voucher.',
    keywords: ['documents', 'bring', 'pick up', 'licence', 'license', 'passport', 'id', 'requirements'],
    body: [
      { type: 'list', items: [
        'The main driver\'s full, valid driving licence.',
        'A passport or national ID card.',
        'A credit card in the main driver\'s name for the security deposit.',
        'Your HogiCar voucher – printed, on your phone or in Apple / Google Wallet.',
        'An International Driving Permit if your licence isn\'t in the local alphabet or the country requires one.',
      ] },
      { type: 'note', tone: 'warning', text: 'Without these documents the rental company may refuse to hand over the car. Check the rental conditions for any extra requirements.' },
    ],
    related: ['international-driving-permit', 'security-deposit', 'voucher'],
  },
  {
    slug: 'airport-pick-up', category: 'pick-up-drop-off',
    title: 'How does airport pick-up work?',
    summary: 'In the terminal, by shuttle or meet & greet – shown on every car.',
    keywords: ['airport', 'terminal', 'shuttle', 'meet and greet', 'desk', 'where'],
    body: [
      { type: 'p', text: 'Each car shows its pick-up type:' },
      { type: 'list', items: [
        'In terminal – the rental desk is in the arrivals hall.',
        'Shuttle – a free shuttle takes you to the rental office near the airport.',
        'Meet & greet – a representative meets you in arrivals with your name.',
      ] },
      { type: 'p', text: 'Exact pick-up instructions and the rental company\'s phone number are on your voucher.' },
    ],
    related: ['late-flight', 'what-to-bring'],
  },
  {
    slug: 'late-flight', category: 'pick-up-drop-off',
    title: 'What if my flight is delayed?',
    summary: 'Add your flight number and let the rental company know.',
    keywords: ['flight', 'delay', 'late', 'missed', 'arrival', 'flight number'],
    body: [
      { type: 'p', text: 'Add your flight number when you book or later in Manage booking, so the rental company can follow your arrival. If you\'ll arrive outside opening hours or much later than planned, call the rental company using the number on your voucher.' },
      { type: 'note', tone: 'info', text: 'Rental companies hold cars for a limited grace period after the pick-up time – it\'s shown in the rental conditions.' },
    ],
    related: ['airport-pick-up', 'update-details'],
  },
  {
    slug: 'fuel-policy', category: 'pick-up-drop-off',
    title: 'What do the fuel policies mean?',
    summary: 'Full to full, same to same and other policies explained.',
    keywords: ['fuel', 'petrol', 'gas', 'full to full', 'refuel', 'tank'],
    body: [
      { type: 'list', items: [
        'Full to full – pick up with a full tank and return it full. The fairest option: you only pay for the fuel you use.',
        'Same to same – return the car with the same amount of fuel as at pick-up.',
        'Pre-purchase – you pay for a tank at pick-up and can return it empty; unused fuel is usually not refunded.',
      ] },
      { type: 'p', text: 'Each car shows its fuel policy before you book.' },
    ],
    related: ['whats-included-in-price', 'returning-the-car'],
  },
  {
    slug: 'returning-the-car', category: 'pick-up-drop-off',
    title: 'How do I return the car?',
    summary: 'On time, at the agreed location, with the right fuel level.',
    keywords: ['return', 'drop off', 'late return', 'after hours', 'key'],
    body: [
      { type: 'steps', items: [
        'Return the car at the drop-off location and time on your voucher.',
        'Refuel according to the fuel policy and remove your belongings.',
        'Ask for a final check and keep the return receipt. Take photos if you return out of hours.',
      ] },
      { type: 'note', tone: 'warning', text: 'Late returns can cost an extra day. If you\'ll be late, call the rental company.' },
    ],
    related: ['fuel-policy', 'security-deposit'],
  },

  // ---------------------------------------------------------------- drivers
  {
    slug: 'driver-age', category: 'drivers', popular: true,
    title: 'What are the age requirements?',
    summary: 'Results assume a driver aged 30–65; other ages may pay a fee at the desk.',
    keywords: ['age', 'young driver', 'senior driver', 'minimum age', 'under 25', 'over 65'],
    body: [
      { type: 'p', text: 'Search results assume a main driver aged 30–65. If the main driver is younger or older, untick "Driver aged 30–65" when you search, and check the rental conditions of the car you choose: young- or senior-driver fees, where they apply, are usually paid at the rental desk.' },
      { type: 'p', text: 'Minimum age and how long the driver must have held their licence are set by each rental company and shown in the rental conditions.' },
    ],
    related: ['what-to-bring', 'additional-drivers'],
  },
  {
    slug: 'international-driving-permit', category: 'drivers',
    title: 'Do I need an International Driving Permit?',
    summary: 'Sometimes – it depends on your licence and the country you visit.',
    keywords: ['idp', 'international driving permit', 'foreign licence', 'license', 'translation'],
    body: [
      { type: 'p', text: 'You may need an International Driving Permit (IDP) if your licence isn\'t written in the Latin alphabet or the local language, or if the country you\'re visiting requires one. The IDP is carried together with your national licence – it doesn\'t replace it.' },
      { type: 'note', tone: 'tip', text: 'Get your IDP in your home country before you travel. The rental conditions say whether the rental company requires one.' },
    ],
    related: ['what-to-bring', 'driver-age'],
  },
  {
    slug: 'additional-drivers', category: 'drivers',
    title: 'Can someone else drive the car?',
    summary: 'Add additional drivers at the desk or as an extra.',
    keywords: ['additional driver', 'second driver', 'extra driver', 'spouse', 'share driving'],
    body: [
      { type: 'p', text: 'Only drivers registered on the rental agreement are insured. Add additional drivers as an extra when you book where available, or at the rental desk. Each driver must show their driving licence at pick-up.' },
    ],
    related: ['driver-age', 'book-for-someone-else'],
  },

  // ---------------------------------------------------------------- voucher & app
  {
    slug: 'voucher', category: 'voucher-app', popular: true,
    title: 'Where is my voucher?',
    summary: 'In your confirmation email and in Manage booking – also as a PDF.',
    keywords: ['voucher', 'pdf', 'print', 'download', 'confirmation document'],
    body: [
      { type: 'p', text: 'Your voucher is attached to your confirmation email and always available in Manage booking. It includes your booking reference, pick-up instructions, what\'s included and the rental company\'s contact details.' },
      { type: 'p', text: 'You can download it as a PDF, print it or simply show it on your phone at the desk.' },
      { type: 'actions', items: [manage] },
    ],
    related: ['wallet', 'calendar', 'what-to-bring'],
  },
  {
    slug: 'wallet', category: 'voucher-app',
    title: 'Can I add my booking to Apple Wallet or Google Wallet?',
    summary: 'Yes – use the wallet buttons on your voucher.',
    keywords: ['apple wallet', 'google wallet', 'pass', 'iphone', 'android', 'mobile'],
    body: [
      { type: 'p', text: 'Open your voucher and tap Add to Apple Wallet or Add to Google Wallet. The pass shows your pick-up details and booking reference and is available offline.' },
    ],
    related: ['voucher', 'calendar'],
  },
  {
    slug: 'calendar', category: 'voucher-app',
    title: 'How do I add my rental to my calendar?',
    summary: 'Download the calendar file from your voucher or Manage booking.',
    keywords: ['calendar', 'ics', 'reminder', 'google calendar', 'outlook'],
    body: [
      { type: 'p', text: 'Use Add to calendar on your voucher or in Manage booking. It downloads a calendar file that works with Apple Calendar, Google Calendar and Outlook, including the pick-up time and location.' },
    ],
    related: ['voucher', 'wallet'],
  },

  // ---------------------------------------------------------------- business
  {
    slug: 'affiliate-program', category: 'business',
    title: 'How do I join the HogiCar affiliate program?',
    summary: 'Earn commission on the bookings you refer.',
    keywords: ['affiliate', 'partner', 'commission', 'refer', 'blogger', 'awin', 'publisher'],
    body: [
      { type: 'p', text: 'Websites, creators and travel businesses can earn commission on bookings they send to HogiCar. Apply on the affiliate program page – once approved you get your own tracking links and a dashboard. We also work with affiliate networks such as Awin.' },
      { type: 'actions', items: [{ label: 'Affiliate program', to: '/affiliate-program' }, contact] },
    ],
    related: ['partner-api', 'become-supplier'],
  },
  {
    slug: 'become-supplier', category: 'business',
    title: 'How can my rental company list cars on HogiCar?',
    summary: 'Apply as a supplier and manage your fleet, rates and bookings online.',
    keywords: ['supplier', 'rental company', 'list cars', 'fleet', 'join', 'agency'],
    body: [
      { type: 'p', text: 'Rental companies can apply to sell through HogiCar. Approved suppliers get a supplier dashboard to manage locations, cars, rates, promotions and bookings.' },
      { type: 'actions', items: [{ label: 'Become a supplier', to: '/become-supplier' }, contact] },
    ],
    related: ['affiliate-program', 'partner-api'],
  },
  {
    slug: 'partner-api', category: 'business',
    title: 'Do you offer an API for partners?',
    summary: 'Yes – live search, booking and product feeds for approved partners.',
    keywords: ['api', 'integration', 'xml', 'feed', 'b2b', 'developer', 'travel agency'],
    body: [
      { type: 'p', text: 'Approved partners can search live availability and create bookings through the HogiCar Partner API, and affiliate networks can receive a product feed. Tell us about your business and we\'ll set up access.' },
      { type: 'actions', items: [{ label: 'Contact our business team', to: '/contact?topic=PARTNERSHIP' }] },
    ],
    related: ['affiliate-program', 'become-supplier'],
  },
  {
    slug: 'press', category: 'business',
    title: 'Press and media enquiries',
    summary: 'Contact our team for interviews, data and brand assets.',
    keywords: ['press', 'media', 'journalist', 'brand', 'logo', 'interview'],
    body: [
      { type: 'p', text: `For press and media enquiries, write to ${CONTACT_EMAIL} or use the contact form and choose "Press & media".` },
      { type: 'actions', items: [{ label: 'Contact us', to: '/contact?topic=PRESS' }] },
    ],
  },
];

export const articleBySlug = (slug: string) => HELP_ARTICLES.find(a => a.slug === slug);
export const categoryBySlug = (slug: string) => HELP_CATEGORIES.find(c => c.slug === slug);
export const articlesIn = (category: string) => HELP_ARTICLES.filter(a => a.category === category);
export const articleUrl = (a: HelpArticle) => `/help/${a.category}/${a.slug}`;

/** Plain text of an article, for search and structured data. */
export const articleText = (a: HelpArticle): string =>
  a.body.map(b => (b.type === 'p' || b.type === 'note' ? b.text : b.type === 'actions' ? '' : b.items.join(' '))).join(' ');

// ------------------------------------------------------------------ search

const SYNONYMS: Record<string, string[]> = {
  refund: ['money', 'back', 'reimburse'],
  cancel: ['cancellation', 'cancelled', 'canceled'],
  change: ['modify', 'amend', 'edit', 'update'],
  deposit: ['hold', 'block', 'security'],
  licence: ['license', 'permit', 'idp'],
  pay: ['payment', 'paid', 'card', 'charge'],
  pickup: ['pick-up', 'collect', 'collection'],
  dropoff: ['drop-off', 'return'],
  voucher: ['confirmation', 'pdf', 'ticket'],
  insurance: ['cover', 'cdw', 'excess'],
};

const normalize = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, ' ');
export const tokenize = (s: string) => normalize(s).split(/[\s-]+/).filter(t => t.length > 1);

/** Optimal-string-alignment distance, capped – cheap typo tolerance for short words. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

type Indexed = { article: HelpArticle; title: string[]; keywords: string[]; body: string[] };
let index: Indexed[] | null = null;
const getIndex = () => (index ??= HELP_ARTICLES.map(article => ({
  article,
  title: tokenize(article.title + ' ' + article.summary),
  keywords: tokenize(article.keywords.join(' ')),
  body: tokenize(articleText(article)),
})));

function expand(token: string): string[] {
  const out = new Set([token]);
  for (const [k, vs] of Object.entries(SYNONYMS)) {
    if (k === token || vs.includes(token)) { out.add(k); vs.forEach(v => out.add(v)); }
  }
  return [...out];
}

function tokenScore(q: string, words: string[], weight: number): number {
  let best = 0;
  for (const w of words) {
    if (w === q) best = Math.max(best, weight);
    else if (w.startsWith(q) && q.length >= 2) best = Math.max(best, weight * 0.8);
    else if (q.length >= 4 && editDistance(q, w, q.length >= 7 ? 2 : 1) <= (q.length >= 7 ? 2 : 1)) best = Math.max(best, weight * 0.6);
  }
  return best;
}

export type SearchHit = { article: HelpArticle; score: number };

/** Ranked, typo-tolerant search over titles, keywords and article text. */
export function searchHelp(query: string, limit = 8): SearchHit[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const hits: SearchHit[] = [];
  for (const doc of getIndex()) {
    let score = 0;
    let matched = 0;
    for (const t of tokens) {
      let s = 0;
      for (const v of expand(t)) {
        s = Math.max(s, tokenScore(v, doc.title, 10), tokenScore(v, doc.keywords, 8), tokenScore(v, doc.body, 3));
      }
      if (s > 0) matched++;
      score += s;
    }
    if (!matched) continue;
    score *= matched / tokens.length; // reward matching every word
    if (doc.article.popular) score *= 1.05;
    hits.push({ article: doc.article, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
