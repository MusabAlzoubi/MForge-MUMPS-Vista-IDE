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
exports.MumpsDefinitionProvider = void 0;
const vscode = __importStar(require("vscode"));
const routineParser_1 = require("../../parser/routineParser");
class MumpsDefinitionProvider {
    routineIndex;
    output;
    constructor(routineIndex, output) {
        this.routineIndex = routineIndex;
        this.output = output;
    }
    async provideDefinition(document, position) {
        const reference = (0, routineParser_1.findMumpsReferenceAt)(document.lineAt(position.line).text, position.character);
        if (!reference) {
            this.debug('No MUMPS label or routine reference at cursor.');
            return null;
        }
        if (reference.routine) {
            await this.routineIndex.ensureBuilt();
            const routine = this.routineIndex.findRoutine(reference.routine);
            if (!routine) {
                this.debug(`Routine '${reference.routine}' not found in workspace index.`);
                return null;
            }
            if (!reference.label) {
                return new vscode.Location(routine.uri, new vscode.Range(0, 0, 0, 0));
            }
            const label = routine.labels.find((candidate) => candidate.name.toUpperCase() === reference.label?.toUpperCase());
            if (!label) {
                this.debug(`Label '${reference.label}' not found in routine '${reference.routine}'.`);
                return null;
            }
            return new vscode.Location(routine.uri, new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter));
        }
        if (reference.label) {
            const localLabel = (0, routineParser_1.parseMumpsRoutine)(document.getText()).labels.find((label) => label.name.toUpperCase() === reference.label?.toUpperCase());
            if (!localLabel) {
                this.debug(`Local label '${reference.label}' not found.`);
                return null;
            }
            return new vscode.Location(document.uri, new vscode.Range(localLabel.line, localLabel.nameStartCharacter, localLabel.line, localLabel.nameEndCharacter));
        }
        return null;
    }
    debug(message) {
        const traceLevel = vscode.workspace.getConfiguration('mforge').get('trace.level', 'off');
        if (traceLevel === 'debug') {
            this.output?.appendLine(`[navigation] ${message}`);
        }
    }
}
exports.MumpsDefinitionProvider = MumpsDefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map