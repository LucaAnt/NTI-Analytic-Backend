//External Node Libs
const chokidar = require('chokidar');

//MY LIBS
const dbPusher = require("./lib/dbConnection");

//GLOBAL SETTINGS
const settings = require("./conf/settings.js");


///////////////////////////DEMONE STAZIONE COLLAUDO
//Se PARSE_MODE in settings è impostato a true Effettua il parsing e il push di tutti i file all'avvio 
//Se PARSE_MODE in settings è impostato a false effettua il parsing solo dei nuovi file
if(settings.ALL_MODE)
  dbPusher.pushReportFilesNoCheck();

// Listener INIT
var watcher = chokidar.watch(settings.XML_PATH+"*", {
  ignored: /[\/\\]\./, persistent: true
});

//Listener che effettua il parsing e il push su DB solo sui nuovi file rilevati
watcher.on('ready', () => {
  console.log('Initial scan complete. Ready for changes');
  watcher.on('add', (path) => parseAndPushNewFile(path.substr(path.lastIndexOf("\\")+1,path.length)));
});

const parseAndPushNewFile=(fileName)=>{
  dbPusher.pushNewReportFile(fileName);
};
///////////////////////////FINE DEMONE STAZIONE COLLAUDO
