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
exports.registerNavigationFeature = registerNavigationFeature;
const vscode = __importStar(require("vscode"));
const language_1 = require("../../config/language");
const symbols_1 = require("../symbols");
const definitionProvider_1 = require("./definitionProvider");
const routineIndex_1 = require("./routineIndex");
function registerNavigationFeature(context, output) {
    if (!isNavigationEnabled()) {
        output?.appendLine('Stage 3 navigation is disabled by mforge.navigation.enabled.');
        return;
    }
    const routineIndex = new routineIndex_1.MumpsRoutineIndex(output);
    routineIndex.registerWatchers(context);
    context.subscriptions.push(routineIndex, vscode.languages.registerDefinitionProvider(language_1.MUMPS_LANGUAGE_ID, new definitionProvider_1.MumpsDefinitionProvider(routineIndex, output)));
    (0, symbols_1.registerSymbolsFeature)(context, routineIndex);
}
function isNavigationEnabled() {
    return vscode.workspace.getConfiguration('mforge').get('navigation.enabled', true);
}
//# sourceMappingURL=index.js.map