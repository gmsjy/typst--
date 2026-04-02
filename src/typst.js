const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

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

/**
 * 将 Typst 文档转换为 Markdown
 */
function convertTypstToMarkdown(typstContent) {
    // 首先保护代码块
    const codeBlocks = [];
    let processed = typstContent.replace(/```[\s\S]*?```/g, (match) => {
        codeBlocks.push(match);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    
    // 转换公式
    processed = convertFormulas(processed);
    
    // 转换标题
    processed = convertHeadings(processed);
    
    // 转换粗体
    processed = convertBold(processed);
    
    // 转换斜体
    processed = convertItalic(processed);
    
    // 转换链接
    processed = convertLinks(processed);
    
    // 转换图片
    processed = convertImages(processed);
    
    // 转换列表
    processed = convertLists(processed);
    
    // 恢复代码块
    codeBlocks.forEach((block, index) => {
        processed = processed.replace(`__CODE_BLOCK_${index}__`, block);
    });
    
    return processed;
}

/**
 * 转换公式（行内和块级）
 */
function convertFormulas(content) {
    // 处理块级公式（单独一行，前后有空格）
    content = content.replace(/^\$\s+([\s\S]+?)\s+\$\s*$/gm, (match, formula) => {
        return `$$${convertTypstFormulaToLatex(formula)}$$`;
    });
    
    // 处理行内公式
    content = content.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
        return `$${convertTypstFormulaToLatex(formula)}$`;
    });
    
    return content;
}

/**
 * 将 Typst 公式转换为 LaTeX
 */
function convertTypstFormulaToLatex(formula) {
    let result = formula;
    
    // 转换矩阵（需要先处理，避免被其他规则干扰）
    result = convertMatrix(result);
    
    // 转换分段函数
    result = convertCases(result);
    
    // 转换希腊字母
    result = convertGreekLetters(result);
    
    // 转换数学运算符
    result = convertMathOperators(result);
    
    // 转换特殊符号
    result = convertSpecialSymbols(result);
    
    // 转换箭头
    result = convertArrows(result);
    
    // 转换修饰符
    result = convertModifiers(result);
    
    // 转换根号
    result = convertSqrt(result);
    
    // 转换分数（最后处理，因为需要处理嵌套）
    result = convertFractions(result);
    
    return result;
}

/**
 * 转换分数 x/y -> \frac{x}{y}
 */
function convertFractions(formula) {
    // 递归处理嵌套的分数
    function processFraction(str) {
        // 找到最外层的 /
        let depth = 0;
        let slashIndex = -1;
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '(' || char === '{' || char === '[') depth++;
            else if (char === ')' || char === '}' || char === ']') depth--;
            else if (char === '/' && depth === 0) {
                slashIndex = i;
                break;
            }
        }
        
        if (slashIndex === -1) return str;
        
        // 提取分子和分母
        let numerator = str.substring(0, slashIndex);
        let denominator = str.substring(slashIndex + 1);
        
        // 简单处理：如果分子或分母包含运算，用括号包裹
        // 递归处理分子和分母中的分数
        numerator = processFraction(numerator);
        denominator = processFraction(denominator);
        
        return `\\frac{${numerator}}{${denominator}}`;
    }
    
    return processFraction(formula);
}

/**
 * 转换根号 sqrt(x) -> \sqrt{x}, sqrt(x, n) -> \sqrt[n]{x}
 */
function convertSqrt(formula) {
    // sqrt(x, n)
    formula = formula.replace(/sqrt\s*\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g, (match, content, n) => {
        return `\\sqrt[${n}]{${content}}`;
    });
    
    // sqrt(x)
    formula = formula.replace(/sqrt\s*\(\s*([^)]+?)\s*\)/g, (match, content) => {
        return `\\sqrt{${content}}`;
    });
    
    return formula;
}

/**
 * 希腊字母映射
 */
