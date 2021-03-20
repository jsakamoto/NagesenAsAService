"use strict";
var NaaS;
(function (NaaS) {
    class UrlService {
        get roomNumber() { return parseInt(location.pathname.split('/')[2]); }
        get apiBaseUrl() { return location.origin + '/api/rooms/' + this.roomNumber; }
        get controllerUrl() { return location.origin + '/room/' + this.roomNumber; }
        constructor() {
        }
    }
    NaaS.UrlService = UrlService;
    NaaS.urlService = new UrlService();
})(NaaS || (NaaS = {}));
