(function () {
    // ===== Hub Page: Purpose Selection =====
    var cards = document.querySelectorAll('.purpose-card:not(.purpose-card--disabled)');
    var generateBtn = document.getElementById('generate-btn');
    var selectedPurpose = 'TRACKING';

    cards.forEach(function (card) {
        card.addEventListener('click', function () {
            cards.forEach(function (c) { c.classList.remove('purpose-card--selected'); });
            card.classList.add('purpose-card--selected');
            var radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            selectedPurpose = card.getAttribute('data-purpose');
        });
    });

    // ===== Hub: Permissions Tab Bar =====
    var permTabBar = document.getElementById('perm-tab-bar');
    var permTemplatePanel = document.getElementById('perm-template-panel');
    var permCustomPanel = document.getElementById('perm-custom-panel');

    permTabBar.addEventListener('click', function (e) {
        var tab = e.target.closest('.config-tab');
        if (!tab) return;
        permTabBar.querySelectorAll('.config-tab').forEach(function (t) { t.classList.remove('config-tab--active'); });
        tab.classList.add('config-tab--active');
        if (tab.getAttribute('data-tab') === 'template') {
            permTemplatePanel.classList.remove('hidden');
            permCustomPanel.classList.add('hidden');
        } else {
            permTemplatePanel.classList.add('hidden');
            permCustomPanel.classList.remove('hidden');
        }
    });

    // ===== Hub: Data Scope Chips =====
    var scopeChipsContainer = document.getElementById('scope-chips');
    var schoolSearchGroup = document.getElementById('school-search-group');

    scopeChipsContainer.addEventListener('click', function (e) {
        var chip = e.target.closest('.scope-chip');
        if (!chip) return;
        scopeChipsContainer.querySelectorAll('.scope-chip').forEach(function (c) { c.classList.remove('scope-chip--active'); });
        chip.classList.add('scope-chip--active');

        // Show school search only for "school" scope
        var scope = chip.getAttribute('data-scope');
        if (scope === 'school') {
            schoolSearchGroup.classList.remove('hidden');
        } else {
            schoolSearchGroup.classList.add('hidden');
        }
    });

    // ===== Hub: Expiry Chips =====
    var expiryChipsContainer = document.getElementById('expiry-chips');
    var expiryHint = document.getElementById('expiry-hint');
    var hubExpiryHours = 168; // default 7 days

    var expiryLabels = {
        '24': '24 ชั่วโมง',
        '168': '7 วัน',
        '720': '30 วัน',
        '0': 'ไม่มีวันหมดอายุ'
    };

    expiryChipsContainer.addEventListener('click', function (e) {
        var chip = e.target.closest('.expiry-chip');
        if (!chip) return;
        expiryChipsContainer.querySelectorAll('.expiry-chip').forEach(function (c) { c.classList.remove('expiry-chip--active'); });
        chip.classList.add('expiry-chip--active');

        hubExpiryHours = parseInt(chip.getAttribute('data-hours'));
        var label = expiryLabels[String(hubExpiryHours)] || hubExpiryHours + ' ชม.';
        if (hubExpiryHours === 0) {
            expiryHint.innerHTML = 'ลิงค์จะ <strong>ไม่มีวันหมดอายุ</strong>';
        } else {
            expiryHint.innerHTML = 'ลิงค์จะหมดอายุใน <strong>' + label + '</strong> นับจากเวลาสร้าง';
        }
    });

    // ===== Generate Button =====
    generateBtn.addEventListener('click', function () {
        if (selectedPurpose === 'TRACKING') {
            openModal();
        }
    });

    // ===== Modal: Open / Close =====
    var overlay = document.getElementById('modal-overlay');
    var closeBtn = document.getElementById('modal-close-btn');
    var formSection = document.getElementById('modal-form-section');
    var resultSection = document.getElementById('modal-result-section');
    var submitBtn = document.getElementById('modal-submit-btn');
    var createAnotherBtn = document.getElementById('modal-create-another');

    var mapInitialized = false;
    var map, marker;

    function openModal() {
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (!mapInitialized) {
            initMap();
            mapInitialized = true;
        } else {
            setTimeout(function () { map.invalidateSize(); }, 100);
        }
    }

    function closeModal() {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal();
    });

    // ===== Modal: Map =====
    var latInput = document.getElementById('m_student_lat');
    var lngInput = document.getElementById('m_student_lng');

    function initMap() {
        map = L.map('modal-picker-map').setView([13.7, 100.5], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        map.on('click', function (e) {
            placeMarker(e.latlng.lat, e.latlng.lng);
            map.setView(e.latlng, Math.max(map.getZoom(), 13));
        });

        setTimeout(function () { map.invalidateSize(); }, 200);
    }

    function placeMarker(lat, lng) {
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on('dragend', function () {
                var pos = marker.getLatLng();
                latInput.value = pos.lat.toFixed(6);
                lngInput.value = pos.lng.toFixed(6);
            });
        }
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
    }

    // GPS button
    var locateBtn = document.getElementById('m_locate-btn');
    var gpsNotice = document.createElement('small');
    gpsNotice.style.cssText = 'display:block;margin-top:4px;color:#e74c3c;';
    locateBtn.parentNode.insertBefore(gpsNotice, document.getElementById('modal-picker-map'));

    locateBtn.addEventListener('click', function () {
        var btn = this;
        btn.textContent = '📍 กำลังค้นหา...';
        btn.disabled = true;
        gpsNotice.textContent = '';

        function onFail(msg) {
            gpsNotice.textContent = msg;
            btn.textContent = '📍 ใช้ตำแหน่งของฉัน';
            btn.disabled = false;
        }

        if (!navigator.geolocation) {
            onFail('อุปกรณ์ไม่รองรับ GPS — กรุณาคลิกบนแผนที่หรือพิมพ์พิกัดด้วยตัวเอง');
            return;
        }

        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            onFail('GPS ไม่สามารถใช้ได้ผ่าน HTTP — กรุณาคลิกบนแผนที่เพื่อเลือกพิกัดแทน');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function (pos) {
                placeMarker(pos.coords.latitude, pos.coords.longitude);
                map.setView([pos.coords.latitude, pos.coords.longitude], 15);
                btn.textContent = '📍 ใช้ตำแหน่งของฉัน';
                btn.disabled = false;
            },
            function () {
                onFail('ไม่สามารถดึงตำแหน่ง GPS ได้ — กรุณาอนุญาตการเข้าถึงตำแหน่ง หรือคลิกบนแผนที่แทน');
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    });

    // Sync lat/lng inputs → marker
    function syncFromInputs() {
        var lat = parseFloat(latInput.value);
        var lng = parseFloat(lngInput.value);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            placeMarker(lat, lng);
            map.setView([lat, lng], Math.max(map.getZoom(), 13));
        }
    }

    latInput.addEventListener('change', syncFromInputs);
    lngInput.addEventListener('change', syncFromInputs);

    // ===== Expiry: Use hub-level selection =====
    function computeExpiryHours() {
        // hubExpiryHours is set by the expiry chip on the hub page
        // 0 = "no expiry" → use max allowed (90 days = 2160h)
        return hubExpiryHours === 0 ? 2160 : hubExpiryHours;
    }

    // ===== Helpers =====
    function copyText(text, onSuccess) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
        } else { fallback(); }
        function fallback() {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try { document.execCommand('copy'); onSuccess(); } catch (e) { alert('กรุณาคัดลอกด้วยตัวเอง:\n' + text); }
            document.body.removeChild(ta);
        }
    }

    function normalizePublicLink(rawLink) {
        if (!rawLink) return rawLink;
        try {
            var url = new URL(rawLink, window.location.origin);
            if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                url.protocol = window.location.protocol;
                url.host = window.location.host;
            }
            return url.toString();
        } catch (_) {
            return rawLink;
        }
    }

    function buildLineShareUrl(publicLink) {
        return 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(publicLink);
    }

    // ===== Modal: Form Submission =====
    submitBtn.addEventListener('click', function () {
        var name = document.getElementById('m_student_name').value.trim();
        var assigned = document.getElementById('m_assigned_to_name').value.trim();
        if (!name || !assigned) {
            alert('กรุณากรอกชื่อนักเรียนและชื่อผู้รับงาน');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังสร้าง...';

        var body = {
            student_name: name,
            student_school: document.getElementById('m_student_school').value.trim(),
            student_address: document.getElementById('m_student_address').value.trim(),
            student_subdistrict: document.getElementById('m_student_subdistrict').value.trim(),
            student_district: document.getElementById('m_student_district').value.trim(),
            student_province: document.getElementById('m_student_province').value.trim(),
            student_zipcode: document.getElementById('m_student_zipcode').value.trim(),
            student_lat: parseFloat(latInput.value) || null,
            student_lng: parseFloat(lngInput.value) || null,
            reason_flagged: document.getElementById('m_reason_flagged').value.trim(),
            assigned_to_name: assigned,
            assigned_to_phone: document.getElementById('m_assigned_to_phone').value.trim(),
            expires_in_hours: computeExpiryHours()
        };

        fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.error) {
                    alert(data.error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'สร้างภารกิจ';
                    return;
                }

                var publicLink = normalizePublicLink(data.magic_link);
                document.getElementById('modal-magic-link').textContent = publicLink;

                if (data.qr_code_data) {
                    document.getElementById('modal-qr-img').src = data.qr_code_data;
                }

                document.getElementById('modal-line-share-btn').href = buildLineShareUrl(publicLink);

                formSection.classList.add('hidden');
                resultSection.classList.remove('hidden');

                // Copy button
                document.getElementById('modal-copy-btn').onclick = function () {
                    copyText(publicLink, function () {
                        document.getElementById('modal-copy-btn').textContent = '✅';
                        setTimeout(function () {
                            document.getElementById('modal-copy-btn').textContent = '📋';
                        }, 2000);
                    });
                };
            })
            .catch(function () {
                alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
                submitBtn.disabled = false;
                submitBtn.textContent = 'สร้างภารกิจ';
            });
    });

    // ===== Create Another =====
    createAnotherBtn.addEventListener('click', function () {
        document.getElementById('m_student_name').value = '';
        document.getElementById('m_student_school').value = '';
        document.getElementById('m_student_address').value = '';
        document.getElementById('m_student_subdistrict').value = '';
        document.getElementById('m_student_district').value = '';
        document.getElementById('m_student_province').value = '';
        document.getElementById('m_student_zipcode').value = '';
        latInput.value = '';
        lngInput.value = '';
        document.getElementById('m_reason_flagged').value = '';
        document.getElementById('m_assigned_to_name').value = '';
        document.getElementById('m_assigned_to_phone').value = '';
        // Reset expiry is handled on the hub page now, so we can ignore m_expires_value

        if (marker) {
            map.removeLayer(marker);
            marker = null;
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'สร้างภารกิจ';

        resultSection.classList.add('hidden');
        formSection.classList.remove('hidden');

        // Refresh map size
        setTimeout(function () { map.invalidateSize(); }, 100);
    });
})();
