function copyToClipboard(button) {
  const codeBlock = button.closest(".code-block").querySelector("pre code"); // Selects only the actual code
  const textToCopy = codeBlock.textContent.trim(); // Ensures only code is copied

  navigator.clipboard.writeText(textToCopy).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => {
          button.textContent = 'Copy';
      }, 2000);
  });
}
