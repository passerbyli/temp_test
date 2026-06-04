#!/usr/bin/env node

import { Command } from 'commander';
import { init } from './init.js';
import { run } from './run.js';

const program = new Command();

program
  .name('ui-guardian')
  .description('UI consistency verification tool')
  .version('0.1.0');

program
  .command('init')
  .description('Generate configuration templates')
  .action(async () => {
    await init();
  });

program
  .command('run')
  .description('Execute comparison flow')
  .action(async () => {
    await run();
  });

program.parse();
