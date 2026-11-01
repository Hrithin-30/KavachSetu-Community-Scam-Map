/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'hi';

export const TRANSLATIONS: Record<
  Language,
  {
    navVerify: string;
    navMap: string;
    navAlerts: string;
    navTrack: string;
    navOrgLicense: string;
    btnReportScam: string;
    btnOfficerLogin: string;
    heroTitle: string;
    heroSubtitle: string;
    tabPhone: string;
    tabUpi: string;
    tabUrl: string;
    tabSender: string;
    placeholderPhone: string;
    placeholderUpi: string;
    placeholderUrl: string;
    placeholderSender: string;
    btnCheckNow: string;
    quickTestLabel: string;
    privacyGuaranteeTitle: string;
    privacyGuaranteeText: string;
    verdictKnownScam: string;
    verdictSuspicious: string;
    verdictNoReports: string;
    verdictVerified: string;
    reportModalTitle: string;
    reportModalSubtitle: string;
    disputeModalTitle: string;
    disputeModalSubtitle: string;
  }
> = {
  en: {
    navVerify: 'Verify',
    navMap: 'Scam Map',
    navAlerts: 'Alerts',
    navTrack: 'Track Case',
    navOrgLicense: 'Org License',
    btnReportScam: 'Report a Scam',
    btnOfficerLogin: 'Officer Login',
    heroTitle: 'Check before you trust',
    heroSubtitle: 'Has anyone reported this phone number, UPI ID, or link?',
    tabPhone: 'Phone (+91)',
    tabUpi: 'UPI ID',
    tabUrl: 'Link / URL',
    tabSender: 'SMS Sender (e.g. HDFCBK)',
    placeholderPhone: 'Enter phone number (e.g. +91 98765 43210, 1930), UPI, or link...',
    placeholderUpi: 'Enter UPI ID (e.g. merchant@okaxis, ravi12@ybl)...',
    placeholderUrl: 'Enter website link (e.g. https://sbi-kyc-update.in/verify)...',
    placeholderSender: 'Enter SMS Sender ID (e.g. VM-HDFCBK, AD-SBIINB)...',
    btnCheckNow: 'Check Now',
    quickTestLabel: 'Quick Test:',
    privacyGuaranteeTitle: 'Privacy Guarantee:',
    privacyGuaranteeText:
      'Reports are crowdsourced and subject to automated trust verification. In case of emergency, call 1930. We never store reporter names, phone numbers, or exact addresses. Unverified numbers remain masked until confirmed by at least 3 distinct citizens.',
    verdictKnownScam: 'Known Scam Pattern',
    verdictSuspicious: 'Suspicious Activity (Unconfirmed)',
    verdictNoReports: 'No Scam Reports Found',
    verdictVerified: 'Verified Official Entity',
    reportModalTitle: 'Report a Scam in Under 45 Seconds',
    reportModalSubtitle: '100% Anonymous. Zero PII stored. Protects your neighborhood.',
    disputeModalTitle: 'Business Number / UPI Dispute Portal',
    disputeModalSubtitle: 'Is your legitimate business number or UPI ID wrongly reported? Submit a challenge to place it under review immediately.'
  },
  hi: {
    navVerify: 'जाँच करें',
    navMap: 'स्कैम मैप',
    navAlerts: 'अलर्ट',
    navTrack: 'केस ट्रैक करें',
    navOrgLicense: 'संस्था लाइसेंस',
    btnReportScam: 'स्कैम रिपोर्ट करें',
    btnOfficerLogin: 'अधिकारी लॉगिन',
    heroTitle: 'भरोसा करने से पहले जाँच लें',
    heroSubtitle: 'क्या किसी ने इस फ़ोन नंबर, UPI ID या लिंक को स्कैम रिपोर्ट किया है?',
    tabPhone: 'फ़ोन (+91)',
    tabUpi: 'UPI ID',
    tabUrl: 'लिंक / वेबसाइट',
    tabSender: 'SMS सेंडर (जैसे HDFCBK)',
    placeholderPhone: 'फ़ोन नंबर डालें (जैसे +91 98765 43210, 1930), UPI, या लिंक...',
    placeholderUpi: 'UPI ID डालें (जैसे freshbakes@okaxis)...',
    placeholderUrl: 'वेबसाइट लिंक डालें (जैसे sbi-kyc-update.in/verify)...',
    placeholderSender: 'SMS सेंडर कोड डालें (जैसे VM-HDFCBK)...',
    btnCheckNow: 'अभी जाँचें',
    quickTestLabel: 'त्वरित परीक्षण:',
    privacyGuaranteeTitle: 'गोपनीयता की गारंटी:',
    privacyGuaranteeText:
      'रिपोर्ट क्राउडसोर्स की जाती हैं और स्वचालित ट्रस्ट नियमों द्वारा जाँची जाती हैं। आपातकाल में 1930 पर कॉल करें। हम कभी भी रिपोर्ट करने वाले का नाम, फ़ोन नंबर या सटीक पता सेव नहीं करते हैं। कम से कम 3 अलग नागरिकों द्वारा पुष्टि होने तक नंबर छुपाए जाते हैं।',
    verdictKnownScam: 'पुष्ट स्कैम पैटर्न (Known Scam)',
    verdictSuspicious: 'संदिग्ध गतिविधि (Suspicious)',
    verdictNoReports: 'कोई स्कैम रिपोर्ट नहीं मिली',
    verdictVerified: 'सत्यापित आधिकारिक संस्था (Verified)',
    reportModalTitle: '45 सेकंड में स्कैम रिपोर्ट करें',
    reportModalSubtitle: '100% गुमनाम। आपकी पहचान पूरी तरह सुरक्षित है।',
    disputeModalTitle: 'व्यापारिक नंबर विवाद पोर्टल (Dispute)',
    disputeModalSubtitle: 'क्या आपके असली व्यापारिक नंबर या UPI को गलती से रिपोर्ट किया गया है? तुरंत समीक्षा के लिए दर्ज करें।'
  }
};
