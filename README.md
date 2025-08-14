# Automation Playwright POM

A robust test automation framework built with Playwright and TypeScript, implementing the Page Object Model (POM) pattern for scalable and maintainable end-to-end testing.

## 🚀 Features

- **Page Object Model (POM)** - Clean separation of test logic and page elements
- **TypeScript Support** - Type-safe test development with strict linting
- **Multi-browser Testing** - Support for Chromium, Firefox, and WebKit
- **Database Integration** - Prisma ORM with PostgreSQL for test data management
- **Raw SQL Support** - Execute custom SQL queries alongside ORM operations
- **API Testing** - Comprehensive API testing with REST providers
- **Environment Configuration** - Flexible configuration for different environments
- **Code Quality** - Biome linting and formatting with pre-commit hooks
- **Rich Reporting** - HTML, JSON, and JUnit reports with detailed test results
- **Excel Integration** - Read/write Excel files for data-driven testing
- **CI/CD Ready** - Optimized for continuous integration pipelines

## 📋 Prerequisites

- Node.js (>= 18.0.0)
- npm or yarn
- PostgreSQL database (for test data management)
- Git (for version control and pre-commit hooks)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd automation-playwright-pom
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

6. Set up code quality tools:
```bash
# Install git hooks for code quality
npm run prepare

# Run code formatting and linting
npm run check
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
BASE_URL=https://your-app-url.com
ENVIRONMENT=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name?schema=schema_name
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qa_automation_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_SCHEMA=olva

# Test Configuration
HEADLESS=true
BROWSER=chromium
TIMEOUT=30000
RETRIES=2
WORKERS=4
TEST_USERNAME=
TEST_PASSWORD=

# API Endpoints
API_BASE_URL_ENVIO_REST_DEV=https://your-envio-api.com
API_BASE_URL_GEO_DEV=https://your-geo-api-dev.com
API_BASE_URL_GEO_PROD=https://your-geo-api-prod.com
GEO_X_API_KEY=your-geo-api-key

# Playwright Configuration
STORAGE_STATE_PATH=./auth-state.json
START_LOCAL_SERVER=false
SCREENSHOT_MODE=only-on-failure
VIDEO_MODE=retain-on-failure
TRACE_MODE=on-first-retry

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/test.log
```

## 🏗️ Project Structure

```
automation-playwright-pom/
├── src/
│   ├── apiProviders/               # API client providers
│   │   ├── envioRest.ts           # Envio REST API provider
│   │   └── geo.ts                 # Geo API provider
│   ├── config/
│   │   ├── environment.ts         # Environment configuration
│   │   └── ciudades.ts            # Cities configuration
│   ├── database/
│   │   ├── connection.ts          # Database connection singleton
│   │   └── testDataHelpers.ts     # Database query helpers
│   ├── pages/
│   │   ├── base/
│   │   │   └── BasePage.ts        # Base page class
│   │   └── LoginPage.ts           # Login page object
│   ├── testData/
│   │   ├── archivosExcel/         # Excel test data files
│   │   └── archivosJson/          # JSON test data files
│   ├── types/
│   │   ├── dataBaseInterfaces.ts  # Database type definitions
│   │   └── excelInterfaces.ts     # Excel type definitions
│   └── utils/
│       ├── helpers.ts             # Utility functions
│       └── validadores.ts         # Data validators
├── tests/
│   ├── api/
│   │   ├── creacionTrancking/     # Tracking creation tests
│   │   ├── validacionDesdeBD/     # Database validation tests
│   │   ├── validacionDireccionesNoGeorreferenciadas/
│   │   ├── validacionOficinas/    # Office validation tests
│   │   └── validacionPoligonos/   # Polygon validation tests
│   ├── e2e/
│   │   └── web/                   # End-to-end web tests
│   └── setup/
│       ├── global-setup.ts        # Global test setup
│       └── global-teardown.ts     # Global test teardown
├── prisma/
│   └── schema.prisma              # Database schema
├── resultados-exportados/         # Test results exports
├── biome.json                     # Biome linting configuration
├── playwright.config.ts           # Playwright configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json
```

## 🧪 Running Tests

