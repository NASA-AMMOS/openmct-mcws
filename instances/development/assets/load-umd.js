const savedModule = window.module;
const savedExports = window.savedExports;

export default async function loadUmd(src) {
    const mockExports = {};
    const mockModule = {exports: mockExports};

    window.module = mockModule;
    window.exports = mockExports;

    try {
        await import(src);
        const exports = window.module?.exports || window.exports;

        return exports;
    } finally {
        if (savedExports === undefined) {
            delete window.exports;
        } else {
            window.exports = savedExports;
        }
        
        if (savedModule === undefined) {
            delete window.module;
        } else {
            window.module = savedModule;
        }  
    }
}