
export default function createMCWSUser(UserClass) {
    /**
     * @typedef {Object} MCWSUserInfo
     * @property {String} name
     */
    return class MCWSUser extends UserClass {
        /**
         * @param {MCWSUserInfo} userInfo
         */
        constructor(name) {
            super(name, name); // no id is returned, so we use name twice
        }
    };
}
