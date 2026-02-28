(function () {
  var pathParts = window.location.pathname.split('/');
  var taskId = pathParts[2];

  var loading = document.getElementById('loading');
  var content = document.getElementById('content');

  var causeLabels = {
    POVERTY: 'ปัญหาความยากจน',
    ILLNESS: 'เจ็บป่วย',
    FAMILY_ISSUE: 'ปัญหาครอบครัว',
    TRANSPORTATION: 'ปัญหาการเดินทาง',
    OTHER: 'อื่นๆ'
  };

  function statusBadge(status) {
    var map = {
      PENDING: 'badge-pending',
      IN_PROGRESS: 'badge-progress',
      COMPLETED: 'badge-completed',
      ACTIVE: 'badge-active',
      DELEGATED: 'badge-delegated',
      EXPIRED: 'badge-expired'
    };
    return '<span class="badge ' + (map[status] || 'badge-pending') + '">' + status + '</span>';
  }

  function formatDateTime(d) {
    if (!d) return '-';
    return new Date(d).toLocaleString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  fetch('/api/tasks/' + taskId + '/chain')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      loading.classList.add('hidden');
      if (data.error) {
        content.innerHTML = '<div class="alert alert-error">' + data.error + '</div>';
        content.classList.remove('hidden');
        return;
      }

      content.classList.remove('hidden');
      document.getElementById('header-info').textContent = data.student_name + ' — ' + (data.student_school || '');
      document.getElementById('student-name').textContent = data.student_name;
      document.getElementById('student-school').textContent = data.student_school || '-';
      document.getElementById('reason-flagged').textContent = data.reason_flagged || '-';
      document.getElementById('task-status').innerHTML = statusBadge(data.task_status);

      // Timeline
      var timeline = document.getElementById('timeline');
      var submission = null;

      data.chain.forEach(function (link, i) {
        var dotClass = 'dot-active';
        if (link.status === 'DELEGATED') dotClass = 'dot-delegated';
        if (link.status === 'COMPLETED') dotClass = 'dot-completed';
        if (link.status === 'EXPIRED') dotClass = 'dot-expired';

        var actionText = '';
        if (i === 0) actionText = 'ได้รับมอบหมายจากต้นทาง';
        else actionText = 'ได้รับการส่งต่อ (ทอดที่ ' + link.delegation_depth + ')';

        var statusText = '';
        if (link.status === 'DELEGATED') statusText = ' — ส่งต่อให้คนอื่นแล้ว';
        if (link.status === 'COMPLETED') statusText = ' — ลงพื้นที่สำเร็จ';
        if (link.status === 'ACTIVE') statusText = ' — รอดำเนินการ';

        var item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML =
          '<div class="timeline-dot ' + dotClass + '"></div>' +
          '<div class="timeline-title">' + (link.assigned_to_name || 'ไม่ระบุ') + '</div>' +
          '<div class="timeline-meta">' + actionText + statusText + '</div>' +
          '<div class="timeline-meta">' + formatDateTime(link.created_at) + '</div>';
        timeline.appendChild(item);

        if (link.submission) submission = link.submission;
      });

      // Submission detail
      if (submission) {
        var card = document.getElementById('submission-card');
        card.classList.remove('hidden');

        var detail = document.getElementById('submission-detail');
        detail.innerHTML =
          '<div class="info-row"><span class="label">สาเหตุ</span><span class="value">' + (causeLabels[submission.cause_category] || submission.cause_category || '-') + '</span></div>' +
          '<div class="info-row"><span class="label">รายละเอียด</span><span class="value">' + (submission.cause_detail || '-') + '</span></div>' +
          '<div class="info-row"><span class="label">ข้อเสนอแนะ</span><span class="value">' + (submission.recommendation || '-') + '</span></div>' +
          '<div class="info-row"><span class="label">พิกัดลงพื้นที่</span><span class="value">' + (submission.visit_lat ? submission.visit_lat + ', ' + submission.visit_lng : '-') + '</span></div>' +
          '<div class="info-row"><span class="label">เวลาส่งรายงาน</span><span class="value">' + formatDateTime(submission.submitted_at) + '</span></div>';

        // Photos
        var photos = [];
        try { photos = JSON.parse(submission.photo_paths || '[]'); } catch (e) {}
        var photosEl = document.getElementById('submission-photos');
        photos.forEach(function (p) {
          var img = document.createElement('img');
          img.src = p;
          img.addEventListener('click', function () { window.open(p, '_blank'); });
          photosEl.appendChild(img);
        });

        // Map
        if (submission.visit_lat && submission.visit_lng) {
          var map = L.map('submission-map').setView([submission.visit_lat, submission.visit_lng], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);
          L.marker([submission.visit_lat, submission.visit_lng]).addTo(map)
            .bindPopup('ตำแหน่งที่ลงพื้นที่').openPopup();
        } else {
          document.getElementById('submission-map').style.display = 'none';
        }
      }
    })
    .catch(function () {
      loading.classList.add('hidden');
      content.innerHTML = '<div class="alert alert-error">ไม่สามารถโหลดข้อมูลได้</div>';
      content.classList.remove('hidden');
    });
})();
