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
exports.registerDiagnosticsFeature = registerDiagnosticsFeature;
const vscode = __importStar(require("vscode"));
const language_1 = require("../../config/language");
const diagnostics_1 = require("./diagnostics");
function registerDiagnosticsFeature(context) {
    const collection = vscode.languages.createDiagnosticCollection('mforge-mumps');
    context.subscriptions.push(collection);
    const refresh = (document) => {
        if (document.languageId !== language_1.MUMPS_LANGUAGE_ID) {
            return;
        }
        if (!isDiagnosticsEnabled()) {
            collection.delete(document.uri);
            return;
        }
        collection.set(document.uri, (0, diagnostics_1.analyzeMumpsDocument)(document));
    };
    for (const document of vscode.workspace.textDocuments) {
        refresh(document);
    }
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(refresh), vscode.workspace.onDidChangeTextDocument((event) => refresh(event.document)), vscode.workspace.onDidSaveTextDocument(refresh), vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri)), vscode.workspace.onDidChangeConfiguration((event) => {
        if (!event.affectsConfiguration('mforge.diagnostics.enabled')) {
            return;
        }
        for (const document of vscode.workspace.textDocuments) {
            refresh(document);
        }
    }));
}
function isDiagnosticsEnabled() {
    return vscode.workspace.getConfiguration('mforge').get('diagnostics.enabled', true);
}
//# sourceMappingURL=index.js.map