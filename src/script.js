import 'https://unpkg.com/@microblink/blinkid-in-browser-sdk@6.1.0/ui/dist/blinkid-in-browser/blinkid-in-browser.esm.js';

function extractPeerIdFromURL() {
  const params = new URLSearchParams(location.search);
  const peerId = params.get("peerId");

  return peerId;
}

function generatePeerUrl(peerId) {
  return window.location.href + `?peerId=${peerId}`;
}
            
async function main() {
  const blinkId = document.querySelector('blinkid-in-browser');
  
  // Set absolute location of the worker file
  // IMPORTANT: function getWorkerLocation is a workaround for the CodePen since native Web Workers are not supported
  blinkId.workerLocation = await getWorkerLocation('https://unpkg.com/@microblink/blinkid-in-browser-sdk@6.1.0/resources/BlinkIDWasmSDK.worker.min.js');
  
  blinkId.d2dOptions = {
    secure: true,
    host: "0.peerjs.com",
    port: 443,
    urlFactory: generatePeerUrl,
    peerIdExtractor: extractPeerIdFromURL,
  };
  
  blinkId.addEventListener('fatalError', ev => {
    console.log('fatalError', ev.detail);
  });

  blinkId.addEventListener('ready', ev => {
    console.log('ready', ev.detail);
  });

  blinkId.addEventListener('scanError', ev => {
    console.log('scanError', ev.detail);
  });

  blinkId.addEventListener('scanSuccess', ev => {
    console.log('scanSuccess', ev.detail);

    const recognitionResults = ev.detail.recognizer;
    console.log( "BlinkID SingleSide recognizer results", recognitionResults );

    let firstName = "";
    let lastName = "";
    let fullName = "";

    if (recognitionResults?.firstName && recognitionResults?.lastName) {
      if (
        typeof recognitionResults.firstName === "string" &&
        typeof recognitionResults.lastName === "string"
      ) {
        firstName = recognitionResults.firstName;
        lastName = recognitionResults.lastName;
      } else {
        firstName =
          recognitionResults.firstName.latin ||
          recognitionResults.firstName.cyrillic ||
          recognitionResults.firstName.arabic;
        lastName =
          recognitionResults.lastName.latin ||
          recognitionResults.lastName.cyrillic ||
          recognitionResults.lastName.arabic;
      }
    } 

    if ( recognitionResults?.fullName ) {
      if ( recognitionResults.fullName?.latin && recognitionResults.fullName?.arabic ) {
        fullName = `${recognitionResults.fullName.latin} ${recognitionResults.fullName.arabic}`;
      } else if ( recognitionResults.fullName?.latin && recognitionResults.fullName?.cirilic ) {
        fullName = `${recognitionResults.fullName.latin} ${recognitionResults.fullName.cirilic}`
      } else {
        fullName =
          recognitionResults.fullName.latin ||
          recognitionResults.fullName.cyrillic ||
          recognitionResults.fullName.arabic; 
      }
    } 

    const derivedFullName = `${firstName} ${lastName}`.trim() || fullName

    let dateOfBirth = {
      year: 0,
      month: 0,
      day: 0
    };

    if ( recognitionResults?.dateOfBirth ) {
      dateOfBirth = {
        year: recognitionResults.dateOfBirth.year || recognitionResults.mrz.dateOfBirth.year,
        month: recognitionResults.dateOfBirth.month || recognitionResults.mrz.dateOfBirth.month,
        day: recognitionResults.dateOfBirth.day || recognitionResults.mrz.dateOfBirth.day
      }
    }

    alert
    (
      `Hello, ${ derivedFullName }!\n You were born on ${ dateOfBirth.year }-${ dateOfBirth.month }-${ dateOfBirth.day }.`
    );
  });

  blinkId.addEventListener('feedback', ev => {
    console.log('feedback', ev.detail);
  });
}

function getWorkerLocation(path) {  
  return new Promise((resolve) => {
    window.fetch(path)
      .then(response => response.text())
      .then(data => {
        const blob = new Blob( [ data ], { type: "application/javascript" } );
        const url = URL.createObjectURL( blob );
        resolve(url);
      });
  });
}

main();