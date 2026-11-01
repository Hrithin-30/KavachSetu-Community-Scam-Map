/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IdentifierType = 'phone' | 'upi' | 'url' | 'sender_id';

export interface PostalArea {
  pincode: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
}

/**
 * Appendix B: The 25 official areas used by the test tool, with exact coordinates.
 */
export const OFFICIAL_AREAS: Record<string, PostalArea> = {
  '560102': { pincode: '560102', area: 'HSR Layout', city: 'Bengaluru', lat: 12.9116, lng: 77.6473 },
  '560038': { pincode: '560038', area: 'Indiranagar', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
  '560034': { pincode: '560034', area: 'Koramangala', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  '560066': { pincode: '560066', area: 'Whitefield', city: 'Bengaluru', lat: 12.9698, lng: 77.7500 },
  '560076': { pincode: '560076', area: 'BTM Layout', city: 'Bengaluru', lat: 12.9166, lng: 77.6101 },
  '560011': { pincode: '560011', area: 'Jayanagar', city: 'Bengaluru', lat: 12.9299, lng: 77.5826 },
  '560037': { pincode: '560037', area: 'Marathahalli', city: 'Bengaluru', lat: 12.9591, lng: 77.6974 },
  '560103': { pincode: '560103', area: 'Bellandur', city: 'Bengaluru', lat: 12.9260, lng: 77.6762 },
  '560100': { pincode: '560100', area: 'Electronic City', city: 'Bengaluru', lat: 12.8452, lng: 77.6602 },
  '560078': { pincode: '560078', area: 'JP Nagar', city: 'Bengaluru', lat: 12.9077, lng: 77.5851 },
  '560003': { pincode: '560003', area: 'Malleshwaram', city: 'Bengaluru', lat: 13.0035, lng: 77.5709 },
  '560010': { pincode: '560010', area: 'Rajajinagar', city: 'Bengaluru', lat: 12.9915, lng: 77.5520 },
  '560024': { pincode: '560024', area: 'Hebbal', city: 'Bengaluru', lat: 13.0358, lng: 77.5970 },
  '560064': { pincode: '560064', area: 'Yelahanka', city: 'Bengaluru', lat: 13.1007, lng: 77.5963 },
  '560070': { pincode: '560070', area: 'Banashankari', city: 'Bengaluru', lat: 12.9250, lng: 77.5468 },
  '400050': { pincode: '400050', area: 'Bandra West', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  '110016': { pincode: '110016', area: 'Hauz Khas', city: 'Delhi', lat: 28.5494, lng: 77.2001 },
  '500081': { pincode: '500081', area: 'Madhapur', city: 'Hyderabad', lat: 17.4486, lng: 78.3908 },
  '600020': { pincode: '600020', area: 'Adyar', city: 'Chennai', lat: 13.0012, lng: 80.2565 },
  '411014': { pincode: '411014', area: 'Viman Nagar', city: 'Pune', lat: 18.5679, lng: 73.9143 },
  '700091': { pincode: '700091', area: 'Salt Lake Sector V', city: 'Kolkata', lat: 22.5790, lng: 88.4290 },
  '380015': { pincode: '380015', area: 'Satellite', city: 'Ahmedabad', lat: 23.0260, lng: 72.5085 },
  '302017': { pincode: '302017', area: 'Malviya Nagar', city: 'Jaipur', lat: 26.8570, lng: 75.8080 },
  '226010': { pincode: '226010', area: 'Gomti Nagar', city: 'Lucknow', lat: 26.8540, lng: 80.9990 },
  '682030': { pincode: '682030', area: 'Kakkanad', city: 'Kochi', lat: 10.0159, lng: 76.3419 }
};

export interface VerifiedEntity {
  type: IdentifierType;
  normalizedValue: string;
  displayValue: string;
  name: string;
}

/**
 * Appendix C: Verified numbers, sender IDs, URLs, and UPI IDs.
 * A lookup on any of these must return VERIFIED_BUSINESS, never a scam.
 */
export const VERIFIED_ENTITIES: VerifiedEntity[] = [
  { type: 'phone', normalizedValue: '1930', displayValue: '1930', name: 'National Cybercrime Helpline' },
  { type: 'phone', normalizedValue: '1909', displayValue: '1909', name: 'TRAI Do Not Disturb' },
  { type: 'phone', normalizedValue: '18001600', displayValue: '1800 1600', name: 'HDFC Bank customer care' },
  { type: 'phone', normalizedValue: '18002600', displayValue: '1800 2600', name: 'HDFC Bank customer care' },
  { type: 'phone', normalizedValue: '18001080', displayValue: '1800 1080', name: 'ICICI Bank customer care' },
  { type: 'phone', normalizedValue: '18001234', displayValue: '1800 1234', name: 'State Bank of India customer care' },
  { type: 'phone', normalizedValue: '18002100', displayValue: '1800 2100', name: 'State Bank of India customer care' },
  { type: 'phone', normalizedValue: '18604195555', displayValue: '1860 419 5555', name: 'Axis Bank customer care' },
  { type: 'phone', normalizedValue: '18602662666', displayValue: '1860 266 2666', name: 'Kotak Mahindra Bank customer care' },
  { type: 'sender_id', normalizedValue: 'HDFCBK', displayValue: 'HDFCBK', name: 'HDFC Bank SMS sender' },
  { type: 'sender_id', normalizedValue: 'ICICIB', displayValue: 'ICICIB', name: 'ICICI Bank SMS sender' },
  { type: 'sender_id', normalizedValue: 'SBIINB', displayValue: 'SBIINB', name: 'State Bank of India SMS sender' },
  { type: 'sender_id', normalizedValue: 'AXISBK', displayValue: 'AXISBK', name: 'Axis Bank SMS sender' },
  { type: 'sender_id', normalizedValue: 'KOTAKB', displayValue: 'KOTAKB', name: 'Kotak Mahindra Bank SMS sender' },
  { type: 'url', normalizedValue: 'https://cybercrime.gov.in', displayValue: 'https://cybercrime.gov.in', name: 'National Cyber Crime Reporting Portal' },
  { type: 'url', normalizedValue: 'https://sancharsaathi.gov.in', displayValue: 'https://sancharsaathi.gov.in', name: 'Sanchar Saathi' },
  { type: 'phone', normalizedValue: '+918041002233', displayValue: '+91 80 4100 2233', name: 'Fresh Bakes, Indiranagar' },
  { type: 'phone', normalizedValue: '+918025530190', displayValue: '+91 80 2553 0190', name: 'Koramangala Pharmacy' },
  { type: 'upi', normalizedValue: 'freshbakes@okaxis', displayValue: 'freshbakes@okaxis', name: 'Fresh Bakes, Indiranagar' }
];

export const SCAM_TYPES: Array<{ id: string; label: string; labelHi: string; desc: string }> = [
  { id: 'digital-arrest', label: 'Digital Arrest Video Call', labelHi: 'डिजिटल अरेस्ट वीडियो कॉल', desc: 'Fake police/CBI/customs officer on video call demanding money' },
  { id: 'fake-kyc-link', label: 'Fake Bank KYC Link', labelHi: 'नकली बैंक KYC लिंक', desc: 'SMS/WhatsApp link claiming bank account or PAN will be blocked' },
  { id: 'upi-refund-qr', label: 'UPI Refund / QR Code Scam', labelHi: 'UPI रिफंड / QR स्कैम', desc: '"Scan QR or enter PIN to receive money" actually debits account' },
  { id: 'investment-group', label: 'WhatsApp Stock / Trading Group', labelHi: 'व्हाट्सएप निवेश ग्रुप', desc: 'Fake VIP trading app showing fabricated high returns' },
  { id: 'courier-customs', label: 'FedEx / Customs Parcel Scam', labelHi: 'कूरियर / कस्टम पार्सल स्कैम', desc: 'Claiming illegal drugs/passports found in a parcel in your name' },
  { id: 'job-offer', label: 'Part-Time Task / Job Scam', labelHi: 'पार्ट-टाइम जॉब स्कैम', desc: 'Telegram/YouTube like-and-earn tasks asking for prepaid deposits' },
  { id: 'lottery-prize', label: 'Lottery / Prize Fee Scam', labelHi: 'लॉटरी / इनाम स्कैम', desc: 'Fake prize win demanding processing or tax fee upfront' },
  { id: 'loan-app-harassment', label: 'Instant Loan App Extortion', labelHi: 'लोन ऐप ब्लैकमेलिंग', desc: 'Predatory 7-day loan app threatening contacts with morphed photos' },
  { id: 'electricity-disconnection', label: 'Electricity Bill Disconnection', labelHi: 'बिजली बिल कटौती SMS', desc: '"Power will be cut tonight at 9:30 PM, call officer immediately"' },
  { id: 'fake-customer-care', label: 'Fake Customer Care Number', labelHi: 'नकली कस्टमर केयर नंबर', desc: 'Fraudulent helpline number found on search engines or social media' },
  { id: 'otp-call', label: 'OTP / Credit Card Verification', labelHi: 'OTP / कार्ड वेरिफिकेशन कॉल', desc: 'Caller posing as bank staff asking for OTP or CVV' },
  { id: 'sextortion', label: 'Video Call Sextortion', labelHi: 'वीडियो कॉल ब्लैकमेल', desc: 'Screen-recorded trap call threatening social media exposure' },
  { id: 'other', label: 'Other Fraud Pattern', labelHi: 'अन्य साइबर धोखाधड़ी', desc: 'Any other suspicious cyber financial fraud' }
];

export const REPORT_CHANNELS = [
  'Phone call',
  'SMS or WhatsApp',
  'QR code',
  'Fake website',
  'UPI request',
  'Something else'
];

/**
 * Normalize Indian Phone Number:
 * - Short helplines: 1930, 1909 -> '1930', '1909'
 * - Toll-free numbers starting 1800 or 1860 (8 to 11 digits): e.g. '1800 1600' -> '18001600', '1860 419 5555' -> '18604195555'
 * - Standard 10-digit Indian mobile/landline: +91 98765 43210, 09876543210, 98765-43210, 919876543210 -> '+919876543210'
 * - Rejects junk ('12345', 'test', '0000000000', '9999999999', '+91XXXXXXXXXX') with null.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Reject if contains letters (like 'test' or 'XXXX')
  if (/[a-zA-Z]/.test(trimmed)) {
    return null;
  }

  // Strip spaces, hyphens, parentheses, dots
  const cleaned = trimmed.replace(/[\s\-().]/g, '');

  // Check short helplines (1930, 1909)
  if (cleaned === '1930' || cleaned === '1909') {
    return cleaned;
  }

  // Check toll-free numbers starting with 1800 or 1860
  const digitsOnly = cleaned.replace(/^\+?91/, '');
  if (/^(1800|1860)\d{4,7}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^(1800|1860)\d{4,7}$/.test(digitsOnly)) {
    return digitsOnly;
  }

  // Extract 10-digit Indian subscriber number
  let tenDigits = '';
  if (/^\+91\d{10}$/.test(cleaned)) {
    tenDigits = cleaned.slice(3);
  } else if (/^91\d{10}$/.test(cleaned)) {
    tenDigits = cleaned.slice(2);
  } else if (/^0\d{10}$/.test(cleaned)) {
    tenDigits = cleaned.slice(1);
  } else if (/^\d{10}$/.test(cleaned)) {
    tenDigits = cleaned;
  } else {
    return null;
  }

  // Validate 10-digit Indian mobile ([6-9]...) or landline ([2-8]..., e.g. 8041002233 for Bengaluru 080)
  if (!/^[2-9]\d{9}$/.test(tenDigits)) {
    return null;
  }

  // Reject obvious repetitive junk like 0000000000, 1111111111, 9999999999, 1234567890
  if (/^(\d)\1{9}$/.test(tenDigits) || tenDigits === '1234567890' || tenDigits === '98765432100') {
    return null;
  }

  return `+91${tenDigits}`;
}

/**
 * Normalize UPI ID:
 * - Lowercase, no spaces. Ravi12@OKAXIS -> ravi12@okaxis
 * - Must have handle@provider format.
 */
export function normalizeUpi(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/\s+/g, '').toLowerCase();
  if (!/^[a-z0-9._-]{2,64}@[a-z0-9]{2,32}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Normalize Link / URL:
 * - https://, no www., nothing after ?, no / at the end.
 * - http://www.sbi-kyc.in/pay?utm=sms becomes https://sbi-kyc.in/pay
 */
export function normalizeUrl(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();
  if (!s || /\s/.test(s)) return null;

  if (!/^https?:\/\//i.test(s)) {
    s = 'https://' + s;
  }

  try {
    const parsed = new URL(s);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    // Host must contain at least one dot and valid TLD
    if (!host.includes('.') || host.endsWith('.') || host.startsWith('.')) {
      return null;
    }
    const tld = host.split('.').pop() || '';
    if (tld.length < 2) return null;

    let pathname = parsed.pathname || '';
    // Strip trailing slashes
    pathname = pathname.replace(/\/+$/, '');

    return `https://${host}${pathname}`;
  } catch {
    return null;
  }
}

/**
 * Normalize SMS Sender ID:
 * - The 6-letter (or 5-8 alphanumeric) code without the 2-letter prefix the phone adds.
 * - VM-HDFCBK, AD-HDFCBK, and HDFCBK all become HDFCBK.
 */
export function normalizeSenderId(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!s) return null;

  // Strip 2-character telco prefix like VM-, AD-, JD-, AX-, VK-, TM-, QP-
  if (/^[A-Z0-9]{2}-[A-Z0-9]{5,8}$/.test(s)) {
    s = s.slice(3);
  } else if (/^[A-Z]{2}[A-Z]{6}$/.test(s) && (s.startsWith('VM') || s.startsWith('AD') || s.startsWith('AX') || s.startsWith('JD') || s.startsWith('VK'))) {
    s = s.slice(2);
  }

  // Must be 5 to 8 uppercase alphanumeric characters, and not common junk words like 'TEST' or '12345'
  if (!/^[A-Z0-9]{5,8}$/.test(s)) {
    return null;
  }
  if (/^\d+$/.test(s) || s === 'TESTING') {
    return null;
  }

  return s;
}

export function normalizeIdentifier(type: IdentifierType, rawValue: string): string | null {
  switch (type) {
    case 'phone':
      return normalizePhone(rawValue);
    case 'upi':
      return normalizeUpi(rawValue);
    case 'url':
      return normalizeUrl(rawValue);
    case 'sender_id':
      return normalizeSenderId(rawValue);
    default:
      return null;
  }
}

/**
 * Privacy Rule #2:
 * Hide identifiers until at least 3 different people have reported them:
 * - Phone: +919876543210 -> 98XXXXX210
 * - UPI ID: ravi12@okaxis -> r***@okaxis
 * - Link: https://sbi-kyc.in/pay -> sbi***.in/...
 * - Sender ID: HDFCBK -> HD****
 */
export function maskIdentifier(type: IdentifierType, normalizedValue: string, isConfirmedOrVerified: boolean): string {
  if (isConfirmedOrVerified) {
    return normalizedValue;
  }

  switch (type) {
    case 'phone': {
      const digits = normalizedValue.replace(/^\+91/, '');
      if (digits.length === 10) {
        return `${digits.slice(0, 2)}XXXXX${digits.slice(7)}`;
      }
      if (digits.length >= 6) {
        return `${digits.slice(0, 2)}XXXX${digits.slice(-2)}`;
      }
      return digits;
    }
    case 'upi': {
      const [user, handle] = normalizedValue.split('@');
      if (!handle) return normalizedValue;
      return `${user.charAt(0)}***@${handle}`;
    }
    case 'url': {
      try {
        const u = new URL(normalizedValue);
        const parts = u.hostname.split('.');
        const tld = parts.length > 1 ? parts.slice(1).join('.') : 'in';
        const prefix = parts[0].slice(0, 3);
        return `${prefix}***.${tld}/...`;
      } catch {
        return `${normalizedValue.slice(0, 6)}***`;
      }
    }
    case 'sender_id': {
      if (normalizedValue.length >= 2) {
        return `${normalizedValue.slice(0, 2)}****`;
      }
      return '****';
    }
    default:
      return normalizedValue;
  }
}

export function findVerifiedEntity(type: IdentifierType, normalizedValue: string): VerifiedEntity | undefined {
  return VERIFIED_ENTITIES.find(
    (item) => item.type === type && item.normalizedValue.toLowerCase() === normalizedValue.toLowerCase()
  );
}

export function isValidPincode(pincode: string): boolean {
  if (!pincode || typeof pincode !== 'string') return false;
  const clean = pincode.trim();
  return Boolean(OFFICIAL_AREAS[clean] || /^[1-9]\d{5}$/.test(clean));
}

export function getAreaByPincode(pincode: string): PostalArea {
  const clean = pincode?.trim();
  if (OFFICIAL_AREAS[clean]) {
    return OFFICIAL_AREAS[clean];
  }
  return {
    pincode: clean || '560102',
    area: `Postal Sector ${clean || '560102'}`,
    city: 'Bengaluru',
    lat: 12.9116,
    lng: 77.6473
  };
}

/**
 * Haversine distance in kilometers between two coordinates.
 */
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}
