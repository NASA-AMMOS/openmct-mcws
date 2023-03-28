var USAGE = [
    "",
    "Usage:",
    "",
    "    node scripts/summarize-report.js report-YYYYMMDD.md [options]",
    "",
    "...where report-YYYYMMDD.md is a completed versions of " +
    "test procedures, and is found in docs/process/testing.",
    "",
    "Options:",
    "-a,  --all                             show all procedures, including those",
    "                                       that have not been implemented",
    "-C,  --exclude-coverage-summary        exclude coverage summary",
    "-c,  --only-coverage-summary           only show coverage summary",
    "-R,  --exclude-requirements-matrix     exclude requirements matrix",
    "-r,  --only-requirements-matrix        only show requirements matrix",
    "-P,  --exclude-procedure-summary       exclude procedure summary",
    "-p,  --only-procedure-summary          only show procedure summary"
];

var _ = require('lodash');
var marked = require('marked');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');

var columns = [
    "Test ID",
    "Relevant reqs.",
    "Conducted?",
    "Passed?",
    "Issues"
];
var symbols = {
    "Yes": ":white_check_mark:",
    "Yes &dagger;": ":white_check_mark:",
    "No": ":x:"
};
var transforms = {
    "Test ID": function (value, metrics, title, filename, procedure) {
        var fragmentId = _.kebabCase(title);
        var url = filename + "#" + fragmentId;
        var link = "[" + value + "](" + url + ")";
        procedure.id = value;
        procedure.link = link;
        return link;
    },
    "Conducted?": function (value, metrics, title, filename, procedure) {
        if (value.indexOf("Yes") !== -1) {
            procedure.conducted = true;
            metrics.conducted += 1;
        }
        return value + " " + (symbols[value] || "");
    },
    "Passed?": function (value, metrics, title, filename, procedure) {
        if (value.indexOf("Yes") !== -1) {
            metrics.passed += 1;
            procedure.passed = true;
        } else if (value.indexOf("No") !== -1) {
            metrics.failed += 1;
        }
        if (value.length > 16) {
            value = value.substring(0, 16) + "...";
        }
        return value + " " + (symbols[value] || "");
    },
    "Relevant reqs.": function (value, metrics, title, filename, procedure) {
        procedure.requirements = value.split(/[,;]\s*/);
        return value;
    }
};

var matchIssueUrl = /https:\/\/github\.jpl\.nasa\.gov\/MissionControl\/vista\/issues\/(\d+)\/?/;

function SummaryRenderer(filename) {
    marked.Renderer.call(this);
    this.reportFilename = filename;

    this.metrics = {
        total: 0,
        implemented: 0,
        conducted: 0,
        passed: 0,
        failed: 0
    };
    this.procedures = [];
}
SummaryRenderer.prototype = Object.create(marked.Renderer.prototype);

function noText() { return ""; }

[
    'code',
    'blockquote',
    'html',
    'hr',
    'list',
    'listItem',
    'paragraph',
    'strong',
    'em',
    'codespan',
    'br',
    'del',
    'image'
].forEach(function (method) {
    SummaryRenderer.prototype[method] = noText;
});

SummaryRenderer.prototype.heading = function (text, level) {
    if (level === 1) {
        this.inProcedures = (text === 'Procedures');
    } else if (level === 2 && this.inProcedures) {
        this.currentProcedure = text;
        this.metrics.total += 1;
    }
    return "";
};

SummaryRenderer.prototype.table = function (header, body) {
    if (!this.inProcedures) {
        return "";
    }

    var contents = body.split('\n').reduce(function (a, row) {
        var cells = row.split('|').map(function (cell) {
            return cell.trim();
        });
        a[cells[0]] = cells[1];
        return a;
    }, {});

    var title = this.currentProcedure;
    var filename = this.reportFilename;
    var procedure = {
        conducted: false,
        passed: false,
        implemented: false
    };
    this.procedures.push(procedure);

    var result = columns.map(function (column) {
        var value = contents[column];
        var transform = transforms[column];
        if (!value) { return value; }
        return transform ?
            transform(value, this.metrics, title, filename, procedure) : value;
    }.bind(this)).join(" | ") + "\n";

    if (contents["Instructions"].indexOf("(") === 0) {
        if (args['all']) {
            return result;
        } else {
            return "";
        }
    } else {
        procedure.implemented = true;
        this.metrics.implemented += 1;
        return result;
    }
};

SummaryRenderer.prototype.tablerow = function (text) {
    return text + "\n";
};

SummaryRenderer.prototype.tablecell = function (text) {
    return text + "|";
};

