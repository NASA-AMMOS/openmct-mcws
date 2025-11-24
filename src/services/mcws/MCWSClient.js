class MCWSClient {
  constructor() {
    this.config = {};
    this.pending = 0;
    this._updatePending = this._updatePending.bind(this);
  }

  configure(config) {
    this.config = config;
  }

  proxyRequest(options) {
    let url = options.url;

    if (!url.startsWith('http') && !url.startsWith('//')) {
      url = `${this.config.mcwsUrl}${url}`;
    }

    if (this.config.proxyUrl) {
      const params = options.params;
      let isJsonResponse = false;

      if (params && Object.keys(params).length > 0) {
        // Check if this is a JSON response before we delete params
        if (params.output === 'json') {
          isJsonResponse = true;
        }

        const paramKeys = Object.keys(params);
        const formattedParams = paramKeys
          .map((key) => `${key}=${encodeURIComponent(params[key])}`)
          .join('&');

        url += `?${formattedParams}`;
        
        // Delete params after using them to prevent baseRequest from adding them again
        delete options.params;
      }

      url = `${this.config.proxyUrl}proxyUrl?url=${encodeURIComponent(url)}`;
      
      // Preserve the isJsonResponse flag for baseRequest
      if (isJsonResponse) {
        options.isJsonResponse = true;
      }

      delete options.params;
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
    let isJsonResponse = false;

    if (options?.isJsonResponse) {
      isJsonResponse = true;
      delete options.isJsonResponse;
    }


    this.pending++;

    if (options?.params) {
      const params = new URLSearchParams(options.params);

      // append options params to url
      // dataset urls may already contain user specified params
      url = url.includes('?') ? `${url}&${params}` : `${url}?${params}`;

      delete options.params;
    }

    // Keepalive
    options.keepalive = true;

    try {
      response = await fetch(url, options);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Request aborted', error);
        return;
      } else {
        console.error('Error in base request', error);
        throw error;
      }
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
  }

  async authorizedRequest(options) {
    let response;
    const url = options.url;
    delete options.url;

    try {
      response = await this.baseRequest(url, options);
    } catch (error) {
      return Promise.reject(error);
    }

    return response;
  }
}

const client = new MCWSClient();

export default client;
