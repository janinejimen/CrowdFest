"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
var admin = require("firebase-admin");
var initialized = false;
function init() {
    if (!initialized) {
        admin.initializeApp();
        initialized = true;
    }
    return admin;
}
var db = function () { return init().firestore(); };
exports.db = db;
var auth = function () { return init().auth(); };
exports.auth = auth;
