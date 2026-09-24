export function createToastManager() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);

  return {
    show: (message, type = 'info', duration = 3000) => {
      const toast = document.createElement('div');
      toast.className = `toast-item ${type}`;

      let icon = 'info';
      if (type === 'error') icon = 'error';
      else if (type === 'success') icon = 'check_circle';

      toast.innerHTML = `
        <span class="material-symbols-outlined text-[18px]" style="color: ${type === 'error' ? 'var(--color-error)' : type === 'success' ? 'var(--color-emerald)' : 'var(--color-primary)'};">${icon}</span>
        <span class="font-code-sm text-on-surface" style="font-size: 11.5px;">${message}</span>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };
}
