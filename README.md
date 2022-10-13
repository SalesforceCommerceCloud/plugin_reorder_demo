# plugin\_reorder\_demo: Storefront Reference Architecture (SFRA)

This is the repository for the plugin\_reorder\_demo plugin. This plugin enhances the plugin\_commercepayments cartridge by providing re-order functionality, including the following capabilities:

* Registered shoppers can re-order previously placed orders from their accounts

This plugin depends on the plugin\_commercepayments cartridge.

# Cartridge Path Considerations
The plugin\_reorder\_demo plugin requires the plugin\_commercepayments cartridge and the app\_storefront\_base cartridge. In your cartridge path, include the cartridges in the following order:

```
plugin_reorder_demo:plugin_commercepayments:app_storefront_base
```

# Getting Started

1. Clone this repository. (The name of the top-level folder is plugin\_reorder\_demo.)
2. In the top-level plugin\_reorder\_demo folder, enter the following command: `npm install`. (This command installs all of the package dependencies required for this plugin.)
3. In the top-level plugin\_reorder\_demo folder, edit the paths.base property in the package.json file. This property should contain a relative path to the local directory containing the Storefront Reference Architecture repository. For example:
```
"paths": {
    "base": "../storefront-reference-architecture/cartridges/app_storefront_base/"
  }
```
4. In the top-level plugin\_reorder\_demo folder, enter the following command: `npm run compile:js && npm run compile:scss`
5. In the top-level plugin\_reorder\_demo folder, enter the following command: `npm run uploadCartridge`

# NPM Scripts

* Use the provided NPM scripts to compile and upload changes to your Sandbox.

## Compile Client-Side Code and SCSS

* npm run compile:scss - Compiles all scss files into css.

* npm run compile:js - Compiles all js files and aggregates them.

## Lint Your Code

* npm run lint - Execute linting for all JavaScript and SCSS files in the project. You should run this command before committing your code.

## Watch for Changes and Uploading

* npm run watch:static - Watches js and scss files for changes, recompiles them and uploads result to the sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

* npm run watch:cartridge - Watches all cartridge files (except for static content) and uploads it to sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

* npm run watch - Watches everything and recompiles (if necessary) and uploads to the sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

**Note:** This command locates the URL of your sandbox by reading the `dw.json` file in the root directory of your project. If you don't have this file at the expected location, the integration tests will fail.
{
    "hostname": "devxx-sitegenesis-dw.demandware.net"
}
