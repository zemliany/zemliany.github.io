function copyToClipboard(button) {
    const codeBlock = button.previousElementSibling.textContent;
    navigator.clipboard.writeText(codeBlock).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    });
  }