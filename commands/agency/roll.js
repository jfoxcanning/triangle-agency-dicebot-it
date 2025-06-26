const { rando } = require("@nastyox/rando.js");
const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`tira`)
        .setDescription(`Tira 6d4 per Alterare la Realtà.`)
        .addStringOption(option => 
            option.setName(`obiettivo`)
                .setDescription(`Perché vuoi tirare i dadi?`)
                .setMaxLength(32)
                .setRequired(false)
        )
        .addIntegerOption(option => 
            option.setName(`burnout`)
                .setDescription(`Di quanto Burnout stai soffrendo?`)
                .setMinValue(0)    
        )
        ,
    async execute(interaction) {
        //pull options and define variables
        var reasoning = interaction.options.getString(`obiettivo`);
        var burnout = interaction.options.getInteger(`burnout`) ?? 0;
        var hadBurnout = (burnout > 0);

        var reasonOutput = ``;
        var resultsOutput = ``;
        var commentaryOutput = ``;

        // ---------- REASONING
        if (reasoning) {
            var reasonTag = `\`\`\``;
            reasonOutput = `${reasonTag}${reasoning}${reasonTag}`;
        }

        // ---------- RESULTS
        // roll those <dice / bones>
        var results = [];
        for (dice = 0; dice < 6; dice++) {
           results.push(rando(1,4));
        }

        // TEST DATA
        //results = [3,3,3,3,2,3];
        
        //sort initial results
        var threes = [];
        var chaos = [];
        results.forEach((v,i,a) => {
            if (v == 3) {
                threes.push(v);
            } else {
                chaos.push(v);
            }
        });

        // check for Triscendence
        var startStable = (threes.length > 0 && threes.length % 3 == 0);
        var isTriscendent = (threes.length == 3);

        if (!isTriscendent) { //if triscendent, do not adjust rolls
            //otherwise start applying adjustments
            var extraChaos = 0;
            for (b = burnout; b > 0; b--) {
                if(threes.length > 0) {
                    chaos.push(`${threes.pop()}`);
                } else {
                    extraChaos++;
                }
            }
        }
        
        // check for stability after adjustment
        var isStable = (threes.length > 0 && threes.length % 3 == 0);

        // ----------- RESULTS ASSEMBLY
        var compiledResults = ``;
        var threesTag = `**`;
        var stableTag = isStable ? `~~` : ``; //if stable, prepare to strikethrough all non-successes

        // if NOT stable but burnout was applied, strikeout any 3s in the chaos array
        if (!isStable && hadBurnout) {
            chaos.forEach((v,i,a) => {
                if (v==3) {
                    chaos[i] = `~~${v}~~`;
                }
            });
        }

        // add tagged threes to the results
        if (threes.length > 0) { // if there are any threes...
            compiledResults = compiledResults.concat(`${threesTag}${threes.join(`, `)}${threesTag}`);
        }
        if (threes.length > 0 && chaos.length > 0) { // comma check
            compiledResults = compiledResults.concat(`, `);
        }
        if (chaos.length > 0) { // if there's chaos...
            // ...add it to the results string
            compiledResults = compiledResults.concat(`${stableTag}${chaos.join(`, `)}${stableTag}`);
        }

        //finalize results
        resultsOutput = `Esito: ${compiledResults}`;

        // ----------- COMMENTARY
        var commentaryTag = isStable ? `🔺` : ``;
        var plural = ``;

        var threesText = ``;
        var chaosText = ``;

        // assemble success commentary
        if (threes.length == 0) {
            threesText = `Fallimento.`;
            commentaryTag = `🔵`;
        } else {
            threesText = `Successo: ${threes.length} tre!`;
        }

        // assemble failures commentary
        var totalChaos = chaos.length + extraChaos;
        var chaosNumberText = `${totalChaos}`;
        if (totalChaos == 0 || isStable) {
            chaosNumberText = `0`;
        }

        chaosText = `Generi ${chaosNumberText} Caos.`;

        // burnout check
        var burnoutText = ``;
        if (hadBurnout) {
            var burnoutVerb = startStable ? `neutralizzato` : `applicato`;

            burnoutText = ` Burnout ${burnoutVerb}.`;
        }

        commentaryOutput = commentaryOutput.concat(`${commentaryTag} ${threesText} ${chaosText}${burnoutText} ${commentaryTag}`);

        //send reply
        await interaction.reply(`${reasonOutput}${resultsOutput}\n${commentaryOutput.trim()}`);
        //triscendence followup
        if (isTriscendent) {
            await interaction.followUp({ content: `🔺🔺🔺**TRISCENDENZA!!!**🔺🔺🔺`, flags: MessageFlags.Ephemeral });
        }
    }
};