### Run all tests:
```bash
npx playwright test
```

### Run tests in headed mode:
```bash
npx playwright test --headed
```

### Run specific test file:
```bash
npx playwright test tests/api/validacionDesdeBD/validacionNormalizacionDirecciones.spec.ts
```

### Run specific test suite:
```bash
# Database validation tests
npx playwright test tests/api/validacionDesdeBD/

# API creation tests
npx playwright test tests/api/creacionTrancking/

# Geolocation validation tests
npx playwright test tests/api/validacionOficinas/
```

### Run tests with specific browser:
```bash
npx playwright test --project=chromium
```

### Run tests in debug mode:
```bash
npx playwright test --debug
```

### Run tests with custom environment:
```bash
ENVIRONMENT=production npx playwright test
```

## 📊 Reports

After running tests, you can view reports:

### HTML Report:
```bash
npx playwright show-report
```

Reports are generated in:
- `playwright-report/` - HTML report
- `test-results/` - JSON and JUnit reports

## 🔧 Development

### Code Quality and Linting

This project uses Biome for linting and formatting:

```bash
# Check and fix code formatting/linting
npm run check

# Only check without fixing
npm run lint

# Compile TypeScript
npm run tsc

# Generate Prisma client
npm run prisma:generate
```

### Adding New Page Objects

1. Create a new page class extending `BasePage`:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base/BasePage';

export class YourPage extends BasePage {
  private readonly yourElement: Locator;

  constructor(page: Page) {
    super(page);
    this.yourElement = page.locator('#your-element');
  }

  public async yourMethod(): Promise<void> {
    // Implementation
  }
}
```

2. Create corresponding test file in `tests/e2e/web/`

### Database Operations

#### Using Prisma ORM (Recommended):
```typescript
import { prisma } from '../database/connection';

// Query with ORM
const trackings = await prisma.olvaTrackings.findMany({
  where: {
    fecha_emision: { gt: new Date('2025-06-23') },
    emision: 25
  },
  select: {
    tracking: true,
    address: true,
    address_normalized: true
  },
  orderBy: { tracking: 'desc' },
  take: 10
});
```

#### Using Raw SQL (For complex queries):
```typescript
import { prisma } from '../database/connection';

// Raw SQL query
const results = await prisma.$queryRaw`
  SELECT t.tracking, t.address, t.address_normalized
  FROM olva.trackings t
  WHERE t.fecha_emision > ${new Date('2025-06-23')}
    AND t.emision = ${25}
  ORDER BY t.tracking DESC
  LIMIT 10
`;
```

### API Testing

#### Creating API Providers:
```typescript
import { request } from '@playwright/test';

export class YourApiProvider {
  private baseUrl: any;

  async init() {
    this.baseUrl = await request.newContext({
      baseURL: 'https://your-api.com',
      extraHTTPHeaders: {
        'Content-Type': 'application/json'
      }
    });
    return this;
  }

  async getData(id: number) {
    return await this.baseUrl.get(`/data/${id}`);
  }
}
```

### Excel Data Testing

```typescript
import { leerDatosDesdeExcel, exportarResultadosGenerico } from '../utils/helpers';

// Read Excel data
const datos = leerDatosDesdeExcel('./path/to/file.xlsx', 'SheetName');

// Export results to Excel
exportarResultadosGenerico({
  data: results,
  nombreBase: 'test_results',
  headers: ['Column1', 'Column2'],
  extraerCampos: [(r) => r.field1, (r) => r.field2]
});
```

## 🚀 CI/CD Integration

The framework is optimized for CI/CD with:
- Parallel test execution
- Retry mechanisms
- Multiple report formats
- Environment-specific configurations

### GitHub Actions Example:

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
```

## 📝 Best Practices

1. **Page Objects**: Keep page objects focused and maintainable
2. **Test Data**: Use external data files for test inputs
3. **Assertions**: Use meaningful assertion messages
4. **Waits**: Prefer explicit waits over implicit ones
5. **Environment**: Use environment-specific configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions and support, please:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## � Useful Links

- [Playwright Documentation](https://playwright.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Prisma Documentation](https://www.prisma.io/)
