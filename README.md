# Open Source Communities on Discord

This is a maintained source list of open-source communities that use and live on Discord. It is used to populate the list at https://discord.com/open-source.

The data contract remains compatible with the original Discord directory: `communities.json` contains a top-level `data` array with one record per community. This repository is community-maintained and is not an official Discord product.

Thanks for being part of Discord!

## Acceptance criteria

At this time, we are accepting communities which meet the following criteria:

1.  Your community is not Discord-focused (for example, Discord bots or modifications are not accepted).
2.  Your community has at least 1,000 members, or the GitHub repo has at least 1,000 stars.
3.  Your community adheres to the [Discord community guidelines](https://discord.com/guidelines).

Do you own a large bot? Take a look at [verifying it](https://support.discord.com/hc/en-us/articles/360040720412).

## Local checks

Install Node.js 22 or newer, then run:

```sh
npm ci
npm test
```

The normal test suite is deterministic and does not require network access. Maintainers can run the live Discord invite checks separately:

```sh
npm run validate-online
```

Live checks use timeouts and bounded retries. A temporary Discord outage should be investigated before merging, but does not make pull-request checks flaky.

## Adding your project

1.  Fork the repo and create a branch
2.  Add your logo into [`/logos`](https://github.com/discord/discord-open-source/tree/master/logos)

    * Logo dimensions should be either `72x72` for SVG or `144x144` for PNG.
    * Logo should be minified.
    * Logo should be monochromatic and white (check [the website](https://discord.com/open-source) for examples)
    * SVGs should contain only vector shapes — no raster graphics.

3.  Add your community to [`communities.json`](https://github.com/discord/discord-open-source/blob/master/communities.json), like so:

```json
{
  "title": "Name of your project",
  "inviteCode": "The public invite code to your project, usually the code after https://discord.gg/",
  "githubUrl": "The URL of your GitHub organization or project repository.",
  "logo": "your-logo.svg",
  "quote": "Optional: A short quote about how you use Discord for your project.",
  "quoteSourceUrl": "Optional: An optional source for the quote."
}
```

4.  Run `npm test` and confirm that your invite is permanent and publicly joinable.
5.  Submit a PR with your change. Approved entries may be displayed on Discord's [open source page](https://discord.com/open-source).

Please keep entries alphabetized by `title`. A project may share an invite code with another project when both communities intentionally use the same server. Logos should be transparent, monochromatic white artwork: SVGs should be 72x72 and PNGs should be 144x144.
