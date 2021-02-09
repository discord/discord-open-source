const fs = require('fs')
const discordCommunities = {}
discordCommunities.data = []

// Load all community json files from the communities directory
fs.readdirSync('./communities/').forEach(communityFile => {
  const community = require('./communities/' + communityFile)
  discordCommunities.data.push(community)
})

// Write the new communities.json file
fs.writeFileSync(`./communities.json`, JSON.stringify(discordCommunities, null, 2) + "\n")