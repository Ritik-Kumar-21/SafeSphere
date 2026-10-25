/**
 * EMBER — Tactical Emergency SMS Operations System
 * Core Frontend Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // App State
    const state = {
        armed: true,
        provider: "demo",
        isDemo: true,
        recipients: [],
        currentPreset: "fire",
        abortSecondsRemaining: 3,
        audioMuted: false,
        currentTheme: (localStorage.getItem("safesphere_theme_v3") ? localStorage.getItem("safesphere_theme") : "safesphere") || "safesphere"
    };
    localStorage.setItem("safesphere_theme_v3", "true");

    // DOM Elements
    const elements = {
        clockTime: document.getElementById("clock-time"),
        providerBadge: document.getElementById("provider-badge"),
        armedSwitch: document.getElementById("system-armed-toggle"),
        btnFireEmergency: document.getElementById("btn-fire-emergency"),
        abortOverlay: document.getElementById("abort-countdown-overlay"),
        abortCountSpan: document.getElementById("abort-countdown-seconds"),
        btnAbortAction: document.getElementById("btn-abort-action"),
        audioToggleBtn: document.getElementById("btn-toggle-audio"),
        themeToggleBtn: document.getElementById("btn-theme-toggle"),
        themeIcon: document.getElementById("theme-icon"),
        themeName: document.getElementById("theme-name"),
        settingsBtn: document.getElementById("btn-open-settings"),
        exportLogsBtn: document.getElementById("btn-export-logs"),
        
        // Form Inputs
        alertTypeSelect: document.getElementById("alert-type"),
        severitySelect: document.getElementById("severity-level"),
        locationInput: document.getElementById("alert-location"),
        messageTextarea: document.getElementById("alert-message"),
        charCounter: document.getElementById("char-counter"),
        smsCreditsCounter: document.getElementById("sms-credits-counter"),

        // Phone Simulator Preview
        phoneClock: document.getElementById("phone-preview-clock"),
        phoneDate: document.getElementById("phone-preview-date"),
        notifTitle: document.getElementById("preview-notif-title"),
        notifBody: document.getElementById("preview-notif-body"),
        notifTime: document.getElementById("preview-notif-time"),
        phoneNotification: document.getElementById("phone-push-card"),

        // Recipient Roster Grid
        rosterGrid: document.getElementById("recipient-roster-grid"),
        configuredSlotsCount: document.getElementById("configured-slots-count"),

        // KPI Badges
        kpiTotalIncidents: document.getElementById("kpi-total-incidents"),
        kpiSmsSent: document.getElementById("kpi-sms-sent"),
        kpiActiveLinks: document.getElementById("kpi-active-links"),
        kpiLastIncident: document.getElementById("kpi-last-incident"),

        // Real Gateway Banner
        gatewayBanner: document.getElementById("real-gateway-banner"),
        gatewayHeading: document.getElementById("gateway-banner-heading"),
        gatewayDesc: document.getElementById("gateway-banner-desc"),
        btnBannerConfig: document.getElementById("btn-banner-config-twilio"),

        // Audit Logs Table
        auditLogsTableBody: document.getElementById("audit-logs-tbody"),

        // Modals
        recipientModal: document.getElementById("modal-recipient"),
        recipientModalClose: document.getElementById("modal-recipient-close"),
        recipientForm: document.getElementById("recipient-form"),
        recipientSlotInput: document.getElementById("recipient-slot-number"),
        recipientNameInput: document.getElementById("recipient-name"),
        recipientPhoneInput: document.getElementById("recipient-phone"),
        recipientRoleInput: document.getElementById("recipient-role"),
        recipientNotesInput: document.getElementById("recipient-notes"),
        recipientActiveCheckbox: document.getElementById("recipient-is-active"),
        btnDeleteRecipient: document.getElementById("btn-delete-recipient"),

        settingsModal: document.getElementById("modal-settings"),
        settingsModalClose: document.getElementById("modal-settings-close"),
        settingsForm: document.getElementById("settings-form"),
        providerSelect: document.getElementById("setting-provider-mode"),
        facilityNameInput: document.getElementById("setting-facility-name"),
        twilioSidInput: document.getElementById("setting-twilio-sid"),
        twilioTokenInput: document.getElementById("setting-twilio-token"),
        twilioFromInput: document.getElementById("setting-twilio-from"),
        btnTestTwilio: document.getElementById("btn-test-twilio-conn"),
        twilioTestResult: document.getElementById("twilio-test-result"),

        logDetailModal: document.getElementById("modal-log-detail"),
        logDetailClose: document.getElementById("modal-log-detail-close"),
        logDetailContent: document.getElementById("log-detail-body"),

        // 3D Illusion & Physics Studio Controls
        btnOpen3DStudio: document.getElementById("btn-open-3d-studio"),
        btnDepthPill: document.getElementById("btn-depth-pill"),
        modal3DIllusions: document.getElementById("modal-3d-illusions"),
        modal3DClose: document.getElementById("modal-3d-close"),
        btnReset3DDefaults: document.getElementById("btn-reset-3d-defaults"),
        toggle3DFloating: document.getElementById("toggle-3d-floating"),
        toggle3DGyro: document.getElementById("toggle-3d-gyro"),
        slider3DParallax: document.getElementById("slider-3d-parallax"),
        val3DParallax: document.getElementById("val-3d-parallax"),
        slider3DYaw: document.getElementById("slider-3d-yaw"),
        val3DYaw: document.getElementById("val-3d-yaw"),
        slider3DPitch: document.getElementById("slider-3d-pitch"),
        val3DPitch: document.getElementById("val-3d-pitch"),
        slider3DElevation: document.getElementById("slider-3d-elevation"),
        val3DElevation: document.getElementById("val-3d-elevation"),
        slider3DGlare: document.getElementById("slider-3d-glare"),
        val3DGlare: document.getElementById("val-3d-glare"),
        slider3DRadar: document.getElementById("slider-3d-radar"),
        val3DRadar: document.getElementById("val-3d-radar"),
        slider3DGyro: document.getElementById("slider-3d-gyro"),
        val3DGyro: document.getElementById("val-3d-gyro"),
        slider3DBtn: document.getElementById("slider-3d-btn"),
        val3DBtn: document.getElementById("val-3d-btn"),

        toastContainer: document.getElementById("toast-container")
    };

    // ================================================================
    // PRESET DEFINITIONS
    // ================================================================
    const PRESETS = {
        fire: {
            type: "FIRE ALERT",
            severity: "CRITICAL",
            location: "Tech Hub - Main Building (All Floors)",
            message: "CODE RED FIRE DETECTED. Evacuate immediately via North/South fire stairwells. Do NOT use elevators. Assemble at Zone A parking grounds."
        },
        gas: {
            type: "GAS LEAK HAZARD",
            severity: "CRITICAL",
            location: "Level 1 Chemistry & Battery Lab",
            message: "AMBER ALERT: Hazardous gas sensor triggered in Lab 102. Evacuate to upwind muster area. Maintenance team dispatched."
        },
        drill: {
            type: "EMERGENCY DRILL",
            severity: "LOW",
            location: "Facility Wide",
            message: "MUSTER DRILL: This is a scheduled evacuation safety drill. Proceed to designated emergency assembly points for attendance verification."
        },
        weather: {
            type: "SEVERE WEATHER",
            severity: "MEDIUM",
            location: "Campus Exterior & Terraces",
            message: "WEATHER ALERT: High-velocity squall warning in effect. Clear all rooftop decks and exterior patios. Shelter inside until all-clear."
        },
        custom: {
            type: "FACILITY ALERT",
            severity: "HIGH",
            location: "Facility Site",
            message: ""
        }
    };

    // ================================================================
    // VISUAL THEMES ENGINE
    // ================================================================
    const THEMES = [
        { id: "safesphere", name: "Safe Sphere", icon: "🌐" },
        { id: "cybershield", name: "Cyber Matrix", icon: "⚡" },
        { id: "polarday", name: "Polar Daylight", icon: "☀️" }
    ];

    function applyTheme(themeId) {
        state.currentTheme = themeId;
        document.documentElement.setAttribute("data-theme", themeId);
        localStorage.setItem("safesphere_theme", themeId);

        const current = THEMES.find(t => t.id === themeId) || THEMES[0];
        if (elements.themeIcon) elements.themeIcon.textContent = current.icon;
        if (elements.themeName) elements.themeName.textContent = current.name;
    }

    function cycleTheme() {
        window.soundEngine.playSwitchClick();
        const currentIndex = THEMES.findIndex(t => t.id === state.currentTheme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        applyTheme(THEMES[nextIndex].id);
        showToast(`Visual theme: ${THEMES[nextIndex].name}`, "info");
    }

    // ================================================================
    // INITIALIZATION & TIMERS
    // ================================================================
    function init() {
        applyTheme(state.currentTheme);
        startClock();
        loadSystemStatus();
        loadRecipients();
        loadAuditLogs();
        setupEventListeners();
        applyPreset("fire");
        updateSmsLengthMetrics();
        syncAudioButton();
        init3DIllusionStudio();
        init3DParallaxTilt();
    }

    function startClock() {
        function tick() {
            const now = new Date();
            // Format for telemetry display
            const timeStr = now.toLocaleTimeString("en-IN", { hour12: false });
            const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            
            if (elements.clockTime) {
                elements.clockTime.textContent = `${timeStr} IST`;
            }
            if (elements.phoneClock) {
                const phoneTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                elements.phoneClock.textContent = phoneTime;
            }
            if (elements.phoneDate) {
                elements.phoneDate.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
            }
        }
        tick();
        setInterval(tick, 1000);
    }

    // ================================================================
    // 3D SPATIAL ILLUSION & PHYSICS CALIBRATION STUDIO
    // ================================================================
    const DEFAULT_3D_SETTINGS = {
        parallax: 1.0,
        yaw: -8,
        pitch: 7,
        elevation: 16,
        glare: 80,
        radar: 2.2,
        gyro: 4.0,
        btnDepth: 8,
        floating: true,
        gyroSpin: true
    };

    const PRESETS_3D = {
        hyper: {
            parallax: 2.2,
            yaw: -18,
            pitch: 14,
            elevation: 32,
            glare: 100,
            radar: 1.2,
            gyro: 2.0,
            btnDepth: 14,
            floating: true,
            gyroSpin: true
        },
        tactical: {
            parallax: 1.0,
            yaw: -8,
            pitch: 7,
            elevation: 16,
            glare: 80,
            radar: 2.2,
            gyro: 4.0,
            btnDepth: 8,
            floating: true,
            gyroSpin: true
        },
        subtle: {
            parallax: 0.4,
            yaw: -3,
            pitch: 2,
            elevation: 8,
            glare: 40,
            radar: 3.0,
            gyro: 6.0,
            btnDepth: 5,
            floating: true,
            gyroSpin: true
        },
        flat: {
            parallax: 0.0,
            yaw: 0,
            pitch: 0,
            elevation: 0,
            glare: 0,
            radar: 2.2,
            gyro: 4.0,
            btnDepth: 3,
            floating: false,
            gyroSpin: false
        }
    };

    function init3DIllusionStudio() {
        let saved = null;
        try {
            const raw = localStorage.getItem("safesphere_3d_fx");
            if (raw) saved = JSON.parse(raw);
        } catch (e) {
            console.warn("Could not load 3D settings", e);
        }

        state.settings3D = Object.assign({}, DEFAULT_3D_SETTINGS, saved || {});

        // Helper to update CSS variables and UI
        function applySettings(settings, save = true) {
            const root = document.documentElement;
            root.style.setProperty("--3d-parallax-scale", settings.parallax);
            root.style.setProperty("--3d-phone-yaw", `${settings.yaw}deg`);
            root.style.setProperty("--3d-phone-pitch", `${settings.pitch}deg`);
            root.style.setProperty("--3d-phone-elevation", `${settings.elevation}px`);
            root.style.setProperty("--3d-glare-opacity", (settings.glare / 100).toFixed(2));
            root.style.setProperty("--3d-radar-duration", `${settings.radar}s`);
            root.style.setProperty("--3d-gyro-duration", `${settings.gyro}s`);
            root.style.setProperty("--3d-btn-depth", `${settings.btnDepth}px`);
            root.style.setProperty("--3d-phone-anim", settings.floating ? "phoneFloat3D 6s ease-in-out infinite alternate" : "none");
            root.style.setProperty("--3d-gyro-state", settings.gyroSpin ? "running" : "paused");

            // Sync controls
            if (elements.slider3DParallax) elements.slider3DParallax.value = settings.parallax;
            if (elements.val3DParallax) elements.val3DParallax.textContent = `${Number(settings.parallax).toFixed(1)}x`;

            if (elements.slider3DYaw) elements.slider3DYaw.value = settings.yaw;
            if (elements.val3DYaw) elements.val3DYaw.textContent = `${settings.yaw}°`;

            if (elements.slider3DPitch) elements.slider3DPitch.value = settings.pitch;
            if (elements.val3DPitch) elements.val3DPitch.textContent = `${settings.pitch}°`;

            if (elements.slider3DElevation) elements.slider3DElevation.value = settings.elevation;
            if (elements.val3DElevation) elements.val3DElevation.textContent = `${settings.elevation}px`;

            if (elements.slider3DGlare) elements.slider3DGlare.value = settings.glare;
            if (elements.val3DGlare) elements.val3DGlare.textContent = `${settings.glare}%`;

            if (elements.slider3DRadar) elements.slider3DRadar.value = settings.radar;
            if (elements.val3DRadar) elements.val3DRadar.textContent = `${Number(settings.radar).toFixed(1)}s`;

            if (elements.slider3DGyro) elements.slider3DGyro.value = settings.gyro;
            if (elements.val3DGyro) elements.val3DGyro.textContent = `${Number(settings.gyro).toFixed(1)}s`;

            if (elements.slider3DBtn) elements.slider3DBtn.value = settings.btnDepth;
            if (elements.val3DBtn) elements.val3DBtn.textContent = `${settings.btnDepth}px`;

            if (elements.toggle3DFloating) elements.toggle3DFloating.checked = !!settings.floating;
            if (elements.toggle3DGyro) elements.toggle3DGyro.checked = !!settings.gyroSpin;

            if (save) {
                try {
                    localStorage.setItem("safesphere_3d_fx", JSON.stringify(settings));
                } catch (e) {}
            }
        }

        // Initial application
        applySettings(state.settings3D, false);

        // Map sliders to actions
        const sliderBindings = [
            { el: elements.slider3DParallax, badge: elements.val3DParallax, key: "parallax", unit: "x", format: v => Number(v).toFixed(1) },
            { el: elements.slider3DYaw, badge: elements.val3DYaw, key: "yaw", unit: "°", format: v => v },
            { el: elements.slider3DPitch, badge: elements.val3DPitch, key: "pitch", unit: "°", format: v => v },
            { el: elements.slider3DElevation, badge: elements.val3DElevation, key: "elevation", unit: "px", format: v => v },
            { el: elements.slider3DGlare, badge: elements.val3DGlare, key: "glare", unit: "%", format: v => v },
            { el: elements.slider3DRadar, badge: elements.val3DRadar, key: "radar", unit: "s", format: v => Number(v).toFixed(1) },
            { el: elements.slider3DGyro, badge: elements.val3DGyro, key: "gyro", unit: "s", format: v => Number(v).toFixed(1) },
            { el: elements.slider3DBtn, badge: elements.val3DBtn, key: "btnDepth", unit: "px", format: v => v }
        ];

        sliderBindings.forEach(binding => {
            if (!binding.el) return;
            binding.el.addEventListener("input", (e) => {
                const val = parseFloat(e.target.value);
                state.settings3D[binding.key] = val;
                if (binding.badge) binding.badge.textContent = `${binding.format(val)}${binding.unit}`;
                applySettings(state.settings3D, true);

                // Unmark preset active
                document.querySelectorAll(".btn-preset-3d").forEach(btn => btn.classList.remove("active"));
            });
        });

        // Toggles
        if (elements.toggle3DFloating) {
            elements.toggle3DFloating.addEventListener("change", (e) => {
                state.settings3D.floating = e.target.checked;
                applySettings(state.settings3D, true);
            });
        }
        if (elements.toggle3DGyro) {
            elements.toggle3DGyro.addEventListener("change", (e) => {
                state.settings3D.gyroSpin = e.target.checked;
                applySettings(state.settings3D, true);
            });
        }

        // Preset Chips
        document.querySelectorAll(".btn-preset-3d").forEach(btn => {
            btn.addEventListener("click", () => {
                const presetKey = btn.dataset.preset;
                if (PRESETS_3D[presetKey]) {
                    document.querySelectorAll(".btn-preset-3d").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    state.settings3D = Object.assign({}, PRESETS_3D[presetKey]);
                    applySettings(state.settings3D, true);
                    if (window.soundEngine) window.soundEngine.playSwitchClick();
                    showToast(`3D Calibration: ${btn.textContent.trim()}`, "info");
                }
            });
        });

        // Reset Defaults
        if (elements.btnReset3DDefaults) {
            elements.btnReset3DDefaults.addEventListener("click", () => {
                state.settings3D = Object.assign({}, DEFAULT_3D_SETTINGS);
                applySettings(state.settings3D, true);
                document.querySelectorAll(".btn-preset-3d").forEach(b => {
                    b.classList.toggle("active", b.dataset.preset === "tactical");
                });
                if (window.soundEngine) window.soundEngine.playSwitchClick();
                showToast("3D Illusion parameters restored to default", "info");
            });
        }

        // Modal Open / Close
        function open3DStudio() {
            if (elements.modal3DIllusions) {
                elements.modal3DIllusions.classList.add("open");
                if (window.soundEngine) window.soundEngine.playArmTone();
            }
        }
        function close3DStudio() {
            if (elements.modal3DIllusions) {
                elements.modal3DIllusions.classList.remove("open");
            }
        }

        if (elements.btnOpen3DStudio) elements.btnOpen3DStudio.addEventListener("click", open3DStudio);
        if (elements.btnDepthPill) elements.btnDepthPill.addEventListener("click", open3DStudio);
        if (elements.modal3DClose) elements.modal3DClose.addEventListener("click", close3DStudio);
        if (elements.modal3DIllusions) {
            elements.modal3DIllusions.addEventListener("click", (e) => {
                if (e.target === elements.modal3DIllusions) close3DStudio();
            });
        }
    }

    // ================================================================
    // 3D PARALLAX TILT & SPECULAR GLARE ENGINE
    // ================================================================
    function init3DParallaxTilt() {
        const tiltTargets = document.querySelectorAll(
            ".metric-card, .slot-card, .console-panel, .phone-simulator-panel, .audit-panel, .phone-device-chassis"
        );

        tiltTargets.forEach(el => {
            if (el.dataset.tiltInitialized) return;
            el.dataset.tiltInitialized = "true";

            el.addEventListener("mousemove", (e) => {
                if (window.innerWidth <= 768) return;
                const scale = state.settings3D ? state.settings3D.parallax : 1.0;
                if (scale === 0) {
                    el.style.transform = "";
                    return;
                }

                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Tailored limits based on element type
                let maxDeg = 4.5;
                if (el.classList.contains("metric-card")) maxDeg = 8;
                if (el.classList.contains("slot-card")) maxDeg = 6;
                if (el.classList.contains("phone-device-chassis")) maxDeg = 9;

                maxDeg *= scale;

                const rotateX = -((y - centerY) / centerY) * maxDeg;
                const rotateY = ((x - centerX) / centerX) * maxDeg;

                if (el.classList.contains("phone-device-chassis")) {
                    const yaw = (state.settings3D ? state.settings3D.yaw : -8) + rotateY;
                    const pitch = (state.settings3D ? state.settings3D.pitch : 7) + rotateX;
                    const elevation = (state.settings3D ? state.settings3D.elevation : 16) + 12;
                    el.style.transform = `perspective(1200px) rotateY(${yaw.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) translateZ(${elevation}px)`;
                } else {
                    el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(12px)`;
                }

                // Update specular glare reflection position
                const glareX = ((x / rect.width) * 100).toFixed(1);
                const glareY = ((y / rect.height) * 100).toFixed(1);
                el.style.setProperty("--glare-x", `${glareX}%`);
                el.style.setProperty("--glare-y", `${glareY}%`);
                el.style.setProperty("--glare-opacity", "0.14");
            });

            el.addEventListener("mouseleave", () => {
                el.style.transform = "";
                el.style.setProperty("--glare-opacity", "0");
            });
        });
    }

    // ================================================================
    // TELEMETRY & API LOADERS
    // ================================================================
    async function loadSystemStatus() {
        try {
            const res = await fetch("/api/status");
            const data = await res.json();
            
            state.provider = data.provider;
            state.isDemo = data.is_demo_mode;
            state.armed = data.system_armed;
            state.twilioConfigured = data.twilio_configured;

            // Update Header Status
            if (elements.providerBadge) {
                elements.providerBadge.textContent = state.isDemo ? "DEMO SIMULATOR (₹0)" : (state.twilioConfigured ? "TWILIO REAL CELLULAR" : "TWILIO (KEYS NEEDED)");
                elements.providerBadge.className = `mode-badge ${state.isDemo ? 'demo' : 'twilio'}`;
            }

            // Update Real Gateway Banner
            if (elements.gatewayBanner) {
                if (state.provider === 'twilio') {
                    if (state.twilioConfigured) {
                        elements.gatewayBanner.className = "real-gateway-banner connected";
                        if (elements.gatewayHeading) elements.gatewayHeading.textContent = "✔ REAL TWILIO CELLULAR GATEWAY CONNECTED:";
                        if (elements.gatewayDesc) elements.gatewayDesc.textContent = `Transmitting real SMS alerts to physical phones via ${data.twilio_from || 'Twilio'}. Real carrier delivery active.`;
                        if (elements.btnBannerConfig) elements.btnBannerConfig.textContent = "⚙️ Gateway Settings";
                    } else {
                        elements.gatewayBanner.className = "real-gateway-banner";
                        if (elements.gatewayHeading) elements.gatewayHeading.textContent = "⚠️ REAL CELLULAR SMS ACTIVE (CREDENTIALS REQUIRED):";
                        if (elements.gatewayDesc) elements.gatewayDesc.textContent = "Twilio credentials are required to dispatch actual cellular SMS to real phone numbers. Click to connect your Account SID, Auth Token & Number.";
                        if (elements.btnBannerConfig) elements.btnBannerConfig.textContent = "🔑 Connect Twilio Keys";
                    }
                } else {
                    elements.gatewayBanner.className = "real-gateway-banner connected";
                    if (elements.gatewayHeading) elements.gatewayHeading.textContent = "DEMO SIMULATOR ACTIVE:";
                    if (elements.gatewayDesc) elements.gatewayDesc.textContent = "Currently simulating cellular SMS dispatch. Click to activate real Twilio SMS mode.";
                    if (elements.btnBannerConfig) elements.btnBannerConfig.textContent = "Switch to Real Twilio SMS";
                }
            }

            // Sync Armed Switch
            if (elements.armedSwitch) {
                elements.armedSwitch.checked = state.armed;
                updateArmedUI(state.armed);
            }

            // Update KPIs
            if (data.stats) {
                if (elements.kpiTotalIncidents) elements.kpiTotalIncidents.textContent = data.stats.total_incidents;
                if (elements.kpiSmsSent) elements.kpiSmsSent.textContent = data.stats.total_sms_sent;
                if (elements.kpiActiveLinks) elements.kpiActiveLinks.textContent = `${data.stats.active_recipients_count} / 5`;
                if (elements.configuredSlotsCount) elements.configuredSlotsCount.textContent = `${data.stats.recipients_count} / 5 Slots Assigned`;
                
                if (elements.kpiLastIncident && data.stats.last_incident) {
                    const dt = new Date(data.stats.last_incident.created_at);
                    elements.kpiLastIncident.textContent = `${data.stats.last_incident.alert_type} (${dt.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})})`;
                }
            }

        } catch (err) {
            console.error("Failed to load system status:", err);
        }
    }

    async function loadRecipients() {
        try {
            const res = await fetch("/api/recipients");
            const data = await res.json();
            state.recipients = data.slots || [];
            renderRecipientRoster(state.recipients);
        } catch (err) {
            console.error("Failed to load recipients:", err);
            showToast("Failed to fetch recipient roster", "error");
        }
    }

    async function loadAuditLogs() {
        try {
            const res = await fetch("/api/logs");
            const data = await res.json();
            renderAuditLogs(data.logs || []);
        } catch (err) {
            console.error("Failed to load audit logs:", err);
        }
    }

    // ================================================================
    // ROSTER RENDERING (5 SLOTS MAX)
    // ================================================================
    function renderRecipientRoster(slots) {
        if (!elements.rosterGrid) return;
        elements.rosterGrid.innerHTML = "";

        slots.forEach(slot => {
            const card = document.createElement("div");
            card.className = "slot-card";

            if (slot.is_empty) {
                card.className += " empty-slot";
                card.innerHTML = `
                    <div class="empty-slot-content">
                        <div class="empty-slot-icon">＋</div>
                        <div style="font-weight: 700; color: #fff;">SLOT ${slot.slot_number} UNASSIGNED</div>
                        <div style="font-size: 0.72rem;">Click to configure recipient</div>
                    </div>
                `;
                card.addEventListener("click", () => openRecipientModal(slot.slot_number));
            } else {
                const isActive = slot.is_active === 1;
                card.className += isActive ? " active-slot" : " muted-slot";

                // Format phone visually
                let phoneDisplay = slot.phone_number;
                let flagEmoji = "📱";
                if (slot.phone_number.startsWith("+91")) {
                    flagEmoji = "🇮🇳";
                }

                card.innerHTML = `
                    <div>
                        <div class="slot-header">
                            <span class="slot-badge">SLOT 0${slot.slot_number}</span>
                            <span class="slot-carrier-indicator ${isActive ? '' : 'muted'}">
                                <span class="status-beacon ${isActive ? 'active' : 'warning'}"></span>
                                ${isActive ? 'LINK ARMED' : 'MUTED'}
                            </span>
                        </div>
                        <div class="recipient-name">${escapeHTML(slot.name)}</div>
                        <div class="recipient-role">${escapeHTML(slot.role || 'Responder')}</div>
                        <div class="recipient-phone">
                            <span class="flag">${flagEmoji}</span>
                            <span>${escapeHTML(phoneDisplay)}</span>
                        </div>
                    </div>
                    <div class="slot-actions">
                        <button class="btn-slot-action ping" title="Send individual test SMS" data-slot="${slot.slot_number}">
                            <span>⚡</span> Ping Test
                        </button>
                        <button class="btn-slot-action edit" title="Edit recipient details" data-slot="${slot.slot_number}">
                            <span>✎</span> Edit
                        </button>
                        <button class="btn-slot-action toggle" title="${isActive ? 'Mute' : 'Arm'} this contact" data-id="${slot.id}">
                            ${isActive ? 'Mute' : 'Arm'}
                        </button>
                    </div>
                `;

                // Wire action buttons
                card.querySelector(".btn-slot-action.ping").addEventListener("click", (e) => {
                    e.stopPropagation();
                    testSingleRecipient(slot.slot_number);
                });
                card.querySelector(".btn-slot-action.edit").addEventListener("click", (e) => {
                    e.stopPropagation();
                    openRecipientModal(slot.slot_number, slot);
                });
                card.querySelector(".btn-slot-action.toggle").addEventListener("click", async (e) => {
                    e.stopPropagation();
                    await toggleRecipient(slot.id);
                });
            }

            elements.rosterGrid.appendChild(card);
        });

        // Apply 3D perspective parallax to newly rendered slot cards
        init3DParallaxTilt();
    }

    // ================================================================
    // AUDIT LOG RENDERING
    // ================================================================
    function renderAuditLogs(logs) {
        if (!elements.auditLogsTableBody) return;
        elements.auditLogsTableBody.innerHTML = "";

        if (logs.length === 0) {
            elements.auditLogsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">
                        No emergency broadcasts recorded yet. Trigger an alert or test ping to initiate activity logs.
                    </td>
                </tr>
            `;
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement("tr");
            tr.style.cursor = "pointer";

            const timeStr = log.created_at ? log.created_at.replace("T", " ").substring(0, 19) : "N/A";
            const statusClass = log.status === "mock_delivered" ? "mock_delivered" : (log.status === "sent" ? "sent" : "failed");
            const statusText = log.status === "mock_delivered" ? "MOCK DELIVERED" : (log.status === "sent" ? "TWILIO SENT" : "FAILED");

            tr.innerHTML = `
                <td class="mono-cell" style="color: var(--text-muted);">${timeStr}</td>
                <td class="mono-cell" style="color: var(--tactical-cyan); font-weight: 700;">${log.incident_code || 'PING'}</td>
                <td style="font-weight: 600; color: #fff;">${escapeHTML(log.recipient_name)}</td>
                <td class="mono-cell">${escapeHTML(log.phone_number)}</td>
                <td><span class="status-tag ${statusClass}">${statusText}</span></td>
                <td class="mono-cell" style="color: var(--text-muted);">${log.dispatch_latency_ms || 120}ms</td>
                <td class="mono-cell" style="color: var(--text-secondary);">${log.provider_sid ? log.provider_sid.substring(0, 14) + '...' : (log.error_code || '—')}</td>
            `;

            tr.addEventListener("click", () => openLogDetailModal(log));
            elements.auditLogsTableBody.appendChild(tr);
        });
    }

    // ================================================================
    // EMERGENCY TRIGGER & ABORT COUNTDOWN
    // ================================================================
    function triggerEmergencyFlow() {
        if (!state.armed) {
            showToast("System is DISARMED. Arm system first to broadcast.", "warning");
            return;
        }

        if (state.provider === "twilio" && !state.twilioConfigured) {
            showToast("Twilio API keys required to send actual cellular SMS. Opening Gateway settings...", "warning");
            openSettingsModal();
            return;
        }

        window.soundEngine.playSwitchClick();

        // Start 3-second abort countdown
        state.abortSecondsRemaining = 3;
        elements.abortCountSpan.textContent = state.abortSecondsRemaining;
        elements.abortOverlay.classList.add("active");

        // Countdown timer tick
        state.abortCountdownTimer = setInterval(() => {
            state.abortSecondsRemaining -= 1;
            elements.abortCountSpan.textContent = state.abortSecondsRemaining;
            window.soundEngine.playPing();

            if (state.abortSecondsRemaining <= 0) {
                clearInterval(state.abortCountdownTimer);
                elements.abortOverlay.classList.remove("active");
                executeBroadcast();
            }
        }, 1000);
    }

    function abortBroadcast() {
        if (state.abortCountdownTimer) {
            clearInterval(state.abortCountdownTimer);
            state.abortCountdownTimer = null;
        }
        if (window.soundEngine && typeof window.soundEngine.stopEmergencyAlarm === "function") {
            window.soundEngine.stopEmergencyAlarm();
        }
        elements.abortOverlay.classList.remove("active");
        window.soundEngine.playSwitchClick();
        showToast("EMERGENCY BROADCAST ABORTED BY OPERATOR", "warning");
    }

    async function executeBroadcast() {
        elements.btnFireEmergency.disabled = true;
        elements.btnFireEmergency.innerHTML = `<span>⏳</span> TRANSMITTING CELLULAR BROADCAST...`;

        // Play authentic emergency siren for 5 seconds
        if (window.soundEngine) {
            window.soundEngine.playEmergencyAlarm(5.0);
        }

        // Animate phone push preview
        animatePhonePush();

        const payload = {
            alert_type: elements.alertTypeSelect.value,
            severity: elements.severitySelect.value,
            location: elements.locationInput.value,
            message: elements.messageTextarea.value.trim()
        };

        try {
            const res = await fetch("/api/alert/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                showToast(`🚨 BROADCAST SENT (${data.incident_code}): ${data.success_count} Dispatched, ${data.failure_count} Failed`, "success");
                // Delay triumph chime until 5.0-second emergency siren finishes
                setTimeout(() => {
                    if (window.soundEngine) window.soundEngine.playSuccessChime();
                }, 5000);
            } else {
                showToast(`Broadcast Error: ${data.message}`, "error");
            }

            // Refresh logs and KPI
            await loadSystemStatus();
            await loadAuditLogs();

        } catch (err) {
            console.error("Broadcast failed:", err);
            showToast("Network dispatch failed. Check local server connection.", "error");
        } finally {
            elements.btnFireEmergency.disabled = !state.armed;
            elements.btnFireEmergency.innerHTML = `<span>⚠️</span> TRANSMIT EMERGENCY SMS BROADCAST <span>⚠️</span>`;
        }
    }

    // Individual Test Ping
    async function testSingleRecipient(slotNumber) {
        if (state.provider === "twilio" && !state.twilioConfigured) {
            showToast("Twilio API keys required to send actual SMS. Please connect your keys.", "warning");
            openSettingsModal();
            return;
        }

        window.soundEngine.playSwitchClick();
        showToast(`Sending real cellular test ping to Slot ${slotNumber}...`, "info");

        // Trigger 3D Holographic Radar Pulse Animation on the slot card
        const pingBtn = document.querySelector(`.btn-slot-action.ping[data-slot="${slotNumber}"]`);
        const slotCard = pingBtn?.closest(".slot-card");
        if (slotCard) {
            slotCard.classList.remove("radar-pulse-active-3d");
            void slotCard.offsetWidth;
            slotCard.classList.add("radar-pulse-active-3d");
            setTimeout(() => slotCard.classList.remove("radar-pulse-active-3d"), 2600);
        }

        try {
            const res = await fetch(`/api/recipients/${slotNumber}/test-sms`, { method: "POST" });
            const data = await res.json();

            if (data.success) {
                window.soundEngine.playSuccessChime();
                showToast(`⚡ Test SMS accepted for ${data.recipient.name} via ${data.result.provider}!`, "success");
                animatePhonePush();
            } else {
                const errMsg = data.result?.error_message || data.message || "Failed";
                showToast(`Ping failed: ${errMsg}`, "error");
            }

            await loadSystemStatus();
            await loadAuditLogs();

        } catch (err) {
            console.error("Test ping failed:", err);
            showToast("Failed to send test ping", "error");
        }
    }

    // Toggle Recipient Active
    async function toggleRecipient(recipientId) {
        window.soundEngine.playSwitchClick();
        try {
            await fetch(`/api/recipients/${recipientId}/toggle`, { method: "POST" });
            await loadRecipients();
            await loadSystemStatus();
        } catch (err) {
            showToast("Failed to toggle status", "error");
        }
    }

    // ================================================================
    // PRESETS & MESSAGE METRICS
    // ================================================================
    function applyPreset(key) {
        const p = PRESETS[key] || PRESETS.fire;
        state.currentPreset = key;

        // Highlight chip
        document.querySelectorAll(".preset-chip").forEach(chip => {
            chip.classList.toggle("active", chip.dataset.preset === key);
        });

        elements.alertTypeSelect.value = p.type;
        elements.severitySelect.value = p.severity;
        elements.locationInput.value = p.location;
        elements.messageTextarea.value = p.message;

        updatePhonePreview();
        updateSmsLengthMetrics();
    }

    function updateSmsLengthMetrics() {
        const text = elements.messageTextarea.value;
        const len = text.length;
        // Standard GSM 03.38 character limit is 160. Multiple SMS split at 153 chars.
        const credits = len === 0 ? 1 : Math.ceil(len / 160);

        if (elements.charCounter) {
            elements.charCounter.textContent = `${len} / 160 chars`;
        }
        if (elements.smsCreditsCounter) {
            elements.smsCreditsCounter.textContent = `${credits} SMS Credit${credits > 1 ? 's' : ''}`;
        }
    }

    function updatePhonePreview() {
        const alertType = elements.alertTypeSelect.value || "EMERGENCY ALERT";
        const message = elements.messageTextarea.value || "Emergency notification in progress.";

        if (elements.notifTitle) {
            elements.notifTitle.textContent = `SAFE SPHERE [${alertType.toUpperCase()}]`;
        }
        if (elements.notifBody) {
            elements.notifBody.textContent = message;
        }
    }

    function animatePhonePush() {
        if (elements.phoneNotification) {
            elements.phoneNotification.classList.remove("vibrate");
            void elements.phoneNotification.offsetWidth; // trigger reflow
            elements.phoneNotification.classList.add("vibrate");
        }

        // Trigger 3D Haptic Pop and Jolt on the Smartphone Chassis
        const phoneChassis = document.getElementById("phone-device-chassis");
        if (phoneChassis) {
            phoneChassis.classList.remove("haptic-pop-3d");
            void phoneChassis.offsetWidth;
            phoneChassis.classList.add("haptic-pop-3d");
            setTimeout(() => {
                phoneChassis.classList.remove("haptic-pop-3d");
            }, 750);
        }
    }

    // ================================================================
    // MODALS: RECIPIENTS, SETTINGS, LOG DETAILS
    // ================================================================
    function openRecipientModal(slotNumber, existing = null) {
        window.soundEngine.playSwitchClick();
        elements.recipientSlotInput.value = slotNumber;
        
        if (existing) {
            document.getElementById("modal-recipient-title").textContent = `Configure Slot 0${slotNumber} Recipient`;
            elements.recipientNameInput.value = existing.name || "";
            elements.recipientPhoneInput.value = existing.phone_number || "";
            elements.recipientRoleInput.value = existing.role || "Emergency Contact";
            elements.recipientNotesInput.value = existing.notes || "";
            elements.recipientActiveCheckbox.checked = existing.is_active === 1;
            elements.btnDeleteRecipient.style.display = "inline-flex";
        } else {
            document.getElementById("modal-recipient-title").textContent = `Assign Slot 0${slotNumber} Recipient`;
            elements.recipientNameInput.value = "";
            elements.recipientPhoneInput.value = "+91 ";
            elements.recipientRoleInput.value = "Emergency Contact";
            elements.recipientNotesInput.value = "";
            elements.recipientActiveCheckbox.checked = true;
            elements.btnDeleteRecipient.style.display = "none";
        }

        elements.recipientModal.classList.add("open");
    }

    function closeRecipientModal() {
        elements.recipientModal.classList.remove("open");
    }

    async function handleRecipientSubmit(e) {
        e.preventDefault();
        const payload = {
            slot_number: parseInt(elements.recipientSlotInput.value),
            name: elements.recipientNameInput.value.trim(),
            phone_number: elements.recipientPhoneInput.value.trim(),
            role: elements.recipientRoleInput.value.trim(),
            notes: elements.recipientNotesInput.value.trim(),
            is_active: elements.recipientActiveCheckbox.checked
        };

        try {
            const res = await fetch("/api/recipients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                showToast(`Slot ${payload.slot_number} saved: ${data.normalized_phone}`, "success");
                closeRecipientModal();
                await loadRecipients();
                await loadSystemStatus();
            } else {
                showToast(data.message, "error");
            }
        } catch (err) {
            showToast("Failed to save recipient", "error");
        }
    }

    async function handleDeleteRecipient() {
        const slot = elements.recipientSlotInput.value;
        if (!confirm(`Are you sure you want to clear Slot ${slot}?`)) return;

        try {
            const res = await fetch(`/api/recipients/${slot}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast(`Slot ${slot} cleared`, "info");
                closeRecipientModal();
                await loadRecipients();
                await loadSystemStatus();
            }
        } catch (err) {
            showToast("Failed to delete recipient", "error");
        }
    }

    // Settings Modal
    function openSettingsModal() {
        window.soundEngine.playSwitchClick();
        elements.providerSelect.value = state.provider;
        elements.settingsModal.classList.add("open");
        elements.twilioTestResult.style.display = "none";
    }

    function closeSettingsModal() {
        elements.settingsModal.classList.remove("open");
    }

    async function handleSettingsSubmit(e) {
        e.preventDefault();
        const payload = {
            provider: elements.providerSelect.value,
            facility_name: elements.facilityNameInput.value,
            twilio_account_sid: elements.twilioSidInput.value.trim(),
            twilio_auth_token: elements.twilioTokenInput.value.trim(),
            twilio_from_number: elements.twilioFromInput.value.trim()
        };

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast("Settings updated successfully", "success");
                closeSettingsModal();
                await loadSystemStatus();
            }
        } catch (err) {
            showToast("Failed to update settings", "error");
        }
    }

    async function testTwilioConnection() {
        elements.btnTestTwilio.disabled = true;
        elements.btnTestTwilio.textContent = "Validating Credentials...";
        elements.twilioTestResult.style.display = "block";
        elements.twilioTestResult.className = "callout-box";
        elements.twilioTestResult.textContent = "Connecting to Twilio REST API...";

        try {
            const res = await fetch("/api/settings/test-twilio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    twilio_account_sid: elements.twilioSidInput.value.trim(),
                    twilio_auth_token: elements.twilioTokenInput.value.trim()
                })
            });
            const data = await res.json();

            if (data.success) {
                elements.twilioTestResult.className = "callout-box";
                elements.twilioTestResult.style.borderColor = "var(--tactical-emerald)";
                elements.twilioTestResult.innerHTML = `<strong>✅ Verification Passed:</strong> ${escapeHTML(data.message)}`;
            } else {
                elements.twilioTestResult.className = "callout-box amber";
                elements.twilioTestResult.innerHTML = `<strong>❌ Verification Failed:</strong> ${escapeHTML(data.message)}`;
            }
        } catch (err) {
            elements.twilioTestResult.className = "callout-box amber";
            elements.twilioTestResult.innerHTML = `<strong>❌ Error:</strong> ${escapeHTML(err.message)}`;
        } finally {
            elements.btnTestTwilio.disabled = false;
            elements.btnTestTwilio.textContent = "Test Twilio API Connection";
        }
    }

    // Log Inspection Detail Modal
    function openLogDetailModal(log) {
        window.soundEngine.playSwitchClick();
        if (!elements.logDetailContent) return;

        const isSuccess = log.status === "sent" || log.status === "mock_delivered";

        elements.logDetailContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
                <div>
                    <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">INCIDENT CODE</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--tactical-cyan);">${log.incident_code || 'STANDALONE PING'}</div>
                </div>
                <div>
                    <span class="status-tag ${isSuccess ? 'sent' : 'failed'}">${log.status.toUpperCase()}</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.82rem;">
                <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem;">RECIPIENT</div>
                    <div style="font-weight: 600; color: #fff;">${escapeHTML(log.recipient_name)}</div>
                    <div style="font-family: var(--font-mono); color: var(--text-secondary);">${escapeHTML(log.phone_number)}</div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem;">GATEWAY PROVIDER</div>
                    <div style="font-weight: 700; text-transform: uppercase; color: ${log.provider === 'twilio' ? 'var(--tactical-emerald)' : 'var(--hazard-amber)'};">${log.provider}</div>
                    <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${log.dispatch_latency_ms || 120} ms latency</div>
                </div>
            </div>

            <div style="background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
                <div style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 4px;">PROVIDER SID / REFERENCE</div>
                <div style="font-family: var(--font-mono); font-size: 0.8rem; color: #fff; word-break: break-all;">
                    ${log.provider_sid || 'N/A (No external reference)'}
                </div>
            </div>

            ${log.error_message ? `
                <div class="callout-box amber">
                    <strong>⚠️ Error Diagnostic (${log.error_code || 'GENERAL'}):</strong><br>
                    ${escapeHTML(log.error_message)}
                </div>
            ` : `
                <div class="callout-box" style="border-left-color: var(--tactical-emerald);">
                    <strong>✔ Gateway Acknowledged:</strong> Message dispatch request was validated and processed by cellular routing queue without network rejection.
                </div>
            `}
        `;

        elements.logDetailModal.classList.add("open");
    }

    function closeLogDetailModal() {
        elements.logDetailModal.classList.remove("open");
    }

    // ================================================================
    // ARMED STATE & UTILITIES
    // ================================================================
    function updateArmedUI(isArmed) {
        state.armed = isArmed;
        if (elements.btnFireEmergency) {
            elements.btnFireEmergency.disabled = !isArmed;
            elements.btnFireEmergency.classList.toggle("disarmed", !isArmed);
        }
        const label = document.getElementById("armed-switch-label");
        if (label) {
            label.textContent = isArmed ? "SYSTEM ARMED" : "SYSTEM SAFE";
            label.style.color = isArmed ? "var(--fire-red)" : "var(--text-muted)";
        }
    }

    function syncAudioButton() {
        if (!elements.audioToggleBtn) return;
        const muted = window.soundEngine.muted;
        elements.audioToggleBtn.innerHTML = muted ? "🔇" : "🔊";
        elements.audioToggleBtn.title = muted ? "Audio Muted (Click to Unmute)" : "Audio Active (Click to Mute)";
    }

    function showToast(message, type = "info") {
        if (!elements.toastContainer) return;
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        let icon = "ℹ️";
        if (type === "success") icon = "✅";
        if (type === "error") icon = "🚨";
        if (type === "warning") icon = "⚠️";

        toast.innerHTML = `<span>${icon}</span><div>${escapeHTML(message)}</div>`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(100%)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 4500);
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ================================================================
    // EVENT LISTENERS
    // ================================================================
    function setupEventListeners() {
        // Armed Toggle
        if (elements.armedSwitch) {
            elements.armedSwitch.addEventListener("change", async (e) => {
                const isArmed = e.target.checked;
                window.soundEngine.playSwitchClick();
                updateArmedUI(isArmed);
                await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ system_armed: isArmed })
                });
                showToast(isArmed ? "SYSTEM ARMED: Emergency trigger active" : "SYSTEM SAFE: Trigger disarmed", isArmed ? "warning" : "info");
            });
        }

        // Emergency Fire Strobe Button
        if (elements.btnFireEmergency) {
            elements.btnFireEmergency.addEventListener("click", triggerEmergencyFlow);
        }

        // Abort Action
        if (elements.btnAbortAction) {
            elements.btnAbortAction.addEventListener("click", abortBroadcast);
        }

        // Preset Chips
        document.querySelectorAll(".preset-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                window.soundEngine.playSwitchClick();
                applyPreset(chip.dataset.preset);
            });
        });

        // Form Inputs Realtime Preview
        elements.alertTypeSelect.addEventListener("change", updatePhonePreview);
        elements.messageTextarea.addEventListener("input", () => {
            updatePhonePreview();
            updateSmsLengthMetrics();
        });

        // Theme Switcher
        if (elements.themeToggleBtn) {
            elements.themeToggleBtn.addEventListener("click", cycleTheme);
        }

        // Audio Toggle
        if (elements.audioToggleBtn) {
            elements.audioToggleBtn.addEventListener("click", () => {
                window.soundEngine.toggleMute();
                syncAudioButton();
                showToast(window.soundEngine.muted ? "Audio muted" : "Audio unmuted", "info");
            });
        }

        // Settings Open
        if (elements.settingsBtn) {
            elements.settingsBtn.addEventListener("click", openSettingsModal);
        }
        if (elements.btnBannerConfig) {
            elements.btnBannerConfig.addEventListener("click", openSettingsModal);
        }
        if (elements.providerBadge) {
            elements.providerBadge.addEventListener("click", openSettingsModal);
        }

        // Export Logs
        if (elements.exportLogsBtn) {
            elements.exportLogsBtn.addEventListener("click", () => {
                window.location.href = "/api/export-logs";
            });
        }

        // Modal Closers
        if (elements.recipientModalClose) elements.recipientModalClose.addEventListener("click", closeRecipientModal);
        if (elements.recipientForm) elements.recipientForm.addEventListener("submit", handleRecipientSubmit);
        if (elements.btnDeleteRecipient) elements.btnDeleteRecipient.addEventListener("click", handleDeleteRecipient);

        if (elements.settingsModalClose) elements.settingsModalClose.addEventListener("click", closeSettingsModal);
        if (elements.settingsForm) elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
        if (elements.btnTestTwilio) elements.btnTestTwilio.addEventListener("click", testTwilioConnection);

        if (elements.logDetailClose) elements.logDetailClose.addEventListener("click", closeLogDetailModal);

        // Click outside backdrop to close
        [elements.recipientModal, elements.settingsModal, elements.logDetailModal].forEach(modal => {
            if (!modal) return;
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.classList.remove("open");
            });
        });
    }

    // Run
    init();
});
