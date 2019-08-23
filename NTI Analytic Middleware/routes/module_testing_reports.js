//Imports
const express = require("express");
const router = express.Router();
const DbHelper = require("../lib/dbQueryUtil");

//GET torna tutti le tipologie di reports dei moduli presenti nel DB
//http://127.0.0.1:${port}/module_testing_reports/
router.get("/", (req, res) => {
  try {
    res.send("OK");
  } catch (ex) {
    res.status(500);
    res.sendStatus("Internal Sever Error");
  }
});

//GET torna tutti i reports nel DB
//http://127.0.0.1:${port}/module_testing_reports/all/
router.get("/all/",async (req, res) => {
  try {
      let toReturnArray = await DbHelper.getAllReportsQuery();
      res.send(toReturnArray);
  } catch (ex) {
    res.status(500);
    res.sendStatus("Internal Sever Error");
  }
});

//GET torna tutti i tipi di moduli dei reports
//http://127.0.0.1:${port}/module_testing_reports/alltypes/
router.get("/alltypes/",async (req, res) => {
  try {
      let toReturnArray = await DbHelper.getAllModuleTypesQuery();
      let  plainArray = [];
      toReturnArray.forEach(element => {
        plainArray.push(element.AluPartNumber);
      });
      res.send(plainArray);

  } catch (ex) {
    res.status(500);
    res.sendStatus("Internal Sever Error");
  }
});

//Risorna solo i reports del modulo designato
router.get("/:ModuleType/",async (req, res) => {
  try {
    const requestedAluType = req.params.ModuleType;
    let toReturnArray = await DbHelper.getSingleModuleReportQuery(requestedAluType);
      res.send(toReturnArray);
  } catch (ex) {
    res.status(500);
    res.sendStatus("Internal Sever Error");
  }
});


// Get Field Params
//http://localhost:8080/module_testing_reports/field

router.get("/download/:fileName/", (req, res) => {
  /*
  try {
    const requestedFile = req.params.fileName;
    const file = `${settings.XML_PATH}/${requestedFile}`;
    res.download(file);
  } catch (ex) {
    res.status(500);
    res.sendStatus("Internal Server Error");
  }
  */
});

router.get("/downloadCsv/:fileName/", (req, res) => {
  try {
    /*
    const requestedFile = req.params.fileName;
    const file = `${settings.XML_PATH}/${requestedFile}`;
    console.log(serverGlobal.find((e)=>{return (e.fileName==requestedFile)}));
    res.download(file);
    */
  } catch (ex) {
    res.status(500);
    res.sendStatus("Internal Server Error");
  }
});

module.exports = router;
