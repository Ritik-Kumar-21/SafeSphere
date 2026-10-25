"""
EMBER Emergency Broadcast & Evacuation Response System
SQLite Database Management Layer
"""

import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ember.db")


def get_db_connection():
    """Returns a row-factory enabled SQLite connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Initializes tables, indexes, and default seed recipients."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Table: System Settings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Table: Recipients (Max 5 enforced in business logic and slot index)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recipients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_number INTEGER UNIQUE CHECK(slot_number BETWEEN 1 AND 5),
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Emergency Contact',
            is_active INTEGER NOT NULL DEFAULT 1,
            is_verified INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Table: Emergency Incidents / Broadcast Events
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_code TEXT UNIQUE NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            location TEXT NOT NULL,
            message_body TEXT NOT NULL,
            triggered_by TEXT NOT NULL DEFAULT 'Local Operator',
            total_recipients INTEGER NOT NULL DEFAULT 0,
            successful_dispatches INTEGER NOT NULL DEFAULT 0,
            failed_dispatches INTEGER NOT NULL DEFAULT 0,
            provider_mode TEXT NOT NULL DEFAULT 'demo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Table: Granular SMS Logs per Recipient
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sms_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id INTEGER,
            recipient_id INTEGER,
            recipient_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            provider TEXT NOT NULL,
            provider_sid TEXT,
            status TEXT NOT NULL, -- 'queued', 'sent', 'delivered', 'failed', 'mock_delivered'
            error_code TEXT,
            error_message TEXT,
            dispatch_latency_ms INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE SET NULL,
            FOREIGN KEY (recipient_id) REFERENCES recipients (id) ON DELETE SET NULL
        )
    """)

    # Table: Campus Notices (SafeSphere)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notices (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Table: Student Requests (SafeSphere)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_requests (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            category TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Table: Campus Alerts (SafeSphere)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS campus_alerts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            location TEXT NOT NULL,
            severity TEXT NOT NULL, -- Critical, High, Medium, Low
            status TEXT NOT NULL DEFAULT 'Active', -- Active, Resolved
            audience INTEGER NOT NULL DEFAULT 248,
            acknowledged INTEGER NOT NULL DEFAULT 0,
            acknowledged_by TEXT NOT NULL DEFAULT '[]',
            simulated INTEGER NOT NULL DEFAULT 1,
            sender TEXT NOT NULL DEFAULT 'Admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Default Settings
    default_settings = [
        ('sms_provider', os.getenv('SMS_PROVIDER', 'twilio')),
        ('facility_name', 'Tech Hub & Innovation Lab - Wing B'),
        ('system_armed', '1'),
        ('auto_retry_failed', '1'),
        ('audio_alerts_enabled', '1'),
        ('total_sms_sent_counter', '0'),
        ('twilio_account_sid', os.getenv('TWILIO_ACCOUNT_SID', '')),
        ('twilio_auth_token', os.getenv('TWILIO_AUTH_TOKEN', '')),
        ('twilio_from_number', os.getenv('TWILIO_FROM_NUMBER', '')),
    ]

    for key, val in default_settings:
        cursor.execute("""
            INSERT OR IGNORE INTO system_settings (key, value)
            VALUES (?, ?)
        """, (key, val))

    # Seed starter notices if empty
    cursor.execute("SELECT COUNT(*) AS count FROM notices")
    if cursor.fetchone()['count'] == 0:
        starter_notices = [
            ("NTC-1", "Monthly safety drill", "A campus-wide evacuation drill is scheduled for Friday at 11:00 AM."),
            ("NTC-2", "Update your contact info", "Please make sure your emergency contact details are up to date.")
        ]
        cursor.executemany("INSERT INTO notices (id, title, body) VALUES (?, ?, ?)", starter_notices)

    # Seed starter campus alerts if empty
    cursor.execute("SELECT COUNT(*) AS count FROM campus_alerts")
    if cursor.fetchone()['count'] == 0:
        starter_alerts = [
            ("ALT-2048", "Fire drill in progress", "Block B evacuation drill is active. Please use the nearest marked exit.", "Block B · Academic", "Critical", "Active", 248, 192, '["ritik"]', 1, "Admin"),
            ("ALT-2047", "Chemistry lab drill", "Chemistry lab corridor is temporarily restricted. Follow safety team instructions.", "Science Block · Lab 3", "High", "Active", 86, 71, '[]', 1, "Admin"),
            ("ALT-2046", "Power backup test", "Emergency power switchover test completed successfully.", "Library · Ground floor", "Medium", "Resolved", 132, 128, '[]', 1, "Admin"),
            ("ALT-2045", "Security check", "Visitor verification drill complete. All campus gates are operational.", "Main Gate", "Low", "Resolved", 64, 61, '[]', 1, "Admin")
        ]
        cursor.executemany("""
            INSERT INTO campus_alerts (id, title, message, location, severity, status, audience, acknowledged, acknowledged_by, simulated, sender)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, starter_alerts)

    # Check if recipients table is empty; if so, populate with 3 realistic starter contacts
    cursor.execute("SELECT COUNT(*) AS count FROM recipients")
    count = cursor.fetchone()['count']
    if count == 0:
        seed_recipients = [
            (1, "Ritik Chauhan", "+91 98211 21275", "Incident Commander / Self", 1, 1, "Primary on-site responder"),
            (2, "Safety Desk Guard", "+91 91234 56789", "Security Desk", 1, 0, "Ground floor security outpost"),
            (3, "Dr. Priya Sharma", "+91 99887 76655", "Floor 2 Evac Marshal", 1, 0, "North wing assembly lead")
        ]
        cursor.executemany("""
            INSERT INTO recipients (slot_number, name, phone_number, role, is_active, is_verified, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, seed_recipients)

    conn.commit()
    conn.close()


def get_recipients():
    """Retrieve all recipients sorted by slot number."""
    conn = get_db_connection()
    recipients = conn.execute("SELECT * FROM recipients ORDER BY slot_number ASC").fetchall()
    conn.close()
    return [dict(r) for r in recipients]


def get_active_recipients():
    """Retrieve active recipients only."""
    conn = get_db_connection()
    recipients = conn.execute("SELECT * FROM recipients WHERE is_active = 1 ORDER BY slot_number ASC").fetchall()
    conn.close()
    return [dict(r) for r in recipients]


def save_recipient(slot_number, name, phone_number, role, is_active=1, notes=""):
    """Insert or update a recipient in a specific slot (1-5)."""
    if not (1 <= int(slot_number) <= 5):
        raise ValueError("Slot number must be between 1 and 5.")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if slot already exists
    cursor.execute("SELECT id FROM recipients WHERE slot_number = ?", (slot_number,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE recipients 
            SET name = ?, phone_number = ?, role = ?, is_active = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE slot_number = ?
        """, (name.strip(), phone_number.strip(), role.strip(), int(is_active), notes.strip(), slot_number))
        rec_id = existing['id']
    else:
        cursor.execute("""
            INSERT INTO recipients (slot_number, name, phone_number, role, is_active, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (slot_number, name.strip(), phone_number.strip(), role.strip(), int(is_active), notes.strip()))
        rec_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return rec_id


def delete_recipient(slot_number):
    """Delete a recipient by slot number."""
    conn = get_db_connection()
    conn.execute("DELETE FROM recipients WHERE slot_number = ?", (slot_number,))
    conn.commit()
    conn.close()


def toggle_recipient_status(recipient_id):
    """Toggle is_active between 0 and 1."""
    conn = get_db_connection()
    conn.execute("UPDATE recipients SET is_active = 1 - is_active WHERE id = ?", (recipient_id,))
    conn.commit()
    conn.close()


def create_incident(alert_type, severity, location, message_body, provider_mode, total_recipients):
    """Logs a new emergency incident event."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Generate incident code e.g. SPH-1025-A1B2
    code = f"SPH-{datetime.now().strftime('%m%d')}-{os.urandom(2).hex().upper()}"

    cursor.execute("""
        INSERT INTO incidents (incident_code, alert_type, severity, location, message_body, provider_mode, total_recipients)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (code, alert_type, severity, location, message_body, provider_mode, total_recipients))
    
    incident_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return incident_id, code


def log_sms_result(incident_id, recipient_id, recipient_name, phone_number, provider, provider_sid, status, error_code=None, error_message=None, latency_ms=0):
    """Logs individual SMS outcome."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO sms_logs (incident_id, recipient_id, recipient_name, phone_number, provider, provider_sid, status, error_code, error_message, dispatch_latency_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (incident_id, recipient_id, recipient_name, phone_number, provider, provider_sid, status, error_code, error_message, latency_ms))

    # Update counts in incident record
    if status in ['sent', 'delivered', 'mock_delivered']:
        cursor.execute("UPDATE incidents SET successful_dispatches = successful_dispatches + 1 WHERE id = ?", (incident_id,))
        # Update lifetime counter
        cursor.execute("UPDATE system_settings SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'total_sms_sent_counter'")
    else:
        cursor.execute("UPDATE incidents SET failed_dispatches = failed_dispatches + 1 WHERE id = ?", (incident_id,))

    conn.commit()
    conn.close()


def get_recent_incidents(limit=20):
    """Get list of recent incidents with aggregate stats."""
    conn = get_db_connection()
    incidents = conn.execute("""
        SELECT * FROM incidents 
        ORDER BY id DESC 
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return [dict(i) for i in incidents]


def get_incident_details(incident_id):
    """Get incident info and all associated SMS recipient logs."""
    conn = get_db_connection()
    incident = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if not incident:
        conn.close()
        return None

    logs = conn.execute("""
        SELECT * FROM sms_logs 
        WHERE incident_id = ? 
        ORDER BY id ASC
    """, (incident_id,)).fetchall()
    conn.close()

    result = dict(incident)
    result['logs'] = [dict(l) for l in logs]
    return result


def get_all_sms_logs(limit=50):
    """Get recent SMS logs with incident context."""
    conn = get_db_connection()
    logs = conn.execute("""
        SELECT s.*, i.incident_code, i.alert_type, i.severity, i.location
        FROM sms_logs s
        LEFT JOIN incidents i ON s.incident_id = i.id
        ORDER BY s.id DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return [dict(l) for l in logs]


def get_setting(key, default=None):
    """Get setting value by key."""
    conn = get_db_connection()
    row = conn.execute("SELECT value FROM system_settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    return row['value'] if row else default


def update_setting(key, value):
    """Update or create setting."""
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    """, (key, str(value)))
    conn.commit()
    conn.close()


def get_dashboard_stats():
    """Calculates live KPI metrics for dashboard."""
    conn = get_db_connection()
    recipients_count = conn.execute("SELECT COUNT(*) AS c FROM recipients").fetchone()['c']
    active_recipients_count = conn.execute("SELECT COUNT(*) AS c FROM recipients WHERE is_active = 1").fetchone()['c']
    total_incidents = conn.execute("SELECT COUNT(*) AS c FROM incidents").fetchone()['c']
    total_sms_sent = conn.execute("SELECT COUNT(*) AS c FROM sms_logs WHERE status IN ('sent', 'delivered', 'mock_delivered')").fetchone()['c']
    total_sms_failed = conn.execute("SELECT COUNT(*) AS c FROM sms_logs WHERE status = 'failed'").fetchone()['c']
    last_incident = conn.execute("SELECT created_at, alert_type, incident_code FROM incidents ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()

    return {
        "recipients_count": recipients_count,
        "active_recipients_count": active_recipients_count,
        "max_recipients": 5,
        "total_incidents": total_incidents,
        "total_sms_sent": total_sms_sent,
        "total_sms_failed": total_sms_failed,
        "last_incident": dict(last_incident) if last_incident else None
    }


def get_notices():
    """Retrieve all campus notices sorted latest first."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM notices ORDER BY datetime(created_at) DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_notice(title, body, notice_id=None):
    """Publish a new notice."""
    import time
    if not notice_id:
        notice_id = f"NTC-{int(time.time() % 100000)}"
    conn = get_db_connection()
    conn.execute("INSERT INTO notices (id, title, body) VALUES (?, ?, ?)", (notice_id, title.strip(), body.strip()))
    conn.commit()
    conn.close()
    return {"id": notice_id, "title": title, "body": body}


def get_student_requests():
    """Retrieve student requests sorted latest first."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM student_requests ORDER BY datetime(created_at) DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_student_request(username, category, subject, message, req_id=None):
    """Submit a student request."""
    import time
    if not req_id:
        req_id = f"REQ-{int(time.time() * 1000)}"
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO student_requests (id, username, category, subject, message, status)
        VALUES (?, ?, ?, ?, ?, 'Open')
    """, (req_id, username.strip(), category.strip(), subject.strip(), message.strip()))
    conn.commit()
    conn.close()
    return {"id": req_id, "username": username, "category": category, "subject": subject, "message": message, "status": "Open"}


def update_request_status(req_id, status):
    """Update status of a student request (Open / Resolved)."""
    conn = get_db_connection()
    conn.execute("UPDATE student_requests SET status = ? WHERE id = ?", (status, req_id))
    conn.commit()
    conn.close()
    return True


def get_campus_alerts():
    """Retrieve all campus alerts sorted latest first."""
    import json
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM campus_alerts ORDER BY datetime(created_at) DESC").fetchall()
    conn.close()
    alerts = []
    for r in rows:
        d = dict(r)
        try:
            d['acknowledged_by'] = json.loads(d.get('acknowledged_by') or '[]')
        except Exception:
            d['acknowledged_by'] = []
        alerts.append(d)
    return alerts


def create_campus_alert(alert_data):
    """Add a campus alert."""
    import json, time
    aid = alert_data.get('id') or f"ALT-{int(time.time() % 100000)}"
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO campus_alerts (id, title, message, location, severity, status, audience, acknowledged, acknowledged_by, simulated, sender)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        aid,
        alert_data.get('title', 'Emergency Alert'),
        alert_data.get('message', ''),
        alert_data.get('location', 'Campus Wide'),
        alert_data.get('severity', 'High'),
        alert_data.get('status', 'Active'),
        int(alert_data.get('audience', 248)),
        int(alert_data.get('acknowledged', 0)),
        json.dumps(alert_data.get('acknowledged_by', [])),
        int(alert_data.get('simulated', 1)),
        alert_data.get('sender', 'Admin')
    ))
    conn.commit()
    conn.close()
    return aid


def acknowledge_campus_alert(alert_id, username):
    """Record an acknowledgment for an alert."""
    import json
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM campus_alerts WHERE id = ?", (alert_id,)).fetchone()
    if not row:
        conn.close()
        return False
    d = dict(row)
    try:
        ack_list = json.loads(d.get('acknowledged_by') or '[]')
    except Exception:
        ack_list = []
    if username not in ack_list:
        ack_list.append(username)
        new_ack = len(ack_list)
        conn.execute("""
            UPDATE campus_alerts 
            SET acknowledged = ?, acknowledged_by = ? 
            WHERE id = ?
        """, (new_ack, json.dumps(ack_list), alert_id))
        conn.commit()
    conn.close()
    return True


def resolve_campus_alert(alert_id):
    """Mark a campus alert as resolved."""
    conn = get_db_connection()
    conn.execute("UPDATE campus_alerts SET status = 'Resolved' WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return True

