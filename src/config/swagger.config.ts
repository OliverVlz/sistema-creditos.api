import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const configSwagger = new DocumentBuilder()
    .setTitle('Base API System')
    .setDescription('Base API System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, configSwagger);

  const isDevelopment = process.env.NODE_ENV !== 'production';

  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      ...(isDevelopment && {
        requestInterceptor: request => {
          return request;
        },
        responseInterceptor: response => {
          if (
            response.url.includes('/users/login') &&
            response.status === 201
          ) {
            try {
              const responseBody = JSON.parse(response.text);
              if (responseBody.token) {
                const ui = (window as any).ui;
                if (ui) {
                  ui.preauthorizeApiKey('bearer', responseBody.token);
                }
              }
            } catch (error) {
              console.warn('No se pudo extraer token automáticamente:', error);
            }
          }
          return response;
        },
      }),
    },
  });
}
