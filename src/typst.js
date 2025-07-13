const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os   = require('os');

/**
 * 输入：完整的行内公式字符串，例如 "$E=mc^2$"
 * 输出：SVG 字符串
 */
function renderTypstToSVG(formula) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'typst-'));
    const typFile = path.join(tmpDir, 'tmp.typ');
    const svgFile = path.join(tmpDir, 'tmp.svg');

    fs.writeFileSync(typFile, formula);

    try {
        execSync(`typst compile --format svg "${typFile}" "${svgFile}"`, { stdio: 'pipe' });
        return fs.readFileSync(svgFile, 'utf8');
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

module.exports = { renderTypstToSVG };