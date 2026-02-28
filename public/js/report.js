(function () {
  var pathParts = window.location.pathname.split('/');
  var token = pathParts[2];

  var gpsDot = document.getElementById('gps-dot');
  var gpsText = document.getElementById('gps-text');
  var submitBtn = document.getElementById('submit-btn');
  var previewList = document.getElementById('preview-list');
  var photosInput = document.getElementById('photos');

  document.getElementById('back-btn').addEventListener('click', function () {
    window.location.href = '/task/' + token;
  });

  // GPS — works only on HTTPS or localhost; gracefully skip otherwise
  function gpsUnavailable(msg) {
    gpsDot.classList.add('gps-err');
    gpsText.textContent = msg;
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    gpsUnavailable('GPS ไม่สามารถใช้ผ่าน HTTP ได้ — ตำแหน่งจะถูกข้ามไป (สามารถส่งรายงานได้ตามปกติ)');
  } else if (!navigator.geolocation) {
    gpsUnavailable('อุปกรณ์ไม่รองรับ GPS — ตำแหน่งจะถูกข้ามไป');
  } else {
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        document.getElementById('visit_lat').value = pos.coords.latitude;
        document.getElementById('visit_lng').value = pos.coords.longitude;
        gpsDot.classList.add('gps-ok');
        gpsText.textContent = 'GPS: ' + pos.coords.latitude.toFixed(6) + ', ' + pos.coords.longitude.toFixed(6);
      },
      function () {
        gpsUnavailable('ไม่สามารถดึงตำแหน่ง GPS ได้ — กรุณาอนุญาตการเข้าถึงตำแหน่ง (สามารถส่งรายงานได้โดยไม่มี GPS)');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // Photo preview
  photosInput.addEventListener('change', function () {
    previewList.innerHTML = '';
    var files = photosInput.files;
    for (var i = 0; i < Math.min(files.length, 5); i++) {
      var img = document.createElement('img');
      img.src = URL.createObjectURL(files[i]);
      previewList.appendChild(img);
    }
  });

  // Submit
  submitBtn.addEventListener('click', function () {
    var category = document.getElementById('cause_category').value;
    if (!category) {
      alert('กรุณาเลือกประเภทสาเหตุ');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'กำลังส่ง...';

    var formData = new FormData();
    formData.append('cause_category', category);
    formData.append('cause_detail', document.getElementById('cause_detail').value.trim());
    formData.append('visit_lat', document.getElementById('visit_lat').value);
    formData.append('visit_lng', document.getElementById('visit_lng').value);
    formData.append('recommendation', document.getElementById('recommendation').value.trim());

    var files = photosInput.files;
    for (var i = 0; i < Math.min(files.length, 5); i++) {
      formData.append('photos', files[i]);
    }

    fetch('/api/tasks/' + token + '/submit', {
      method: 'POST',
      body: formData
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          alert(data.error);
          submitBtn.disabled = false;
          submitBtn.textContent = '✅ บันทึกและส่งรายงาน';
          return;
        }
        window.location.href = '/task/' + token + '/success';
      })
      .catch(function () {
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
        submitBtn.disabled = false;
        submitBtn.textContent = '✅ บันทึกและส่งรายงาน';
      });
  });
})();
