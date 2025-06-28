const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ActionRow, MessageFlags } = require("discord.js");
const {rando} = require(`@nastyox/rando.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playwall')
        .setDescription(`Tira con un dado top secret sbloccato dal Playwall.`)
        .addStringOption(option => 
            option.setName(`codice`)
                .setDescription(`Il codice del Documento in Playwall che intendi usare.`)
                .setRequired(true)
                .setMaxLength(3)
        )
        ,
    async execute(interaction) {
        //read and store input
        var pd = interaction.options.getString(`codice`).toUpperCase();

        switch(pd) {
            // unstable codes
            case `U1`: // old 6-Sided
            case `N2`: // old 10-sided
            case `X2`: // old d100
                await interaction.reply({
                    content: `Questo Documento in Playwall era valido solo nell'Edizione Instabile di Triangle Agency. Controlla il manuale aggiornato e riprova.`,
                    flags: MessageFlags.Ephemeral
                });

                break;
            
            // final codes
            case `U2`: // the Six-Sided Die
                var d6Modal = new ModalBuilder()
                    .setCustomId(`d6Modal`)
                    .setTitle(`Il Dado a Sei Facce`);
                
                var reasoningInput = new TextInputBuilder()
                    .setCustomId(`reasoningInput`)
                    .setLabel(`Quale Abilità Anomala stai usando?`)
                    .setRequired(false)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(45);
                
                var burnoutInput = new TextInputBuilder()
                    .setCustomId(`burnoutInput`)
                    .setLabel(`Di quanto Burnout stai soffrendo?`)
                    .setRequired(false)
                    .setMaxLength(3)
                    .setValue(`0`)
                    .setStyle(TextInputStyle.Short);

                d6Modal.addComponents(new ActionRowBuilder().addComponents(reasoningInput), new ActionRowBuilder().addComponents(burnoutInput));

                interaction.showModal(d6Modal);
                interaction.awaitModalSubmit({time: 60_000})
                    .then(modalResponse => {
                        //pull options and define variables
                        var reasoning = modalResponse.fields.getTextInputValue(`reasoningInput`);
                        var initialBurnout = parseInt(modalResponse.fields.getTextInputValue(`burnoutInput`)) ?? 0;
                        if (initialBurnout < 0) initialBurnout = 0;
                        var hadBurnout = (initialBurnout > 0);

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
                        var d6roll = rando(1,6);

                        // TEST DATA
                        // results = [3,1,1,1,1,1];
                        // d6roll = 6;
                        
                        //sort initial results
                        var threes =[];
                        var chaos = [];
                        results.forEach((v,i,a) => {
                            if (v == 3) {
                                threes.push(v);
                            } else {
                                chaos.push(v);
                            }
                        });
                        var threesTotal = threes.length;
                        var chaosTotal = chaos.length;

                        // handle the d6
                        switch(d6roll) {
                            case 3:
                                threesTotal += 1;
                                break;
                            case 6:
                                threesTotal += 2;
                                break;
                            default:
                                chaosTotal += 1;
                                break;
                        }

                        var isTriscendent = (threesTotal == 3);
                        
                        if (!isTriscendent) { //if triscendent, do not adjust rolls
                            //otherwise start applying burnout adjustments
                            for (b = initialBurnout; b > 0; b--) {
                                if(threes.length > 0) {
                                    chaos.push(`${threes.pop()}`);
                                }
                                if (threesTotal > 0)
                                    threesTotal--;
                                chaosTotal++;
                            }
                        }

                        //stability check
                        var isStable = (threesTotal > 0 && threesTotal % 3 == 0);
                
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
                        // add the d6
                        compiledResults = compiledResults.concat(`, [**${d6roll}**]`);
                
                        //finalize results
                        resultsOutput = `Esito: ${compiledResults}`;
                
                        // ----------- COMMENTARY
                        var commentaryTag = isStable ? `🔺` : ``;
                
                        var threesText = ``;
                        var chaosText = ``;
                
                        // assemble success commentary
                        if (threesTotal == 0) {
                            threesText = `Fallimento.`;
                            commentaryTag = `🔵`;
                        } else {
                            threesText = `Successo: ${threesTotal} tre!`;
                        }
                
                        // assemble failures commentary
                        var chaosNumberText = `${chaosTotal}`;
                        if (chaosTotal == 0 || isStable) {
                            chaosNumberText = `0`;
                        }
                
                        chaosText = `Generi ${chaosNumberText} Caos.`;
                
                        // burnout check
                        var burnoutText = ``;
                        if (hadBurnout) {
                            var burnoutVerb = `applicato`;
                            //stability check
                            if (isStable) {
                                burnoutVerb = `neutralizzato`;
                            }
                
                            burnoutText = ` Burnout ${burnoutVerb}.`;
                        }
                
                        commentaryOutput = commentaryOutput.concat(`${commentaryTag} ${threesText} ${chaosText}${burnoutText} ${commentaryTag}`);
                
                        //send reply
                        modalResponse.reply(`${reasonOutput}${resultsOutput}\n${commentaryOutput.trim()}`);
                        //triscendence or unleash followup
                        if (isTriscendent) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🔺🔺🔺**TRISCENDENZA!!!**🔺🔺🔺`);
                            });
                        }
                        else if (threesTotal == 7) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply({content: `🧿 **SCAT3NATI!** 🧿`});
                            });
                        }
                    })
                    .catch(err => console.log('Non è stato inserito alcun input modale.'));

                break;
            case `G3`: // the Sponsorship Die (d8)
                var d8Modal = new ModalBuilder()
                    .setCustomId(`d8Modal`)
                    .setTitle(`Il Dado Sponsorizzato`);

                var reasoningInput = new TextInputBuilder()
                    .setCustomId(`reasoningInput`)
                    .setLabel(`Cosa vuoi Chiedere all'Agenzia?`)
                    .setRequired(false)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(45);
                
                var burnoutInput = new TextInputBuilder()
                    .setCustomId(`burnoutInput`)
                    .setLabel(`Di quanto Burnout stai soffrendo?`)
                    .setRequired(false)
                    .setMaxLength(3)
                    .setValue(`0`)
                    .setStyle(TextInputStyle.Short);
                
                d8Modal.addComponents(new ActionRowBuilder().addComponents(reasoningInput), new ActionRowBuilder().addComponents(burnoutInput));
                interaction.showModal(d8Modal);
                interaction.awaitModalSubmit({ time: 120_000 })
                    .then(modalResponse => {
                        //get field inputs
                        var reasoning = modalResponse.fields.getTextInputValue(`reasoningInput`);
                        var initialBurnout = parseInt(modalResponse.fields.getTextInputValue(`burnoutInput`));
                        var initialBurnout = parseInt(modalResponse.fields.getTextInputValue(`burnoutInput`)) ?? 0;
                        if (initialBurnout < 0) initialBurnout = 0;
                        var hadBurnout = (initialBurnout > 0);

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
                        var d8roll = rando(1,8);

                        // TEST DATA
                        // results = [3,3,1,1,1,1];
                        // d8roll = 3;
                        
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
                        var threesTotal = threes.length;
                        var chaosTotal = chaos.length;

                        // check for successes on the d8
                        var d8Threes = 0;
                        switch(d8roll) {
                            case 3:
                                d8Threes = 1;
                                break;
                            case 6:
                                d8Threes = 2;
                                break;
                        }

                        var minusTotal = threesTotal - d8Threes;
                        var plusTotal = threesTotal + d8Threes;

                        var isTriscendent = (minusTotal == 3) || (threesTotal == 3) || (plusTotal == 3);
                        
                        if (!isTriscendent) { //if triscendent, do not adjust rolls
                            //otherwise start applying burnout adjustments
                            for (b = initialBurnout; b > 0; b--) {
                                if(threes.length > 0) {
                                    chaos.push(`~~${threes.pop()}~~`);
                                }
                                if (threesTotal > 0)
                                    threesTotal--;
                            }
                        }
                        chaosTotal += initialBurnout;

                        // ----------- RESULTS ASSEMBLY
                        var compiledResults = ``;
                        var threesTag = `**`;
                        var chaosTag = ``;
                
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
                        // add the d8
                        compiledResults = compiledResults.concat(`, /__**${d8roll}**__\\`);
                
                        //finalize results
                        resultsOutput = `Esito: ${compiledResults}`;
                
                        // ----------- COMMENTARY
                        var commentaryTag = ``;
                        var plural = ``;
                
                        var threesText = ``;
                        var chaosText = ``;
                
                        // assemble success commentary
                        var timesBurnoutApplied = 0;
                        var maxBurnout = (d8Threes == 0) ? 1 : 3;
                        var stableTag = ``;
                        var possibleText = ``;

                        if (threesTotal == 0 && d8Threes == 0) {
                            threesText = `Fallimento.`;
                            commentaryTag = `🔵`;
                        } else {
                            if (d8Threes == 0) {
                                if (threesTotal > 0 && threesTotal % 3 == 0) commentaryTag = `🔺`;

                                threesText = `Successo: ${threes.length} tre!`;
                            } else {
                                possibleText = `POSSIBILE `;
                                if (minusTotal > 1 || threesTotal > 1 || plusTotal > 1) plural = `i`;
                                else plural = `o`;

                                // minus check
                                if (hadBurnout && !(minusTotal > 0 && minusTotal % 3 == 0)) {
                                    minusTotal -= initialBurnout;
                                    timesBurnoutApplied++;
                                }

                                if (minusTotal > 0) {
                                    stableTag = (minusTotal % 3 == 0) ? `🔺` : ``;
                                } else {
                                    stableTag = `🔵 `;
                                }
                                threesText = threesText.concat(`${stableTag}${minusTotal}, `);

                                // regular check
                                if (hadBurnout && !(threesTotal > 0 && threesTotal % 3 == 0)) {
                                    threesTotal -= initialBurnout;
                                    timesBurnoutApplied++;
                                }

                                if (threesTotal > 0) {
                                    stableTag = (threesTotal % 3 == 0) ? `🔺` : ``;
                                } else {
                                    stableTag = `🔵 `;
                                }
                                threesText = threesText.concat(`${stableTag}${threesTotal}, o `);

                                // plus check
                                if (hadBurnout && !(plusTotal > 0 && plusTotal % 3 == 0)) {
                                    plusTotal -= initialBurnout;
                                    timesBurnoutApplied++;
                                }

                                if (plusTotal > 0) {
                                    stableTag = (plusTotal % 3 == 0) ? `🔺` : ``;
                                } else {
                                    stableTag = `🔵 `;
                                }
                                threesText = threesText.concat(`${stableTag}${plusTotal}`);

                                // append Success text
                                threesText = threesText.concat(` Success${plural}!`);
                            }
                        }

                        //stability check
                        var isStable = (minusTotal > 0 && minusTotal % 3 == 0) || (threesTotal > 0 && threesTotal % 3 == 0) || (plusTotal > 0 && plusTotal % 3 == 0);
                
                        // assemble failures commentary
                        var chaosNumberText = `${chaosTotal}`;
                        if (isStable && chaosTotal != 0) {
                            chaosNumberText = chaosNumberText.concat(` (o 0)`);
                        }
                        if (d8Threes == 0 && isStable)
                            chaosNumberText = `0`;
                
                        chaosText = `Generi ${chaosNumberText} Caos.`;
                
                        // burnout check
                        var burnoutText = ``;
                        if (hadBurnout) {
                            var maybeText = (d8Threes > 0 && timesBurnoutApplied != maxBurnout) ? `Se il Successo è Stabile, ` : ``;
                            var burnoutVerb = `applicato`;
                            //stability check
                            if (isStable) {
                                burnoutVerb = `neutralizzato`;
                            }
                
                            burnoutText = ` ${maybeText}Burnout ${burnoutVerb}.`;
                        }
                
                        commentaryOutput = commentaryOutput.concat(`${commentaryTag} ${threesText} ${chaosText}${burnoutText} ${commentaryTag}`);

                        // Sponsorship check
                        var sponsorText = ``;
                        if (minusTotal > 0 || threesTotal > 0 || plusTotal > 0) {
                            switch(d8roll) {
                                case 1:
                                    sponsorText = `\n> *Per evitare il Fallimento devi inserire nella Catena Causale un evento che ha coinvolto il bersaglio del tiro o il luogo dove ti trovi **esattamente 40 ore fa**.*`;
                                    break;
                                case 2:
                                    sponsorText = `\n> *Per evitare il Fallimento devi inserire nella Catena Causale **un evento avvenuto all'estero**.*`;
                                    break;
                                case 4:
                                    sponsorText = `\n> *Per evitare il Fallimento devi inserire nella Catena Causale **l'influenza di un'opera di fantasia a tua scelta**.*`;
                                    break;
                                case 5:
                                    sponsorText = `\n> *Per evitare il Fallimento devi inserire nella Catena Causale **le Gomme da Masticare Dietetiche Boccasciutta**. Assicurati di usare il nome completo del prodotto!*`;
                                    break;
                                case 7:
                                    sponsorText = `\n> *Per evitare il Fallimento devi inserire nella Catena Causale **qualcosa di colore blu**.*`;
                                    break;
                                case 8:
                                    sponsorText = `\n> *Per evitare il Fallimento devi inserire nella Catena Causale **un tradimento**.*`;
                                    break;
                            }
                        }

                        //send reply
                        modalResponse.reply(`${reasonOutput}${resultsOutput}\n${commentaryOutput.trim()}${sponsorText}`);
                        
                        //triscendence followup?
                        if (isTriscendent) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🔺🔺🔺**${possibleText}TRISCENDENZA!!!**🔺🔺🔺`);
                            });
                        }
                    })
                    .catch(err => console.log('Non è stato inserito alcun input modale.'))
                break;
            case `N1`: // the Ten-Sided Die
                var d10Modal = new ModalBuilder()
                    .setCustomId(`d10Modal`)
                    .setTitle(`Il Dado a Dieci Facce`);
                
                var burnoutInput = new TextInputBuilder()
                    .setCustomId(`burnoutInput`)
                    .setLabel(`Di quanto Burnout stai soffrendo?`)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(3)
                    .setPlaceholder(`0`)
                    .setRequired(false);
                
                var d6Input = new TextInputBuilder()
                    .setCustomId(`d6Input`)
                    .setLabel(`Tiri anche il d6? (s/n)`)
                    .setMaxLength(1)
                    .setStyle(TextInputStyle.Short)
                    .setValue(`n`)
                    .setRequired(true);

                d10Modal.addComponents(new ActionRowBuilder().addComponents(burnoutInput), new ActionRowBuilder().addComponents(d6Input));

                interaction.showModal(d10Modal);
                interaction.awaitModalSubmit({ time: 120_000 })
                    .then(modalResponse => {
                        var includeD6 = (modalResponse.fields.getTextInputValue(`d6Input`).toLowerCase() === `s`);
                        var initialBurnout = parseInt(modalResponse.fields.getTextInputValue(`burnoutInput`));
                        if (initialBurnout < 0)
                            initialBurnout = 0;

                        // --------- d10 RESULTS
                        var d10roll = rando(1,10);
                        var d6roll = rando(1,6);

                        // TEST DATA
                        //d10roll = 3;
                        //d6roll = 4;

                        var resultsOutput = `Esito: < **${d10roll}** >`;

                        if (includeD6)
                            resultsOutput = resultsOutput.concat(`, [**${d6roll}**]`);

                        var successTotal = d10roll;
                        var failureTotal = d10roll;

                        if (includeD6) {
                            switch(d6roll) {
                                case 3:
                                    successTotal += 1;
                                    break;
                                case 6:
                                    successTotal += 2;
                                    break;
                                default:
                                    failureTotal += 1;
                                    break;
                            }
                        }

                        // apply burnout IF not unleashed
                        var hadBurnout = initialBurnout > 0;
                        var unleashed = (successTotal == 7);
                        if (!unleashed) {
                            for (b = initialBurnout; b > 0; b--) {
                                if (successTotal > 0)
                                    successTotal--;
                                failureTotal++;
                            }
                        }

                        if (d10roll == 3) {
                            successTotal = 0;
                        }

                        // ---------- d10 COMMENTARY
                        var commentaryOutput = ``;

                        var burnoutText = ``;
                        if (hadBurnout) {
                            if (unleashed)
                                burnoutText = ` Burnout neutralizzato.`;
                            else
                                burnoutText = ` Burnout applicato.`;
                        }

                        if (d10roll == 3) {
                            commentaryOutput = `🔺 Fallimento. Generi ${failureTotal} Caos.${burnoutText} 🔺`;
                        } else {
                            var plural = (successTotal == 1) ? `` : `es`;
                            commentaryOutput = `Successo: ${successTotal} tre! Generi ${failureTotal} Caos.${burnoutText}`;
                        }
                
                        // ---------- SEND OUTPUT
                        modalResponse.reply(`${resultsOutput}\n${commentaryOutput}`);
                        // unleash check
                        if (unleashed) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🧿 **SCAT3NATI!** 🧿`);
                            });
                        }
                    })
                    .catch(err => console.log('Non è stato inserito alcun input modale.'));
                break;
            case `T3`: // Skill Checks; the d20
                // modal time
                var d20Modal = new ModalBuilder()
                    .setCustomId(`d20Modal`)
                    .setTitle(`Prova di Abilità`);
                
                var qaInput = new TextInputBuilder()
                    .setCustomId(`qaInput`)
                    .setLabel(`Quanti CQ hai nella Qualità scelta?`)
                    .setStyle(TextInputStyle.Short);
                
                d20Modal.addComponents(new ActionRowBuilder().addComponents(qaInput));

                interaction.showModal(d20Modal);
                interaction.awaitModalSubmit({ time: 120_000 })
                    .then(modalResponse => {
                        var qas = parseInt(modalResponse.fields.getTextInputValue(`qaInput`));
                        
                        // ---------- d20 RESULTS
                        // roll the dice
                        var d20Roll = rando(1,20);

                        // TEST DATA
                        //d20Roll = 11;
                        //qas = 1;

                        var d20Total = d20Roll + qas;

                        var resultsOutput = `Esito: <${d20Roll}> + ${qas}`;

                        // ---------- d20 COMMENTARY
                        var commentaryOutput = ``;
                        var successText= `Successo! La tua storia personale è stata sovrascritta.`;
                        var failureText = `Scegli un pezzo della tua storia personale: non è mai avvenuto.`;
                        var isTriscendent = false;

                        if (d20Roll == 3) {
                            commentaryOutput = `🔺 Successo automatico! La tua storia personale è stata sovrascritta. 🔺`;
                            isTriscendent = true;
                        }
                        else if (d20Roll == 7) {
                            commentaryOutput = `🔵 Fallimento automatico. Generi ${d20Roll} Caos. 🔵\nPerdi tutti i CQ in questa Qualità. ${failureText}`;
                        }
                        else if (d20Total > 10) {
                            commentaryOutput = `${successText}`;
                        }
                        else { // d20Total in failure range
                            commentaryOutput = `Fallimento. Generi ${d20Roll} Caos.\n${failureText}`;
                        }
                        
                        // ---------- d20 OUTPUT
                        modalResponse.reply(`${resultsOutput}\n${commentaryOutput}`);
                        if (isTriscendent) {
                            modalResponse.fetchReply()
                            .then(modalReply => {
                                modalReply.reply(`🔺🔺🔺 **TRISCENDENZA!** 🔺🔺🔺`);
                            });
                        }
                    })
                    .catch(err => {});

                break;
            case `X3`: // Background Talent d100
                // roll the die!
                var extras = rando(1,100);

                // TEST DATA
                //extras = 33;

                await interaction.reply({
                    content: `Hai **${extras} Comparse** a disposizione.\n*Tieni traccia in autonomia delle Comparse rimaste!*\n> **Se Veenilla (lo sviluppatore di AgencyOS) o gli Agenti di NessunDove sono nella partita,** questo tiro non è valido. Ringraziali e usa un altro bot per chiamare le Comparse.`,
                    flags: MessageFlags.Ephemeral
                });

                break;
            default:
                await interaction.reply(`Documento in Playwall non valido. Verifica il codice corretto. Per sporgere reclamo sei pregato di recarti al Caveau della tua Filiale in prima persona.`);
                break;
        }
    }
};