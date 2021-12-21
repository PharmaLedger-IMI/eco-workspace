# eco-workspace

_eco-workspace_ bundles all the necessary dependencies for building and running EPI SSApps in a single package.

For more details about what a _workspace_ is check out the [template-workspace](https://github.com/PrivateSky/template-workspace).

## Installation

In order to use the workspace, we need to follow a list of steps presented below.

If you have trouble installing the _eco-workspace_, please try to follow the guide provided on [PrivateSky.xyz](https://privatesky.xyz/?Start/installation)
1### Step 1: Clone the workspace

```sh
$ git clone https://github.com/PharmaLedger-IMI/eco-workspace.git
```

After the repository was cloned, you must install all the dependencies.

```sh
$ cd eco-workspace
#Important: If you plan to contribute to the project and/or dependecies please set DEV:true
#in the file env.json before you run the installation!
$ npm install
```

**Note:** this command might take quite some time depending on your internet connection and you machine processing power.

### Step 2: Launch the "server"

While in the _eco-workspace_ folder run:

```sh
$ npm run server
```

At the end of this command you get something similar to:

![alt text](scr-npm-run-server.png)

### Step 3: Build all things needed for the application to run.

Open a new console inside _eco-workspace_ folder and run:

```sh
# Note: Run this in a new console inside "eco-workspace" folder
$ npm run build-all
```

## Running

To run the application launch your browser (preferably Chrome) in Incognito mode and access the http://localhost:8080 link.

## Releases

DIDs integration (commit #0436a49b199a48a96b4c6fcb9fbd9a3676aa6bdb)
