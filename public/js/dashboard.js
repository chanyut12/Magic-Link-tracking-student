(function () {
  var loading = document.getElementById('loading');
  var empty = document.getElementById('empty');
  var emptyMessage = document.getElementById('empty-message');
  var tableWrap = document.getElementById('table-wrap');
  var mobileList = document.getElementById('mobile-list');
  var tbody = document.getElementById('cases-body');
  var filterModeAllBtn = document.getElementById('filter-mode-all');
  var filterModeExecBtn = document.getElementById('filter-mode-exec');
  var statusFilterSelect = document.getElementById('status-filter');
  var datePresetFilterSelect = document.getElementById('date-preset-filter');
  var schoolFilterSelect = document.getElementById('school-filter');
  var linkFilterSelect = document.getElementById('link-filter');
  var sortFilterSelect = document.getElementById('sort-filter');
  var btnResetFilters = document.getElementById('btn-reset-filters');
  var filterSummary = document.getElementById('filter-summary');

  var allCases = [];
  var currentMode = 'ALL';
  var currentStatusFilter = 'ALL';
  var currentDatePreset = 'ALL';
  var currentSchool = 'ALL';
  var currentLinkFilter = 'ALL';
  var currentSort = 'DEFAULT';

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
      IN_PROGRESS: 'badge-progress',
      PENDING_REVIEW: 'badge-pending',
      RESOLVED: 'badge-resolved'
    };
    var labels = {
      IN_PROGRESS: 'กำลังดำเนินการ',
      PENDING_REVIEW: 'รอผอ.ประเมิน',
      RESOLVED: 'ปิดเคสแล้ว'
    };
    var cls = map[status] || 'badge-pending';
    var label = labels[status] || status;
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function formatDate(d) {
    if (!d) return '-';
    var dt = new Date(d);
    return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function linkCellContent(c) {
    if (!c.active_link) return '';
    var publicLink = normalizePublicLink(c.active_link);
    var lineUrl = buildLineShareUrl(publicLink);
    if (c.active_link_locked) {
      return '<span class="badge badge-expired" style="margin-right:6px">ปิดโดยผู้ดูแล</span>';
    }
    return `<a href="${publicLink}" target="_blank" rel="noopener" class="btn-copy-link" style="text-decoration:none; background:#3b82f6; color:white; border-color:#3b82f6;" title="เปิดดูภารกิจ">👁️ เปิด</a> ` +
      `<button class="btn-copy-link" data-link="${publicLink}" title="คัดลอกลิงก์">📋 คัดลอก</button> ` +
      `<a href="${lineUrl}" target="_blank" rel="noopener" class="btn-copy-link btn-line-share" style="background:#06C755;color:#fff;border-color:#06C755;text-decoration:none;" title="ส่งผ่าน LINE">💬 LINE</a> `;
  }

  function mobileLinkCell(c) {
    if (!c.active_link) return '<span class="badge badge-expired">ไม่มีลิงก์ที่ใช้งานได้</span>';
    if (c.active_link_locked) return '<span class="badge badge-expired">ปิดโดยผู้ดูแล</span>';
    var publicLink = normalizePublicLink(c.active_link);
    var lineUrl = buildLineShareUrl(publicLink);
    return (
      `<a href="${publicLink}" target="_blank" rel="noopener" class="btn-copy-link" style="text-decoration:none; background:#3b82f6; color:white; border-color:#3b82f6;">👁️ เปิดดู</a>` +
      `<button class="btn-copy-link" data-link="${publicLink}" title="คัดลอกลิงก์">📋 คัดลอก</button>` +
      `<a href="${lineUrl}" target="_blank" rel="noopener" class="btn-copy-link btn-copy-link--line" title="ส่งผ่าน LINE">💬 LINE</a>`
    );
  }

  function mobileAdminAction(c) {
    if (!c.active_link_id) return '';
    if (c.active_link_locked) {
      return `<button class="btn-copy-link btn-admin-toggle" data-link-id="${c.active_link_id}" data-action="unlock" title="เปิดใช้งานลิงก์อีกครั้ง">🔓 เปิดลิงก์</button>`;
    }
    return `<button class="btn-copy-link btn-admin-toggle" data-link-id="${c.active_link_id}" data-action="lock" title="ปิดลิงก์ชั่วคราว/ถาวร">🔒 ปิดลิงก์</button>`;
  }

  function adminLinkCellContent(c) {
    if (!c.active_link_id) return '';
    if (c.active_link_locked) {
      var reason = c.active_link_lock_reason ? escapeHtml(c.active_link_lock_reason) : '-';
      return `<button class="btn-copy-link btn-admin-toggle" style="color:#ef4444; border-color:#ef4444;" data-link-id="${c.active_link_id}" data-action="unlock" title="เหตุผล: ${reason} (คลิกเพื่อเปิดใช้งานลิงก์อีกครั้ง)">🔓 เปิดลิงก์</button>`;
    }
    return `<button class="btn-copy-link btn-admin-toggle" style="color:#64748b; border-color:#cbd5e1;" data-link-id="${c.active_link_id}" data-action="lock" title="ปิดลิงก์ชั่วคราว/ถาวร">🔒 ปิดลิงก์</button>`;
  }

  function fmt(n) {
    return (n || 0).toLocaleString('th-TH');
  }

  function getStatusLabel(status) {
    var labels = {
      IN_PROGRESS: 'กำลังดำเนินการ',
      PENDING_REVIEW: 'รอผอ.ประเมิน',
      RESOLVED: 'ปิดเคสแล้ว'
    };
    return labels[status] || status;
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function applyDashboardLayout() {
    if (isMobileViewport()) {
      tableWrap.classList.add('hidden');
      mobileList.classList.remove('hidden');
    } else {
      tableWrap.classList.remove('hidden');
      mobileList.classList.add('hidden');
    }
  }

  function isExecutiveCase(c) {
    return c.status === 'PENDING_REVIEW' || c.status === 'IN_PROGRESS';
  }

  function statusPriority(status) {
    var map = {
      PENDING_REVIEW: 0,
      IN_PROGRESS: 1,
      RESOLVED: 2
    };
    return map[status] != null ? map[status] : 99;
  }

  function toDateOnly(str) {
    if (!str) return null;
    var d = new Date(str);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function getFilteredCases() {
    var filtered = allCases.filter(function (c) {
      if (currentMode === 'EXEC' && !isExecutiveCase(c)) return false;
      if (currentStatusFilter !== 'ALL' && c.status !== currentStatusFilter) return false;

      // Date Preset Filter
      if (currentDatePreset !== 'ALL') {
        var caseDate = toDateOnly(c.created_at);
        if (caseDate) {
          var today = toDateOnly(new Date());
          // Use (today - caseDate) without Math.abs to exclude future-dated cases
          var diffTime = today - caseDate;
          if (diffTime < 0) return false; // future date — exclude
          var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // diffDays = 0 for same day, 1 for yesterday
          if (currentDatePreset === 'TODAY' && diffDays > 0) return false;
          if (currentDatePreset === 'LAST_7' && diffDays > 7) return false;
          if (currentDatePreset === 'LAST_30' && diffDays > 30) return false;
        }
      }

      // School filter
      if (currentSchool !== 'ALL') {
        if ((c.student_school || '') !== currentSchool) return false;
      }

      // Link filter
      if (currentLinkFilter === 'ACTIVE') {
        if (!c.active_link || c.active_link_locked) return false;
      } else if (currentLinkFilter === 'LOCKED') {
        if (!c.active_link_locked) return false;
      } else if (currentLinkFilter === 'NONE') {
        if (c.active_link) return false;
      }

      return true;
    });

    filtered.sort(function (a, b) {
      if (currentSort === 'NEWEST') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (currentSort === 'OLDEST') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else {
        // DEFAULT sort
        var byStatus = statusPriority(a.status) - statusPriority(b.status);
        if (byStatus !== 0) return byStatus;
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  }

  function setFilterChipState() {
    filterModeAllBtn.classList.toggle('filter-chip-active', currentMode === 'ALL');
    filterModeExecBtn.classList.toggle('filter-chip-active', currentMode === 'EXEC');
  }

  function updateFilterSummary(filteredCount) {
    var modeLabel = currentMode === 'EXEC' ? 'โหมดผู้บริหาร/ผอ.' : 'ทุกเคส';
    var statusLabel = currentStatusFilter === 'ALL' ? 'ทุกสถานะ' : getStatusLabel(currentStatusFilter);
    filterSummary.textContent = 'กำลังแสดง ' + fmt(filteredCount) + ' จาก ' + fmt(allCases.length) + ' เคส (' + modeLabel + ' • ' + statusLabel + ')';
  }

  function bindCaseActionButtons() {
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
  }

  function renderFilteredCases() {
    var cases = getFilteredCases();
    tbody.innerHTML = '';
    mobileList.innerHTML = '';

    updateFilterSummary(cases.length);

    if (!allCases.length) {
      emptyMessage.textContent = 'ยังไม่มีเคส — กด "สร้างภารกิจใหม่" เพื่อเริ่มต้น';
      empty.classList.remove('hidden');
      tableWrap.classList.add('hidden');
      mobileList.classList.add('hidden');
      return;
    }

    if (!cases.length) {
      emptyMessage.textContent = 'ไม่พบเคสตามตัวกรองที่เลือก';
      empty.classList.remove('hidden');
      tableWrap.classList.add('hidden');
      mobileList.classList.add('hidden');
      return;
    }

    empty.classList.add('hidden');
    applyDashboardLayout();

    cases.forEach(function (c, i) {
      var studentName = escapeHtml(c.student_name || '-');
      var school = escapeHtml(c.student_school || '-');
      var reason = escapeHtml(c.reason_flagged || '-');
      var createdAt = formatDate(c.created_at);
      var tr = document.createElement('tr');
      tr.innerHTML =
        `<td>${i + 1}</td>` +
        `<td>${c.task_id ? `<a href="/task-detail/${c.task_id}" style="text-decoration:none; color:inherit; font-weight:700;">${studentName}</a>` : studentName}</td>` +
        `<td>${school}</td>` +
        `<td class="text-truncate" title="${reason}">${reason}</td>` +
        `<td class="text-nowrap">${statusBadge(c.status)}</td>` +
        `<td class="text-nowrap" style="display:flex; gap:4px; align-items:center;">${linkCellContent(c)}${adminLinkCellContent(c)}</td>` +
        `<td class="text-nowrap">${createdAt}</td>` +
        `<td class="text-nowrap">${c.task_id ? `<a href="/task-detail/${c.task_id}" class="btn-detail"><i class="fas fa-search"></i> ดูรายละเอียด</a>` : '-'}</td>`;
      tbody.appendChild(tr);

      var card = document.createElement('div');
      card.className = 'mobile-case-card';
      card.innerHTML =
        `<div class="mobile-case-top">` +
        `<div>` +
        `<div class="mobile-case-title">${studentName}</div>` +
        `<div class="mobile-case-meta">${school}</div>` +
        `</div>` +
        statusBadge(c.status) +
        `</div>` +
        `<div class="mobile-case-meta">สาเหตุ: ${reason}</div>` +
        `<div class="mobile-case-meta">สร้างเมื่อ: ${createdAt}</div>` +
        `<div class="mobile-case-actions">` +
        linkCellContent(c) +
        adminLinkCellContent(c) +
        (c.task_id ? `<a class="btn-detail" href="/task-detail/${c.task_id}"><i class="fas fa-info-circle"></i> รายละเอียด</a>` : '') +
        `</div>`;
      if (c.active_link_locked && c.active_link_lock_reason) {
        card.innerHTML += `<div class="mobile-case-link">เหตุผลที่ปิดลิงก์: ${escapeHtml(c.active_link_lock_reason)}</div>`;
      }
      mobileList.appendChild(card);
    });

    bindCaseActionButtons();
  }

  function populateSchoolFilter() {
    var schools = {};
    allCases.forEach(function (c) {
      var s = c.student_school || '';
      if (s && !schools[s]) schools[s] = true;
    });
    var sorted = Object.keys(schools).sort();
    schoolFilterSelect.innerHTML = `<option value="ALL">ทุกโรงเรียน</option>`;
    sorted.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      schoolFilterSelect.appendChild(opt);
    });
  }

  function resetAllFilters() {
    currentMode = 'ALL';
    currentStatusFilter = 'ALL';
    currentDatePreset = 'ALL';
    currentSchool = 'ALL';
    currentLinkFilter = 'ALL';
    currentSort = 'DEFAULT';

    statusFilterSelect.value = 'ALL';
    datePresetFilterSelect.value = 'ALL';
    schoolFilterSelect.value = 'ALL';
    linkFilterSelect.value = 'ALL';
    sortFilterSelect.value = 'DEFAULT';

    setFilterChipState();
    renderFilteredCases();
  }

  function bindFilters() {
    filterModeAllBtn.addEventListener('click', function () {
      currentMode = 'ALL';
      setFilterChipState();
      renderFilteredCases();
    });

    filterModeExecBtn.addEventListener('click', function () {
      currentMode = 'EXEC';
      setFilterChipState();
      renderFilteredCases();
    });

    statusFilterSelect.addEventListener('change', function () {
      currentStatusFilter = this.value;
      renderFilteredCases();
    });

    datePresetFilterSelect.addEventListener('change', function () {
      currentDatePreset = this.value;
      renderFilteredCases();
    });

    schoolFilterSelect.addEventListener('change', function () {
      currentSchool = this.value;
      renderFilteredCases();
    });

    linkFilterSelect.addEventListener('change', function () {
      currentLinkFilter = this.value;
      renderFilteredCases();
    });

    sortFilterSelect.addEventListener('change', function () {
      currentSort = this.value;
      renderFilteredCases();
    });

    btnResetFilters.addEventListener('click', resetAllFilters);
  }

  // Fetch stats
  fetch('/api/stats')
    .then(function (r) {
      if (r.status === 401) {
        window.location.href = '/admin-access?next=' + encodeURIComponent(window.location.pathname);
        return null;
      }
      return r.json();
    })
    .then(function (s) {
      if (!s) return;
      document.getElementById('stat-total').textContent = fmt(s.total);
      document.getElementById('stat-progress').textContent = fmt(s.in_progress);
      document.getElementById('stat-resolved').textContent = fmt(s.resolved);
      document.getElementById('stat-today').textContent = fmt(s.created_today);
      document.getElementById('stat-pending-review').textContent = fmt(s.pending_review);
      document.getElementById('stat-active-links').textContent = fmt(s.active_delegations);
      document.getElementById('stat-active-links').parentElement.style.cursor = 'pointer';
      document.getElementById('stat-active-links').parentElement.onclick = function() {
        linkFilterSelect.value = 'ACTIVE';
        currentLinkFilter = 'ACTIVE';
        renderFilteredCases();
      };
      document.getElementById('stat-delegations').textContent = fmt(s.total_delegations);
    })
    .catch(function () { });

  // Fetch cases
  fetch('/api/cases')
    .then(function (r) {
      if (r.status === 401) {
        window.location.href = '/admin-access?next=' + encodeURIComponent(window.location.pathname);
        return null;
      }
      return r.json();
    })
    .then(function (cases) {
      if (!cases) return;
      loading.classList.add('hidden');
      allCases = Array.isArray(cases) ? cases : [];
      populateSchoolFilter();
      setFilterChipState();
      bindFilters();
      renderFilteredCases();
      window.addEventListener('resize', function () {
        if (tbody.children.length || mobileList.children.length) {
          applyDashboardLayout();
        }
      });
    })
    .catch(function () {
      loading.classList.add('hidden');
      empty.classList.remove('hidden');
    });
})();
