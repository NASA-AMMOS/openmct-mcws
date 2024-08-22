import MCWSIndicator from './MCWSIndicator.vue';
import mcws from 'services/mcws/mcws'
import mount from 'ommUtils/mountVueComponent';
import { nextTick } from 'vue';

function getText(el) {
    return el.querySelector('.label.c-indicator__label').innerText.trim();
}

function getDescription(el) {
    return el.querySelector('.c-indicator').getAttribute('text');
}

function indicatorHasClasses(el, classArray) {
    const indicatorClasses = el.querySelector('.c-indicator').classList;

    return classArray.every(classname => {
        return indicatorClasses.contains(classname);
    });
}

describe('MCWS Indicator', () => {
    let mockNamespace;
    let mockPromise;
    let indicator;
    let _destroy = null;
    let element;
    let openmct = {};

    beforeEach(() => {
        spyOn(mcws, 'namespace');
        spyOn(window, 'setInterval');
        mockNamespace = jasmine.createSpyObj('namespace', ['read']);
        mockPromise = jasmine.createSpyObj('promise', ['then']);
        mockNamespace.read.and.returnValue(mockPromise);
        mcws.namespace.and.returnValue(mockNamespace);
        element = document.createElement('div');

        indicator = mount(
            {
                provide: {
                    openmct
                },
                components: {
                    MCWSIndicator
                },
                template: '<MCWSIndicator />'
            },
            {
              element
            }
        );

        _destroy = indicator.destroy;
    });

    afterEach(() => {
        _destroy?.();
    });

    it('should have the correct glyphClass', () => {
        const indicatorElement = element.querySelector('.c-indicator');

        expect(indicatorElement.classList.contains('icon-database')).toBeTrue();
    });

    describe('initially', () => {
        it('is in a pending state', () => {
            expect(getText(element)).toBe('Checking connection...');
            expect(getDescription(element)).toBe(null);
        });

        it('registers a function with interval', () => {
            expect(window.setInterval)
                .toHaveBeenCalledWith(jasmine.any(Function), 15000);
        });

        it('invokes read and registers handlers', () => {
            expect(mockNamespace.read).toHaveBeenCalled();
            expect(mockPromise.then)
                .toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Function)
                );
        });
    });

    describe('successful read call', () => {
        beforeEach((done) => {
            mockPromise.then.calls.all()[0].args[0]();
            nextTick(done);
        });

        it('is in a connected state', () => {
            expect(indicatorHasClasses(element, ['icon-database', 's-status-ok'])).toBe(true);
            expect(getText(element)).toBe('Connected');
            expect(getDescription(element)).toBe('Connected to the domain object database.');
        });
    });

    describe('failed read call', () => {
        beforeEach((done) => {
            mockPromise.then.calls.all()[0].args[1]();
            nextTick(done);
        });

        it('is in a disconnected state', () => {
            expect(indicatorHasClasses(element, ['icon-database', 's-status-error'])).toBe(true);
            expect(getText(element)).toBe('Disconnected');
            expect(getDescription(element)).toBe('Unable to connect to the domain object database.');
        });
    });
});
