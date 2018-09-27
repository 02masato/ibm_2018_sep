var express = require("express");
var bodyParser = require('body-parser')
var app = express();
var cfenv = require("cfenv");

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// parse application/x-www-form-urlencoded
//app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json())

var cloudant, mydb;

/* Endpoint to greet and add a new visitor to database.
* Send a POST request to localhost:3000/api/visitors with body
* {
* 	"name": "Bob"
* }
*/

/*
受信基板　：0004F000
送信基板１：0004F001
送信基板２：0004F002
*/
/*
{
  {
    "skyley_id":"0004101C",   //識別子
    "sensor_type":"AA",     //センサー種別(2byte)
    "value_str":"28,60",  //"温度（28℃）", ”湿度（60%）"
    "time":3232...        //milisec時間
  },
  ...
}

*/

 var fs = require('fs');

app.get('/top', function(req, res, next) {
    
    var senrsor_datas = fs.readFileSync('datas.txt', 'utf-8');   
    var senrsor_json_arr = JSON.parse( fs.readFileSync('datas.txt', 'utf-8') );   
       
       var len = senrsor_json_arr.length;
       var sensors = {};
      
      // def
       // 別ファイルで @ next
       
        var locations = {
         /* "0004F001" : { lat : 34.716164  ,  lng : 135.487351 } ,
          "0004F002" : { lat : 34.7211134 ,  lng : 135.4931013} ,
          "0004F003" : { lat : 34.7205101 ,  lng : 135.4938128} ,
          "0004F004" : { lat : 34.72193256 ,  lng :135.507025} ,
          "0004F005" : { lat : 34.7207805 ,  lng : 135.4948175 } ,
          "0004F006" : { lat : 34.7220861 ,  lng : 135.5032748} ,
          "0004F007" : { lat :34.7218474,  lng : 135.5000723 } ,
          "0004F008" : { lat :34.7211131,  lng : 135.5063018 } */
           "000410C7" : { lat :34.7211131,  lng : 135.5063018 } 
       }
     
      // def  end
         
       for ( i = 0 ;  i < len ; i ++  ) {
           var sensor_json = senrsor_json_arr[i];
           var skyley_id = sensor_json.skyley_id ;
                    
            var img_url_str = ""; 
            /*
            if ( Number(sensor_json.value_str) >= 100 ){
                 img_url_str = './res/img/10cm.jpg';   
             }
            if ( Number(sensor_json.value_str) >= 75 ){
                    img_url_str = './res/img/75cm.jpg';  
             }
             */
             /*
            if ( Number(sensor_json.value_str) >= 50 ){
                 img_url_str = './res/img/50cm.jpg';   
             } else
            if ( Number(sensor_json.value_str) >= 45 ){
                       img_url_str = './res/img/30cm.jpg';   
             }  else */
             if ( ( Number(sensor_json.value_str) - 27 ) <  10 ){
                    img_url_str = './res/img/100cm.jpg';   
             } 
                     
                sensors[skyley_id] = {
                    value_str  :  sensor_json.value_str ,
                    skyley_id  :  skyley_id ,
                    LatLng     :  locations[skyley_id] ,
                    img_src          :  img_url_str
                } ;

       }
      
     res.render('index',{'sensors': JSON.stringify(sensors)});
     res.end();
});

/*
app.post('/api/put/data', function(req, res) {
    
  var datas = fs.readFileSync('datas.txt', 'utf-8');   
  var text  = JSON.stringify(req.body) +datas;
  
  var err = writeFile('datas.txt',text);
  res.render('index',{'text':text});

  res.end();
});
*/

app.post('/api/put/sensordata', function(req, res) {
    
  //var sensors_json = JSON.parse(fs.readFileSync('datas.txt', 'utf8'));
  
  var request_json =  JSON.stringify(req.body) ;
  /*
       var sen_arr =  request_json['datas'];
    for(var i = 0 ; i<sen_arr.length ; i++ ){
           var obj = JSON.parse(sen_arr[i]);
           sensors_json [ obj.skyley_id ] = obj;
      }
  */
  //var json_str = JSON.stringify(request_json);
  
  var err = writeFile('datas.txt',request_json);
  res.render('index',{'text':err});
  res.end();
  
});

function writeFile(path, data) {
  fs.writeFile(path, data, function (err) {
    if (err) {
        throw err;

    }
  });
}

app.post("/api/visitors", function (request, response) {
  var userName = request.body.name;
  var doc = { "name" : userName };
  if(!mydb) {
    console.log("No database.");
    response.send(doc);
    return;
  }
  // insert the username as a document
  mydb.insert(doc, function(err, body, header) {
    if (err) {
      console.log('[mydb.insert] ', err.message);
      response.send("Error");
      return;
    }
    doc._id = body.id;
    response.send(doc);
  });
});

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/visitors", function (request, response) {
  var names = [];
  if(!mydb) {
    response.json(names);
    return;
  }

  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.name)
          names.push(row.doc.name);
      });
      response.json(names);
    }
  });
});


// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

// Load the Cloudant library.
var Cloudant = require('@cloudant/cloudant');
if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/cloudant/)) {

  // Initialize database with credentials
  if (appEnv.services['cloudantNoSQLDB']) {
    // CF service named 'cloudantNoSQLDB'
    cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
  } else {
     // user-provided service with 'cloudant' in its name
     cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
  }
} else if (process.env.CLOUDANT_URL){
  cloudant = Cloudant(process.env.CLOUDANT_URL);
}
if(cloudant) {
  //database name
  var dbName = 'mydb';

  // Create a new "mydb" database.
  cloudant.db.create(dbName, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbName);
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbName);
}

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