const GREEK_LETTERS = {
    'alpha': '\\alpha', 'beta': '\\beta', 'gamma': '\\gamma', 'delta': '\\delta',
    'epsilon': '\\epsilon', 'zeta': '\\zeta', 'eta': '\\eta', 'theta': '\\theta',
    'iota': '\\iota', 'kappa': '\\kappa', 'lambda': '\\lambda', 'mu': '\\mu',
    'nu': '\\nu', 'xi': '\\xi', 'pi': '\\pi', 'rho': '\\rho',
    'sigma': '\\sigma', 'tau': '\\tau', 'upsilon': '\\upsilon', 'phi': '\\phi',
    'chi': '\\chi', 'psi': '\\psi', 'omega': '\\omega',
    'Alpha': '\\Alpha', 'Beta': '\\Beta', 'Gamma': '\\Gamma', 'Delta': '\\Delta',
    'Epsilon': '\\Epsilon', 'Zeta': '\\Zeta', 'Eta': '\\Eta', 'Theta': '\\Theta',
    'Iota': '\\Iota', 'Kappa': '\\Kappa', 'Lambda': '\\Lambda', 'Mu': '\\Mu',
    'Nu': '\\Nu', 'Xi': '\\Xi', 'Pi': '\\Pi', 'Rho': '\\Rho',
    'Sigma': '\\Sigma', 'Tau': '\\Tau', 'Upsilon': '\\Upsilon', 'Phi': '\\Phi',
    'Chi': '\\Chi', 'Psi': '\\Psi', 'Omega': '\\Omega'
};

/**
 * 转换希腊字母
 */
function convertGreekLetters(formula) {
    let result = formula;
    for (const [typst, latex] of Object.entries(GREEK_LETTERS)) {
        // 使用单词边界确保完整匹配
        const regex = new RegExp(`\\b${typst}\\b`, 'g');
        result = result.replace(regex, latex);
    }
    return result;
}

/**
 * 数学运算符映射
 */
const MATH_OPERATORS = {
    'sum': '\\sum', 'prod': '\\prod', 'integral': '\\int',
    'sin': '\\sin', 'cos': '\\cos', 'tan': '\\tan', 'cot': '\\cot',
    'sec': '\\sec', 'csc': '\\csc', 'ln': '\\ln', 'log': '\\log',
    'exp': '\\exp'
};

/**
 * 转换数学运算符（包括上下标）
 */
function convertMathOperators(formula) {
    let result = formula;
    
    // 处理带上下标的运算符 sum_i^n, integral_a^b
    for (const [typst, latex] of Object.entries(['sum', 'prod', 'integral'])) {
        const symbol = typst === 'integral' ? '\\int' : `\\${typst}`;
        // _i^n
        const regex1 = new RegExp(`${typst}_([^_\\^\\s]+)\\^([^\\s]+)`, 'g');
        result = result.replace(regex1, `${symbol}_{$1}^{$2}`);
        // _i
        const regex2 = new RegExp(`${typst}_([^_\\^\\s]+)`, 'g');
        result = result.replace(regex2, `${symbol}_{$1}`);
        // ^n
        const regex3 = new RegExp(`${typst}\\^([^\\s]+)`, 'g');
        result = result.replace(regex3, `${symbol}^{$1}`);
    }
    
    // 处理普通运算符
    for (const [typst, latex] of Object.entries(MATH_OPERATORS)) {
        if (!['sum', 'prod', 'integral'].includes(typst)) {
            const regex = new RegExp(`\\b${typst}\\b`, 'g');
            result = result.replace(regex, latex);
        }
    }
    
    return result;
}

/**
 * 特殊符号映射
 */
const SPECIAL_SYMBOLS = {
    'infinity': '\\infty',
    'partial': '\\partial',
    'nabla': '\\nabla'
};

/**
 * 转换特殊符号
 */
function convertSpecialSymbols(formula) {
    let result = formula;
    for (const [typst, latex] of Object.entries(SPECIAL_SYMBOLS)) {
        const regex = new RegExp(`\\b${typst}\\b`, 'g');
        result = result.replace(regex, latex);
    }
    return result;
}

/**
 * 修饰符映射
 */
const MODIFIERS = {
    'dot': '\\dot',
    'ddot': '\\ddot',
    'tilde': '\\tilde',
    'hat': '\\hat',
    'vec': '\\vec'
};

