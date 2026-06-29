// js/utils.js
// Utility functions for the admin portal
var Utils = {

  /**
   * Format a timestamp to date string (YYYY-MM-DD).
   * @param {number|string|Date} ts - Timestamp or Date value
   * @returns {string} Formatted date or '-' if falsy
   */
  formatDate: function (ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '-';
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  },

  /**
   * Format a timestamp to date + time string (YYYY-MM-DD HH:mm).
   * @param {number|string|Date} ts - Timestamp or Date value
   * @returns {string} Formatted date-time or '-' if falsy
   */
  formatDateTime: function (ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '-';
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return y + '-' + m + '-' + day + ' ' + h + ':' + min;
  },

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str - Raw string
   * @returns {string} HTML-escaped string
   */
  escapeHtml: function (str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  /**
   * Create a debounced version of a function.
   * @param {Function} fn - Function to debounce
   * @param {number} ms - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce: function (fn, ms) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  },

  /**
   * Show a toast notification.
   * @param {string} msg - Message text
   * @param {string} [type='success'] - Toast type: 'success', 'error', or 'warning'
   */
  showToast: function (msg, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () { el.remove(); }, 3000);
  },

  /**
   * Show a loading spinner in the content area.
   */
  showLoading: function () {
    var el = document.getElementById('content');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">加载中...</p></div>';
  },

  /**
   * Hide loading state. Content will be replaced by module render.
   */
  hideLoading: function () {
    var el = document.getElementById('content');
    if (el) el.innerHTML = '';
  }
};
