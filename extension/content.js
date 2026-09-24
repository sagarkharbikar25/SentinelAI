document.addEventListener('submit', () => {
  chrome.runtime.sendMessage({
    type: 'BROWSER_EVENT',
    actionType: 'BROWSER_FORM_SUBMIT',
    operation: 'WRITE',
    url: window.location.href
  });
});
