#! /usr/bin/env node

const fs = require("fs");
const shell = require("shelljs");
const cliSelect = require("cli-select");
const { program } = require("commander");

program.parse();

const programOptions = program.opts();

const main = async (repositoryUrl, directoryName, phoneInput) => {
  console.log(`Creating new project ${directoryName}`);
  console.log(`Installing Yarn`);
  shell.exec("npm install -g yarn", (code, stdout, stderr) => {
    console.log(stdout);
  });
  if (directoryName.match(/[<>:"\/\\|?*\x00-\x1F]/)) {
    return console.error(`
        Invalid directory name.
        `);
  }

  //Get the name of the app-directory to make
  let tmpDir = "tempDirectoryBySystemToBeRemoved";

  try {
    removingDirectory(tmpDir);
    // 1. Clone starter template
    console.log("\x1b[34m", "Cloning Templates...");
    shell.exec(`git clone ${repositoryUrl} ${tmpDir}`);

    // 2. initialize React Native
    console.log("\x1b[0m", "Initializing React Native...");
    shell.exec(`npx react-native init ${directoryName}`);

    const dependencyList = phoneInput
      ? [
          "softlofy-rn-components",
          "react-native-reanimated",
          "react-native-svg",
          "softlofy-rn-phone-input-component",
        ]
      : [
          "softlofy-rn-components",
          "react-native-reanimated",
          "react-native-svg",
        ];

    const devDependencyList = ["react-native-svg-transformer"];

    //3. Installing the dependencies.
    console.log(
      "installing... ",
      `${dependencyList.join(" ")} & ${devDependencyList.join(" ")}`
    );
    shell.exec(`yarn add ${dependencyList.join(" ")}`, {
      cwd: `${process.cwd()}/${directoryName}`,
    });
    shell.exec(`yarn add --dev ${devDependencyList.join(" ")}`, {
      cwd: `${process.cwd()}/${directoryName}`,
    });

    shell.rm("-rf", `${directoryName}/App.tsx`);
    shell.rm("-rf", `${directoryName}/babel.config.js`);
    shell.rm("-rf", `${directoryName}/metro.config.js`);
    shell.rm("-rf", `${directoryName}/.eslintrc.js`);
    shell.rm("-rf", `${directoryName}/.prettierrc.js`);
    shell.rm("-rf", `${directoryName}/README.md`);

    shell.mv(`${tmpDir}/src`, `${directoryName}`);
    shell.mv(`${tmpDir}/App.tsx`, `${directoryName}`);
    shell.mv(`${tmpDir}/babel.config.js`, `${directoryName}`);
    shell.mv(`${tmpDir}/metro.config.js`, `${directoryName}`);
    shell.mv(`${tmpDir}/.eslintrc`, `${directoryName}`);
    shell.mv(`${tmpDir}/.prettierrc`, `${directoryName}`);
    shell.mv(`${tmpDir}/README.md`, `${directoryName}`);
    shell.cd(`${directoryName}/src`);
    shell.mkdir("assets");
    shell.mkdir("components");
    shell.mkdir("screens");
    shell.mkdir("utils");
    shell.mkdir("hooks");
    shell.cd("../..");

    console.log("\x1b[32m", `Application generated... its ready to use.`);
    console.log(
      "\x1b[0m",
      `To get started, 
  - cd ${directoryName}
  - npm run dev`
    );
  } catch {
    // handle error
  } finally {
    removingDirectory(tmpDir);
  }
};

const removingDirectory = (directory) => {
  try {
    if (directory && fs.existsSync(directory)) {
      fs.rmSync(directory, { recursive: true });
    } else {
      return;
    }
  } catch (e) {
    console.error(
      `An error has occurred while removing the temp folder at ${directory}. Please remove it manually. Error: ${e}`
    );
  }
};

const templateURL = "https://github.com/Softlofy/rn-starter-termplate.git";

let directoryName = process.argv[2];

const callMainFunction = () => {
  console.log(
    `Do you need a phone number input for for your project ${directoryName}?`
  );
  cliSelect({
    values: ["Yes", "No"],
  }).then((phoneInput) => {
    console.log(phoneInput);
    if (phoneInput.value === "Yes") {
      main(templateURL, directoryName, true);
    } else {
      main(templateURL, directoryName, false);
    }
  });
};

if (!directoryName || directoryName.length === 0) {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(`What's your project name?`, (name) => {
    console.log(`Hi ${name}!`);
    readline.close();
    directoryName = name;

    callMainFunction();
    if (programOptions.ts) {
      console.log("Generating... Typescript Template");
      return callMainFunction();
    }
  });
  return;
}

if (directoryName.match(/[<>:"\/\\|?*\x00-\x1F]/)) {
  return console.error(`
      Invalid directory name.
      `);
}

if (programOptions.ts) {
  console.log("Generating... Typescript Template");
  return callMainFunction();
}

callMainFunction();
