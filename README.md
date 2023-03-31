# Open MCT for MCWS
Open Mission Control Techologies for Mission Control Web Services (Open MCT for MCWS) is a next-generation web-based mission control framework for visualization of data on desktop and mobile devices. Open MCT for MCWS is built on the [Open MCT Framework](https://github.com/nasa/openmct), and includes adapter code for using MCWS as a telemetry and persistence provider. Open MCT is developed at NASA Ames Research Center in Silicon Valley, in collaboration with NASA AMMOS and the Jet Propulsion Laboratory, California Institute of Technology (under its contract with NASA, 80NM0018D0004).

## Configuration
Various configurations and customizations are available by editing `config.js`. Descriptions of each configuration reside with the configuration in the file.

### Required configurations
1. `camUrl` and `mcwsUrl` are required to work with MCWS and CAM.
2. In the `namespaces` configuration, `url`, the path to the MCWS persistence spaces, are required.

## Development

### 1. Install Open MCT for MCWS
In a terminal, run this command to install Open MCT for MCWS and its dependencies. This may take a few minutes.

    npm install

If you've installed Open MCT for MCWS locally before, first run this command.

    npm run clean

### 2. Modify config.js
Uncomment the `proxyUrl` setting in `config.js`. It is located under Developer 
Settings near the end of the file.

### 3. Run Open MCT for MCWS locally

    npm start

With that running, browse to http://localhost:8080/ to access Open MCT for MCWS.

### 4. Rebuilding SASS stylesheets

    npm run build:prod

With the stylesheets rebuilt, you can reload your browser (assuming the server is running) to see the rebuilt CSS.

## Development MCWS server
To connect Open MCT for MCWS to MCWS, either run a local mock server, run MCWS locally, or connect to a remote instance of MCWS.

## Running a mock MCWS server
An example mock mcws server - https://github.com/davetsay/mcws-test-server
*requires request access

## Running MCWS locally
Refer to MCWS documentation.

## Running a development server
Running a development server requires that you are on the JPL network so that
you can access a development MCWS server. You'll need to retrieve an authentication cookie 
and make a small modification to your Open MCT for MCWS configuration; here's how.
### 1. Get your CAM cookie
To get past CAM, you will need to export an environment variable, 
`COOKIE`, that contains your CAM authentication cookie. Instructions for 
retrieving this cookie are at the bottom of the README. If you've copied
your CAM cookie into the clipboard, use this command to set the variable:

    export COOKIE=`pbpaste`

## Tests

Tests are written for [Jasmine 4.4](https://jasmine.github.io/api/npm/4.4/Jasmine)
and run by [Karma](http://karma-runner.github.io). 

Test files end with `Spec.js`, and will be automatically executed when running the following command:

    npm test

Running the tests creates a code coverage report in `target/coverage`.

## Building for production

    npm install
    mvn clean install

This will create a deployable artifact, `openmct_client.war` in the `target` 
directory.

## Notes

### Getting your CAM cookie

Go to the MCWS server location and log in to CAM.  Then retrieve 
the cookie from your browser.

Unsure how to get cookies from the browser? Here's a shortcut: create a 
bookmarklet with the following code:

    javascript:(function () {prompt('Your cookies for ' + location.host, document.cookie);})();

Pressing this bookmarklet will show you your cookies for the current host, 
which you can then copy into your clipboard to use to set the cookie environment 
variable. Note that logging out of CAM or getting a new session will require you
to get the cookie again.
