/**
 * Created by finnb on 8/20/16.
 */
var http = require('http');
var qs = require('querystring');
var mysql = require('mysql');
var fs = require('fs');

console.log("Reading MYSQL config...");
var connectionData = JSON.parse(fs.readFileSync('/home/finnb/nodejs-mysql.cfg'));
connectionData.database = 'pythagortraffic';
console.log("Done.");

var chartPagePart1 = fs.readFileSync("chartPagePart1.html");
var chartPagePart2 = fs.readFileSync("chartPagePart2.html");
var chartJS = fs.readFileSync("./clicks/Chart.min.js");

var query = function(string, callback) {
    var connection = mysql.createConnection(connectionData);

    connection.connect(function (err) {
        if (err) {
            throw "Could not connect to mysql: " + err;
            callback(null, null);
        }

        connection.query(string, function (err, rows, fields) {
            console.log("Queried mysql: " + string);
            connection.end();
            callback(rows, fields);
        });
    });
};

query("CREATE TABLE IF NOT EXISTS Clicks (id INT UNIQUE AUTO_INCREMENT, date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);", function(rows) {
    if (rows == null) {
        console.log("Failed to create table Login.");
    }
    else {
        console.log("Initialized Database");
    }
});

var serverPort = 3009;
http.createServer(function (request, response) {
    if(request.method === "GET") {
        if (request.url == "/clicks/Chart.min.js") {
            response.write(chartJS);
            response.end();
        }
        else if (request.url == "/clicks/count") {
            query("SELECT COUNT(*) as clickCount FROM Clicks;", function (rows) {
                if (rows == null || rows.length == 0) {
                    console.log("Failed to count clicks.");
                    response.end("N/A");
                }
                else {
                    response.write(rows[0].clickCount.toString());
                    response.end();
                }
            });
        }
        else if (request.url == "/clicks/chart") {
            query("SELECT COUNT(1) AS clicks, DATE(date) as date FROM Clicks WHERE date >= DATE_FORMAT(CURDATE(),'%Y-%m-01') GROUP BY DATE(date);", function (rows) {
                if (rows == null || rows.length == 0) {
                    console.log("Failed to get clicks.");
                    response.end("N/A");
                }
                else {
                    var chartData = { labels: [], values: []};
                    rows.forEach(function (row) {
                        chartData.labels.push(new Date(row.date).getDate());
                        chartData.values.push(row.clicks);
                    });
                    var responseString = chartPagePart1 + JSON.stringify(chartData) + chartPagePart2;
                    //console.log(responseString);
                    response.write(responseString);
                    response.end();
                }
            });
        }
    } else if(request.method === "POST") {
        query("INSERT INTO Clicks () VALUES ();", function(rows) {
            if (rows == null)
            {
                console.log("Failed to log click.");
            }
            else
            {
                console.log("Logged click.");
                response.end();
            }
        });
    }
}).listen(serverPort);
console.log('Server running at localhost:'+serverPort);