'use strict';

/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable no-loop-func */

const fs = require('fs/promises');
const util = require('util');
const chalk = require('chalk');
const fetch = require('node-fetch');
const cliProgress = require('cli-progress');
const { data: communities } = require('./communities.json');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function validateCommunity(community, error, warn) {
  for (const field of ['title', 'inviteCode', 'githubUrl', 'logo']) {
    if (!community[field] || typeof community[field] !== 'string') {
      error(`${chalk.bold(field)} field must be present and a string`);
    }
  }

  const ghUrl = new URL(community.githubUrl);
  if (ghUrl.protocol !== 'https:' || ghUrl.pathname.endsWith('.git')) {
    error(`${chalk.bold('githubUrl')} should be a valid URL starting with \`https://\` (and not a cloning URL)`);
  }

  if (community.quote) {
    if (community.quote.length > 350) {
      warn(`${chalk.bold('quote')} field must not have more than 350 characters`);
    }
  }

  if (community.quoteSourceUrl) {
    if (!community.quote) {
      error(`${chalk.bold('quoteSourceUrl')} field requires the ${chalk.bold('quote')} field`);
    }
    const url = new URL(community.quoteSourceUrl);
    if (url.protocol !== 'https:') {
      error(`${chalk.bold('quoteSourceUrl')} should be a valid URL starting with \`https://\``);
    }
  }

  await fs.stat(`./logos/${community.logo}`);

  while (true) {
    const req = await fetch(`https://discord.com/api/v9/invites/${community.inviteCode}?with_expiration=1`);
    const response = await req.json();

    if (response.retry_after) {
      console.warn(chalk.yellow(`Rate limited for ${response.retry_after}s, waiting`));
      await delay(response.retry_after * 1000);
      continue;
    }

    if (!response.guild) {
      error(`${community.inviteCode} ${util.inspect(response)}`);
    }

    if (response.expires_at) {
      error('Invite must be permanant');
    }

    if (!response.guild.features.includes('COMMUNITY')) {
      warn('COMMUNITY feature is not enabled');
    }

    break;
  }
}

async function validate() {
  console.log(chalk.underline.bold.white('Validating communities.json'));
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(communities.length, 0);

  for (const community of communities) {
    const error = (message) => {
      process.exitCode = 1;
      if (process.stderr.clearLine) {
        process.stderr.clearLine();
        process.stderr.cursorTo(0);
      }
      console.error(`${chalk.red.bold(community.title)}: ${message}`);
    };
    const warn = (message) => {
      if (process.stderr.clearLine) {
        process.stderr.clearLine();
        process.stderr.cursorTo(0);
      }
      console.error(`${chalk.yellow.bold(community.title)}: ${message}`);
    };

    await validateCommunity(community, error, warn);

    bar.increment();
  }

  bar.stop();

  const sorted = communities
    .slice(0)
    .sort((a, b) => a.title.localeCompare(b.title));

  for (let i = 0; i < sorted.length; i += 1) {
    const a = sorted[i];
    const b = communities[i];
    if (a.title !== b.title) {
      console.log(chalk.red(`${chalk.bold(b.title)} is not in alphabetical order!`));
      process.exitCode = 1;
      break;
    }
  }
}

validate().catch((e) => {
  process.exitCode = 1;
  console.error(e);
});
