// requirements
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { token } = require("./config.json");

// create a new Client and options
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// command handler
client.commands = new Collection();
const foldersPath = path.join(__dirname, `commands`);
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[ATTENZIONE] Proprietà 'data' o 'execute' mancante nel comando in posizione ${filepath} !`);
        }
    }
}

// Run this when the client is ready
client.once(Events.ClientReady, c => {
    c.user.setActivity(`ogni vostra azione`, {type: ActivityType.Watching});
    console.log(`Operativo!`);
});

//setup some interaction logging
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Impossibile trovare il comando ${interaction.commandName} .`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `Errore nell'esecuzione del comando!`, ephemeral: true });
        } else {
            await interaction.reply({ content: `Errore nell'esecuzione del comando!`, ephemeral: true});
        }
    }
});

client.on('error', error => {
    console.error(`Errore di WebSocket:`, error);
});

// Log in
client.login(token);