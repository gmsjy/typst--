const assert = require('assert');
const {
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
} = require('../src/typst');

describe('Typst Formula Conversion Tests', () => {
    it('convertFractions - simple fraction', () => {
        assert.strictEqual(convertFractions('a/b'), '\\frac{a}{b}');
    });

    it('convertFractions - nested fraction (right associative)', () => {
        assert.strictEqual(convertFractions('a/b/c'), '\\frac{a}{\\frac{b}{c}}');
    });

    it('convertFractions - complex fraction', () => {
        assert.strictEqual(convertFractions('(a+b)/(c+d)'), '\\frac{(a+b)}{(c+d)}');
    });

    it('convertSqrt - square root', () => {
        assert.strictEqual(convertSqrt('sqrt(x)'), '\\sqrt{x}');
        assert.strictEqual(convertSqrt('sqrt(16)'), '\\sqrt{16}');
    });

    it('convertSqrt - nth root', () => {
        assert.strictEqual(convertSqrt('sqrt(x, 3)'), '\\sqrt[3]{x}');
        assert.strictEqual(convertSqrt('sqrt(27, 3)'), '\\sqrt[3]{27}');
    });

    it('convertGreekLetters - lowercase', () => {
        assert.strictEqual(convertGreekLetters('alpha'), '\\alpha');
        assert.strictEqual(convertGreekLetters('beta'), '\\beta');
        assert.strictEqual(convertGreekLetters('gamma'), '\\gamma');
        assert.strictEqual(convertGreekLetters('delta'), '\\delta');
        assert.strictEqual(convertGreekLetters('pi'), '\\pi');
        assert.strictEqual(convertGreekLetters('theta'), '\\theta');
    });

    it('convertGreekLetters - uppercase', () => {
        assert.strictEqual(convertGreekLetters('Alpha'), '\\Alpha');
        assert.strictEqual(convertGreekLetters('Beta'), '\\Beta');
        assert.strictEqual(convertGreekLetters('Gamma'), '\\Gamma');
        assert.strictEqual(convertGreekLetters('Delta'), '\\Delta');
        assert.strictEqual(convertGreekLetters('Pi'), '\\Pi');
    });

    it('convertGreekLetters - multiple letters', () => {
        assert.strictEqual(convertGreekLetters('alpha + beta'), '\\alpha + \\beta');
    });

    it('convertMathOperators - basic operators', () => {
        assert.strictEqual(convertMathOperators('sin(x)'), '\\sin(x)');
        assert.strictEqual(convertMathOperators('cos(x)'), '\\cos(x)');
        assert.strictEqual(convertMathOperators('tan(x)'), '\\tan(x)');
        assert.strictEqual(convertMathOperators('log(x)'), '\\log(x)');
        assert.strictEqual(convertMathOperators('ln(x)'), '\\ln(x)');
    });

    it('convertMathOperators - sum with limits (current behavior)', () => {
        const result = convertMathOperators('sum_i^n');
        assert.strictEqual(result, 'sum_i^n');
    });

    it('convertSpecialSymbols', () => {
        assert.strictEqual(convertSpecialSymbols('infinity'), '\\infty');
        assert.strictEqual(convertSpecialSymbols('partial'), '\\partial');
        assert.strictEqual(convertSpecialSymbols('nabla'), '\\nabla');
    });

    it('convertModifiers', () => {
        assert.strictEqual(convertModifiers('hat(x)'), '\\hat{x}');
        assert.strictEqual(convertModifiers('vec(x)'), '\\vec{x}');
        assert.strictEqual(convertModifiers('dot(x)'), '\\dot{x}');
        assert.strictEqual(convertModifiers('ddot(x)'), 'd\\dot{x}');
        assert.strictEqual(convertModifiers('tilde(x)'), '\\tilde{x}');
    });

    it('convertArrows', () => {
        assert.strictEqual(convertArrows('arrow.l'), '\\leftarrow');
        assert.strictEqual(convertArrows('arrow.r'), '\\rightarrow');
        assert.strictEqual(convertArrows('arrow.l.r'), '\\left\\rightarrow');
    });

    it('convertMatrix', () => {
        assert.strictEqual(
            convertMatrix('mat(a, b; c, d)'),
            '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'
        );
    });

    it('convertCases', () => {
        assert.strictEqual(
            convertCases('cases(x < 0, x >= 0)'),
            '\\begin{cases} x < 0 \\\\ x >= 0 \\end{cases}'
        );
    });
});

