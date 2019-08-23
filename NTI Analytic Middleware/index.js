//External Node Libs
const express = require("express");
const app = express();
const cors = require("cors");
const module_testing_reports = require("./routes/module_testing_reports.js");

//GLOBAL VAR
let port = process.argv[2] || 8080;

app.use(cors());

app.use("/module_testing_reports", module_testing_reports);

app.use((req, res) => {
  res.status(404).send("error 404");
});

console.log(`Server running at http://127.0.0.1:${port}/module_testing_reports`);
app.listen(port);