SummaryRenderer.prototype.link = function (href, title, text) {

    if (text === href) {
        if (matchIssueUrl.test(href)) {
            text = matchIssueUrl.exec(href)[1];
        } else {
            text = ":link:";
        }
    }
    return "[" + text + "](" + href + ")";
};

if (!process.argv[2]) {
    USAGE.forEach(function (line) {
        console.log(line);
    });
    process.exit();
}

var args = minimist(process.argv.slice(2), {
    alias: {
        'a': 'all',
        'C': 'exclude-coverage-summary',
        'c': 'only-coverage-summary',
        'R': 'exclude-requirements-matrix',
        'r': 'only-requirements-matrix',
        'P': 'exclude-procedure-summary',
        'p': 'only-procedure-summary'
    },
    boolean: [
        'all',
        'exclude-coverage-summary',
        'only-coverage-summary',
        'exclude-requirements-matrix',
        'only-requirements-matrix',
        'exclude-procedure-summary',
        'only-procedure-summary'
    ]
});

var exclusiveOptions = _(args)
    .keys()
    .filter(function (key) {
        return key.indexOf('only') === 0;
    })
    .value();

_(exclusiveOptions)
    .filter(function (key) {
        return args[key];
    })
    .each(function (key) {
        _.each(exclusiveOptions, function (k) {
            args[k.replace('only', 'no')] = true;
        });
        args[key.replace('only', 'no')] = false;
    });

var filename = args._[0];
var filepath = path.resolve('docs/process/testing', filename);
var report = fs.readFileSync(filepath, 'utf8');
var renderer = new SummaryRenderer(filename);
var summary = marked(report, { renderer: renderer });
var metrics = renderer.metrics;
var requirements = {};

function getRequirement(id) {
    if (!requirements[id]) {
        requirements[id] = {
            id: id,
            procedures: []
        };
    }
    return requirements[id];
}

_.each(renderer.procedures, function (procedure) {
    if(!procedure.requirements) { return; }
    _.each(procedure.requirements, function (requirementId) {
        var requirement = getRequirement(requirementId);
        requirement.procedures.push(procedure);
    });
});

var sortedRequirements = _(requirements)
    .values()
    .filter(function (r) {
        if (args['all']) {
            return true;
        } else {
            return _.some(r.procedures, {implemented: true});
        }
    })
    .sortBy(function (requirement) {
        return requirement.id.replace(
            /\d+/,
            function (n) {
                while (n.length < 4) { // look guys i rewrote leftpad!
                    n = '0' + n;
                }
                return n;
            }
        );
    })
    .value();

var hasError;
_.forEach(_.groupBy(renderer.procedures, 'id'), function (procs, id) {
    if (procs.length > 1) {
        console.log('Procedure ID ', id, ' has more than one associated procedure!');
        console.log(_.map(procs, 'id'));
        hasError = true;
    }
});

if (hasError) {
    console.log('Duplicate procedure IDs, fix problem and try running again.');
    process.exit(1);
}

console.log('# Summary\n');

if (!args['exclude-requirements-matrix']) {
    console.log('## Requirements Coverage\n');
    console.log('Requirement ID | Test Procedures | Status');
    console.log('--- | --- | --- ');
    _.each(sortedRequirements, function (requirement) {
            var procedureCount = requirement.procedures.length;
            var implemented = _.filter(requirement.procedures, {implemented: true}).length;
            var conducted = _.filter(requirement.procedures, {conducted: true}).length;
            var verified = _.filter(requirement.procedures, {conducted: true, passed: true}).length;
            console.log([
                requirement.id,
                _.map(requirement.procedures, 'link').join('; '),
                implemented === 0 ? 'Not Implemented' :
                    conducted === 0 ? 'Skipped' :
                    verified === 0 ? 'Failed' :
                    'Passed'
            ].join(' | '));
        });
        console.log('');
}

if (!args['exclude-coverage-summary']) {
    console.log('## Procedure Coverage\n');

    console.log("Procedures | Count | % of All Procedures | % of Implemented | % of Conducted");
    console.log("---|---|---|---|---");
    Object.keys(metrics).forEach(function (key) {
        var value = metrics[key];
        var name = key[0].toUpperCase() + key.substring(1);
        console.log([
            name,
            value,
            ((value / metrics.total) * 100).toFixed(2),
            ((value / metrics.implemented) * 100).toFixed(2),
            ((value / metrics.conducted) * 100).toFixed(2)
        ].join(" | "));
    });
    console.log("");
}

if (!args['exclude-procedure-summary']) {
    console.log('## Results\n');

    console.log(columns.join(" | "));
    console.log(columns.map(function (column) {
        return "------";
    }).join("|"));
    console.log(summary);
}

