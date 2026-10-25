# SAFE SPHERE — Fire & Emergency SMS Operations Platform
> Tactical Emergency Operations Center (EOC) & Cellular Alert Gateway  
> **Python · Flask · SQLite · Twilio SMS API · Tactical Web Interface**

SAFE SPHERE is a fully functional, live emergency broadcast platform designed to dispatch life-safety cellular SMS alerts to up to five recipient phones with **₹0 hosting, zero paid database, and zero software subscriptions**.

It includes an integrated **Tactical Demo Engine** so you can present or test the entire emergency evacuation drill risk-free without external API failures, plus a native **Twilio SMS Gateway** for real cellular delivery to physical phones.

---

## ⚡ Quick Start on Mac (Local Prototype)

Open Terminal in this directory (`ember_fire_sms`) and run:

### Step 1 — Create and activate virtual environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 2 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 3 — Environment configuration
```bash
cp .env.example .env
```
*(By default, `SMS_PROVIDER=demo` is selected so you can immediately explore and present without any API setup).*

### Step 4 — Launch the application
```bash
python app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

## 📱 Features Included

- **Mission-Critical EOC Command Interface**: Dark tactical aesthetic with high-visibility hazard crimson and amber accents, live digital timecode clock, and real-time operational status beacons.
- **Master Arm/Disarm Safety Switch**: Prevents accidental triggers during briefings and routine checks.
- **Physical Emergency Strobe Button with 3-Second Abort Countdown**: Click the crimson button to initiate an abortable 3-second transmission window with tactile audio feedback.
- **5-Slot Recipient Roster (Enforced ₹0 Cap)**:
  - Add, edit, mute, or remove up to 5 responder phone numbers.
  - Automatically formats Indian (`+91`) mobile numbers to E.164 standard.
  - **⚡ Individual Ping Test**: Test a single recipient's phone without triggering an all-facility alarm.
- **Live Smartphone Lockscreen Simulator**: Interactive iPhone mockup that mirrors the emergency push notification banner in real time as you compose the broadcast.
- **Web Audio Klaxon & Sound System**: Synthesized emergency sirens, switch clicks, and pings without broken external audio files (includes one-click mute).
- **SQLite Database**:
  - Automatically initializes `ember.db` with incident logs, recipient rosters, and system settings.
- **Live Gateway Switcher**: Switch between `demo` and `twilio` modes directly from the UI without restarting the server.
- **Audit Trail & CSV Export**: Detailed log of every broadcast, Twilio SID, delivery latency, and response codes.

---

## 🔑 Activating Real SMS to Indian Phones (₹0 Twilio Trial)

Twilio offers a free trial balance (typically ~$15) when you sign up. Because it's a trial, Twilio enforces two safety rules:

1. **Verified Recipients Only**: You can only send SMS to numbers you have verified under your Twilio account.
2. **SMS Geo-Permissions**: Twilio must have permission enabled to route messages to India (+91).

### Step-by-Step Validation:
1. Create a free account at [twilio.com](https://console.twilio.com/).
2. In the Twilio Console, go to **Phone Numbers** > **Manage** > **Verified Caller IDs**.
3. Add and verify your personal Indian mobile number via the one-time OTP SMS.
4. Go to **Messaging** > **Settings** > **Geo Permissions** and ensure **India** is checked.
5. In your EMBER dashboard, click the **⚙️ (Settings)** icon in the top header.
6. Switch provider to **Twilio SMS API**, enter your `Account SID`, `Auth Token`, and your assigned Twilio Phone Number, then click **Apply Settings**.
7. In the Recipient Roster, set your verified phone in **Slot 1**, then click **⚡ Ping Test**.
8. Your physical phone will buzz with the live EMBER verification SMS!

---

## 🛠️ Project Structure

```
ember_fire_sms/
├── app.py                 # Flask server & REST API endpoints
├── database.py            # SQLite database schema, logger, and queries
├── sms_service.py         # Twilio client integration & Demo gateway simulator
├── requirements.txt       # Python dependencies
├── .env.example           # Environment template
├── .env                   # Local environment file
├── ember.db               # SQLite database file (auto-created)
├── static/
│   ├── css/
│   │   └── style.css      # Mission-critical tactical EOC styling
│   ├── js/
│   │   ├── app.js         # Countdown timer, lockscreen mirror, API calls
│   │   └── audio.js       # Web Audio API sound synthesis engine
│   └── img/
│       └── logo.svg       # Tactical flame insignia
└── templates/
    └── index.html         # Emergency command dashboard
```

---

## 🛡️ License
Prototype demonstration build — Free for educational and emergency preparedness prototyping.
