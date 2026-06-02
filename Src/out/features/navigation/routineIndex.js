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
exports.MumpsRoutineIndex = void 0;
exports.isSupportedRoutineFile = isSupportedRoutineFile;
exports.shouldIgnoreRoutinePath = shouldIgnoreRoutinePath;
exports.routineNameFromFile = routineNameFromFile;
exports.buildRoutineIndexFromFiles = buildRoutineIndexFromFiles;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const language_1 = require("../../config/language");
const routineParser_1 = require("../../parser/routineParser");
const DEFAULT_MAX_WORKSPACE_FILES = 2000;
const EXCLUDED_SEGMENTS = new Set(['node_modules', '.git', 'dist', 'out', 'Old Extensions']);
const EXTENSIONS = new Set(language_1.SUPPORTED_EXTENSIONS.map((extension) => extension.toLowerCase()));
function isSupportedRoutineFile(filePath) {
    return EXTENSIONS.has(path.extname(filePath).toLowerCase());
}
function shouldIgnoreRoutinePath(filePath) {
    return filePath.split(/[\\/]+/u).some((segment) => EXCLUDED_SEGMENTS.has(segment));
}
function routineNameFromFile(filePath) {
    return path.basename(filePath, path.extname(filePath));
}
function buildRoutineIndexFromFiles(files) {
    const routines = files
        .filter((file) => isSupportedRoutineFile(file.filePath))
        .filter((file) => !shouldIgnoreRoutinePath(file.filePath))
        .map((file) => {
        const name = routineNameFromFile(file.filePath);
        return {
            name,
            uri: file.uri ?? vscode.Uri.file(path.resolve(file.filePath)),
            filePath: file.filePath,
            labels: (0, routineParser_1.parseMumpsRoutine)(file.text, name).labels
        };
    })
        .sort((left, right) => left.name.localeCompare(right.name));
    return { routines };
}
class MumpsRoutineIndex {
    output;
    routines = new Map();
    built = false;
    watcher = null;
    constructor(output) {
        this.output = output;
    }
    dispose() {
        this.watcher?.dispose();
    }
    registerWatchers(context) {
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{m,M,mumps,mps,rou,int}');
        context.subscriptions.push(this.watcher, this.watcher.onDidCreate(() => this.markDirty()), this.watcher.onDidChange(() => this.markDirty()), this.watcher.onDidDelete(() => this.markDirty()), vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('mforge.maxWorkspaceFiles')) {
                this.markDirty();
            }
        }));
    }
    async ensureBuilt() {
        if (!this.built) {
            await this.rebuild();
        }
    }
    markDirty() {
        this.built = false;
    }
    getRoutines() {
        return Array.from(this.routines.values()).sort((left, right) => left.name.localeCompare(right.name));
    }
    findRoutine(name) {
        return this.routines.get(name.toUpperCase());
    }
    findLabel(routineName, labelName) {
        return this.findRoutine(routineName)?.labels.find((label) => label.name.toUpperCase() === labelName.toUpperCase());
    }
    async rebuild() {
        const maxFiles = getMaxWorkspaceFiles();
        const files = await vscode.workspace.findFiles('**/*.{m,M,mumps,mps,rou,int}', '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/Old Extensions/**}', maxFiles);
        const inputs = [];
        for (const uri of files) {
            if (shouldIgnoreRoutinePath(uri.fsPath)) {
                continue;
            }
            try {
                inputs.push({ filePath: uri.fsPath, uri, text: await fs.readFile(uri.fsPath, 'utf8') });
            }
            catch (error) {
                this.output?.appendLine(`[navigation] Could not index ${uri.fsPath}: ${String(error)}`);
            }
        }
        const data = buildRoutineIndexFromFiles(inputs.slice(0, maxFiles));
        this.routines = new Map(data.routines.map((routine) => [routine.name.toUpperCase(), routine]));
        this.built = true;
        this.output?.appendLine(`[navigation] Indexed ${this.routines.size} MUMPS routine(s).`);
    }
}
exports.MumpsRoutineIndex = MumpsRoutineIndex;
function getMaxWorkspaceFiles() {
    const configured = vscode.workspace.getConfiguration('mforge').get('maxWorkspaceFiles', DEFAULT_MAX_WORKSPACE_FILES);
    return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_WORKSPACE_FILES;
}
//# sourceMappingURL=routineIndex.js.map