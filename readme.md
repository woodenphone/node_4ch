# node-4ch readme and major notes

## Readme
Most of the interesting stuff is in 4ch_sequelize.js

4ch_sequelize_database contains the Sequelize table definitions and setup

This code is not currently designed for use outside a code editing environment.

(I use Visual Studio code to write and run this.)

Try to keep requests below 1 per second (per 4chan's guidelines).

## Working with this repository
### Requirements
- [Git](https://git-scm.com)
- [NodeJS + NPM](https://nodejs.org/en/)
- (Optional) [Visual Studio Code](https://code.visualstudio.com)

### Run this code
1. Clone this repository with `git clone https://github.com/Wolvan/node_4ch.git && cd node_4ch`
2. Run `npm install` to get the necessary modules
3. Run the program with `npm start`

### Contributing to this code
1. Clone the repository (command above) and run `npm install`
2. Run `npm run watch` to permanently build changes in `src/`
3. Run `npm run exec` to start the built version
4. Use `npm run debug` and VSCode's ATTACH launch option to step through your code
5. `npm run build` compiles your `src/` directory with babel to `build/`
6. `npm run lint` runs `eslint` on your code and makes sure your style fits
7. `npm test` runs all available tests (currently only `npm run lint`)

Before submitting a pull request, please make sure that your code complies with the linting rules.

## Useful links:
4chan's API docs
<https://github.com/4chan/4chan-API>

<https://desuarchive.org>'s versions of Asagi and FoolFuuka
<https://github.com/desuarchive/asagi>
<https://github.com/desuarchive/FoolFuuka>
