// Sidebar toggle (desktop collapse + mobile slide)
document.addEventListener('DOMContentLoaded', function() {
  var menuBtn = document.getElementById('menu-btn');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('overlay');

  function isMobile() {
    return window.innerWidth <= 768;
  }

  if (menuBtn) {
    menuBtn.onclick = function() {
      if (isMobile()) {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
      } else {
        document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebar-collapsed', document.body.classList.contains('sidebar-collapsed'));
      }
    };
  }

  if (overlay) {
    overlay.onclick = function() {
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    };
  }

  // Restore desktop collapse state
  if (!isMobile() && localStorage.getItem('sidebar-collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
  }
});
