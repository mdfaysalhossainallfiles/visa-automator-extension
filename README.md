# 🚀 Visa Premium Automator - Chrome Extension v9.0
## OTP Verification System সহ সম্পূর্ণ Automation

![Version](https://img.shields.io/badge/Version-9.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

---

## 📋 বৈশিষ্ট্য (Features)

✅ **OTP ভেরিফিকেশন সিস্টেম**
- 6-ডিজিট OTP স্বয়ংক্রিয় জেনারেশন
- 24 ঘন্টা বৈধতা সহ সেশন-ভিত্তিক OTP
- এক-ক্লিক OTP কপি করার সুবিধা
- রিয়েল-টাইম OTP টাইমার

✅ **স্বয়ংক্রিয় লগইন**
- ফোন নম্বর এবং পাসওয়ার্ড স্বয়ংক্রিয় পূরণ
- লগইনের পর স্বয়ংক্রিয় OTP জেনারেশন

✅ **OTP ভেরিফিকেশন**
- ম্যানুয়াল OTP এন্ট্রি এবং যাচাইকরণ
- 5টি চেষ্টার সীমা সহ নিরাপত্তা

✅ **মাল্টি-ফাইল PDF আপলোড**
- 1টি প্রাথমিক + 3টি অতিরিক্ত ফাইল
- প্রতিটি ফাইল 500 KB সীমা
- ড্র্যাগ-এন্ড-ড্রপ সমর্থন

✅ **স্বয়ংক্রিয় নিয়োগ স্লট বুকিং**
- ক্যালেন্ডার নেভিগেশন
- তারিখ নির্বাচন এবং স্বয়ংক্রিয় বুকিং

---

## 📥 দ্রুত ইনস্টলেশন (Quick Setup)

### ১. ডাউনলোড করুন
```bash
git clone https://github.com/mdfaysalhossainallfiles/visa-automator-extension.git
cd visa-automator-extension
```

### ২. Chrome এ লোড করুন
- Chrome এ যান: `chrome://extensions/`
- **Developer mode** চালু করুন (উপরে দান)
- **Load unpacked** ক্লিক করুন
- ফোল্ডার নির্বাচন করুন → **সম্পূর্ণ!**

### ৩. ব্যবহার শুরু করুন
- Chrome টুলবারে Visa Automator আইকন ক্লিক করুন
- প্যানেল খুলবে
- "🎫 OTP জেনারেট করুন" ক্লিক করুন

---

## 🎯 ৭-ধাপ সম্পূর্ণ প্রক্রিয়া

| ধাপ | কাজ | কীভাবে করবেন |
|------|------|-------|
| **1️⃣** | OTP জেনারেট | "🎫 OTP জেনারেট করুন" ক্লিক → কোড দেখাবে |
| **2️⃣** | OTP কপি করুন | "📋 কপি" বাটনে ক্লিক → ক্লিপবোর্ডে কপি হবে |
| **3️⃣** | OTP ভেরিফাই | OTP পেস্ট করুন → "✓ যাচাই করুন" ক্লিক |
| **4️⃣** | লগইন | ফোন/পাসওয়ার্ড এন্ট্রি → "🚀 1 লগইন" ক্লিক |
| **5️⃣** | OTP এন্ট্রি | "📱 2 OTP" ক্লিক → স্বয়ংক্রিয় পূরণ |
| **6️⃣** | ফাইল আপলোড | PDF ড্র্যাগ করুন → "📎 3 আপলোড" ক্লিক |
| **7️⃣** | স্লট বুকিং | তারিখ নির্বাচন → "📅 4 বুকিং" ক্লিক |

---

## 🔐 OTP সিস্টেম

```
OTP Format:     6-ডিজিট (100000-999999)
Storage:        Chrome Local Storage (সম্পূর্ণ নিরাপদ)
Validity:       24 ঘন্টা
Max Attempts:   5টি চেষ্টা
Auto-Clear:     ট্যাব বন্ধ হলে সব তথ্য মুছে যায়
```

**কীভাবে কাজ করে:**

1. **OTP জেনারেশন** → `background.js` তে তৈরি হয়
2. **Chrome Storage** → লোকালি সংরক্ষিত হয়
3. **OTP ভেরিফিকেশন** → `content.js` দ্বারা যাচাই
4. **Success** → সব অটোমেশন বাটন সক্রিয় হয়
5. **Auto-Lock** → 24 ঘন্টার পর এক্সপায়ার হয়

---

## 📁 ফাইলের অর্থ

| ফাইল | কাজ | গুরুত্ব |
|------|------|--------|
| `manifest.json` | Extension কনফিগারেশন | ⭐⭐⭐ জরুরি |
| `background.js` | OTP লজিক | ⭐⭐⭐ কোর সিস্টেম |
| `content.js` | অটোমেশন স্ক্রিপ্ট | ⭐⭐⭐ মূল কাজ |
| `style.css` | UI ডিজাইন | ⭐⭐ দৃষ্টিমান |
| `README.md` | ডকুমেন্টেশন | ⭐ গাইড |

---

## 🚀 শুরু করার চেকলিস্ট

- [ ] GitHub থেকে কোড ডাউনলোড করেছেন?
- [ ] Chrome এর Developer mode চালু করেছেন?
- [ ] `chrome://extensions/` খুলেছেন?
- [ ] Load unpacked ক্লিক করেছেন?
- [ ] ফোল্ডার সিলেক্ট করেছেন?
- [ ] Visa Automator আইকন দেখা যাচ্ছে?
- [ ] প্যানেল খুলছে?

যদি সব ✓ হয়, তাহলে সেটাপ সম্পূর্ণ! 🎉

---

## 🎓 উদাহরণ ব্যবহার

### সিনারিও: Visa Application সম্পূর্ণ করা

```
সময়: ৩০ মিনিট → ৫ মিনিটে পরিণত হয়!

📱 ম্যানুয়াল প্রক্রিয়া (আগে):
1. ওয়েবসাইটে লগইন - ৫ মিনিট
2. OTP এন্ট্রি - ৩ মিনিট
3. ফর্ম পূরণ - ১০ মিনিট
4. PDFs আপলোড - ৮ মিনিট
5. স্লট বুকিং - ৪ মিনিট
────────────────────
মোট: ৩০ মিনিট ⏱️

✨ Automation প্রক্রিয়া (এখন):
1. OTP জেনারেট - ৩ সেকেন্ড
2. Auto Login - ১০ সেকেন্ড
3. Auto Upload - ২ মিনিট
4. Auto Booking - ৫ সেকেন্ড
────────────────────
মোট: ৫ মিনিট ⚡
```

---

## 🐛 সাধারণ সমস্যা ও সমাধান

### ❌ এক্সটেনশন দেখা যাচ্ছে না
```bash
✓ Check: chrome://extensions/ 
✓ Developer mode চালু?
✓ Load unpacked ক্লিক করেছেন?
→ সমাধান: সব ফাইল একটি ফোল্ডারে রাখুন
```

### ❌ OTP জেনারেট হচ্ছে না
```bash
✓ background.js লোড হয়েছে?
✓ Permissions allow করেছেন?
→ সমাধান: F12 → Console দেখুন, এরর মেসেজ খুঁজুন
```

### ❌ অটোমেশন কাজ করছে না
```bash
✓ OTP ভেরিফাই করেছেন?
✓ সঠিক ওয়েবসাইটে আছেন?
→ সমাধান: Status মেসেজ পড়ুন এবং ধাপে ধাপে করুন
```

---

## 📊 Performance

| মেট্রিক | মান |
|--------|------|
| Extension Size | ~50 KB |
| Load Time | < 1 সেকেন্ড |
| CPU Usage | < 5% |
| Memory | ~15 MB |
| Storage Used | ~200 KB |

---

## 🔒 ডেটা নিরাপত্তা

✅ **সম্পূর্ণ লোকাল স্টোরেজ** - কোথাও পাঠানো হয় না  
✅ **এনক্রিপ্টেড সেশন** - ট্যাব বন্ধ = ডেটা মুছে যায়  
✅ **Multiple Layers** - 5টি চেষ্টার সীমা  
✅ **Auto-expiry** - 24 ঘন্টার পর স্বয়ংক্রিয় মুছে যায়  

---

## 📞 সাপোর্ট পান

- **GitHub Issues**: [Open Issue](https://github.com/mdfaysalhossainallfiles/visa-automator-extension/issues)
- **Developer**: [@mdfaysalhossainallfiles](https://github.com/mdfaysalhossainallfiles)
- **Version**: 9.0 (OTP System)

---

## ⭐ এটি পছন্দ হলে স্টার দিন!

GitHub এ স্টার দিয়ে সাপোর্ট করুন → https://github.com/mdfaysalhossainallfiles/visa-automator-extension

---

**🎉 Happy Visa Automation!**

*সর্বশেষ আপডেট: ২০২৬ সেপ্টেম্বর*
