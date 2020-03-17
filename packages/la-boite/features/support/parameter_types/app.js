"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var defineParameterType = require('cucumber').defineParameterType;
var screenplay_1 = require("../screenplay");
defineParameterType({
    name: 'app',
    regexp: /[A-Z][a-z]+(?:[A-Z][a-z]+)*/,
    transformer: function (name) { return new screenplay_1.Actor(name); }
});
