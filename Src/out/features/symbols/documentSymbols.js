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
exports.MumpsDocumentSymbolProvider = void 0;
exports.getDocumentLabels = getDocumentLabels;
const vscode = __importStar(require("vscode"));
const routineParser_1 = require("../../parser/routineParser");
function getDocumentLabels(documentText) {
    return (0, routineParser_1.parseMumpsRoutine)(documentText).labels;
}
class MumpsDocumentSymbolProvider {
    provideDocumentSymbols(document) {
        return getDocumentLabels(document.getText()).map((label) => {
            const range = new vscode.Range(label.line, label.startCharacter, label.line, label.endCharacter);
            const selectionRange = new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter);
            return new vscode.DocumentSymbol(label.signature, 'MUMPS label', vscode.SymbolKind.Function, range, selectionRange);
        });
    }
}
exports.MumpsDocumentSymbolProvider = MumpsDocumentSymbolProvider;
//# sourceMappingURL=documentSymbols.js.map