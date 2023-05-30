import path from 'path';

const baseTemplatePath = path.resolve(__dirname, '');
const TemplatesPath = path.resolve(baseTemplatePath, '../');
const finalTemplatesPath = path.resolve(TemplatesPath, 'views');

const settings = {
    jwtSecret: process.env.JWT_SECRET || 'SerfTHh7iy0c045duo7poyg9RxdDursH',
    dbConnectionString: process.env.DATABASE_CONNECTION_STRING || 'mysql://root:10121314@127.0.0.1:3306/dj_management',
    templatesPath: finalTemplatesPath,

    //smtp settings
    smtpServer: {
        host: process.env.DJ_SMTP_SERVER,
        port: process.env.DJ_SMTP_PORT,
        secure: process.env.DJ_SMTP_SECURE,
        user: process.env.DJ_SMTP_USERNAME,
        pass: process.env.DJ_SMTP_PASSWORD,
        fromName: process.env.DJ_FROM_NAME,
        fromAddress: process.env.DJ_FROM_EMAIL,
    },
};
export default settings;
