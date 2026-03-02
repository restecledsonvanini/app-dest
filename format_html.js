const fs = require('fs');

let html = fs.readFileSync('ferramentas/index.html', 'utf8');

// The 8 tool forms mapping buttons to forms
const mappings = [
  ['removeMask', 'removeMask'],
  ['addMaskEprotocolo', 'addMaskEprotocolo'],
  ['addMaskGMS', 'addMaskGMS'],
  ['addMaskCPF', 'addMaskCPF'],
  ['addMaskCNPJ', 'addMaskCNPJ'],
  ['calculateDateValidity', 'calculateDateValidity'],
  ['calculateDaysRemaining', 'calculateDaysRemaining'],
  ['searchCNPJ', 'searchCNPJ']
];

let currentIndex = 0;
// We replace <div class="tool-body"> with <form class="tool-body" data-tool="...">
// and change the closing </div> to </form> which occurs exactly before </div>\n                    </div>\n                </div>
// Wait, regex might be tricky. Let's do it by blocks

let parts = html.split('<div class="tool-body">');
let newHtml = parts[0];

for (let i = 1; i < parts.length; i++) {
    // Find the onclick function in this block
    const match = parts[i].match(/onclick=\"([a-zA-Z]+)\(\)\"/);
    if (match) {
        const funcName = match[1];
        newHtml += `<form class="tool-body form-tool" data-tool="${funcName}">` + parts[i];
    } else {
        newHtml += `<div class="tool-body">` + parts[i];
    }
}

newHtml = newHtml.replace(/onclick=\"[a-zA-Z]+\(\)\"/g, '');
newHtml = newHtml.replace(/<button type="button" class="btn btn-primary"/g, '<button type="submit" class="btn btn-primary"');

// Fix closing form tags
// Whenever we see a <div id="cnpj-result" class="result-box"></div> followed by spaces and </div>, that last </div> should be </form>
// Actually we can just find <form and then correctly match divs to close the form.
fs.writeFileSync('ferramentas/index2.html', newHtml);
