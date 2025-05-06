# Open Source Communities on Discord

This repository contains the source list of open source software (OSS) communities that utilize Discord. It is used to populate the list displayed on [Discord's Open Source page](https://discord.com/open-source).

Thank you for being part of Discord!

---

## 🎯 Acceptance Criteria

To be added to the list, communities must meet the following requirements:

1. **Open Source Focus:** Your community should be tied directly to an open source project and not Discord-focused (e.g., Discord bots or modifications are not accepted).
2. **Community Size:** Your community must have at least **1,000 members**, or the associated GitHub repository must have **1,000 stars** or more.
3. **Guidelines Compliance:** Your community must adhere to the [Discord Community Guidelines](https://discord.com/guidelines).

> **Note:** If you own a large bot, consider [verifying it](https://support.discord.com/hc/en-us/articles/360040720412) as an alternative.

---

## 🛠 Adding Your Project

Follow these steps to submit your project:

### 1. Fork the Repository
Fork this repository to your GitHub account.

### 2. Add Your Logo
Place your project's logo in the [`/logos`](https://github.com/discord/discord-open-source/tree/master/logos) directory.

- **Dimensions:** 
  - For SVG: `72x72`
  - For PNG: `144x144`
- **Optimization:** The logo should be minified.
- **Style:** The logo must be monochromatic and white (see examples on the [Discord Open Source page](https://discord.com/open-source)).
- **Format:** SVGs should contain only vector shapes (no raster graphics).

### 3. Update `communities.json`
Add your community details to the [`communities.json`](https://github.com/discord/discord-open-source/blob/master/communities.json) file using the following format:

```json
{
  "title": "Name of your project",
  "inviteCode": "The public invite code to your project (found after https://discord.gg/).",
  "githubUrl": "The URL of your GitHub organization or project repository.",
  "logo": "your-logo.svg",
  "quote": "Optional: A short quote about how you use Discord for your project.",
  "quoteSourceUrl": "Optional: A URL providing the source of the quote."
}
```

### 4. Submit a Pull Request
- Open a Pull Request (PR) with your changes.
- Ensure all criteria are met and the JSON follows the required structure.
- Once reviewed and approved, your community will be added to Discord's [Open Source page](https://discord.com/open-source).

---

## 📋 Notes

- Communities tied to Discord-focused projects (e.g., bots, modifications) are not eligible for this list.
- Ensure your logo meets all specifications to avoid delays in approval.
- Join our growing list of open source communities and connect with contributors worldwide!

💜 Thanks for contributing to open source and for being part of Discord!