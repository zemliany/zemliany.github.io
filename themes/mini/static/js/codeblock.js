document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".code-content").forEach((block) => {
        const code = block.querySelector("pre code");
        const lineNumbers = block.querySelector(".line-numbers");

        if (!code || !lineNumbers) return;

        // Ensure all lines are captured
        let rawText = code.innerText
            .replace(/\s+$/g, "") // Trim only unnecessary spaces
            .split(/\r?\n/); 

        // Generate line numbers dynamically
        lineNumbers.innerHTML = rawText.map((_, i) => `<span>${i + 1}</span>`).join("");

        // Ensure it aligns properly
        block.style.display = "flex";
        lineNumbers.style.lineHeight = "1.4em";
    });
});
