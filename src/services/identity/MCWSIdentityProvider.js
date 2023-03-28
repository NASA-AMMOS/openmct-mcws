import mcws from 'services/mcws/mcws';
import createMCWSUser from './createMCWSUser';

export default class UserProvider {
    constructor(openmct) {
        this.openmct = openmct;
        this.user = undefined;
        this.loggedIn = false;

        this.MCWSUser = createMCWSUser(openmct.user.User);
    }

    isLoggedIn() {
        return this.loggedIn;
    }

    getCurrentUser() {
        if (!this.userPromise) {
            this.userPromise = this.#getUserInfo();
        }

        return this.userPromise;
    }

    async #getUserInfo() {
        try {
            const rows = await mcws.namespace().read();
            const userRow = rows.filter((row) => row.subject === 'current_user' && row.predicate === 'has_userid')[0];
            const userId = userRow?.object;

            if (!userId) {
                throw new Error('No user row or user row object returned from MCWS.');
            }

            this.user = new this.MCWSUser(userId);
            this.loggedIn = true;
        } catch(error) {
            console.warn("Could not read user identity from MCWS.", error);
        }

        return this.user;
    }

}