/**
 * 转换修饰符
 */
function convertModifiers(formula) {
    let result = formula;
    for (const [typst, latex] of Object.entries(MODIFIERS)) {
        // dot(x) -> \dot{x}
        const regex = new RegExp(`${typst}\\(([^)]+)\\)`, 'g');
        result = result.replace(regex, `${latex}{$1}`);
    }
    return result;
}

/**
 * 箭头映射
 */
const ARROWS = {
    'arrow.l': '\\leftarrow',
    'arrow.r': '\\rightarrow',
    'arrow.l.r': '\\leftrightarrow'
};

/**
 * 转换箭头
 */
function convertArrows(formula) {
    let result = formula;
    for (const [typst, latex] of Object.entries(ARROWS)) {
        result = result.replace(typst, latex);
    }
    return result;
}

/**
 * 转换矩阵 mat(a, b; c, d) -> \begin{pmatrix} a & b \\ c & d \end{pmatrix}
 */
function convertMatrix(formula) {
    return formula.replace(/mat\s*\(([^)]+)\)/g, (match, content) => {
        // 分号分隔行，逗号分隔列
        const rows = content.split(';').map(row => {
            return row.split(',').map(cell => cell.trim()).join(' & ');
        });
        const matrixContent = rows.join(' \\\\ ');
        return `\\begin{pmatrix} ${matrixContent} \\end{pmatrix}`;
    });
}

/**
 * 转换分段函数 cases(a, b) -> \begin{cases} a \\ b \end{cases}
 */
function convertCases(formula) {
    return formula.replace(/cases\s*\(([^)]+)\)/g, (match, content) => {
        const parts = content.split(',').map(p => p.trim());
        return `\\begin{cases} ${parts.join(' \\\\ ')} \\end{cases}`;
    });
}

/**
 * 转换标题
 */
function convertHeadings(content) {
    // 从最多6级开始处理
    for (let i = 6; i >= 1; i--) {
        const typstPrefix = '='.repeat(i) + ' ';
        const mdPrefix = '#'.repeat(i) + ' ';
        const regex = new RegExp(`^${'='.repeat(i)} `, 'gm');
        content = content.replace(regex, mdPrefix);
    }
    return content;
}

/**
 * 转换粗体 *text* -> **text**
 */
function convertBold(content) {
    // 避免匹配公式中的 *
    return content.replace(/\*([^*\n]+?)\*/g, '**$1**');
}

/**
 * 转换斜体 _text_ -> *text*
 */
function convertItalic(content) {
    return content.replace(/_([^_\n]+?)_/g, '*$1*');
}

/**
 * 转换链接
 */
function convertLinks(content) {
    // link("url", "text") -> [text](url)
    content = content.replace(/link\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/g, '[$2]($1)');
    
    // link("url") -> [url](url)
    content = content.replace(/link\s*\(\s*"([^"]+)"\s*\)/g, '[$1]($1)');
    
    return content;
}

/**
 * 转换图片
 */
function convertImages(content) {
    // image("path", alt: "text") -> ![text](path)
    content = content.replace(/image\s*\(\s*"([^"]+)"\s*,\s*alt:\s*"([^"]+)"\s*\)/g, '![$2]($1)');
    
    // image("path") -> ![](path)
    content = content.replace(/image\s*\(\s*"([^"]+)"\s*\)/g, '![]($1)');
    
    return content;
}

/**
 * 转换列表
 */
function convertLists(content) {
    // + 转为 -
    content = content.replace(/^(\s*)\+ /gm, '$1- ');
    
    return content;
}

module.exports = {
    renderTypstToSVG,
    convertTypstToMarkdown,
    convertTypstFormulaToLatex,
    convertFractions,
    convertSqrt,
    convertGreekLetters,
    convertMathOperators,
    convertSpecialSymbols,
    convertModifiers,
    convertArrows,
    convertMatrix,
    convertCases,
    convertHeadings,
    convertBold,
    convertItalic,
    convertLinks,
    convertImages,
    convertLists
};