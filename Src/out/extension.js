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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const language_1 = require("./config/language");
const OUTPUT_CHANNEL_NAME = 'MForge MUMPS & VistA IDE';
function activate(context) {
    const output = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
    context.subscriptions.push(output);
    output.appendLine(`${OUTPUT_CHANNEL_NAME} activated for language '${language_1.MUMPS_LANGUAGE_ID}'.`);
    output.appendLine(`Supported extensions: ${language_1.SUPPORTED_EXTENSIONS.join(', ')}`);
    context.subscriptions.push(vscode.commands.registerCommand('mforge.showGettingStarted', async () => {
        const selection = await vscode.window.showInformationMessage('MForge MUMPS & VistA IDE is ready. Stage 1 includes syntax highlighting, language configuration, and snippets.', 'Open README', 'Show Output');
        if (selection === 'Open README') {
            const readme = vscode.Uri.joinPath(context.extensionUri, 'README.md');
            await vscode.commands.executeCommand('vscode.open', readme);
        }
        if (selection === 'Show Output') {
            output.show();
        }
    }));
}
function deactivate() {
    // Static Stage 1 contributions do not need shutdown work.
}
//# sourceMappingURL=extension.js.map