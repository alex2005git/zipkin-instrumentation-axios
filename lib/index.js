const { Instrumentation } = require('zipkin');

/**
 * Wrapper for the axios HTTP-client.
 *
 */
class AxiosWrapper {
  /**
   * Override default constructor.
   *
   */
  constructor(axios, { tracer, remoteServiceName }) {
    this.axios = axios;
    this.tracer = tracer;
    this.remoteServiceName = remoteServiceName;
  }

  /**
   * Sends a GET-Request to the given url.
   */
  get(url, opt = {}) {
    opt.method = 'GET';
    return this.sendRequest(url, opt);
  }

  /**
   * Sends a PUT-Request to the given url.
   *
   */
  put(url, data, opt = {}) {
    opt.method = 'PUT';
    opt.data = data;
    return this.sendRequest(url, opt);
  }

  /**
   * Sends a PATCH-Request to the given url.
   *
   */
  patch(url, data, opt = {}) {
    opt.method = 'PATCH';
    opt.data = data;
    return this.sendRequest(url, opt);
  }

  /**
   * Sends a POST-Request to the given url.
   *
   */
  post(url, data, opt = {}) {
    opt.method = 'POST';
    opt.data = data;
    return this.sendRequest(url, opt);
  }

  /**
   * Sends a DELETE-Request to the given url.
   *
   */
  delete(url, opt = {}) {
    opt.method = 'DELETE';
    return this.sendRequest(url, opt);
  }

  /**
   * Sends a HEAD-Request to the given url.
   *
   */
  head(url, opt = {}) {
    opt.method = 'HEAD';
    return this.sendRequest(url, opt);
  }

  /**
   * Sends a OPTIONS-Request to the given url.
   *
   */
  options(url, opt = {}) {
    opt.method = 'OPTIONS';
    return this.sendRequest(url, opt);
  }

  /**
   * Wrapper for axios.request
   * Here we create the scope and record the annotations.
   *
   */
  sendRequest(url, opts) {
    const { axios, tracer, remoteServiceName } = this;
    const { method } = opts;
    const instrumentation = new Instrumentation.HttpClient({
      tracer,
      remoteServiceName,
    });

    return new Promise((resolve, reject) => {
      tracer.scoped(() => {
        let urlWithBaseUrl = url;
        if (axios.defaults.baseURL) {
          urlWithBaseUrl = axios.defaults.baseURL + urlWithBaseUrl;
        }

        const config = instrumentation.recordRequest(opts, urlWithBaseUrl, method);
        config.url = url;

        const traceId = tracer.id;

        axios.request(config)
            .then(result => {
              tracer.scoped(() => {
                instrumentation.recordResponse(traceId, result.status);
              });

              resolve(result);
            })
            .catch(err => {
              tracer.scoped(() => {
                instrumentation.recordError(traceId, err);
              });

              reject(err);
            });
      });
    });
  }
}

/**
 * Instrument the given axios instance.
 *
 * @param  {object} axios   The axios instance to Instrument
 * @param  {object} options Options in the form: { tracer, remoteServiceName}
 * @return {AxiosWrapper}   The wrapped axios instance
 */
module.exports = function wrapAxios(axios, options) {
  return new AxiosWrapper(axios, options);
};
