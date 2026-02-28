(function () {
  var loading = document.getElementById('loading');
  var empty = document.getElementById('empty');
  var tableWrap = document.getElementById('table-wrap');
  var tbody = document.getElementById('cases-body');

  function copyText(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); onSuccess(); } catch (e) { alert('คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตัวเอง:\n' + text); }
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

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function statusBadge(status) {
    var map = {
      OPEN: 'badge-open',
      IN_PROGRESS: 'badge-progress',
      RESOLVED: 'badge-resolved',
      COMPLETED: 'badge-completed'
    };
    var labels = {
      OPEN: 'เปิด',
      IN_PROGRESS: 'กำลังดำเนินการ',
      RESOLVED: 'เสร็จสิ้น',
      COMPLETED: 'เสร็จสิ้น'
    };
    var cls = map[status] || 'badge-pending';
    var label = labels[status] || status;
    return '<span class="badge ' + cls + '">' + label + '</span>';
  }

  function formatDate(d) {
    if (!d) return '-';
    var dt = new Date(d);
    return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function linkCell(c) {
    if (!c.active_link) return '<td class="text-center">-</td>';
    var publicLink = normalizePublicLink(c.active_link);
    var lineUrl = buildLineShareUrl(publicLink);
    if (c.active_link_locked) {
      return '<td><span class="badge badge-expired">ปิดโดยผู้ดูแล</span></td>';
    }
    return '<td style="white-space:nowrap">' +
      '<button class="btn-copy-link" data-link="' + publicLink + '" title="คัดลอกลิงก์">📋</button> ' +
      '<a href="' + lineUrl + '" target="_blank" rel="noopener" class="btn-copy-link btn-line-share" style="background:#06C755;color:#fff;border-color:#06C755;text-decoration:none;" title="ส่งผ่าน LINE">💬</a>' +
      '</td>';
  }

  function adminLinkCell(c) {
    if (!c.active_link_id) return '<td class="text-center">-</td>';
    if (c.active_link_locked) {
      var reason = c.active_link_lock_reason ? escapeHtml(c.active_link_lock_reason) : '-';
      return '<td>' +
        '<div class="admin-link-box">เหตุผล: ' + reason + '</div>' +
        '<button class="btn-copy-link btn-admin-toggle" data-link-id="' + c.active_link_id + '" data-action="unlock" title="เปิดใช้งานลิงก์อีกครั้ง">🔓 เปิดลิงก์</button>' +
        '</td>';
    }
    return '<td>' +
      '<button class="btn-copy-link btn-admin-toggle" data-link-id="' + c.active_link_id + '" data-action="lock" title="ปิดลิงก์ชั่วคราว/ถาวร">🔒 ปิดลิงก์</button>' +
      '</td>';
  }

  function fmt(n) {
    return (n || 0).toLocaleString('th-TH');
  }

  // Fetch stats
  fetch('/api/stats')
    .then(function (r) { return r.json(); })
    .then(function (s) {
      document.getElementById('stat-total').textContent = fmt(s.total);
      document.getElementById('stat-progress').textContent = fmt(s.in_progress);
      document.getElementById('stat-resolved').textContent = fmt(s.resolved);
      document.getElementById('stat-today').textContent = fmt(s.created_today);
      document.getElementById('stat-open').textContent = fmt(s.open);
      document.getElementById('stat-active-links').textContent = fmt(s.active_delegations);
      document.getElementById('stat-delegations').textContent = fmt(s.total_delegations);
    })
    .catch(function () {});

  // Fetch cases
  fetch('/api/cases')
    .then(function (r) { return r.json(); })
    .then(function (cases) {
      loading.classList.add('hidden');
      if (!cases.length) {
        empty.classList.remove('hidden');
        return;
      }
      tableWrap.classList.remove('hidden');
      cases.forEach(function (c, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + (i + 1) + '</td>' +
          '<td>' + (c.student_name || '-') + '</td>' +
          '<td>' + (c.student_school || '-') + '</td>' +
          '<td>' + (c.reason_flagged || '-') + '</td>' +
          '<td>' + statusBadge(c.status) + '</td>' +
          linkCell(c) +
          adminLinkCell(c) +
          '<td>' + formatDate(c.created_at) + '</td>' +
          '<td>' + (c.task_id ? '<a href="/task-detail/' + c.task_id + '">ดูรายละเอียด</a>' : '-') + '</td>';
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.btn-copy-link[data-link]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var link = this.getAttribute('data-link');
          copyText(link, function () {
            btn.textContent = '✅ คัดลอกแล้ว!';
            setTimeout(function () { btn.textContent = '📋 คัดลอก'; }, 2000);
          });
        });
      });

      document.querySelectorAll('.btn-admin-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var linkId = btn.getAttribute('data-link-id');
          var action = btn.getAttribute('data-action');
          var reason = '';

          if (action === 'lock') {
            reason = prompt('เหตุผลที่ปิดลิงก์ (บังคับ):', '');
            if (reason === null) return;
            reason = reason.trim();
            if (!reason) {
              alert('กรุณาระบุเหตุผลที่ปิดลิงก์');
              return;
            }
          } else {
            if (!confirm('ยืนยันเปิดลิงก์นี้อีกครั้ง?')) return;
          }

          btn.disabled = true;
          fetch('/api/task-links/' + linkId + '/admin-lock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, reason: reason })
          })
            .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
            .then(function (resp) {
              if (!resp.ok) {
                alert(resp.data.error || 'ไม่สามารถอัปเดตสถานะลิงก์ได้');
                btn.disabled = false;
                return;
              }
              window.location.reload();
            })
            .catch(function () {
              alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
              btn.disabled = false;
            });
        });
      });
    })
    .catch(function () {
      loading.classList.add('hidden');
      empty.classList.remove('hidden');
    });
})();
