"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚗 Driver API is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map