# Open Source Communities on Discord

This is the source list of OSS communities that use and live on Discord. It is used to populate the list at https://discord.com/open-source.

Thanks for being part of Discord!

## Acceptance criteria

At this time, we are accepting communities which meet the following criteria:

1.  Your community is not Discord-focused (for example, Discord bots or modifications are not accepted).
2.  Your community has at least 1,000 members, or the GitHub repo has at least 1,000 stars.
3.  Your community adheres to the [Discord community guidelines](https://discord.com/guidelines).

Do you own a large bot? Take a look at [verifying it](https://support.discord.com/hc/en-us/articles/360040720412).

## Adding your project

1.  Fork the repo
2.  Add your logo into [`/logos`](https://github.com/discord/discord-open-source/tree/master/logos)

    * Logo dimensions should be either `72x72` for SVG or `144x144` for PNG.
    * Logo should be minified.
    * Logo should be monochromatic and white (check [the website](https://discord.com/open-source) for examples)
    * SVGs should contain only vector shapes — no raster graphics.

3.  Add your community to [`communities.json`](https://github.com/discord/discord-open-source/blob/master/communities.json), like so:

```json
{
  "logo": "your-logo.svg",
  "title": "Name of your project",
  "quote": "Optional: A short quote about how you use Discord for your project.",
  "quoteSourceUrl": "Optional: An optional source for the quote.",
  "inviteCode": "The public invite code to your project, usually the code after https://discord.gg/",
  "githubUrl": "The URL of your GitHub organization or project repository."
}
```

4.  Submit a PR with your change, and if all is well, we'll merge it and display it on Discord's [open source page](https://discord.com/open-source)!
