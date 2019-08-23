//Librerie
const fs = require("fs");
const path = require('path')
const xpath = require("xpath");
const dom = require("xmldom").DOMParser;
const date = require("date-and-time");
date.setLocales('en', {A: ['AM', 'PM']});
const settings = require("../conf/settings.js");
const sizeof = require('object-sizeof')

var skipped=0,parsed=0,error=0;

//Funzione principale di parsing Xmls->Javascript Objects Array (parsedFilesObjects)
exports.parseAllFiles = () => {
  let parsedFilesObjects = [];
  let itemXmlToJobj=null;
  let toReadFileCounter = 0;
  let oldParsedArrayLength = 0;
 

  //Legge i vecchi oggetti Json già parsati in precedenza
  console.log("Reading parsed files from " + settings.JSON_PARSED);
  try {
    parsedFilesObjects = JSON.parse(fs.readFileSync(settings.JSON_PARSED, "utf-8"));
  } catch (ex) {
    console.log("No Json found..");
  }

  oldParsedArrayLength = parsedFilesObjects.length;

  Xmls = fs.readdirSync(settings.XML_PATH);

  //Effettua il parsing solo se  ci sono nuovi file
  if (!(Xmls.length == parsedFilesObjects.length)) {
    console.log("Parsing new file from " + settings.XML_PATH);

    for (var i = 0; i < Xmls.length; i++) {
      //esegue il parsing solo se l'oggetto Json non è stato parsato in precedenza e pushato
      if (parsedFilesObjects.find(el => {return Xmls[i] === el.fileName;}) == null ) {

        toReadFileCounter++;
        //Generazione Obj da file xml
        try {
          
          if (settings.XML_PARSE_MODE == "Header")
            itemXmlToJobj = this.parseObjectHeaderOnly(Xmls[i]);
            //console.log(itemXmlToJobj);

          if (itemXmlToJobj!=null)
            parsedFilesObjects.push(itemXmlToJobj);

          console.log(itemXmlToJobj);
            
        } catch (e){
          console.log("Errore di parsing, file malformato: " + Xmls[i],e);
          error++;
          parsedFilesObjects.push(malformedParsing(Xmls[i]));
        }

        //Percentuale completamento parsing
        console.log("Percentuale completamento parsing:",((toReadFileCounter / (Xmls.length - oldParsedArrayLength)) *100).toFixed(1) + "%");
        console.log("Parsed:",parsed,"Skipped",skipped,"Errors",error);
      }
    }
    console.log("Xml Parsing Completed");
    console.log("Writing to Json..");
    //fs.writeFileSync(settings.JSON_PARSED, JSON.stringify(parsedFilesObjects));
  } else {
    console.log("No new xml files detected...");
  }
  return parsedFilesObjects;
};

  //PARSING SOLO DELL' HEADER
  exports.parseObjectHeaderOnly = (fileName) => 
  {
    
     
      //Header fields
      let AluPartNumber,stationId,TestSocketIndex,serial,Operator,
      numberOfResults,finalResult,totalTime,dateTimeStart,dateTimeEnd;
      //Raw parsed Chars
      let rawText;
      
      //Lettura dati del file
      let fileType = path.extname(fileName);
      if(fileType!=".xml" && fileType!=".html")
      {
        console.log("File "+fileType+" not supported. Skipping..");
        skipped++;
        return null;
      }

      rawText = fs.readFileSync(settings.XML_PATH + fileName, "utf-8");

      if((settings.PARSE_MODE!="nokia") && (settings.PARSE_MODE!="standard"))
      {
        console.log("Invalid Parsing mode");
        process.exit(1);
      }
        
      
      switch (settings.PARSE_MODE)
      { 
        case "nokia":
                          const extractFieldFunction = (toSearchString)=>{
                              let start = rawText.indexOf(toSearchString)+toSearchString.length;
                              let size = rawText.substr(start).indexOf("</B>");
                              return rawText.substr(start,size);
                          };
                          let cutStart = rawText.indexOf("<TABLE");
                          let cutEnd = rawText.indexOf("</TABLE>")+8;

                          const dateFormatterStringNokia = "D MMMM YYYY h:m:s";
                          const dateFormatterStringNokiaDot = "D MMMM YYYY h.m.s";
                          const dateFormatterStringNokiaEnFormat = "MMMM DD, YYYY h:mm:ss A";
                          
                          rawText = rawText.substring(cutStart,cutEnd);
                          let dateText,timeText,toParseDateTime;

                        //STATION ID
                          stationId = extractFieldFunction("Station ID: </B><TD><B>");
                        //ALU Part Number
                          AluPartNumber = extractFieldFunction("ALU Part Number:</B><TD><B>");
                        //TEST SOCKET INDEX
                          TestSocketIndex = 0;
                        //SERIAL
                          serial = extractFieldFunction("Serial Number: </B><TD><B>");
                        //OPERATOR
                          Operator = extractFieldFunction("Operator: </B><TD><B>");
                        //NUMBER OF RESULTS
                          numberOfResults = parseInt(extractFieldFunction("Number of Results: </B><TD><B>")); 
                        //TEST SEQUENCE FINAL RESULT
                          finalResult = extractFieldFunction("UUT Result: </B><TD><B>").split(">")[1].split("<")[0]; 
                        //TOTAL TEST DURATION SECONDS
                          totalTime = parseInt(extractFieldFunction("Execution Time: </B><TD><B>").split(" ")[0]); 
                        //START DATE TIME & END DATE TIME
                        try{
                          dateText = extractFieldFunction("Date: </B><TD><B>");
                          dateText = dateText.substr(dateText.indexOf(" ")).trim();
                          timeText = extractFieldFunction("Time: </B><TD><B>");
                          toParseDateTime = (dateText + " " + timeText).trim();
                        }catch(e){
                          dateTimeStart = settings.MALFORMED_FIELD_PLACEHOLDER_STRING;
                          console.log("Date Parsing Error:",fileName);
                          error++;
                        }

                        try{
                          
                          if(containMonth(toParseDateTime))//En Format
                            {
                              //console.log("Parse type 1",fileName);
                              date.setLocales('en', {A: ['AM', 'PM']});
                              date.locale('en');
                              dateTimeStart = date.parse(toParseDateTime,dateFormatterStringNokiaEnFormat);
                              
                            }else if(timeText.includes(":"))//Italian format 1
                          {
                            console.log("Parse type 2",fileName);
                            date.locale('it');
                            dateTimeStart = date.parse(toParseDateTime,dateFormatterStringNokia);
                          }
                            else if ((timeText.includes(".")))//Italian format 2
                            {
                              //console.log("Parse type 3",fileName);
                              date.locale('it');
                              dateTimeStart = date.parse(toParseDateTime,dateFormatterStringNokiaDot);
                            }
                          
                          dateTimeEnd = date.addSeconds(dateTimeStart, totalTime);

                        }catch(e){
                          console.log("malformed date string:",toParseDateTime,containMonth(dateText),dateTimeStart);
                          console.log(e);
                          error++;
                        }
                          break;
        case "standard":
                          //Taglia la parte malformata dell'html per il parsing xpath
                          if(fileType==".html")
                          {   
                            let cutStart;
                            let cutEnd;

                            cutStart = rawText.indexOf("<table");
                            cutEnd = rawText.indexOf("</table>")+8;
                            rawText = rawText.substring(cutStart,cutEnd);
                          }
                          
                          //console.log(rawText);

                          let xmlDomDocument = new dom().parseFromString(rawText);

                          
                          //Stringhe Query Xpath XML/HTML
                          const xpathStationId = (fileType==".xml"?"//Prop[@Name='StationID']/Value":"(/table/tbody/tr/td[@class='hdr_value']/b)[1]") ;
                          const xpathTestSocketIndex =  (fileType==".xml"?"//Prop[@Name='TestSocketIndex']/Value":"(/table/tbody/tr/td[@class='hdr_value']/b)[2]");
                          const xpathSerial =  (fileType==".xml"?"//Prop[@Name='SerialNumber']/Value":"(/table/tbody/tr/td[@class='hdr_value']/b)[3]");
                          const xpathOperator =  (fileType==".xml"?"//Prop[@Name='LoginName']/Value":"(/table/tbody/tr/td[@class='hdr_value']/b)[6]");
                          const xpathNumberOfResults =  (fileType==".xml"?"//Report[@Type='UUT']/@StepCount":"(/table/tbody/tr/td[@class='hdr_value']/b)[8]/text()");
                          const xpathFinalResult = (fileType==".xml"?"//Report[@Type='UUT']/@UUTResult":"(/table/tbody/tr/td[@class='hdr_value']/b/span)[1]/text()") ;
                          const xpathTotalTime =  (fileType==".xml"?"//Reports/Report/Prop[@Type='TEResult']/Prop[@Name='TS']/Prop[@Name='TotalTime']/Value":"(/table/tbody/tr/td[@class='hdr_value']/b)[7]");
                          const xpathStartDate = (fileType==".xml"?"//Prop[@Name='StartDate']/Prop[@Name='ShortText']/Value":"(/table/tbody/tr/td[@class='hdr_value']/b)[4]") ;
                          const xpathStartTime =  (fileType==".xml"?"//Prop[@ Name='StartTime']/Prop[@Name='Text']/Value":"(/table/tbody/tr/td[@class='hdr_value']/b)[5]");
                          const dateFormatterString = (fileType==".xml"?"M/D/YYYY h:m:s A":"MMMM D, YYYY h:m:s A");
                          date.locale('en');


                          //ALU PART NUMBER
                          AluPartNumber = fileName.split("[")[0];

                          //STATION ID
                          try{
                                stationId = xpath.select( xpathStationId ,xmlDomDocument)[0].firstChild.data;
                          }catch(e){
                            stationId = settings.MALFORMED_FIELD_PLACEHOLDER;
                          }

                          //TEST SOCKET INDEX
                          try{
                          TestSocketIndex = xpath.select(
                            xpathTestSocketIndex,
                            xmlDomDocument
                          )[0].firstChild.data;
                        }catch(e){
                          TestSocketIndex = settings.MALFORMED_FIELD_PLACEHOLDER_NUMERIC;
                        }
                        
                        //SERIAL
                        try{
                            serial = xpath.select(
                            xpathSerial ,
                            xmlDomDocument
                          )[0].firstChild.data;
                        }catch(e){
                          serial = settings.MALFORMED_FIELD_PLACEHOLDER;
                        }
                        
                        //OPERATOR
                        try{
                            Operator = xpath.select(
                            xpathOperator ,
                            xmlDomDocument
                          )[0].firstChild.data;
                        }catch(e){
                          Operator = settings.MALFORMED_FIELD_PLACEHOLDER;
                        }

                        //NUMBER OF RESULTS 
                        try{
                            numberOfResults = parseInt(
                            xpath.select(xpathNumberOfResults, xmlDomDocument)[0].nodeValue
                            );
                          }catch(e){
                            numberOfResults = settings.MALFORMED_FIELD_PLACEHOLDER_NUMERIC;
                          }

                        //TEST SEQUENCE FINAL RESULT
                        finalResult;
                        try{
                          finalResult = xpath.select(
                            xpathFinalResult,
                            xmlDomDocument
                          )[0].nodeValue;

                        }catch(e){
                          finalResult = settings.MALFORMED_FIELD_PLACEHOLDER_NUMERIC;
                        }

                          

                            //PARSING START TIME E TEST DURATION SECONDS
 
                            //TOTAL TEST DURATION SECONDS
                            totalTime;
                            try{
                            totalTime = parseInt(
                              xpath.select(
                                xpathTotalTime,
                                xmlDomDocument
                              )[0].firstChild.data
                            );
                          }catch(e){
                            finalResult = settings.MALFORMED_FIELD_PLACEHOLDER_NUMERIC;
                          }

                          
                          //START DATE TIME & END DATE TIME
                          dateTimeStart;
                          dateTimeEnd;
                          try{
                            let dateText = xpath.select(
                              xpathStartDate,
                              xmlDomDocument
                            )[0].firstChild.data.trim();

                            if(fileType==".html")
                              dateText=dateText.substring(dateText.indexOf(",")+2);

                            let timeText = xpath.select(
                              xpathStartTime,
                              xmlDomDocument
                            )[0].firstChild.data.trim();

                            
                            dateTimeStart = date.parse(dateText + " " + timeText,dateFormatterString);

                            dateTimeEnd = date.addSeconds(dateTimeStart, totalTime);
                            
                          }catch(e){
                            dateTimeStart = settings.MALFORMED_FIELD_PLACEHOLDER;
                            dateTimeEnd = settings.MALFORMED_FIELD_PLACEHOLDER;
                          }
                break;    
                default:
                break;
        
              }

              parsed++;
              return {
                fileName: fileName,
                AluPartNumber:AluPartNumber,
                stationId: stationId,
                serial: serial,
                //TestSocketIndex: TestSocketIndex,
                dateTimeStart: dateTimeStart,
                dateTimeEnd: dateTimeEnd,
                Operator: Operator,
                totalTime: totalTime,
                numberOfResults: numberOfResults,
                finalResult: finalResult
              };
};

