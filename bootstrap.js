#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var chalk = require('chalk');
var inquirer = require('inquirer');
var figlet = require('figlet');

const { spawn } = require('child_process');
const { promisify } = require('util');
const readFilePromise = promisify(fs.readFile);
const copyFilePromise = promisify(fs.copyFile);
const writeFilePromise = promisify(fs.writeFile);

var ui = new inquirer.ui.BottomBar();
var write = ui.log.write;

//this will modify files in this directory like variables.env, prisma.yml and your datamodel. Are you sure you want to run this?

const title = () => {
  figlet('Skeleton Key', function(err, data) {
    if (err) {
      write(err);
    }
    write(data);
  });
};

program.option('-f, --full', 'Full setup.').action((dir, cmd) => {
  title();

  setTimeout(() => {
    inquirer
      .prompt([
        {
          type: 'confirm',
          name: 'full',
          message:
            'This bootstrapper does a lot of stuff without your permission including downloading/deleting files and shit. You cool with this?',
        },
      ])
      .then(({ full }) => {
        if (full) {
          write('Running npm i...');
          const npm = spawn('npm', ['i'], { stdio: 'inherit' });
          npm.on('exit', code => {
            write(`Prisma init is exiting with code ${code}`);
            if (code !== 0) {
              write('Something went wrong with your npm i. Exiting.');
              process.exit(1);
            } else {
              bootstrapWithPrisma();
            }
          });
        } else {
          // ui.log.write('Exiting. No changes have been made.');
        }
      });
  }, 500);
});

bootstrapWithPrisma = async () => {
  if (exists('datamodel.prisma')) {
    write('Deleting datamodel.prisma...');
    fs.unlink('datamodel.prisma', err => {
      if (err) throw err;
      write('Successfully deleted datamodel.prisma');
    });
  }
  if (exists('prisma.yml')) {
    write('Deleting prisma.yml...');
    fs.unlink('prisma.yml', err => {
      if (err) throw err;
      write('Successfully deleted prisma.yml');
    });
  }
  write('Running prisma init...');
  const prisma = spawn('prisma', ['init'], { stdio: 'inherit' });
  prisma.on('exit', code => {
    write(`Prisma init is exiting with code ${code}`);
    if (code !== 0) {
      write('Something went wrong with your prisma init. Exiting.');
      process.exit(1);
    } else {
      variablesStuff();
    }
  });

  //   variablesStuff();
};

exists = path => {
  return fs.existsSync(path);
};

variablesStuff = async () => {
  write('Checking for variables.env...');
  var variablesExist = fs.existsSync('variables.env');
  if (variablesExist) {
    fs.unlink('variables.env', err => {
      if (err) throw err;
      write('Successfully deleted variables.env');
    });
  }
  write('Retrieving your development prisma api endpoint...');
  if (exists('prisma.yml')) {
    const data = await readFilePromise('prisma.yml', 'utf8');
    //regex to pull URL from prisma.yml
    const regex = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/;
    regexp = new RegExp(regex);
    matched = data.match(regexp);
    //get our prisma DB URL
    var DEV_PRISMA_URL = matched[0];
    write(`Setting your prisma development DB URL to ${DEV_PRISMA_URL}`);
    //copy our variables template
    if (exists('variablestemplate.txt')) {
      var variablesSucessfullyCopied = await copyVariablesTemplate();
      var dataModelAndPrismaSuccessfullyCopied = await copyFiles();

      if (variablesSucessfullyCopied && dataModelAndPrismaSuccessfullyCopied) {
        var variablesWritten = await writeVariables(DEV_PRISMA_URL);
        if (variablesWritten) {
          deploy();
        }
      }
    } else {
      write('Your variablestemplate.txt does not exist. Exiting.');
    }
  } else {
    write(
      "Something happened, you don't have a prisma.yml file for us to search. Exiting.",
    );
  }
};

copyVariablesTemplate = async () => {
  return await copyFilePromise('variablestemplate.txt', 'variables.env').then(
    err => {
      if (err) {
        return err;
      }
      return true;
    },
  );
};

copyFiles = async () => {
  var prisma = await copyFilePromise('prismatemplate.txt', 'prisma.yml').then(
    err => {
      if (err) {
        return err;
      }
      return true;
    },
  );
  var datamodel = await copyFilePromise(
    'datamodeltemplate.txt',
    'datamodel.prisma',
  ).then(err => {
    if (err) {
      return err;
    }
    return true;
  });
  if (datamodel && prisma) {
    return true;
  }
  return false;
};

writeVariables = async DEV_PRISMA_URL => {
  //put our prisma url in our variables.
  var match = 'thisisyourdevelopmentprismaendpoint';
  var file = await readFilePromise('variables.env', 'utf8');

  var file = file.replace(
    'thisisyourdevelopmentprismaendpoint',
    DEV_PRISMA_URL,
  );
  write('Writing your new variables.env file');
  const newVariablesenv = await writeFilePromise(
    'variables.env',
    file,
    'utf8',
  ).then(err => {
    if (err) {
      return err;
    } else {
      return true;
    }
  });
  return newVariablesenv;
};

deploy = () => {
  const deploy = spawn('npm', ['run', 'deploy'], { stdio: 'inherit' });
  deploy.on('exit', code => {
    write(`Npm run deploy is exiting with code ${code}`);
    if (code !== 0) {
      write('Something went wrong with your deploy. Exiting.');
      process.exit(1);
    } else {
      write(
        'Successfully deployed to prisma demo server. Use npm run dev to begin backend service.',
      );
      process.exit(0);
    }
  });
};

program.parse(process.argv);

//npm install

//run prisma init

//get prisma endpoint and write variables.env/prisma.yml/datamodel.prisma

//make sure our other pieces are here (check if frontend and prisma are in place) if not clone them and run their boostrappers.

//npm run deploy (insert dummy data?);
