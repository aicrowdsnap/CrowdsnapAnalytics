// Database connection and utilities
import mysql, { Pool } from "mysql2/promise";

declare global {
    var mysqlPool: Pool | undefined;
}

if (!global.mysqlPool) {
    global.mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,      
        user: process.env.DB_USER,      
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: 4000,                     
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 30,
        maxIdle: 10,
        idleTimeout: 180000,
        queueLimit: 5,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        multipleStatements: true,
        connectTimeout: 60000
    });
}

export const pool: Pool = global.mysqlPool!;

// Helper function to execute queries
export async function executeQuery<T>(query: string, values: any[] = []): Promise<T> {
    const connection = await pool.getConnection();
    try {
        const [results] = await connection.execute(query, values);
        return results as T;
    } finally {
        connection.release();
    }
}

// Escape FULLTEXT search query
export function escapeFTQuery(query: string): string {
    return query
        .replace(/[+\-<>()~*"@]/g, '')
        .trim()
        .split(/\s+/)
        .map(word => `+${word}*`)
        .join(' ');
}
