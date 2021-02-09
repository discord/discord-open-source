const fs = require('fs')
const discordCommunities = require('./communities.json')

// Split the communities.json into seperate files
discordCommunities.data.forEach(community => {
	const id = community.logo.slice(0, -4)
	fs.writeFileSync(`./communities/${id}.json`, JSON.stringify(community, null, 2))
})