const { rando } = require("@nastyox/rando.js");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('conflitto')
        .setDescription('Dai inizio alla Risoluzione dei Conflitti Interni.')
        .addStringOption(option => 
            option.setName(`obiettivo`)
                .setDescription(`Dichiara il tuo obiettivo.`)
                .setMaxLength(32)
                .setRequired(true)
        )
        ,
    async execute(interaction) {
        //pull options and define variables
        var reasoning = interaction.options.getString(`obiettivo`);

        var reasonOutput = ``;
        var resultsOutput = ``;
        var commentaryOutput = ``;

        // ---------- REASONING
        if (reasoning) {
            var reasonTag = `\`\`\``;
            reasonOutput = `**Inizio Risoluzione del Conflitto.** Obiettivo:${reasonTag}${reasoning}${reasonTag}`;
        }

        // ---------- RESULTS
        var results;
        var threesTotal = 0;
        var rollsNeeded = 0;

        var compiledResults = ``;
        var threesTag = `**`;
        var chaosTag = ``;
        
        while (threesTotal < 6) {
            // roll those <dice / bones>
            results = [];
            for (dice = 0; dice < 6; dice++) {
            results.push(rando(1,4));
            }

            // TEST DATA
            //results = [3,3,3,1,1,1];

            //increment loop count
            rollsNeeded++;
            
            //sort initial results
            var threes = [];
            var chaos = [];
            results.forEach((v,i,a) => {
                if (v == 3) {
                    threes.push(v);
                    threesTotal++;
                } else {
                    chaos.push(v);
                }
            });

            // ----------- RESULTS ASSEMBLY

            // add tagged threes to the results
            if (threes.length > 0) { // if there are any threes...
                compiledResults = compiledResults.concat(`${threesTag}${threes.join(`, `)}${threesTag}`);
            }
            if (threes.length > 0 && chaos.length > 0) { // comma check
                compiledResults = compiledResults.concat(`, `);
            }
            if (chaos.length > 0) { // if there's chaos...
                // ...add it to the results string
                compiledResults = compiledResults.concat(`${chaosTag}${chaos.join(`, `)}${chaosTag}`);
            }

            // line break
            compiledResults = compiledResults.concat(`\n`);
        }

        //finalize results
        resultsOutput = `Esito:\n${compiledResults}`;

        // ----------- COMMENTARY
        var commentaryOutput = ``;

        //assemble commentary
        commentaryOutput = `Hai ottenuto **${threesTotal} Successi** in **${rollsNeeded} tiri**.`;
        commentaryOutput = commentaryOutput.concat(`\n-# Ha la meglio chi arriva a sei 3 con meno tiri. A parità di tiri, ha la meglio chi ha ottenuto più 3.`);

        //send reply
        await interaction.reply(`${reasonOutput}${resultsOutput}\n${commentaryOutput.trim()}`);
    }
};