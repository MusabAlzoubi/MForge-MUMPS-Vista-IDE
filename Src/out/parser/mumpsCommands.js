"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MUMPS_COMMANDS = void 0;
exports.isKnownMumpsCommand = isKnownMumpsCommand;
exports.normalizeMumpsCommand = normalizeMumpsCommand;
exports.MUMPS_COMMANDS = new Map([
    ['B', 'BREAK'],
    ['BREAK', 'BREAK'],
    ['C', 'CLOSE'],
    ['CLOSE', 'CLOSE'],
    ['D', 'DO'],
    ['DO', 'DO'],
    ['E', 'ELSE'],
    ['ELSE', 'ELSE'],
    ['F', 'FOR'],
    ['FOR', 'FOR'],
    ['G', 'GOTO'],
    ['GOTO', 'GOTO'],
    ['H', 'HALT'],
    ['HALT', 'HALT'],
    ['HANG', 'HANG'],
    ['I', 'IF'],
    ['IF', 'IF'],
    ['J', 'JOB'],
    ['JOB', 'JOB'],
    ['K', 'KILL'],
    ['KILL', 'KILL'],
    ['L', 'LOCK'],
    ['LOCK', 'LOCK'],
    ['M', 'MERGE'],
    ['MERGE', 'MERGE'],
    ['N', 'NEW'],
    ['NEW', 'NEW'],
    ['O', 'OPEN'],
    ['OPEN', 'OPEN'],
    ['Q', 'QUIT'],
    ['QUIT', 'QUIT'],
    ['R', 'READ'],
    ['READ', 'READ'],
    ['S', 'SET'],
    ['SET', 'SET'],
    ['TC', 'TCOMMIT'],
    ['TCOMMIT', 'TCOMMIT'],
    ['TRE', 'TRESTART'],
    ['TRESTART', 'TRESTART'],
    ['TRO', 'TROLLBACK'],
    ['TROLLBACK', 'TROLLBACK'],
    ['TS', 'TSTART'],
    ['TSTART', 'TSTART'],
    ['U', 'USE'],
    ['USE', 'USE'],
    ['V', 'VIEW'],
    ['VIEW', 'VIEW'],
    ['W', 'WRITE'],
    ['WRITE', 'WRITE'],
    ['X', 'XECUTE'],
    ['XECUTE', 'XECUTE']
]);
function isKnownMumpsCommand(token) {
    const upper = token.toUpperCase();
    return exports.MUMPS_COMMANDS.has(upper) || /^Z[A-Z][A-Z0-9]*$/.test(upper);
}
function normalizeMumpsCommand(token) {
    const upper = token.toUpperCase();
    return exports.MUMPS_COMMANDS.get(upper) ?? upper;
}
//# sourceMappingURL=mumpsCommands.js.map