import mysql from 'mysql2/promise';
import settings from './settings';

const pool = mysql.createPool({
    uri: settings.dbConnectionString,
    waitForConnections: true, // wait for a connection to become available
    connectionLimit: 10, // maximum number of connections
    queueLimit: 0, // unlimited queueing
    // acquireTimeout: 30000, // deprecated timeout in milliseconds for acquiring a connection
    // createDatabase: true // deprecated
});

pool.on('error', (err) => {
    console.log('MySQL pool error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        // Connection to the MySQL server is lost
        console.log('Reconnecting to MySQL server...');
        pool.getConnection(async (err, connection) => {
            if (err) {
                console.log('Error reconnecting to MySQL server', err);
            } else {
                console.log('Successfully reconnected to MySQL server');
                connection.release();
            }
        });
    } else {
        throw err;
    }
});

export const connectDatabase = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`Database connection successful!`);
        connection.release();
    } catch (error) {
        console.log('Failed to connect to database:', error);
    }
};

export default pool;
