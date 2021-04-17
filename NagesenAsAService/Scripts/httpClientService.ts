namespace NaaS {
    export class HttpClientService {

        constructor() {
        }

        public postAsync(url: string, body?: any, headers?: any): Promise<Response> {
            return this.sendRequestAsync('post', url, body, headers);
        }

        public deleteAsync(url: string, body?: any, headers?: any): Promise<Response> {
            return this.sendRequestAsync('delete', url, body, headers);
        }

        public sendRequestAsync(method: string, url: string, body?: any, headers?: any): Promise<Response> {
            const options: any = { method };

            if (typeof (headers) !== 'undefined') options.headers = headers;
            options.headers = (options.headers || {});
            if (typeof (options.headers["Accept"]) === 'undefined') options.headers["Accept"] = 'application/json';
            if (typeof (options.headers["Content-Type"]) === 'undefined') options.headers["Content-Type"] = 'application/json';

            if (typeof (body) === 'string') options.body = body;
            if (typeof (body) === 'object') options.body = JSON.stringify(body);

            const token = this.getCookie('X-ANTIFORGERY-TOKEN');
            if (token !== '') options.headers["X-ANTIFORGERY-TOKEN"] = token;

            return fetch(url, options);
        }

        private getCookie(key: string): string {
            const entry = document.cookie
                .split(';')
                .map(keyvalue => keyvalue.trim().split('='))
                .filter(keyvalue => decodeURIComponent(keyvalue[0]) === key)
                .pop();
            if (typeof (entry) === 'undefined') return '';
            return decodeURIComponent(entry[1]);
        }
    }

    export const httpClientService = new HttpClientService();
}