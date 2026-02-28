(function () {
  var formSection = document.getElementById('form-section');
  var resultSection = document.getElementById('result-section');
  var submitBtn = document.getElementById('submit-btn');
  var latInput = document.getElementById('student_lat');
  var lngInput = document.getElementById('student_lng');

  function copyText(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(ta); ta.focus(); ta.select();
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

  function computeExpiryHours() {
    var val = parseInt(document.getElementById('expires_value').value) || 1;
    var unit = document.getElementById('expires_unit').value;
    if (unit === 'days') return val * 24;
    if (unit === 'weeks') return val * 168;
    return val;
  }

  // --- Map Picker ---
  var map = L.map('picker-map').setView([13.7, 100.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var marker = null;

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

  map.on('click', function (e) {
    placeMarker(e.latlng.lat, e.latlng.lng);
    map.setView(e.latlng, Math.max(map.getZoom(), 13));
  });

  var gpsNotice = document.createElement('small');
  gpsNotice.style.cssText = 'display:block;margin-top:4px;color:#e74c3c;';
  document.getElementById('locate-btn').parentNode.insertBefore(gpsNotice, document.getElementById('picker-map'));

  document.getElementById('locate-btn').addEventListener('click', function () {
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

  function syncFromInputs() {
    var lat = parseFloat(latInput.value);
    var lng = parseFloat(lngInput.value);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
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
      map.setView([lat, lng], Math.max(map.getZoom(), 13));
    }
  }

  latInput.addEventListener('change', syncFromInputs);
  lngInput.addEventListener('change', syncFromInputs);

  // --- Form Submit ---
  submitBtn.addEventListener('click', function () {
    var name = document.getElementById('student_name').value.trim();
    var assigned = document.getElementById('assigned_to_name').value.trim();
    if (!name || !assigned) {
      alert('กรุณากรอกชื่อนักเรียนและชื่อผู้รับงาน');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'กำลังสร้าง...';

    var body = {
      student_name: name,
      student_school: document.getElementById('student_school').value.trim(),
      student_address: document.getElementById('student_address').value.trim(),
      student_lat: parseFloat(latInput.value) || null,
      student_lng: parseFloat(lngInput.value) || null,
      reason_flagged: document.getElementById('reason_flagged').value.trim(),
      assigned_to_name: assigned,
      assigned_to_phone: document.getElementById('assigned_to_phone').value.trim(),
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
        document.getElementById('magic-link').textContent = publicLink;
        if (data.qr_code_data) {
          document.getElementById('qr-img').src = data.qr_code_data;
        }
        document.getElementById('line-share-btn').href = buildLineShareUrl(publicLink);
        formSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        document.getElementById('copy-btn').addEventListener('click', function () {
          copyText(publicLink, function () {
            document.getElementById('copy-btn').textContent = '✅ คัดลอกแล้ว!';
            setTimeout(function () {
              document.getElementById('copy-btn').textContent = '📋 คัดลอกลิงก์';
            }, 2000);
          });
        });
      })
      .catch(function () {
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
        submitBtn.disabled = false;
        submitBtn.textContent = 'สร้างภารกิจ';
      });
  });
})();
