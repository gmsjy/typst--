// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { renderTypstToSVG } = require('./src/typst');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');


function findInlineFormula(document, position) {
    const line = document.lineAt(position).text;
    let start = line.lastIndexOf('$', position.character);
    if (start === -1) return null;
    let end   = line.indexOf('$', start + 1);
    if (end   === -1) return null;
    return line.slice(start, end + 1);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	const cmd = vscode.commands.registerCommand(
        'typst--.svg-export',
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const doc = editor.document;
            let formula;
            if (!editor.selection.isEmpty) {
                formula = doc.getText(editor.selection);
				formula = `#set page(width: auto, height: auto, margin: 0pt,fill: none)
				#show math.equation: set text(top-edge: "bounds", bottom-edge: "bounds")
				`+formula ;
            } else {
                formula = findInlineFormula(doc, editor.selection.start);
				formula = formula = `#set page(width: auto, height: auto, margin: 0pt,fill: none)
				#show math.equation: set text(top-edge: "bounds", bottom-edge: "bounds")
				`+formula ;
            }
            if (!formula || !formula.trim()) {
                vscode.window.showErrorMessage('未找到行内公式');
                return;
            }

            try {
                const svg = renderTypstToSVG(formula);
                const hash = crypto.createHash('sha256')
                                   .update(formula)
                                   .digest('hex')
                                   .slice(0, 8);
                const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                const outDir = path.join(ws || '.', 'typst-export');
                if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
                const outFile = path.join(outDir, `formula-${hash}.svg`);
                fs.writeFileSync(outFile, svg, 'utf8');
                vscode.window.showInformationMessage(`已导出 → ${path.relative(ws || '.', outFile)}`);
            } catch (err) {
                vscode.window.showErrorMessage('导出失败：' + err.message);
            }
        }
    );
    context.subscriptions.push(cmd);

}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
