'use strict';

const nightmare = require('nightmare');
const mailcomposer = require("mailcomposer");
const aws = require('aws-sdk');

const sesRegion = process.env.SES_REGION
const reportSenderEmail = process.env.REPORT_SENDER_EMAIL
const reportReceiverEmail = process.env.REPORT_RECEIVER_EMAIL
const signature = process.env.SIGNATURE
const username = process.env.USERNAME
const password = process.env.PASSWORD

function pretendToBeAPrinter() {
    //For looking up if something is in the media list
    function hasMedia(list, media) {
        if (!list) return false;

        var i = list.length;
        while (i--) {
            if (list[i] === media) {
                return true;
            }
        }
        return false;
    }

    //Loop though all stylesheets
    for (var styleSheetNo = 0; styleSheetNo < document.styleSheets.length; styleSheetNo++) {
        //Current stylesheet
        var styleSheet = document.styleSheets[styleSheetNo];

        //Output debug information
        console.info("Stylesheet #" + styleSheetNo + ":");
        console.log(styleSheet);

        //First, check if any media queries have been defined on the <style> / <link> tag

        //Disable screen-only sheets
        if (hasMedia(styleSheet.media, "screen") && !hasMedia(styleSheet.media, "print")) {
            styleSheet.disabled = true;
        }

        //Display "print" stylesheets
        if (!hasMedia(styleSheet.media, "screen") && hasMedia(styleSheet.media, "print")) {
            //Add "screen" media to show on screen
            styleSheet.media.appendMedium("screen");
        }

        //Get the CSS rules in a cross-browser compatible way
        var rules = styleSheet.rules || styleSheet.cssRules;

        //Handle cases where styleSheet.rules is null
        if (!rules) {
            continue;
        }

        //Second, loop through all the rules in a stylesheet
        for (var ruleNo = 0; ruleNo < rules.length; ruleNo++) {
            //Current rule
            var rule = rules[ruleNo];

            //Hide screen-only rules
            if (hasMedia(rule.media, "screen") && !hasMedia(rule.media, "print")) {
                //Rule.disabled doesn't work here, so we remove the "screen" rule and add the "print" rule so it isn't shown
                console.info('Rule.media:');
                console.log(rule.media)
                rule.media.appendMedium(':not(screen)');
                rule.media.deleteMedium('screen');
                console.info('Rule.media after tampering:');
                console.log(rule.media)
            }

            //Display "print" rules
            if (!hasMedia(rule.media, "screen") && hasMedia(rule.media, "print")) {
                //Add "screen" media to show on screen
                rule.media.appendMedium("screen");
            }
        }
    }
}

function buildEmail(reportPath) {
    return new Promise((resolve, reject) => {
        let params = {
            from: reportSenderEmail,
            to: reportReceiverEmail.split(','),
            subject: 'Validation CRA.',
            text: `Bonjour,\n peux tu valider mon cra stp.\nCordialement ${signature}.`,
            attachments: [
                {
                    filename: `cra-${signature.replace(/\s+/g, '-').toLowerCase()}.pdf`,
                    path: reportPath
                }
            ]
        }
        mailcomposer(params).build((err, mail) => {
            if (err) {
                reject(err)
            } else {
                resolve(mail);
            }
        });
    })
}

function sendRawEmail(email) {
    return new Promise((resolve, reject) => {
        var params = {
            RawMessage: {
                Data: email
            }
        };
        new aws.SES({ region: sesRegion }).sendRawEmail(params, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        });
    })
}

const url = `https://${username}:${password}@work.adneom.be/ActivityReport/Edit/`;
const craPdf = './out/cra.pdf'
const userAgent = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"

nightmare({ show: true })
    .viewport(1920, 1080)
    .useragent(userAgent)
    .goto(url)
    .wait('#printCRA')
    .screenshot('./out/before-printing.png') // for debug
    .evaluate(pretendToBeAPrinter)
    .screenshot('./out/before-pdf-saving.png') // for debug
    .pdf(craPdf, { landscape: true })
    .end()
    // .then(() => buildEmail(craPdf))
    // .then(email => sendRawEmail(email))
    .then(result => console.log(result))
    .catch(err => console.error(err));