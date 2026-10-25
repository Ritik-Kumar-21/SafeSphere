"""
EMBER — Fire & Emergency SMS Broadcast Prototype
Backend Web Application & API Engine
"""

import os
import csv
import io
from flask import Flask, render_template, request, jsonify, Response, send_file
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

from database import (
    init_db,
    get_recipients,
    get_active_recipients,
    save_recipient,
    delete_recipient,
    toggle_recipient_status,
    create_incident,
    log_sms_result,
    get_recent_incidents,
    get_incident_details,
    get_all_sms_logs,
    get_setting,
    update_setting,
    get_dashboard_stats,
    get_notices,
    create_notice,
    get_student_requests,
    create_student_request,
    update_request_status,
    get_campus_alerts,
    create_campus_alert,
    acknowledge_campus_alert,
    resolve_campus_alert
)
from sms_service import sms_gateway, normalize_phone_number

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "ember-emergency-tactical-prototype-2026")

# Initialize database on startup
init_db()

def update_env_file(key: str, value: str):
    """Safely updates key-value pair in .env file."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    lines = []
    found = False
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if line.strip().startswith(f"{key}="):
            new_lines.append(f"{key}={value}\n")
            found = True
        else:
            new_lines.append(line)
            
    if not found:
        new_lines.append(f"{key}={value}\n")
        
    with open(env_path, "w") as f:
        f.writelines(new_lines)


# Synchronize sms_gateway with saved settings or .env
current_provider = get_setting("sms_provider", os.getenv("SMS_PROVIDER", "twilio"))
sid = get_setting("twilio_account_sid", os.getenv("TWILIO_ACCOUNT_SID", ""))
tok = get_setting("twilio_auth_token", os.getenv("TWILIO_AUTH_TOKEN", ""))
from_num = get_setting("twilio_from_number", os.getenv("TWILIO_FROM_NUMBER", ""))

sms_gateway.set_provider(current_provider)
sms_gateway.update_twilio_credentials(sid, tok, from_num)


@app.route("/")
def index():
    """Renders the main tactical operations dashboard."""
    return render_template("index.html")


@app.route("/presentation")
def presentation():
    """Renders the executive pitch deck & product presentation."""
    return render_template("presentation.html")


@app.route("/api/download-pptx")
def download_pptx():
    """Generates and serves the SafeSphere PowerPoint presentation."""
    pptx_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "SafeSphere_EOC_Presentation.pptx")
    if not os.path.exists(pptx_path):
        import generate_ppt
        generate_ppt.build_presentation(pptx_path)
    return send_file(pptx_path, as_attachment=True, download_name="SafeSphere_EOC_Presentation.pptx")


@app.route("/api/status", methods=["GET"])
def get_system_status():
    """Returns real-time telemetry, provider status, and KPI stats."""
    stats = get_dashboard_stats()
    provider = get_setting("sms_provider", "demo")
    twilio_configured = bool(sms_gateway.account_sid and sms_gateway.auth_token and sms_gateway.from_number)

    return jsonify({
        "status": "operational",
        "provider": provider,
        "is_demo_mode": (provider == "demo"),
        "twilio_configured": twilio_configured,
        "twilio_from": sms_gateway.from_number if twilio_configured else None,
        "facility_name": get_setting("facility_name", "Tech Hub & Innovation Lab - Wing B"),
        "system_armed": get_setting("system_armed", "1") == "1",
        "audio_alerts": get_setting("audio_alerts_enabled", "1") == "1",
        "stats": stats
    })


@app.route("/api/recipients", methods=["GET"])
def list_recipients():
    """Returns recipient roster across the 5 slots."""
    recipients = get_recipients()
    
    # Structure 5 fixed slots
    slots = []
    rec_by_slot = {r["slot_number"]: r for r in recipients}
    for slot_idx in range(1, 6):
        if slot_idx in rec_by_slot:
            slots.append(rec_by_slot[slot_idx])
        else:
            slots.append({
                "slot_number": slot_idx,
                "name": None,
                "phone_number": None,
                "role": None,
                "is_active": 0,
                "is_empty": True
            })

    return jsonify({
        "slots": slots,
        "total_configured": len(recipients),
        "max_slots": 5
    })


@app.route("/api/recipients", methods=["POST"])
def upsert_recipient():
    """Adds or updates a recipient in one of the 5 slots."""
    data = request.get_json() or {}
    slot_number = data.get("slot_number")
    name = (data.get("name") or "").strip()
    phone_number = (data.get("phone_number") or "").strip()
    role = (data.get("role") or "Emergency Contact").strip()
    is_active = 1 if data.get("is_active", True) else 0
    notes = (data.get("notes") or "").strip()

    if not slot_number or not (1 <= int(slot_number) <= 5):
        return jsonify({"success": False, "message": "Slot number must be between 1 and 5."}), 400

    if not name:
        return jsonify({"success": False, "message": "Recipient name is required."}), 400

    if not phone_number:
        return jsonify({"success": False, "message": "Valid phone number is required."}), 400

    # Test normalization
    norm_phone = normalize_phone_number(phone_number)
    if not norm_phone or len(norm_phone) < 8:
        return jsonify({"success": False, "message": "Invalid phone format. Please enter an Indian mobile or E.164 number (e.g. +91 9876543210)."}), 400

    try:
        rec_id = save_recipient(slot_number, name, norm_phone, role, is_active, notes)
        return jsonify({
            "success": True,
            "message": f"Recipient saved to Slot {slot_number}.",
            "recipient_id": rec_id,
            "normalized_phone": norm_phone
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/recipients/<int:slot_number>", methods=["DELETE"])
def remove_recipient(slot_number):
    """Deletes recipient in slot."""
    if not (1 <= slot_number <= 5):
        return jsonify({"success": False, "message": "Invalid slot number"}), 400

    delete_recipient(slot_number)
    return jsonify({"success": True, "message": f"Slot {slot_number} cleared."})


@app.route("/api/recipients/<int:recipient_id>/toggle", methods=["POST"])
def toggle_recipient(recipient_id):
    """Toggles recipient active status."""
    toggle_recipient_status(recipient_id)
    return jsonify({"success": True, "message": "Recipient status toggled."})


@app.route("/api/recipients/<int:slot_number>/test-sms", methods=["POST"])
def test_single_recipient_sms(slot_number):
    """
    Sends a test SMS to an individual recipient.
    Crucial for validating the user's personal phone on ₹0 Twilio trial first!
    """
    recipients = get_recipients()
    recipient = next((r for r in recipients if r["slot_number"] == slot_number), None)
    if not recipient:
        return jsonify({"success": False, "message": f"No recipient found in Slot {slot_number}."}), 404

    test_message = (
        f"[SAFE SPHERE TEST] Verification ping for {recipient['name']}. "
        f"Real SMS cellular link is verified and active!"
    )

    result = sms_gateway.send_sms(recipient["phone_number"], test_message)

    # Log into incident and sms_logs as a verification drill
    inc_id, code = create_incident(
        alert_type="Direct Ping Test",
        severity="Low",
        location="Self Test / Console",
        message_body=test_message,
        provider_mode=sms_gateway.provider,
        total_recipients=1
    )

    log_sms_result(
        incident_id=inc_id,
        recipient_id=recipient["id"],
        recipient_name=recipient["name"],
        phone_number=recipient["phone_number"],
        provider=sms_gateway.provider,
        provider_sid=result.get("provider_sid"),
        status=result.get("status", "failed"),
        error_code=result.get("error_code"),
        error_message=result.get("error_message"),
        latency_ms=result.get("latency_ms", 0)
    )

    return jsonify({
        "success": result.get("success", False),
        "result": result,
        "incident_code": code,
        "recipient": recipient
    })


@app.route("/api/alert/broadcast", methods=["POST"])
def broadcast_alert():
    """
    Main Emergency Broadcast Dispatcher.
    Triggers SMS transmission to all currently active recipient slots (up to 5).
    """
    data = request.get_json() or {}

    alert_type = (data.get("alert_type") or "FIRE ALERT").strip()
    severity = (data.get("severity") or "CRITICAL").strip()
    location = (data.get("location") or "Main Facility - All Zones").strip()
    custom_msg = (data.get("message") or "").strip()
    mode_override = data.get("mode_override") # allows explicit test with demo or twilio

    # Verify system armed
    if get_setting("system_armed", "1") != "1" and not data.get("force_override"):
        return jsonify({"success": False, "message": "System is currently DISARMED. Arm system to broadcast."}), 403

    active_recipients = get_active_recipients()
    if not active_recipients:
        return jsonify({
            "success": False, 
            "message": "No active recipients found. Please configure and enable at least 1 recipient."
        }), 400

    # Compose final high-impact broadcast message
    # Keep concise for standard 160-char GSM SMS constraints
    if not custom_msg:
        final_message = f"[SAFE SPHERE {alert_type.upper()}] EVACUATE IMMEDIATELY. Location: {location}. Follow designated emergency exits. Standby for roll-call."
    else:
        final_message = f"[SAFE SPHERE {alert_type.upper()}] {custom_msg}"

    # Temporarily apply mode override if requested
    original_provider = sms_gateway.provider
    if mode_override in ["demo", "twilio"]:
        sms_gateway.set_provider(mode_override)

    try:
        # Create Incident record
        incident_id, incident_code = create_incident(
            alert_type=alert_type,
            severity=severity,
            location=location,
            message_body=final_message,
            provider_mode=sms_gateway.provider,
            total_recipients=len(active_recipients)
        )

        dispatch_results = []
        success_count = 0
        failure_count = 0

        for rec in active_recipients:
            res = sms_gateway.send_sms(rec["phone_number"], final_message)
            res["recipient_id"] = rec["id"]
            res["recipient_name"] = rec["name"]

            log_sms_result(
                incident_id=incident_id,
                recipient_id=rec["id"],
                recipient_name=rec["name"],
                phone_number=rec["phone_number"],
                provider=sms_gateway.provider,
                provider_sid=res.get("provider_sid"),
                status=res.get("status", "failed"),
                error_code=res.get("error_code"),
                error_message=res.get("error_message"),
                latency_ms=res.get("latency_ms", 0)
            )

            if res.get("success"):
                success_count += 1
            else:
                failure_count += 1

            dispatch_results.append(res)

        return jsonify({
            "success": True,
            "incident_code": incident_code,
            "incident_id": incident_id,
            "total_recipients": len(active_recipients),
            "success_count": success_count,
            "failure_count": failure_count,
            "provider_used": sms_gateway.provider,
            "message_sent": final_message,
            "results": dispatch_results
        })

    finally:
        # Restore provider if overridden
        sms_gateway.set_provider(original_provider)


@app.route("/api/incidents", methods=["GET"])
def list_incidents():
    """Returns recent incidents."""
    incidents = get_recent_incidents(limit=25)
    return jsonify({"incidents": incidents})


@app.route("/api/incidents/<int:incident_id>", methods=["GET"])
def view_incident(incident_id):
    """Detailed view of an incident with logs."""
    data = get_incident_details(incident_id)
    if not data:
        return jsonify({"success": False, "message": "Incident not found"}), 404
    return jsonify(data)


@app.route("/api/logs", methods=["GET"])
def list_sms_logs():
    """Returns detailed SMS logs with filtering."""
    logs = get_all_sms_logs(limit=100)
    return jsonify({"logs": logs})


@app.route("/api/settings", methods=["POST"])
def update_settings():
    """Updates system settings and Twilio configuration."""
    data = request.get_json() or {}

    provider = data.get("provider")
    if provider in ["demo", "twilio"]:
        update_setting("sms_provider", provider)
        update_env_file("SMS_PROVIDER", provider)
        sms_gateway.set_provider(provider)

    if "system_armed" in data:
        update_setting("system_armed", "1" if data["system_armed"] else "0")

    if "audio_alerts" in data:
        update_setting("audio_alerts_enabled", "1" if data["audio_alerts"] else "0")

    if "facility_name" in data and data["facility_name"].strip():
        update_setting("facility_name", data["facility_name"].strip())

    # If updating Twilio credentials
    if "twilio_account_sid" in data or "twilio_auth_token" in data or "twilio_from_number" in data:
        sid = (data.get("twilio_account_sid") or "").strip()
        tok = (data.get("twilio_auth_token") or "").strip()
        frm = (data.get("twilio_from_number") or "").strip()
        
        if sid:
            update_setting("twilio_account_sid", sid)
            update_env_file("TWILIO_ACCOUNT_SID", sid)
        if tok:
            update_setting("twilio_auth_token", tok)
            update_env_file("TWILIO_AUTH_TOKEN", tok)
        if frm:
            update_setting("twilio_from_number", frm)
            update_env_file("TWILIO_FROM_NUMBER", frm)
            
        current_sid = get_setting("twilio_account_sid", "")
        current_tok = get_setting("twilio_auth_token", "")
        current_frm = get_setting("twilio_from_number", "")
        sms_gateway.update_twilio_credentials(current_sid, current_tok, current_frm)

    return jsonify({
        "success": True,
        "message": "Settings saved to database and .env successfully.",
        "provider": sms_gateway.provider,
        "twilio_configured": bool(sms_gateway.account_sid and sms_gateway.auth_token and sms_gateway.from_number)
    })


@app.route("/api/settings/test-twilio", methods=["POST"])
def test_twilio():
    """Tests Twilio account credentials."""
    data = request.get_json() or {}
    sid = data.get("twilio_account_sid") or sms_gateway.account_sid
    tok = data.get("twilio_auth_token") or sms_gateway.auth_token

    # Temporarily set to test
    old_sid, old_tok = sms_gateway.account_sid, sms_gateway.auth_token
    sms_gateway.account_sid = sid
    sms_gateway.auth_token = tok

    try:
        test_res = sms_gateway.test_twilio_connection()
        return jsonify(test_res)
    finally:
        sms_gateway.account_sid = old_sid
        sms_gateway.auth_token = old_tok


@app.route("/api/export-logs", methods=["GET"])
def export_logs():
    """Exports all incident & SMS logs as CSV."""
    logs = get_all_sms_logs(limit=500)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Log ID", "Timestamp", "Incident Code", "Alert Type", "Recipient", "Phone Number", "Provider", "Status", "Provider SID", "Error Code", "Error Message", "Latency (ms)"])

    for l in logs:
        writer.writerow([
            l.get("id"),
            l.get("created_at"),
            l.get("incident_code") or "N/A",
            l.get("alert_type") or "N/A",
            l.get("recipient_name"),
            l.get("phone_number"),
            l.get("provider"),
            l.get("status"),
            l.get("provider_sid"),
            l.get("error_code") or "",
            l.get("error_message") or "",
            l.get("dispatch_latency_ms")
        ])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=safesphere_sms_audit_log.csv"}
    )


# ==========================================
# SAFESPHERE API ENDPOINTS (Notices, Requests, Alerts)
# ==========================================

@app.route("/api/notices", methods=["GET", "POST"])
def handle_notices():
    """List notices or post a new campus notice."""
    if request.method == "POST":
        data = request.get_json() or {}
        title = data.get("title", "").strip()
        body = data.get("body", "").strip()
        if not title or not body:
            return jsonify({"success": False, "error": "Title and body are required."}), 400
        notice = create_notice(title, body)
        return jsonify({"success": True, "notice": notice})
    
    notices = get_notices()
    return jsonify({"success": True, "notices": notices})


@app.route("/api/requests", methods=["GET", "POST"])
def handle_student_requests():
    """List student requests or submit a new safety request."""
    if request.method == "POST":
        data = request.get_json() or {}
        username = data.get("username", "student").strip()
        category = data.get("category", "Safety concern").strip()
        subject = data.get("subject", "").strip()
        message = data.get("message", "").strip()
        if len(subject) < 3 or len(message) < 5:
            return jsonify({"success": False, "error": "Subject must be >= 3 chars and message >= 5 chars."}), 400
        req = create_student_request(username, category, subject, message)
        return jsonify({"success": True, "request": req})
    
    reqs = get_student_requests()
    return jsonify({"success": True, "requests": reqs})


@app.route("/api/requests/<req_id>", methods=["PATCH", "PUT"])
def update_student_req(req_id):
    """Update status of a student request (e.g. resolve)."""
    data = request.get_json() or {}
    status = data.get("status", "Resolved")
    update_request_status(req_id, status)
    return jsonify({"success": True, "status": status})


@app.route("/api/alerts", methods=["GET", "POST"])
def handle_campus_alerts():
    """List all campus alerts or publish a new alert with optional live SMS."""
    if request.method == "POST":
        data = request.get_json() or {}
        aid = create_campus_alert(data)
        
        # If live SMS is requested, broadcast to active recipient slots
        if data.get("send_sms"):
            active = get_active_recipients()
            sms_body = f"[SAFE SPHERE {data.get('severity', 'ALERT').upper()}] {data.get('title')}: {data.get('message')}. Loc: {data.get('location')}."
            for rec in active:
                try:
                    sms_gateway.send_sms(rec["phone_number"], sms_body)
                except Exception as e:
                    print(f"Error sending SMS to {rec['name']}: {e}")
                    
        return jsonify({"success": True, "id": aid})
        
    alerts = get_campus_alerts()
    return jsonify({"success": True, "alerts": alerts})


@app.route("/api/alerts/<alert_id>/ack", methods=["POST"])
def ack_alert(alert_id):
    """Student acknowledges they are safe."""
    data = request.get_json() or {}
    username = data.get("username", "student").strip()
    acknowledge_campus_alert(alert_id, username)
    return jsonify({"success": True, "alert_id": alert_id, "username": username})


@app.route("/api/alerts/<alert_id>/resolve", methods=["POST"])
def resolve_alert(alert_id):
    """Admin marks alert resolved."""
    resolve_campus_alert(alert_id)
    return jsonify({"success": True, "alert_id": alert_id})



if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print(f"""
    ===============================================================
       EMBER — Tactical Emergency SMS Broadcast Engine
       Running on: http://127.0.0.1:{port}
       Provider Mode: {sms_gateway.provider.upper()}
    ===============================================================
    """)
    try:
        app.run(host="127.0.0.1", port=port, debug=True)
    except OSError as e:
        if "Address already in use" in str(e):
            fallback_port = 5050
            print(f"[!] Port {port} occupied (commonly macOS AirPlay). Falling back to http://127.0.0.1:{fallback_port}")
            app.run(host="127.0.0.1", port=fallback_port, debug=True)
        else:
            raise
