import MCWSIdentityProvider from './MCWSIdentityProvider';
import mcws from 'services/mcws/mcws';

class User {
    constructor(id, name) {
        this.id = id;
        this.name = name;

        this.getId = this.getId.bind(this);
        this.getName = this.getName.bind(this);
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }
}

describe('MCWSIdentityProvider', () => {
    let mockOpenmct;
    let mockNamespace;
    let responseData;
    let identityProvider;

    beforeEach(() => {
        spyOn(mcws, 'namespace');
        spyOn(console, 'warn');

        mockOpenmct = {
            user: {
                User,
                getCurrentUser() {
                    return identityProvider.getCurrentUser();
                }
            }
        }

        identityProvider = new MCWSIdentityProvider(mockOpenmct);

        mockNamespace = jasmine.createSpyObj('namespace', ['read'])
        mcws.namespace.and.returnValue(mockNamespace);

        responseData = [{
            subject: 'current_user',
            predicate: 'has_userid',
            object: 'test-user'
        }];
    });

    it('reads the current user ID from MCWS instance data', async () => {
        mockNamespace.read.and.returnValue(Promise.resolve(responseData));
        
        const user = await mockOpenmct.user.getCurrentUser();

        expect(user.getId()).toEqual('test-user');
        expect(user.getName()).toEqual('test-user');
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('handles response that does not have userid', async () => {
        mockNamespace.read.and.returnValue(Promise.resolve([]));

        const user = await mockOpenmct.user.getCurrentUser();
        expect(user).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith('Could not read user identity from MCWS.', new Error('No user row or user row object returned from MCWS.'));
    });

    it('logs a warning when there is an error', async () => {
        mockNamespace.read.and.returnValue(Promise.reject('error'));

        const user = await mockOpenmct.user.getCurrentUser();

        expect(user).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith('Could not read user identity from MCWS.', 'error');
    });
});
