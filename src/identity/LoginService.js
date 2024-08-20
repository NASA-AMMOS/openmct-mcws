export default class LoginService {
    /**
     * LoginService provides a simple interface for logging in a user.
     *
     * @param camUrl the url to use for logging in a user.
     */
    constructor(camUrl) {
        this.camUrl = camUrl;
        this.overlay = undefined;
        this.whenLoggedIn = undefined;
        window.addEventListener('message', this.onMessage.bind(this));
    }

    /**
     * @private
     */
    onMessage(event) {
        const message = event.data;
        const trustedOrigin = new URL(this.camUrl).origin;

        if (event.origin === trustedOrigin && message.name === 'login:complete') {
            this.completeLogin();
        }
    }

    /**
     * Return the login url, with a parameter to redirect to a local url
     * after the login completes.
     * @private
     */
    getLoginUrl() {
        return this.camUrl + "?goto=" +
            encodeURIComponent(
                window.location.origin +
                window.location.pathname +
                'src/identity/close.html'
            );
    }

    /**
     * @private
     */
    show() {
        this.overlay = document.createElement('div');
        this.overlay.classList.add('u-contents');
        
        const iframe = document.createElement('iframe');
        iframe.classList.add('c-login-overlay');
        iframe.src = this.getLoginUrl();

        this.overlay.appendChild(iframe);
        document.body.appendChild(this.overlay);
    }

    /**
     * Signal login as complete, dismiss the visible dialog, and resolve
     * the login promise.
     * @private
     */
    completeLogin() {
        this.overlay.remove();
        this.resolve();
        delete this.overlay;
        delete this.resolve;
        delete this.reject;
    }

    /**
     * Log in a user.  Displays a login dialog in an iFrame.
     *
     * @returns Promise a promise that is resolved when a user is logged in,
     *     or rejected if they choose not to log in.
     */
    login() {
        if (this.whenLoggedIn) {
            return this.whenLoggedIn;
        }
        this.show();
        this.whenLoggedIn = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        return this.whenLoggedIn;
    }
}
