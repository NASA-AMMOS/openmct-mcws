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
      super(String(name).replace(/[^a-zA-Z0-9]/g, ''), name);
    }
  };
}
