import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./shared/config/index.js";
import logger from "./shared/config/logger.js";
import mongodb from "./shared/config/mongodb.js";
import postgres from "./shared/config/postgres.js";
import rabbitmq from "./shared/config/rabbitmq.js";
import errorHandler from "./shared/middlewares/errorHandler.js";
import ResponceFormatter from './shared/utils/responceFormatter.js'
import cookieParser from "cookie-parser";



/**
 * Express server setup with middleware and database connections.
 * It initializes the Express application, sets up middleware for security, CORS, and cookie parsing,
 * and establishes connections to MongoDB, PostgreSQL, and RabbitMQ.
 * It also includes error handling middleware to manage errors in the application.
 * The server listens on the specified port from the configuration.
 */
const app = express();

/**
 * Middleware setup for the Express application.
 * It includes middleware for parsing JSON and URL-encoded data, enabling CORS, setting security headers with Helmet,
 * and parsing cookies. These middleware functions enhance the security and functionality of the application.
 */

app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/**
 * Middleware for logging incoming requests.
 * Logs the HTTP method, path, IP address, and user agent for each incoming request.
 */
app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.path}`,{
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });
    next();
})

/**
 * Health check endpoint for the server.
 * Responds with a JSON object indicating the server's health status, current timestamp, and uptime.
 * This endpoint can be used to monitor the health of the server in production environments.
 */
app.get('/health', (req, res) => {
    res.status(200).json(
        ResponceFormatter.success(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            },
            'Server is healthy',
        )
    );
});

app.get('/', (req, res) => {
    res.status(200).json(
        ResponceFormatter.success(
            {
                service: 'API Monitoring Service',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    auth: '/api/auth',
                    ingest: '/api/hit',
                    analytics: '/api/analytics',
                },
            },
            'API Hit monitoring Service is running',
        )
    );
});


app.use((req, res, next) =>{
    res.status(404).json(
        ResponceFormatter.error(
            'Endpoint not found',
            404
        )
    );
})


app.use(errorHandler);


/**
 * Initializes database connections for MongoDB, PostgreSQL, and RabbitMQ.
 * It attempts to establish connections to each of the databases and logs the status of each connection.
 * If any connection fails, it logs the error and rethrows it for further handling.
 * This function is called during server startup to ensure that all necessary database connections are established.
 * @returns {Promise<void>}
 */
async function initializeConnection(){
    try {
        logger.info('Initializing database connections...');

        console.log('Initializing database connections...');   // remove this line in production

        // Connect to MongoDB
        await mongodb.connect();

        console.log('MongoDB connection established successfully.');   // remove this line in production

        // Connect to PostgreSQL
        await postgres.testConnection();
        
        console.log('PostgreSQL connection established successfully.');   // remove this line in production
        // Connect to RabbitMQ
        await rabbitmq.connect();
        console.log('RabbitMQ connection established successfully.');   // remove this line in production

        logger.info('All connections established successfully.');
    } catch (error) {
        logger.error('Error occurred while initializing connections:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}


async function startServer() {
    try {

        await initializeConnection();

        const server = app.listen(config.port, () => {
            logger.info(`Server is running on port ${config.port}`);
            logger.info(`Environment: ${config.node_env}`);
            logger.info(`API available at: http://localhost:${config.port}`);
            console.log(`Server is running on port ${config.port}`);  // remove this line in production
        });

        // Handle graceful shutdown

        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received, shutting down gracefully...`);

            server.close(async () => {
                logger.info('HTTP server closed.');

                try {
                    await mongodb.disconnect();
                    await postgres.close();
                    await rabbitmq.close();

                    logger.info('All connections closed successfully.');
                    process.exit(0);

                } catch (error) {
                    logger.error('Error occurred while closing connections:', error);
                    process.exit(1);
                }
            });

            setTimeout(() => {
                logger.error('Forced shutdown');
                process.exit(1);
            }, 10000);
        }

        process.on('SIGTERM', ()=> gracefulShutdown("SIGTERM"));
        process.on('SIGINT', ()=> gracefulShutdown("SIGINT"));

        // handle uncought expections
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown("uncaughtException");
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown("unhandledRejection");
        });

    } catch (error) {
        logger.error('Error occurred while starting the server:', error);
        process.exit(1);
    }
}


startServer();