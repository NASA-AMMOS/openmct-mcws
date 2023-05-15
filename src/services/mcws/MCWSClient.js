class MCWSClient {
    constructor() {
        this.config = {};
        this.pending = 0;
        this._updatePending = this._updatePending.bind(this);
    }

    configure(config, login) {
        this.config = config;
        this.login = login;
    }
    
    proxyRequest(options) {
        let url = options.url;

        if (!url.startsWith('http') && !url.startsWith('//')) {
            url = `${this.config.mcwsUrl}${url}`;
        }
    
        if (this.config.proxyUrl) {
            const params = options.params;

            if (params && Object.keys(params).length > 0) {
                const paramKeys = Object.keys(params);
                const formattedParams = paramKeys.map(
                    key => `${key}=${encodeURIComponent(params[key])}`
                ).join('&');

                url += `?${formattedParams}`;
            }
    
            url = `${this.config.proxyUrl}proxyUrl?url=${encodeURIComponent(url)}`;
        }

        options.url = url;
        options.credentials = 'include';

        return this.authorizedRequest(options);
    }
    
    _updatePending() {
        this.pending--;
    }
    
    async baseRequest(url, options) {
        let response;
        this.pending++;
        let isJsonResponse = false;

        if (options?.params) {
            if (options.params?.output === 'json') {
                isJsonResponse = true;
            }

            const params = new URLSearchParams(options.params);

            url += `?${params}`;
            delete options.params;
        }
        
        try {
            response = await fetch(url, options);
        } catch(error) {
            throw error;
        } finally {
            this._updatePending();
        }

        if (!response.ok) {
            return Promise.reject({ response });
        }

        if (isJsonResponse) {
            return response.json();
        }

        return response;
    }
    
    request(options) {
        return this.proxyRequest(options);
    };
    
    isCamResponse(response) {
        const contentType = response?.headers?.['content-type'];

        return contentType?.includes('text/html');
    }

    getResponseType(response) {
        // TODO: more nuanced response handling should be done here
        if (this.isCamResponse(response)) {
            return 'cam';
        } else {
            return 'unhandled';
        }
    }
    
    async authorizedRequest(options) {
        let response;
        const url = options.url;
        delete options.url;
        
        try {
            response = await this.baseRequest(url, options);
            const responseType = this.getResponseType(response);

            if (responseType === 'cam') {
                await this.login();
                
                response = await this.baseRequest(url, options);
            }
        } catch(error) {
            return Promise.reject(error);
        }
        
        return response;
    }
}

const client = new MCWSClient();

export default client;
