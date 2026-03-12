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
      PENDING_REVIEW: 'badge-progress',
      RESOLVED: 'badge-resolved',
      COMPLETED: 'badge-completed',
      ACTIVE: 'badge-active',
      DELEGATED: 'badge-delegated',
      EXPIRED: 'badge-expired'
    };
    var labels = {
      PENDING_REVIEW: 'รอผอ.ประเมิน',
      RESOLVED: 'ปิดเคสแล้ว'
    };
    return '<span class="badge ' + (map[status] || 'badge-pending') + '">' + (labels[status] || status) + '</span>';
  }

  function formatDateTime(d) {
    if (!d) return '-';
    return new Date(d).toLocaleString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function renderReviewHistory(reviews) {
    var historyEl = document.getElementById('review-history');
    var historyCard = document.getElementById('review-history-card');
    historyEl.innerHTML = '';
    if (!reviews || !reviews.length) return;

    historyCard.classList.remove('hidden');
    reviews.forEach(function (r) {
      var actionMap = {
        ASSIST: 'ให้ความช่วยเหลือ',
        FORWARD: 'ส่งต่อหน่วยงาน/ผู้เกี่ยวข้อง',
        CLOSE: 'ปิดเคส'
      };
      var item = document.createElement('div');
      item.className = 'info-row';
      item.innerHTML =
        '<span class="label">' + (actionMap[r.review_action] || r.review_action) + ' — ' + (r.reviewed_by || 'ผอ.') + '</span>' +
        '<span class="value">' + formatDateTime(r.reviewed_at) + '</span>';
      historyEl.appendChild(item);

      if (r.review_note) {
        var note = document.createElement('div');
        note.className = 'admin-link-box';
        note.style.marginBottom = '10px';
        note.textContent = 'หมายเหตุ: ' + r.review_note;
        historyEl.appendChild(note);
      }
    });
  }

  function setupReviewForm(data, submission) {
    var reviewCard = document.getElementById('review-card');
    var reviewStatus = document.getElementById('review-status');
    var submitBtn = document.getElementById('review-submit-btn');
    var reviewedByInput = document.getElementById('reviewed-by');
    var actionInput = document.getElementById('review-action');
    var noteInput = document.getElementById('review-note');

    if (!submission) return;
    reviewCard.classList.remove('hidden');
    reviewStatus.innerHTML = 'สถานะเคสปัจจุบัน: ' + statusBadge(data.case_status || 'IN_PROGRESS');

    if (data.case_status === 'RESOLVED') {
      reviewedByInput.disabled = true;
      actionInput.disabled = true;
      noteInput.disabled = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'ปิดเคสแล้ว';
      return;
    }

    submitBtn.addEventListener('click', function () {
      var payload = {
        review_action: actionInput.value,
        review_note: noteInput.value.trim(),
        reviewed_by: reviewedByInput.value.trim() || 'ผอ.'
      };
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังบันทึก...';
      fetch('/api/cases/' + data.case_id + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (resp) {
          if (!resp.ok) {
            alert(resp.data.error || 'บันทึกผลการประเมินไม่สำเร็จ');
            submitBtn.disabled = false;
            submitBtn.textContent = 'บันทึกผลการประเมิน';
            return;
          }
          alert('บันทึกผลการประเมินสำเร็จ');
          window.location.reload();
        })
        .catch(function () {
          alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
          submitBtn.disabled = false;
          submitBtn.textContent = 'บันทึกผลการประเมิน';
        });
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
      
      if (data.task_type === 'ATTENDANCE') {
          document.getElementById('header-info').textContent = 'ภารกิจเช็คชื่อ ' + data.target_grade + '/' + data.target_room;
          document.getElementById('visit-info').classList.add('hidden');
          document.getElementById('attendance-info').classList.remove('hidden');
          document.getElementById('target-grade').textContent = data.target_grade;
          document.getElementById('target-room').textContent = data.target_room;
          
          // Hide review for attendance tasks for now
          document.getElementById('review-card').classList.add('hidden');
      } else {
          document.getElementById('header-info').textContent = data.student_name + ' — ' + (data.student_school || '');
          document.getElementById('student-name').textContent = data.student_name;
          document.getElementById('student-school').textContent = data.student_school || '-';
          document.getElementById('reason-flagged').textContent = data.reason_flagged || '-';
          document.getElementById('visit-info').classList.remove('hidden');
          document.getElementById('attendance-info').classList.add('hidden');
      }
      
      document.getElementById('task-status').innerHTML = statusBadge(data.case_status || data.task_status);

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
        if (link.admin_locked) statusText = ' — ถูกผู้ดูแลปิดลิงก์';

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

      renderReviewHistory(data.reviews || []);
      setupReviewForm(data, submission);
    })
    .catch(function () {
      loading.classList.add('hidden');
      content.innerHTML = '<div class="alert alert-error">ไม่สามารถโหลดข้อมูลได้</div>';
      content.classList.remove('hidden');
    });
})();
