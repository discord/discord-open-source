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
  // Required string fields
  const requiredFields = ['title', 'inviteCode', 'githubUrl', 'logo'];
  for (const field of requiredFields) {
    if (!community[field] || typeof community[field] !== 'string') {
      error(`${chalk.bold(field)} field must be present and a string`);
    }
  }

  // Validate GitHub URL
  try {
    const ghUrl = new URL(community.githubUrl);
    if (ghUrl.protocol !== 'https:' || ghUrl.pathname.endsWith('.git')) {
      error(`${chalk.bold('githubUrl')} should be a valid URL starting with \`https://\` (and not a cloning URL)`);
    }
  } catch {
    error(`${chalk.bold('githubUrl')} is not a valid URL`);
  }

  // Validate quote length
  if (community.quote && community.quote.length > 350) {
    warn(`${chalk.bold('quote')} field must not have more than 350 characters`);
  }

  // Validate quote source URL
  if (community.quoteSourceUrl) {
    if (!community.quote) {
      error(`${chalk.bold('quoteSourceUrl')} field requires the ${chalk.bold('quote')} field`);
    }
    try {
      const url = new URL(community.quoteSourceUrl);
      if (url.protocol !== 'https:') {
        error(`${chalk.bold('quoteSourceUrl')} should be a valid URL starting with \`https://\``);
      }
    } catch {
      error(`${chalk.bold('quoteSourceUrl')} is not a valid URL`);
    }
  }

  // Check if logo file exists
  try {
    await fs.stat(`./logos/${community.logo}`);
  } catch {
    error(`Logo file ${chalk.bold(community.logo)} not found in /logos folder`);
  }

  // Validate Discord invite
  while (true) {
    const res = await fetch(`https://discord.com/api/v9/invites/${community.inviteCode}?with_expiration=1`);
    const json = await res.json();

    if (json.retry_after) {
      console.warn(chalk.yellow(`Rate limited for ${json.retry_after}s, waiting...`));
      await delay(json.retry_after * 1000);
      continue;
    }

    if (!json.guild) {
      error(`${community.inviteCode} ${util.inspect(json)}`);
    }

    if (json.expires_at) {
      error('Invite must be permanent');
    }

    if (!json.guild.features.includes('COMMUNITY')) {
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
    const error = (msg) => {
      process.exitCode = 1;
      if (process.stderr.clearLine) {
        process.stderr.clearLine();
        process.stderr.cursorTo(0);
      }
      console.error(`${chalk.red.bold(community.title)}: ${msg}`);
    };

    const warn = (msg) => {
      if (process.stderr.clearLine) {
        process.stderr.clearLine();
        process.stderr.cursorTo(0);
      }
      console.error(`${chalk.yellow.bold(community.title)}: ${msg}`);
    };

    await validateCommunity(community, error, warn);
    bar.increment();
  }

  bar.stop();

  // Alphabetical order check
  const sorted = [...communities].sort((a, b) => a.title.localeCompare(b.title));
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].title !== communities[i].title) {
      console.log(chalk.red(`${chalk.bold(communities[i].title)} is not in alphabetical order!`));
      process.exitCode = 1;
      break;
    }
  }
}

// Entry point
validate().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});
