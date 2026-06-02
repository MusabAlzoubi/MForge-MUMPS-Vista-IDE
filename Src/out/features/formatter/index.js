"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFormatterFeature = registerFormatterFeature;
const vscode = __importStar(require("vscode"));
const language_1 = require("../../config/language");
const formatter_1 = require("./formatter");
function registerFormatterFeature(context) {
    const provider = {
        provideDocumentFormattingEdits(document) {
            if (!isFormatterEnabled()) {
                return [];
            }
            const original = document.getText();
            const formatted = (0, formatter_1.formatMumpsDocumentText)(original);
            if (formatted === original) {
                return [];
            }
            const lastLine = document.lineAt(document.lineCount - 1);
            const fullRange = new vscode.Range(new vscode.Position(0, 0), lastLine.rangeIncludingLineBreak.end);
            return [vscode.TextEdit.replace(fullRange, formatted)];
        }
    };
    const indentationProvider = {
        provideOnTypeFormattingEdits(document, position, ch) {
            if (!isFormatterEnabled() || ch !== '\n' || position.line === 0) {
                return [];
            }
            const currentLine = document.lineAt(position.line).text;
            if (currentLine.slice(0, position.character).trim() !== '') {
                return [];
            }
            const previousLine = document.lineAt(position.line - 1).text;
            const indentation = (0, formatter_1.suggestIndentationForNewLine)(previousLine);
            if (indentation === '') {
                return [];
            }
            return [vscode.TextEdit.insert(new vscode.Position(position.line, 0), indentation)];
        }
    };
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(language_1.MUMPS_LANGUAGE_ID, provider), vscode.languages.registerOnTypeFormattingEditProvider(language_1.MUMPS_LANGUAGE_ID, indentationProvider, '\n'));
}
function isFormatterEnabled() {
    return vscode.workspace.getConfiguration('mforge').get('formatter.enabled', true);
}
//# sourceMappingURL=index.js.map