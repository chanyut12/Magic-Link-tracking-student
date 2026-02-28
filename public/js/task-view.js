(function () {
  var pathParts = window.location.pathname.split('/');
  var token = pathParts[2];

  var loading = document.getElementById('loading');
  var errorSection = document.getElementById('error-section');
  var content = document.getElementById('content');

  fetch('/api/tasks/' + token)
    .then(function (r) {
      if (r.status === 410) {
        window.location.href = '/expired';
        return null;
      }
      return r.json().then(function (data) {
        return { status: r.status, data: data };
      });
    })
    .then(function (result) {
      if (!result) return;
      loading.classList.add('hidden');

      if (result.status === 403) {
        errorSection.classList.remove('hidden');
        if (result.data.status === 'ADMIN_LOCKED') {
          var reasonText = result.data.reason ? ('เหตุผล: ' + result.data.reason) : 'ผู้ดูแลระบบปิดลิงก์นี้ไว้';
          errorSection.innerHTML = '<div class="status-page"><div class="status-icon">🔒</div><h2>ลิงก์นี้ถูกปิดโดยผู้ดูแล</h2><p>' + reasonText + '</p></div>';
          return;
        }
        var statusLabel = result.data.status === 'COMPLETED' ? 'เสร็จสิ้นแล้ว' : 'ถูกส่งต่อแล้ว';
        errorSection.innerHTML = '<div class="status-page"><div class="status-icon">📋</div><h2>ภารกิจนี้' + statusLabel + '</h2><p>ลิงก์นี้ไม่สามารถใช้งานได้อีกแล้ว</p></div>';
        return;
      }

      if (result.status !== 200) {
        errorSection.classList.remove('hidden');
        errorSection.innerHTML = '<div class="alert alert-error">' + (result.data.error || 'เกิดข้อผิดพลาด') + '</div>';
        return;
      }

      var d = result.data;
      content.classList.remove('hidden');

      document.getElementById('header-assignee').textContent = 'สวัสดี, ' + d.assigned_to_name;
      document.getElementById('student-name').textContent = d.student_name;
      document.getElementById('student-school').textContent = d.student_school || '-';
      document.getElementById('student-address').textContent = d.student_address || '-';
      document.getElementById('reason-flagged').textContent = d.reason_flagged || '-';
      document.getElementById('depth-info').textContent = d.delegation_depth + ' / ' + d.max_delegation_depth + ' ทอด';

      if (d.student_lat && d.student_lng) {
        document.getElementById('map-card').classList.remove('hidden');
        var map = L.map('map').setView([d.student_lat, d.student_lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        L.marker([d.student_lat, d.student_lng]).addTo(map)
          .bindPopup('บ้านนักเรียน').openPopup();
        document.getElementById('gmaps-link').href =
          'https://www.google.com/maps/dir/?api=1&destination=' + d.student_lat + ',' + d.student_lng;
      }

      document.getElementById('btn-execute').href = '/task/' + token + '/report';

      if (d.can_delegate) {
        document.getElementById('btn-delegate').href = '/task/' + token + '/delegate';
      } else {
        document.getElementById('btn-delegate').classList.add('hidden');
      }
    })
    .catch(function () {
      loading.classList.add('hidden');
      errorSection.classList.remove('hidden');
      errorSection.innerHTML = '<div class="alert alert-error">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่</div>';
    });
})();
