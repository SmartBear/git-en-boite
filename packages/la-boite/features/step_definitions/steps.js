"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _a = require('cucumber'), Given = _a.Given, When = _a.When, Then = _a.Then, defineParameterType = _a.defineParameterType;
var CreateUser = {
    withId: function (userId) { return function (_a) { }; }
};
var Has = {
    user: function (_a) {
        var userId = _a.userId;
    }
};
Given('an app {app}', function (app) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});
When('{app} creates a user {word}', function (app, userId) {
    app.attemptsTo(CreateUser.withId(userId));
});
Then('the {app} app\'s users should include {word}', function (userId, app) {
    app.checksThat(Has.user({ userId: userId }));
});
