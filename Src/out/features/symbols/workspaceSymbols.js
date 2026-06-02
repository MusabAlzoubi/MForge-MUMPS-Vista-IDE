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
exports.MumpsWorkspaceSymbolProvider = void 0;
const vscode = __importStar(require("vscode"));
class MumpsWorkspaceSymbolProvider {
    routineIndex;
    constructor(routineIndex) {
        this.routineIndex = routineIndex;
    }
    async provideWorkspaceSymbols(query) {
        const normalizedQuery = query.trim().toUpperCase();
        await this.routineIndex.ensureBuilt();
        const symbols = [];
        for (const routine of this.routineIndex.getRoutines()) {
            if (matchesQuery(routine.name, normalizedQuery)) {
                symbols.push(new vscode.SymbolInformation(routine.name, vscode.SymbolKind.Module, 'MUMPS routine', new vscode.Location(routine.uri, new vscode.Range(0, 0, 0, 0))));
            }
            for (const label of routine.labels) {
                const labelName = label.signature;
                const qualifiedName = `${label.name}^${routine.name}`;
                if (!matchesQuery(label.name, normalizedQuery) && !matchesQuery(qualifiedName, normalizedQuery)) {
                    continue;
                }
                symbols.push(new vscode.SymbolInformation(qualifiedName, vscode.SymbolKind.Function, routine.name, new vscode.Location(routine.uri, new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter))));
                if (matchesQuery(labelName, normalizedQuery) && label.signature !== label.name) {
                    symbols.push(new vscode.SymbolInformation(labelName, vscode.SymbolKind.Function, routine.name, new vscode.Location(routine.uri, new vscode.Range(label.line, label.startCharacter, label.line, label.endCharacter))));
                }
            }
        }
        return symbols;
    }
}
exports.MumpsWorkspaceSymbolProvider = MumpsWorkspaceSymbolProvider;
function matchesQuery(value, normalizedQuery) {
    return normalizedQuery.length === 0 || value.toUpperCase().includes(normalizedQuery);
}
//# sourceMappingURL=workspaceSymbols.js.map