function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  template.url = ScriptApp.getService().getUrl(); // This adds the URL to the template
  if (e.parameter.page) {
    template = HtmlService.createTemplateFromFile(e.parameter.page);
    template.url = ScriptApp.getService().getUrl(); // Ensure URL is added for other pages as well
  }
  return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate()
     .getContent();
}

function processFormData(getUserName, getUserEmail, signatureDataURL) {
  let template_file = DriveApp.getFileById('1HfAV2a7_6PIXGJDEZsVMK3QQ9HA6GUeeNEMSwGVyOIw');
  let createACopy = template_file.makeCopy();
  let getCopyFileId = createACopy.getId();
  let options = {year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit"};
  let timestamp = new Date().toLocaleDateString("id-ID",options );

  console.log(getCopyFileId);
  let doc = DocumentApp.openById(getCopyFileId);

  let body = doc.getBody();

  // Replace text placeholders
  body.replaceText("{{fname}}", getUserName);
  body.replaceText("{{email}}", getUserEmail);

  // Decode and create the image blob
  let encodedImageData = signatureDataURL.split(',')[1];
  let decodedImageData = Utilities.base64Decode(encodedImageData);
  let blob = Utilities.newBlob(decodedImageData, 'image/png', 'signature.png');

  // Find the placeholder for the signature and replace it with the image
  let cursor = body.findText("{{signature}}");
  if (cursor) {
    let element = cursor.getElement();
    let image = element.getParent().insertInlineImage(cursor.getStartOffset(), blob);

    // Resize the image
    image.setHeight(100).setWidth(390);

    element.removeFromParent();
  }

  doc.saveAndClose();
  let pdf = DocumentApp.openById(getCopyFileId).getAs('application/pdf').setName(`invoice_consultant_${getUserName}_${timestamp}`);
  DriveApp.getFileById(getCopyFileId).setTrashed(true);
  let pdfConverted = DriveApp.getFolderById('1fqL6YeYmAK2pGQJvjGboxcs2_LJnF2u8').createFile(pdf);
  sendEmail(pdfConverted, getUserName);
}

function sendEmail(pdf, name){
  let timestamp = new Date().toLocaleDateString();
  let recepient = 'ima.aruan@colearn.id';
  let subject = `Invoice_Consultant_${name}_${timestamp}`;
  let body = `You just received an invoice of ${name} at ${timestamp}. Please check the attachment. Thank you`;
  let attachment = {name: `invoice_${name}`, attachments: [pdf]}
  MailApp.sendEmail(recepient, subject, body,attachment);
}

