define([

], function () {

    var testingId = 'msl-shared:a7475c11-eb08-413d-acc2-98c82d2371a5';


    function asHexString(decimalString) {
        return '#' + decimalString.split(',').map(function (p) {
            return Number(p).toString(16);
        }).join('');
    }

    function ViewImporter(xmlString, dataSetId, container) {
        this.xmlString = xmlString;
        this.dataSetId = dataSetId;
        this.container = container;
        this.parser = new DOMParser();
        this.warnings = [];
        this.config = this.fromString(xmlString);
    };

    ViewImporter.prototype.warn = function () {
        var message = [].slice.apply(arguments).join(' ');
        console.warn('IMPORT WARNING', message);
        this.warnings.push(message);
    };

    ViewImporter.prototype.fromString = function (xmlString) {
        var parser = new DOMParser();
        var xmlDocument = this.parser.parseFromString(xmlString, 'text/xml');

        if (xmlDocument.documentElement.nodeName === 'parsererror') {
            throw new Error('Parser Error!');
        }

        if (xmlDocument.documentElement.nodeName === 'View') {
            return this.convertView(xmlDocument.documentElement);
        }

        throw new Error('Unknown XML type' + xmlDocument.documentElement.nodeName);
    };

    ViewImporter.prototype.getTelemetryId = function (channelId) {
        // TODO use types to generate type for safety.
        return 'vista:channel:' + this.dataSetId + ':' + channelId;
    };

    ViewImporter.prototype.convertView = function (viewElement) {
        var tagGroups = this.getTagGroups(viewElement.children);
        var fixedConfiguration = {
            name: viewElement.attributes['name'].value,
            composition: [],
            type: 'telemetry.fixed',
            configuration: {
                'fixed-display': {
                    elements: []
                }
            },
            layoutGrid: [20, 80]
        };

        tagGroups._keyOrder.forEach(function (key) {
            this.handleTagGroup(key, tagGroups[key], fixedConfiguration);
        }, this);

        return fixedConfiguration;
    };

    ViewImporter.prototype.handlers = {
        preferredWidth: function (element, config) {
            config.width = +element.innerHTML;
        },
        preferredHeight: function (element, config) {
            config.height = +element.innerHTML;
        },
        coordinateType: function (element, config) {
            if (element.innerHTML === 'PIXEL') {
                config.layoutGrid = [1, 1];
            } else {
                this.warn('Unknown coordinate type!', element.innerHTML);
            }
        },
        ChannelCondition: function (element, config) {
            this.warn('unhandled channel condition', element);
        },
        Channel: function (element, config) {
            var attributes = [].slice.apply(element.attributes);
            var telemetryElement = {
                type: 'fixed.telemetry',
                x: 0,
                y: 0,
                id: '', // telem element id
                stroke: 'transparent',
                color: '',
                titled: true, // show label?
                width: 300, // questionmark
                height: 20 // questionmark
            };

            if (!/^[A-Z]+\-[1-9]+$/.test(element.attributes['channelId'].value)) {
                this.warn('Invalid channel id', element.attributes['channelId'], element.outerHTML);
                return;
            }

            attributes.forEach(function (attribute) {
                if (attribute.name === 'channelId') {
                    telemetryElement.id = this.getTelemetryId(attribute.value);
                } else if (attribute.name === 'xStart') {
                    telemetryElement.x = Number(attribute.value);
                } else if (attribute.name === 'yStart') {
                    telemetryElement.y = Number(attribute.value);
                } else {
                    this.warn('Unhandled channel attribute', attribute.name, attribute.value, element.outerHTML);
                }
            }, this);

            config.composition.push(telemetryElement.id);
            config.configuration['fixed-display'].elements.push(telemetryElement);
        },
        Text: function (element, config) {
            var attributes = [].slice.apply(element.attributes);
            var textElement = {
                type: 'fixed.text',
                fill: 'transparent',
                stroke: 'transparent',
                text: '', // value from text,
                x: 0,
                y: 0,
                width: 300, // how to do?
                height: 20 // how to do?
            };
            attributes.forEach(function (attribute) {
                if (attribute.name === 'text') {
                    textElement.text = attribute.value;
                } else if (attribute.name === 'xStart') {
                    textElement.x = Number(attribute.value);
                } else if (attribute.name === 'yStart') {
                    textElement.y = Number(attribute.value);
                } else {
                    this.warn('Unhandled text attribute', attribute.name, attribute.value, element.outerHTML);
                }
            }, this);
            config.configuration['fixed-display'].elements.push(textElement);
        },
        Box: function (element, config) {
            var attributes = [].slice.apply(element.attributes);
            var boxElement = {
                type: 'fixed.box',
                fill: '', // hex or css value.
                border: 'transparent', // hex or css value.
                stroke: 'transparent', // hex or css value.
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };

            attributes.forEach(function (attribute) {
                if (attribute.name === 'xStart') {
                    boxElement.x = Number(attribute.value);
                } else if (attribute.name === 'yStart') {
                    boxElement.y = Number(attribute.value);
                } else if (attribute.name === 'xEnd') {
                    boxElement.width = Number(attribute.value) - boxElement.x;
                } else if (attribute.name === 'yEnd') {
                    boxElement.height = Number(attribute.value) - boxElement.y;
                } else if (attribute.name === 'background') {
                    boxElement.fill = asHexString(attribute.value);
                } else {
                    this.warn('Unhandled box attribute', attribute.name, attribute.value, element.outerHTML);
                }
            }, this);
            config.configuration['fixed-display'].elements.push(boxElement);
        },
        Line: function (element, config) {
            var attributes = [].slice.apply(element.attributes);
            var lineElement = {
                type: 'fixed.line',
                x: 0,
                y: 0,
                x2: 5,
                y2: 5,
                stroke: '#000000', // hex or css value.
                width: 1,
                height: 1
            };
            attributes.forEach(function (attribute) {
                if (attribute.name === 'xStart') {
                    lineElement.x = Number(attribute.value);
                } else if (attribute.name === 'yStart') {
                    lineElement.y = Number(attribute.value);
                } else if (attribute.name === 'xEnd') {
                    lineElement.x2 = Number(attribute.value);
                } else if (attribute.name === 'yEnd') {
                    lineElement.y2 = Number(attribute.value);
                } else if (attribute.name === 'lineThickness') {
                    lineElement.width = Number(attribute.value);
                } else {
                    this.warn('Unhandled line attribute', attribute.name, attribute.value, element.outerHTML);
                }
            }, this);
            config.configuration['fixed-display'].elements.push(lineElement);
        },
        Button: function (element, config) {
            this.warn('unhandled button', element);
        }
    };

    ViewImporter.prototype.handleTagGroup = function (tagName, elements, config) {
        var handler = this.handlers[tagName];
        if (!handler) {
            this.warn('unknown tag name!', tagName);
        } else {
            elements.forEach(function (element) {
                handler.call(this, element, config);
            }, this);
        }
        return config;
    };

    ViewImporter.prototype.getTagGroups = function (elements) {
        elements = [].slice.apply(elements);
        var groups = {
            _keyOrder: []
        };

        elements.forEach(function (element) {
            if (!groups[element.tagName]) {
                groups[element.tagName] = [];
                groups._keyOrder.push(element.tagName);
            }
            groups[element.tagName].push(element);
        });

        return groups;
    };

    return ViewImporter;
});
