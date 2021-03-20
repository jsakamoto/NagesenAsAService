namespace NaaS {
    export class UrlService {

        public get roomNumber(): number { return parseInt(location.pathname.split('/')[2]); }

        public get apiBaseUrl(): string { return location.origin + '/api/rooms/' + this.roomNumber }

        public get controllerUrl(): string { return location.origin + '/room/' + this.roomNumber }

        constructor() {
        }
    }

    export const urlService = new UrlService();
}