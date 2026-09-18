<div align="center">

# 🌉 CaptionBridge

### جسر التواصل للطلاب الصم

**Real-time AI-powered lecture transcription & analysis for deaf and hard-of-hearing university students**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#-license)

**🌍 Live Demo** · **📸 Screenshots** · **🏗️ Architecture**

</div>

---

## 🎯 المشكلة

في مصر والوطن العربي، أكثر من **2 مليون طالب أصم** يدرسون في جامعات نظامية. المشكلة:

> **الدكتور يشرح لمدة ساعتين، الطالب الأصم يخرج من المحاضرة بدون أي فكرة عما تم شرحه.**

الوسائل الحالية (مترجم إشارة، تدوين يدوي) **غير كافية**:
- ❌ المترجم متاح لطالب واحد فقط في الصف
- ❌ التدوين اليدوي بطيء وضائع
- ❌ التطبيقات الأجنبية (Otter.ai, Live Transcribe) **لا تفهم العربي جيداً**
- ❌ غالية جداً (اشتراكات شهرية)

---

## 🎨 الحل

**CaptionBridge** — جسر ذكي بين الطالب الأصم والمحاضرة.

يعمل كـ **"أذن ذكية"** تحول كلام الدكتور إلى:
- 📝 **نص مكتوب** في الوقت الفعلي
- 🗺️ **خريطة ذهنية** تفاعلية
- 📚 **معجم مصطلحات** مع شرح
- 📄 **ملخص ذكي** للمراجعة
- 🎴 **كروت مراجعة** تفاعلية
- 🎯 **رادار مهام** يلتقط تلميحات الامتحانات
- ❓ **أسئلة القاعة** المستنتجة من ردود الدكتور

---

## ✨ الفيتشرات (12 فيتشر)

### 🎙️ التسجيل الحي (Core)

| الفيتشر | الوصف |
|---------|-------|
| 🎤 الكلام المباشر | تحويل صوت الدكتور لنص فوري عبر Whisper |
| 🧠 الشرح الذكي | استخراج الموضوع + الفروع + المصطلحات |
| 🗺️ الخريطة الذهنية | رسم تفاعلي شجري للموضوعات |
| 📚 المعجم الأكاديمي | كروت ملونة بكل مصطلح وتعريفه |

### 🚀 الفيتشرات الذكية (AI)

| الفيتشر | الوصف |
|---------|-------|
| 📝 ملخص المحاضرة | ملخص منظم (عنوان + نظرة + نقاط + خلاصة) |
| 🔑 الكلمات المهمة | استخراج الكلمات + تصنيف + أهمية |
| 🎴 كروت المراجعة | أسئلة وأجوبة تفاعلية مع صعوبة |
| 🎯 رادار المهام | التقاط تلميحات الامتحانات والتكليفات مع تنبيه فوري |
| ❓ أسئلة القاعة | استنتاج أسئلة الطلاب البعيدين من ردود الدكتور |
| 💬 المساعد العائم | شات ذكي قابل للسحب يجاوب من محتوى المحاضرة |

### 🔊 إمكانية الوصول

| الفيتشر | الوصف |
|---------|-------|
| 🔔 التنبيهات الصوتية | كشف الأصوات المفاجئة (باب، جرس) مع مؤشر عمودي |
| ✨ تمييز ذكي | تلوين تلقائي للإنجليزي والأرقام والكلمات المفتاحية |

### 👤 إدارة الحساب

| الفيتشر | الوصف |
|---------|-------|
| 👤 صفحة الحساب | بروفايل + إحصائيات + 4 تابات |
| 📚 المحاضرات المحفوظة | حفظ وفتح وحذف المحاضرات في DB |
| ⚙️ الإعدادات | ثيم + حجم خط + حساسية صوت |
| 🛡️ لوحة الأدمن | إدارة المستخدمين + تغيير الباسورد |

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client["Client (Browser)"]
        Mic["Microphone Recorder"]
        React["Next.js Frontend"]
        Audio["Web Audio API"]
    end

    subgraph API["Next.js API Routes"]
        Smart["/api/smart"]
        Analyze["/api/analyze"]
        Features["/api/keywords"]
        Advanced["/api/action-items"]
        AdminAPI["/api/admin/*"]
    end

    subgraph AI["AI Services"]
        Whisper["Groq Whisper"]
        Gemini["Google Gemini"]
        Llama["Llama 3.3 70B"]
    end

    subgraph DB["Database"]
        SQLite["SQLite"]
    end

    Mic --> Smart
    React --> Analyze
    React --> Features
    React --> Advanced
    Audio --> React

    Smart --> Whisper
    Smart --> Llama
    Analyze --> Gemini
    Analyze --> Llama
    Features --> Gemini
    Features --> Llama
    Advanced --> Gemini
    Advanced --> Llama
    AdminAPI --> SQLite

    style Client fill:#8470ff,color:#fff
    style API fill:#67bfff,color:#fff
    style AI fill:#3ec972,color:#fff
    style DB fill:#f0bb33,color:#000