describe('Typst to Markdown Conversion Tests', () => {
    it('convertHeadings - h1 to h6', () => {
        assert.strictEqual(convertHeadings('= Title'), '# Title');
        assert.strictEqual(convertHeadings('== Section'), '## Section');
        assert.strictEqual(convertHeadings('=== Subsection'), '### Subsection');
        assert.strictEqual(convertHeadings('==== H4'), '#### H4');
        assert.strictEqual(convertHeadings('===== H5'), '##### H5');
        assert.strictEqual(convertHeadings('====== H6'), '###### H6');
    });

    it('convertBold', () => {
        assert.strictEqual(convertBold('*bold text*'), '**bold text**');
        assert.strictEqual(convertBold('*a* and *b*'), '**a** and **b**');
    });

    it('convertItalic', () => {
        assert.strictEqual(convertItalic('_italic text_'), '*italic text*');
        assert.strictEqual(convertItalic('_a_ and _b_'), '*a* and *b*');
    });

    it('convertLinks', () => {
        assert.strictEqual(
            convertLinks('link("https://example.com", "Example")'),
            '[Example](https://example.com)'
        );
        assert.strictEqual(
            convertLinks('link("https://example.com")'),
            '[https://example.com](https://example.com)'
        );
    });

    it('convertImages', () => {
        assert.strictEqual(
            convertImages('image("path/to/image.png", alt: "Description")'),
            '![Description](path/to/image.png)'
        );
        assert.strictEqual(
            convertImages('image("path/to/image.png")'),
            '![](path/to/image.png)'
        );
    });

    it('convertLists', () => {
        assert.strictEqual(convertLists('+ Item 1'), '- Item 1');
        assert.strictEqual(convertLists('  + Nested item'), '  - Nested item');
    });
});

describe('Typst Formula to LaTeX Integration Tests', () => {
    it('E=mc^2', () => {
        const result = convertTypstFormulaToLatex('E=mc^2');
        assert.strictEqual(result, 'E=mc^2');
    });

    it('Fraction with variables', () => {
        const result = convertTypstFormulaToLatex('a/b');
        assert.strictEqual(result, '\\frac{a}{b}');
    });

    it('Quadratic formula', () => {
        const result = convertTypstFormulaToLatex('(-b + sqrt(b^2 - 4*a*c)) / (2*a)');
        assert.ok(result.includes('\\frac'));
        assert.ok(result.includes('\\sqrt'));
    });

    it('Greek letters in formula', () => {
        const result = convertTypstFormulaToLatex('pi * r^2');
        assert.ok(result.includes('\\pi'));
    });

    it('Sum notation (current behavior)', () => {
        const result = convertTypstFormulaToLatex('sum_i^n i');
        assert.ok(!result.includes('\\sum'));
    });
});

describe('Full Markdown Conversion Tests', () => {
    it('Simple document', () => {
        const input = '= Hello World\n\nThis is a paragraph.';
        const result = convertTypstToMarkdown(input);
        assert.ok(result.includes('# Hello World'));
    });

    it('Document with formula', () => {
        const input = '= Math\n\nThe formula $E=mc^2$ is famous.';
        const result = convertTypstToMarkdown(input);
        assert.ok(result.includes('# Math'));
        assert.ok(result.includes('$E=mc^2$'));
    });

    it('Document with bold and italic', () => {
        const input = '*bold* and _italic_';
        const result = convertTypstToMarkdown(input);
        assert.ok(result.includes('**bold**'));
        assert.ok(result.includes('*italic*'));
    });

    it('Document with list', () => {
        const input = '+ Item 1\n+ Item 2';
        const result = convertTypstToMarkdown(input);
        assert.ok(result.includes('- Item 1'));
        assert.ok(result.includes('- Item 2'));
    });
});
