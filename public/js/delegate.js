(function () {
  var pathParts = window.location.pathname.split('/');
  var token = pathParts[2];

  var formSection = document.getElementById('form-section');
  var resultSection = document.getElementById('result-section');
  var delegateBtn = document.getElementById('delegate-btn');

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

  document.getElementById('back-btn').addEventListener('click', function () {
    window.location.href = '/task/' + token;
  });

  delegateBtn.addEventListener('click', function () {
    var name = document.getElementById('new_assignee_name').value.trim();
    if (!name) {
      alert('กรุณากรอกชื่อผู้รับงานคนใหม่');
      return;
    }

    delegateBtn.disabled = true;
    delegateBtn.textContent = 'กำลังส่งต่อ...';

    var body = {
      new_assignee_name: name,
      new_assignee_phone: document.getElementById('new_assignee_phone').value.trim(),
      expires_in_hours: computeExpiryHours()
    };

    fetch('/api/tasks/' + token + '/delegate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          alert(data.error);
          delegateBtn.disabled = false;
          delegateBtn.textContent = '🔄 ส่งต่อภารกิจ';
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
        delegateBtn.disabled = false;
        delegateBtn.textContent = '🔄 ส่งต่อภารกิจ';
      });
  });
})();
