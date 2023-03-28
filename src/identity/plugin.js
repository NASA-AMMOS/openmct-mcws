define([
    './LoginService'
], function (
    LoginService
) {

    function IdentityPlugin(options) {

        return function install(openmct) {
            if (options.proxyUrl) {
                options.camUrl = options.proxyUrl + 'cam/UI/Login';
            }
            var loginService = new LoginService(options.camUrl);
            install.login = loginService.login.bind(loginService);
        }
    }

    return IdentityPlugin;

});
