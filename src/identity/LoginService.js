/*global define*/
define(
    [
        './login.html'
    ],
    function (loginTemplate) {


        /**
         * LoginService provides a simple interface for logging in a user.
         *
         * @param camUrl the url to use for logging in a user.
         */
        function LoginService(camUrl) {
            this.camUrl = camUrl;
            this.overlay = undefined;
            this.whenLoggedIn = undefined;
            window.addEventListener('message', this.onMessage.bind(this));
        }

        /**
         * @private
         */
        LoginService.prototype.onMessage = function (event) {
            var message = event.data;
            if (message.name === 'login:complete') {
                this.completeLogin();
            }
        };

        /**
         * Return the login url, with a parameter to redirect to a local url
         * after the login completes.
         * @private
         */
        LoginService.prototype.getLoginUrl = function () {
            return this.camUrl + "?goto=" +
                encodeURIComponent(
                    window.location.origin +
                    window.location.pathname +
                    'src/identity/close.html'
                );
        };

        /**
         * @private
         */
        LoginService.prototype.show = function () {
            this.overlay = document.createElement('div');
            this.overlay.classList.add('u-contents');
            this.overlay.innerHTML = loginTemplate;
            document.body.appendChild(this.overlay);
            this.overlay.querySelector('iframe').src = this.getLoginUrl();
        };

        /**
         * Signal login as complete, dismiss the visible dialog, and resolve
         * the login promise.
         * @private
         */
        LoginService.prototype.completeLogin = function () {
            this.overlay.remove();
            this.resolve();
            delete this.overlay;
            delete this.resolve;
            delete this.reject;
        };

        /**
         * Log in a user.  Displays a login dialog in an iFrame.
         *
         * @returns Promise a promise that is resolved when a user is logged in,
         *     or rejected if they choose not to log in.
         */
        LoginService.prototype.login = function () {
            if (this.whenLoggedIn) {
                return this.whenLoggedIn;
            }
            this.show();
            this.whenLoggedIn = new Promise(function(resolve, reject) {
                this.resolve = resolve;
                this.reject = reject;
            }.bind(this))
            return this.whenLoggedIn;
        };

        return LoginService;

    }
);
