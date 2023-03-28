import MCWSIndicator from './MCWSIndicator.vue';
import mcws from 'services/mcws/mcws'
import Vue from 'vue';

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
    let parent;
    let child;
    let openmct = {};

    beforeEach(() => {

        spyOn(mcws, 'namespace');
        spyOn(window, 'setInterval');
        mockNamespace = jasmine.createSpyObj('namespace', ['read']);
        mockPromise = jasmine.createSpyObj('promise', ['then']);
        mockNamespace.read.and.returnValue(mockPromise);
        mcws.namespace.and.returnValue(mockNamespace);
        parent = document.createElement('div');
        child = document.createElement('div');
        indicator = new Vue ({
            el: child,
            provide: {
                openmct
            },
            components: {
                MCWSIndicator
            },
            template: '<MCWSIndicator />'
        });
        parent.appendChild(indicator.$el);
    });

    it('should have the correct glyphClass', () => {
        const indicatorElement = parent.querySelector('.c-indicator');

        expect(indicatorElement.classList.contains('icon-database')).toBeTrue();
    });

    describe('initially', () => {
        it('is in a pending state', () => {
            expect(getText(parent)).toBe('Checking connection...');
            expect(getDescription(parent)).toBe(null);
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
            Vue.nextTick(done);
        });

        it('is in a connected state', () => {
            expect(indicatorHasClasses(parent, ['icon-database', 's-status-ok'])).toBe(true);
            expect(getText(parent)).toBe('Connected');
            expect(getDescription(parent)).toBe('Connected to the domain object database.');
        });
    });

    describe('failed read call', () => {
        beforeEach((done) => {
            mockPromise.then.calls.all()[0].args[1]();
            Vue.nextTick(done);
        });

        it('is in a disconnected state', () => {           
            expect(indicatorHasClasses(parent, ['icon-database', 's-status-error'])).toBe(true);
            expect(getText(parent)).toBe('Disconnected');
            expect(getDescription(parent)).toBe('Unable to connect to the domain object database.');
        });
    });
});
