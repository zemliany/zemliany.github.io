function copyToClipboard(button) {
    const codeContent = button.previousElementSibling.querySelector('.code-content');
    const codeText = codeContent ? codeContent.textContent : button.previousElementSibling.textContent;
    navigator.clipboard.writeText(codeText).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    });
}

function addLineNumbers() {
    document.querySelectorAll('.code-block pre').forEach(pre => {
        if (pre.querySelector('.line-numbers')) return;
        
        const originalText = pre.textContent.trim();
        const lines = originalText.split('\n');
        
        // Create line numbers
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers';
        lineNumbers.textContent = Array.from({length: lines.length}, (_, i) => i + 1).join('\n');
        
        // Create code content with highlighting
        const codeContent = document.createElement('div');
        codeContent.className = 'code-content';
        
        const language = detectLanguage(originalText);
        highlightCode(codeContent, originalText, language);
        
        pre.innerHTML = '';
        pre.style.display = 'flex';
        pre.appendChild(lineNumbers);
        pre.appendChild(codeContent);
    });
}

function detectLanguage(code) {
    if (code.includes('import jenkins') || (code.includes('def ') && code.includes('Authentication'))) {
        return 'groovy';
    }
    if (code.includes('def ') && code.includes('print')) {
        return 'python';
    }
    if (code.includes('func ') || code.includes('package ')) {
        return 'go';
    }
    return 'javascript';
}

function highlightCode(container, code, language) {
    const keywords = {
        groovy: ['def', 'import', 'if', 'else', 'try', 'catch', 'new', 'public', 'private', 'static', 'final'],
        javascript: ['const', 'let', 'var', 'function', 'if', 'else', 'try', 'catch', 'import', 'export'],
        typescript: ['const', 'let', 'var', 'function', 'if', 'else', 'try', 'catch', 'import', 'export', 'interface', 'type', 'enum', 'namespace', 'class', 'extends', 'implements', 'async', 'await'],
        python: ['def', 'import', 'if', 'else', 'try', 'except', 'with', 'as'],
        go: ['func', 'var', 'const', 'if', 'else', 'package', 'import', 'type', 'struct', 'interface', 'for', 'range', 'return', 'go', 'defer', 'select', 'case', 'switch', 'chan', 'map'],
        golang: ['func', 'var', 'const', 'if', 'else', 'package', 'import', 'type', 'struct', 'interface', 'for', 'range', 'return', 'go', 'defer', 'select', 'case', 'switch', 'chan', 'map']
    };
    
    const langKeywords = keywords[language] || [];
    
    // Process line by line to preserve formatting
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
        if (index > 0) {
            container.appendChild(document.createTextNode('\n'));
        }
        
        processLine(container, line, langKeywords);
    });
}

function processLine(container, line, keywords) {
    let remaining = line;
    let pos = 0;
    
    while (pos < line.length) {
        let matched = false;
        
        if (remaining.startsWith('//')) {
            const span = document.createElement('span');
            span.className = 'token comment';
            span.textContent = remaining;
            container.appendChild(span);
            break;
        }
        
        const stringMatch = remaining.match(/^("[^"]*"|'[^']*')/);
        if (stringMatch) {
            const span = document.createElement('span');
            span.className = 'token string';
            span.textContent = stringMatch[0];
            container.appendChild(span);
            pos += stringMatch[0].length;
            remaining = line.slice(pos);
            matched = true;
        }
        
        if (!matched) {
            const wordMatch = remaining.match(/^\w+/);
            if (wordMatch && keywords.includes(wordMatch[0])) {
                const span = document.createElement('span');
                span.className = 'token keyword';
                span.textContent = wordMatch[0];
                container.appendChild(span);
                pos += wordMatch[0].length;
                remaining = line.slice(pos);
                matched = true;
            }
        }
        
        if (!matched) {
            const numberMatch = remaining.match(/^\d+(\.\d+)?/);
            if (numberMatch) {
                const span = document.createElement('span');
                span.className = 'token number';
                span.textContent = numberMatch[0];
                container.appendChild(span);
                pos += numberMatch[0].length;
                remaining = line.slice(pos);
                matched = true;
            }
        }
        
        if (!matched) {
            container.appendChild(document.createTextNode(line[pos]));
            pos++;
            remaining = line.slice(pos);
        }
    }
}

document.addEventListener('DOMContentLoaded', addLineNumbers);