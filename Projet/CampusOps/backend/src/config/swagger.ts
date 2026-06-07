import swaggerJsdoc from 'swagger-jsdoc';

// ============================================
// Swagger / OpenAPI Configuration
// ============================================

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'CampusOps API',
            version: '1.0.0',
            description: 'Distributed Cloud-Native Campus Management API — UEMF',
            contact: {
                name: 'CampusOps Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT access token',
                },
            },
        },
        tags: [
            { name: 'Health', description: 'Server Health Check' },
            { name: 'Auth', description: 'Authentication & Authorization' },
            { name: 'Branches', description: 'Campus Branch Management' },
            { name: 'Users', description: 'User Management' },
            { name: 'Modules', description: 'Academic Module Management' },
            { name: 'Groups', description: 'Student Group Management & Enrollment' },
            { name: 'Planning', description: 'Session Scheduling & Calendar' },
            { name: 'Absences', description: 'Attendance Tracking' },
            { name: 'Progress', description: 'Course Completion Tracking' },
            { name: 'Payments', description: 'Financial Management' },
            { name: 'Notifications', description: 'User Notifications' },
        ],
    },
    apis: ['./src/modules/**/*.routes.ts', './src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
