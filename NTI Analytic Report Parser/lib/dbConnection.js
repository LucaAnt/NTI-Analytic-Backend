const mysql = require('mysql');
const fs = require("fs");
const testParser   = require("./parsing");
const settings   = require("../conf/settings.js");
const connection = mysql.createConnection({
  host     : settings.DB_IP,
  port     : settings.DB_PORT,
  user     : 'NodeClient',
  password : 'NodeClient',
  database : settings.DB_SCHEMA_NAME
});

async function pushReportFilesNoCheck() 
{
  let itemXmlToJobj=null;

  Xmls = fs.readdirSync(settings.XML_PATH);
  //Effettua il parsing 
    console.log("Parsing new file from " + settings.XML_PATH);

    for (var i = 0; i < Xmls.length; i++) {
        //Generazione Obj dal file di report (.xml,.html)
        try {
              itemXmlToJobj = testParser.parseObjectHeaderOnly(Xmls[i]);
              // PUSH ENTRY NEL DB
              if (itemXmlToJobj!=null)
              {
                //pushSingleFileToMySqlServer(itemXmlToJobj);
                await pushSingleFileToMySqlServerAsyncWait(itemXmlToJobj);
              }
        } catch (e){
          console.log("Errore di parsing, file malformato: " + Xmls[i],e);
        }

        //Percentuale completamento parsing
        console.log("Percentuale completamento parsing:",((i / Xmls.length) *100).toFixed(1) + "%");
      
    }
    console.log("Xml Parsing/Push Completed");
}

//EFFETTUA IL PUSH DEI DATI IN MASSA SU DB
const pushReportFiles = ()=>
{

  let itemXmlToJobj=null;
  let toReadFileCounter = 0;
  let oldParsedArrayLength = 0;
  let parsedFilesEntries = [];

  //LETTURA & PUSH DEI FILE NN PARSATI IN PRECEDENZA
  console.log("Reading parsed files from " + settings.JSON_PARSED);
  try {
    parsedFilesEntries = JSON.parse(fs.readFileSync(settings.JSON_PARSED, "utf-8"));
  } catch (ex) {
    console.log("No Json found..");
  }

  oldParsedArrayLength = parsedFilesEntries.length;

  Xmls = fs.readdirSync(settings.XML_PATH);

  //Effettua il parsing solo se  ci sono nuovi file
  if (!(Xmls.length == parsedFilesEntries.length)) {
    console.log("Parsing new file from " + settings.XML_PATH);

    for (var i = 0; i < Xmls.length; i++) {
      //esegue il parsing solo se l'oggetto Json non è stato parsato in precedenza e pushato
      if (parsedFilesEntries.find(el => {return Xmls[i] === el;}) == null ) 
      {
        toReadFileCounter++;
        //Generazione Obj dal file di report (.xml,.html)
        try {

              itemXmlToJobj = testParser.parseObjectHeaderOnly(Xmls[i]);
              parsedFilesEntries.push(Xmls[i]);
              // PUSH ENTRY NEL DB
              if (itemXmlToJobj!=null)
              {
                pushSingleFileToMySqlServer(itemXmlToJobj);
              }
        } catch (e){
          console.log("Errore di parsing, file malformato: " + Xmls[i],e);
        }

        //Percentuale completamento parsing
        console.log("Percentuale completamento parsing:",((toReadFileCounter / (Xmls.length - oldParsedArrayLength)) *100).toFixed(1) + "%");
      }
    }
    console.log("Xml Parsing Completed");
    console.log("Writing to Json ArrayParsedFiles..");
    fs.writeFileSync(settings.JSON_PARSED, JSON.stringify(parsedFilesEntries));
  } else {
    console.log("No new xml files detected...");
  }
}

const pushNewReportFile = (fileName)=>
{
  let itemXmlToJobj=null;
  let parsedFilesEntries = [];

  //LETTURA RECORD FILE PUSHATI 
    try {
      parsedFilesEntries = JSON.parse(fs.readFileSync(settings.JSON_PARSED, "utf-8"));
    } catch (ex) {
      console.log("No Json found..");
    }
  
  
  //PARSING & PUSH NOVO FILE DI REPORT SOLO SE NON è PRESENTE NEL RECORD PUSHATI
  if (parsedFilesEntries.find(el => {return fileName === el;}) == null )
  {
    try {
      itemXmlToJobj = testParser.parseObjectHeaderOnly(fileName);
      parsedFilesEntries.push(fileName);
      if (itemXmlToJobj!=null)
      {
        pushSingleFileToMySqlServer(itemXmlToJobj);
      }
    } catch (e){
      console.log("Errore di parsing, file malformato : " + fileName,e);
    }
  }
 
    console.log("New report file pushed!");
    console.log("Writing to Json ArrayParsedFiles..");
    //AGGIUNTA NUOVA ENTRY NEL RECORD PUSHATI
    fs.writeFileSync(settings.JSON_PARSED, JSON.stringify(parsedFilesEntries));
}

//PUSH DEL SINGOLO FILE SU DB
const pushSingleFileToMySqlServer = (jsObject)=>
{
  try{
      const query = connection.query('INSERT INTO analytic SET ?', jsObject, function (error, results, fields) {
      if(error)
        if (error.code!=null && error.code=="ER_DUP_ENTRY" )
        { 
          console.log("Entry Duplicata: Nome File e Data gia presente");
        } else {
          console.log(error);
        }
        });
        } catch (e){
          console.log(e);
        }
}


function pushSingleFileToMySqlServerAsyncWait(jsObject) 
{
    return new Promise((resolve) => {

        try{
          const query = connection.query('INSERT INTO analytic SET ?', jsObject, function (error, results, fields) {
          if(error)
            if (error.code!=null && error.code=="ER_DUP_ENTRY" )
            { 
              console.log("Entry Duplicata: Nome File e Data gia presente");
            } else {
              console.log(error);
            }
            resolve();
            });
            } catch (e){
              console.log(e);
            }
  });

}



const openConnection=()=>
{
  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('Connected to DB at id:' + connection.threadId);
  });
};


const closeConnection=()=>
{
  //CHIUSURA CONNESSIONE DB
  console.log('Closing connection:' + connection.threadId);
  connection.end();
};


/*
        connection.query({
          sql: 'SELECT * FROM `analytic` WHERE `fileName` = ?',
          timeout: 40000, // 40s
          values: [jsObject.fileName]
        }, function (error, results, fields) {
          console.log(results);
        });
*/

module.exports = {
  pushReportFiles:pushReportFiles,
  pushReportFilesNoCheck:pushReportFilesNoCheck,
  pushNewReportFile:pushNewReportFile,
  openConnection:openConnection,
  closeConnection:closeConnection
  };