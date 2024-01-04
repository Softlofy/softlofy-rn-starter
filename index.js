#! /usr/bin/env node

const fs = require("fs");
const os = require("os");
const shell = require("shelljs");

const { program } = require("commander");
const cliSelect = require("cli-select");

program.parse();

const programOptions = program.opts();

const main = async (repositoryUrl, directoryName) => {
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

  const randomNameGenerator = (num) => {
    let res = "";
    for (let i = 0; i < num; i++) {
      const random = Math.floor(Math.random() * 27);
      res += String.fromCharCode(97 + random);
    }
    return res;
  };

  //Get the name of the app-directory to make
  let tmpDir = "temp" + randomNameGenerator(5);
  try {
    shell.exec(`git clone ${repositoryUrl} ${tmpDir}`);

    //2. get the json from package.json
    const packageJsonRaw = fs.readFileSync(`${tmpDir}/package.json`);

    const packageJson = JSON.parse(packageJsonRaw);
    const dependencyList = Object.keys(packageJson.dependencies);
    const devDependencyList = Object.keys(packageJson.devDependencies);

    console.log("Now, installing react-native...");

    shell.exec(`echo N | npx react-native init ${directoryName}`);

    //3. Installing the dependencies.
    console.log("installing... ", dependencyList);
    shell.exec(`yarn add ${dependencyList.join(" ")}`, {
      cwd: `${process.cwd()}/${directoryName}`,
    });
    shell.exec(`yarn add --dev ${devDependencyList.join(" ")}`, {
      cwd: `${process.cwd()}/${directoryName}`,
    });

    const projectDirectories = directoryName.split("/");

    shell.ls(`${tmpDir}/android/app/src/main/res/drawable/`).forEach((file) => {
      shell.cp(
        "-rf",
        `${tmpDir}/android/app/src/main/res/drawable/${file}`,
        `${directoryName}/android/app/src/main/res/drawable/`
      );
    });
    shell
      .ls(`${tmpDir}/ios/boilerPlateTypescript/Images.xcassets/`)
      .forEach((file) => {
        shell.cp(
          "-rf",
          `${tmpDir}/ios/boilerPlateTypescript/Images.xcassets/${file}`,
          `${directoryName}/ios/${
            projectDirectories[projectDirectories.length - 1]
          }/Images.xcassets/`
        );
      });
    shell.mv(`${tmpDir}/src`, `${directoryName}`);

    if (os.type() === "Darwin") {
      shell.exec(`npx pod-install`, {
        cwd: `${process.cwd()}/${directoryName}`,
      });
    } else {
      console.log("iOS setup only supported in Mac OS.");
    }

    if (repositoryUrl === tsURL) {
      shell.rm("-rf", `${directoryName}/index.js`);
      shell.mv(`${tmpDir}/index.js`, `${directoryName}`);
      shell.rm("-rf", `${directoryName}/App.tsx`);
    } else {
      shell.rm("-rf", `${directoryName}/App.js`);
    }
    shell.rm("-rf", `${directoryName}/babel.config.js`);
    shell.rm("-rf", `${directoryName}/tsconfig.json`);
    shell.rm("-rf", `${directoryName}/metro.config.js`);
    shell.rm("-rf", `${directoryName}/.eslintrc.js`);
    shell.rm("-rf", `${directoryName}/.prettierrc.js`);

    shell.mv(`${tmpDir}/tsconfig.json`, `${directoryName}`);
    shell.mv(`${tmpDir}/babel.config.js`, `${directoryName}`);
    shell.mv(`${tmpDir}/metro.config.js`, `${directoryName}`);
    shell.mv(`${tmpDir}/.eslintrc`, `${directoryName}`);
    shell.mv(`${tmpDir}/.prettierrc`, `${directoryName}`);

    console.log("Adding additional scripts...");
    addScripts(directoryName);

    console.log(`Application generated... its ready to use.
  To get started, 
  - cd ${directoryName}
  - npm run dev
  `);

    // console.log(
    //   'Please, add "postinstall": "sh postinstall" in script to package.json '
    // );

    // - If not start try to delete watchman watches by running following command:
    // - watchman watch-del-all
    // - Then start metro server clearing its cache by running following command:
    // - yarn start --clear-cache

    // the rest of your app goes here
  } catch {
    // handle error
  } finally {
    try {
      if (tmpDir) {
        fs.rmSync(tmpDir, { recursive: true });
      }
    } catch (e) {
      console.error(
        `An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`
      );
    }
  }
};

const addScripts = (directory) => {
  let packageJSON = JSON.parse(
    fs.readFileSync(`${directory}/package.json`, "utf8")
  );
  let scripts = packageJSON.scripts;
  scripts.postinstall = "sh postinstall";
  fs.writeFileSync(
    `${directory}/package.json`,
    JSON.stringify(packageJSON, null, 2)
  );
  console.log("Added postinstall script");
};

const tsURL = "https://github.com/Softlofy/softlofy-rn-components.git";

let directoryName = process.argv[2];

if (!directoryName || directoryName.length === 0) {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(`What's your project name?`, (name) => {
    console.log(`Hi ${name}!`);
    readline.close();
    directoryName = name;

    console.log(`Do you want to install husky`);
    cliSelect({
      values: ["Yes", "No"],
    }).then((husky) => {
      console.log(husky);
      if (husky.value === "Yes") {
        main(tsURL, directoryName, true);
      } else {
        main(tsURL, directoryName, false);
      }
    });
    if (programOptions.ts) {
      console.log("Generating... Typescript Template");
      return main(tsURL, directoryName);
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
  return main(tsURL, directoryName);
}

console.log(`Do you want to install husky`);

cliSelect({
  values: ["Yes", "No"],
}).then((husky) => {
  console.log(husky);
  if (husky.value === "Yes") {
    main(tsURL, directoryName, true);
  } else {
    main(tsURL, directoryName, false);
  }
});