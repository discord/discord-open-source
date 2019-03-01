const util = require('util');
const chalk = require('chalk');
const fetch = require('node-fetch');
const discordCommunities = require('./communities.json');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function validateCommunity(community) {
  while (true) {
    const req = await fetch(`https://discordapp.com/api/v6/invite/${community.inviteCode}`);
    const response = await req.json();

    if (response.guild) break;

    if (response.retry_after) {
      console.log(chalk.yellow(`Rate limited for ${response.retry_after}ms, waiting`));
      await delay(response.retry_after);
      continue;
    }

    throw new Error(
      `${chalk.yellow.bold(community.title)} (${community.inviteCode}): ${util.inspect(response)}`
    );
  }
}

async function validate() {
  console.log(chalk.underline.bold.white('Validating open source community invite codes'));

  const failedCommunities = [];

  for (const community of discordCommunities.data) {
    console.log(`${community.title} (${community.inviteCode})`);
    try {
      await validateCommunity(community);
    } catch (err) {
      failedCommunities.push(err.message);
    }
  }

  if (failedCommunities.length) {
    console.error(chalk.red.bold('Could not validate some community codes!\n'));
    console.error(failedCommunities.join('\n') + '\n');
    throw new Error('Failed to validate invite codes');
  }
}

validate().catch(err => {
  console.error(err.message);
  process.exit(1);
});