//PARSING FILE MALFORMATI
const malformedParsing = (fileName) => {
  return {
    fileName: fileName,
    stationId: settings.MALFORMED_FIELD_PLACEHOLDER_STRING,
    serial: settings.MALFORMED_FIELD_PLACEHOLDER_STRING,
    TestSocketIndex: settings.MALFORMED_FIELD_PLACEHOLDER_STRING,
    dataOra: settings.MALFORMED_FIELD_PLACEHOLDER_STRING,
    Operator: settings.MALFORMED_FIELD_PLACEHOLDER_STRING,
    totalTime: settings.MALFORMED_FIELD_PLACEHOLDER_NUMERIC,
    numberOfResults: settings.MALFORMED_FIELD_PLACEHOLDER_NUMERIC,
    finalResult: settings.MALFORMED_FIELD_PLACEHOLDER_STRING
  };
};

//PARSE DELL'HEADER + INFO AGGIUNTIVE NEL BODY
const parseObjectFull = (fileName, rawXml) => {
  //Begin Sequence: Nuki_Final_FCT_Check_Voltage_TC02\\BATTERY VOLTAGE
  let battery_voltage = xpath.select(
    "//Prop[@Name='BatteryVoltage [Out]']/Value"[0].value,
    xmlDomDocument
  );
  console.log(battery_voltage);
  let Check_Voltage_TC02 = {};

  return {
    fileName: fileName,
    stationId: stationId,
    serial: serial,
    TestSocketIndex: TestSocketIndex,
    dataOra: dataOra,
    Operator: Operator,
    totalTime: totalTime,
    numberOfResults: numberOfResults,
    finalResult: finalResult,
    Check_Voltage_TC02: Check_Voltage_TC02
  };
};

const containMonth = (dateString)=>
{
    let isEngFormat=false;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    months.forEach(month => {
        
        if(dateString.includes(month))
          isEngFormat =  true;
  });
  return isEngFormat;
}