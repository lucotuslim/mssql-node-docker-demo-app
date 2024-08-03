const express = require("express");
const { Connection, Request } = require('tedious');

const app = express();
const port = process.env.PORT || 8080; // Default to 8080 if PORT is not set

app.get('/', (req, res) => {
    console.log('Received request for /');

    const config = {
        server: 'localhost',
        authentication: {
            type: 'default',
            options: {
                userName: 'sa',
                password: 'Yukon900'
            }
        },
        options: {
            port: 1433,
            database: 'master',
            trustServerCertificate: true
        }
    };

    const connection = new Connection(config);

    connection.on('connect', (err) => {
        if (err) {
            console.error('Connection Failed:', err);
            res.status(500).send('Database connection failed');
        } else {
            console.log("Connected");
            executeStatement();
        }
    });

    connection.connect();

    function executeStatement() {
        const query = "SELECT * FROM sys.databases FOR JSON AUTO;";
        const request = new Request(query, (err) => {
            if (err) {
                console.error('Request Error:', err);
                res.status(500).send('Error executing query');
            }
        });

        let result = '';

        request.on('row', (columns) => {
            columns.forEach((column) => {
                if (column.value !== null) {
                    result += column.value;
                }
            });
        });

        request.on('requestCompleted', () => {
            console.log('Request Completed');
            try {
                const jsonResponse = JSON.parse(result); // Parse the JSON result
                res.json(jsonResponse); // Send the parsed JSON response
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                res.status(500).send('Error parsing JSON result');
            }
            connection.close();
        });

        request.on('done', (rowCount, more) => {
            console.log(`${rowCount} rows returned`);
        });

        connection.execSql(request);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
