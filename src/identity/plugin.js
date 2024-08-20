import LoginService from './LoginService';

class IdentityPlugin {
    constructor(options) {
        this.options = options;
    }

    install(openmct) {
        if (this.options.proxyUrl) {
            this.options.camUrl = this.options.proxyUrl + 'cam/UI/Login';
        }
        const loginService = new LoginService(this.options.camUrl);
        this.install.login = loginService.login.bind(loginService);
    }
}

export default IdentityPlugin;
