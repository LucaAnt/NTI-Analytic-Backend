    const mysql = require('mysql');
    const settings = require("../conf/settings");
    const connection = mysql.createConnection({
    host     : settings.DB_IP,
    port     : settings.DB_PORT,
    user     : 'NodeClient',
    password : 'NodeClient',
    database : settings.DB_SCHEMA_NAME
    });

function getAllReportsQuery()
    {
        return new Promise((resolve) => {
            try{
                    connection.query({
                    sql: 'SELECT * FROM `analytic`',
                    timeout: 40000, // 40s
                  }, function (error, results, fields) {
                    resolve(results);
                  });
              
                } catch (e){
                  console.log(e);
                }
      });
    }

    function getAllModuleTypesQuery()
    {
        return new Promise((resolve) => {
            try{
                    connection.query({
                    sql: 'SELECT DISTINCT AluPartNumber FROM `analytic`',
                    timeout: 40000, // 40s
                  }, function (error, results, fields) {
                    resolve(results);
                  });
              
                } catch (e){
                  console.log(e);
                }
      });
    }

    function getSingleModuleReportQuery(AluPartNumber)
    {
        return new Promise((resolve) => {
            try{
                    connection.query({
                    sql: 'SELECT * FROM `analytic` WHERE AluPartNumber = ?',
                    values: [AluPartNumber],
                    timeout: 40000, // 40s
                  }, function (error, results, fields) {
                    resolve(results);
                  });
              
                } catch (e){
                  console.log(e);
                }
      });
    }



    
module.exports = {
    getAllReportsQuery:getAllReportsQuery,
    getAllModuleTypesQuery:getAllModuleTypesQuery,
    getSingleModuleReportQuery:getSingleModuleReportQuery
    };