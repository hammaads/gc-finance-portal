/**
 * Google Apps Script: Soneri Bank Email → Donation Auto-Importer
 *
 * Setup:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this entire file
 * 3. Update CONFIG.API_KEY with your actual webhook key
 * 4. Update CONFIG.GMAIL_QUERY if the sender address differs
 * 5. Run testWithSampleEmail() to verify connectivity
 * 6. Set a time-driven trigger:
 *    Edit > Triggers > Add Trigger > processNewBankEmails > Time-driven > Every 5 minutes
 */

const CONFIG = {
  EDGE_FUNCTION_URL:
    "https://fjyjekhfdkjdancrxvoo.supabase.co/functions/v1/process-bank-email",
  API_KEY: "YOUR_WEBHOOK_API_KEY_HERE", // <-- Replace with your actual key
  // Gmail search query for Soneri Bank Raast credit notifications
  // Adjust the 'from:' address to match the actual sender
  GMAIL_QUERY:
    'from:(soneri) subject:"credit" "Raast" newer_than:1d',
  // Label applied to processed emails so they aren't re-sent
  PROCESSED_LABEL: "AutoProcessed/Donations",
};

/**
 * Main function: find unprocessed Soneri Bank emails and forward to the Edge Function.
 * Set this as a time-driven trigger (every 5 minutes).
 */
function processNewBankEmails() {
  var label = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (!label) {
    label = GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
  }

  var query =
    CONFIG.GMAIL_QUERY + " -label:" + CONFIG.PROCESSED_LABEL.replace("/", "/");
  var threads = GmailApp.search(query, 0, 50);

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      try {
        var result = sendToWebhook(messages[j]);
        Logger.log(
          "Processed: " +
            messages[j].getSubject() +
            " -> " +
            JSON.stringify(result)
        );
      } catch (err) {
        Logger.log(
          "Error processing " + messages[j].getId() + ": " + err.message
        );
      }
    }
    // Mark the entire thread as processed
    threads[i].addLabel(label);
  }
}

/**
 * Send a single email's body to the Edge Function webhook.
 */
function sendToWebhook(message) {
  var payload = {
    email_body: message.getPlainBody(),
    email_subject: message.getSubject(),
    email_date: message.getDate().toISOString(),
  };

  var response = UrlFetchApp.fetch(CONFIG.EDGE_FUNCTION_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-API-Key": CONFIG.API_KEY,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  var body = JSON.parse(response.getContentText());

  if (code >= 400) {
    throw new Error("HTTP " + code + ": " + (body.error || "Unknown error"));
  }

  return body;
}

/**
 * Manual test: send a sample email body to verify the Edge Function is working.
 * Run this from the Apps Script editor to test before enabling the trigger.
 */
function testWithSampleEmail() {
  var sampleBody =
    "PKR 100 received from MUHAMAD MOSA HASHIM ASCM in your SONE A/C*****6119 on 18-Feb-2026 23:05 via Raast Tx ID TEST_" +
    Date.now();

  var response = UrlFetchApp.fetch(CONFIG.EDGE_FUNCTION_URL, {
    method: "post",
    contentType: "application/json",
    headers: { "X-API-Key": CONFIG.API_KEY },
    payload: JSON.stringify({
      email_body: sampleBody,
      email_subject: "Soneri Raast Credit Acknowledgment Message Request",
      email_date: new Date().toISOString(),
    }),
    muteHttpExceptions: true,
  });

  Logger.log("Status: " + response.getResponseCode());
  Logger.log("Body: " + response.getContentText());
}
