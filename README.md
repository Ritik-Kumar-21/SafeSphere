# 🛡️ SAFE SPHERE — Emergency Operations Center & Cellular Alert Gateway
> **Tactical Emergency Operations Center (EOC) · Real-Time Incident Response · Live Twilio SMS Gateway**  
> *Python · Flask · SQLite · Vanilla CSS 3D Animations · Twilio Cellular API*

SAFE SPHERE is a live, mission-critical emergency broadcast platform engineered to dispatch life-safety cellular SMS alerts to physical phones with **₹0 hosting, zero paid database, and zero software subscriptions**.

It includes a tactile **3D Operations Center Interface** (interactive 3D push buttons, isometric smartphone chassis simulator, holographic radar wave telemetry, cursor parallax tilt) plus a native **Twilio SMS Gateway** for real cellular delivery to recipient phones.

---

## ⚡ Quick Start — How to Run from GitHub

Follow these simple steps on any Mac, Linux, or Windows (WSL) machine:

### 1. Clone the Repository
```bash
git clone https://github.com/adityashukla-official/SafeSphere.git
cd SafeSphere
```

### 2. Create and Activate Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```
*(On Windows PowerShell: `.\.venv\Scripts\Activate.ps1`)*

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create Environment File
```bash
cp .env.example .env
```
*(By default, `SMS_PROVIDER=demo` is pre-configured so you can immediately explore and present the entire platform without any API setup. To send real SMS to physical phones, add your free Twilio trial credentials to `.env`).*

### 5. Start the Application
```bash
python app.py
```
Open **[http://127.0.0.1:5001](http://127.0.0.1:5001)** in your browser!

---

## 🌐 How to Run with a Free Live Public HTTPS URL

If you want to access the website from your mobile phone or share it with others online without localhost:

```bash
chmod +x start_live.sh
./start_live.sh
```

This executable launcher:
1. Boots Flask locally on port `5001`.
2. Automatically opens an encrypted **Cloudflare Tunnel** giving you a public HTTPS URL (e.g. `https://xxxx.trycloudflare.com`) accessible from any device worldwide at ₹0 cost.

---

## 📱 Features Included

- **3D Tactical EOC Interface**:
  - Mechanical hydraulic 3D emergency broadcast button with abort timer.
  - Floating 3D isometric smartphone preview reflecting live messages.
  - 3D cursor-following parallax tilt and specular glare physics.
  - Holographic 3D radar pulse waves on recipient cards.
  - Dual-axis rotating gyroscope gimbal rings.
- **5-Slot Recipient Management (Enforced ₹0 Cap)**:
  - Add, edit, mute, or remove up to 5 responder phone numbers.
  - Individual cellular ping tests to verify phones before an actual broadcast.
- **Real Twilio Cellular SMS Integration**:
  - Direct carrier delivery to verified physical mobile phones.
  - Automatic template fallback for trial number routing.
- **SQLite Audit Trail**:
  - Automatically initializes `ember.db`.
  - Records every incident, carrier delivery latency, SID, and status.
  - One-click CSV audit log export.
- **Web Audio Klaxon & Sound System**:
  - Synthesized dual-tone emergency sirens, relay clicks, and pings directly via Web Audio API.
- **100% Mobile Responsive**:
  - Scales seamlessly from 320px phone screens to 4K desktop command centers.

---

## 🔑 Activating Real SMS to Physical Phones (₹0 Twilio Trial)

1. Sign up for a free trial at [twilio.com/console](https://console.twilio.com/).
2. In the Twilio Console, go to **Phone Numbers** > **Manage** > **Verified Caller IDs** and verify your phone number via OTP SMS.
3. Open `.env` and set:
   ```env
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_FROM_NUMBER=your_assigned_trial_number_here
   ```
4. Restart `python app.py`.
5. Enter your phone in **Slot 1** on the dashboard and click **⚡ Ping Test** to receive a real SMS!

---

## 🛠️ Project Structure

```
SafeSphere/
├── app.py                 # Flask web backend & REST API endpoints
├── database.py            # SQLite database schema, logger, and queries
├── sms_service.py         # Twilio client integration & Demo gateway simulator
├── requirements.txt       # Python dependencies (Flask, twilio, python-dotenv)
├── .env.example           # Environment template
├── start_live.sh          # 1-click launcher for Flask + Cloudflare public tunnel
├── static/
│   ├── css/
│   │   └── style.css      # 3D transforms, themes, and responsive design
│   ├── js/
│   │   ├── app.js         # 3D parallax engine, countdown, telemetry
│   │   └── audio.js       # Web Audio API siren synthesizer
│   └── img/
│       ├── logo.svg       # Vector Safe Sphere defense emblem
│       └── campus-courtyard.jpg
└── templates/
    └── index.html         # Operations center dashboard
```

---

## 🛡️ License
Prototype demonstration build — Free for educational, hackathon, and emergency preparedness prototyping.
