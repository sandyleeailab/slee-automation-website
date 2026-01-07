/**
 * GOOGLE APPS SCRIPT FOR RESOURCE LEADS + EMAIL DELIVERY
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Go to https://script.google.com
 * 2. Open your existing "Slee Automation Resource Leads" project
 * 3. Replace ALL the code with this new version
 * 4. Click "Deploy" > "Manage deployments"
 * 5. Click the pencil icon to edit
 * 6. Change "Version" to "New version"
 * 7. Click "Deploy"
 *
 * Now when someone submits the form:
 * - Their info is saved to Google Sheets
 * - They receive an email with the resources link
 */

// Configuration
const SHEET_NAME = 'Slee Automation Resource Leads';
const RESOURCES_URL = 'https://sleeautomation.com/resources-tab';
const FROM_NAME = 'Sandy Lee';

/**
 * Handle POST requests from the website form
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const name = data.name || '';
    const email = data.email || '';

    // Get or create the spreadsheet
    const sheet = getOrCreateSheet();

    // Format the timestamp
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    const formattedDate = Utilities.formatDate(timestamp, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm:ss');

    // Append the row
    sheet.appendRow([
      formattedDate,
      name,
      email,
      data.source || 'resources-page',
      'Sent'
    ]);

    // Send the welcome email with resources link
    if (email) {
      sendResourcesEmail(name, email);
    }

    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log error and return failure
    console.error('Error processing request:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Send email with resources link
 */
function sendResourcesEmail(name, email) {
  const firstName = name.split(' ')[0] || 'there';

  const subject = 'Your Free Resources from Sandy Lee';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">You're In!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
                Hey ${firstName},
              </p>
              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thanks for signing up! Click the button below to access all my free resources - templates, tools, guides, and more.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${RESOURCES_URL}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Access Resources
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                Or copy this link: <a href="${RESOURCES_URL}" style="color: #6366f1;">${RESOURCES_URL}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Talk soon,<br>
                <strong style="color: #1a1a1a;">Sandy Lee</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You're receiving this because you signed up at sleeautomation.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const plainBody = `Hey ${firstName},

Thanks for signing up! Here's your link to access all my free resources:

${RESOURCES_URL}

This includes templates, tools, guides, and more.

Talk soon,
Sandy Lee

---
You're receiving this because you signed up at sleeautomation.com`;

  GmailApp.sendEmail(email, subject, plainBody, {
    name: FROM_NAME,
    htmlBody: htmlBody
  });
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Slee Automation Resource Leads webhook is running'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get or create the Google Sheet for storing leads
 */
function getOrCreateSheet() {
  let spreadsheet;

  // Try to find existing spreadsheet by name
  const files = DriveApp.getFilesByName(SHEET_NAME);

  if (files.hasNext()) {
    const file = files.next();
    spreadsheet = SpreadsheetApp.openById(file.getId());
  } else {
    // Create new spreadsheet
    spreadsheet = SpreadsheetApp.create(SHEET_NAME);

    // Get the first sheet
    const sheet = spreadsheet.getActiveSheet();
    sheet.setName('Leads');

    // Add headers
    const headers = ['Date/Time', 'Name', 'Email', 'Source', 'Status'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format headers
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#6366f1')
      .setFontColor('#ffffff');

    // Set column widths
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 250);
    sheet.setColumnWidth(4, 150);
    sheet.setColumnWidth(5, 100);

    // Freeze header row
    sheet.setFrozenRows(1);

    console.log('Created new spreadsheet: ' + spreadsheet.getUrl());
  }

  return spreadsheet.getSheetByName('Leads') || spreadsheet.getActiveSheet();
}

/**
 * Test function - sends a test email to yourself
 */
function testSendEmail() {
  // Change this to your email to test
  const testEmail = 'sandy@sleeautomation.com';
  sendResourcesEmail('Test User', testEmail);
  console.log('Test email sent to: ' + testEmail);
}

/**
 * Get the spreadsheet URL
 */
function getSpreadsheetUrl() {
  const files = DriveApp.getFilesByName(SHEET_NAME);
  if (files.hasNext()) {
    const file = files.next();
    console.log('Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + file.getId());
    return file.getId();
  }
  console.log('Spreadsheet not found.');
  return null;
}
