# TypeScript Types Organization

This document describes the organization and structure of TypeScript types in the SonarQube Issues Exporter project.

## Overview

All TypeScript type definitions have been organized into dedicated modules within the `src/types/` directory. This organization provides better maintainability, clear separation of concerns, and improved developer experience.

## Type Module Structure

### Core Files

- **`index.ts`** - Main export point for all types with convenient re-exports
- **`sonarqube.ts`** - SonarQube API and domain-specific types
- **`report.ts`** - Report generation and processing types
- **`config.ts`** - Configuration and settings types

### Feature-Specific Files

- **`cli.ts`** - Command-line interface types
- **`service.ts`** - Service layer and API integration types
- **`exporter.ts`** - Export functionality and format types
- **`utils.ts`** - Utility types and common patterns

## Type Categories

### 1. SonarQube Domain Types (`sonarqube.ts`)

- `SonarQubeIssue` - Core issue structure from SonarQube API
- `IssueSeverity`, `IssueStatus`, `IssueType` - Enums for issue properties
- `SonarQubeSearchResponse` - API response structure
- `Component`, `Rule`, `User` - Related domain entities

### 2. Configuration Types (`config.ts`)

- `AppConfig` - Main application configuration interface
- `SonarQubeConfig` - SonarQube connection settings
- `ExportConfig` - Export operation settings
- `LoggingConfig` - Logging system configuration
- `ConfigLoadOptions` - Configuration loading options

### 3. CLI Types (`cli.ts`)

- `ExportCommandOptions` - Export command parameters
- `ValidateCommandOptions` - Validate command parameters
- `CLICommands` - Available CLI commands enum

### 4. Service Types (`service.ts`)

- `FetchIssuesOptions` - API fetching configuration
- `SonarQubeServiceConfig` - Service initialization config
- `ServiceResult` - Generic service operation result
- `ConnectionValidationResult` - Connection validation outcome

### 5. Exporter Types (`exporter.ts`)

- `HtmlExporterOptions` - HTML export configuration
- `ExportFormat` - Supported export formats enum
- `ExportContext` - Export operation context
- `BaseExporter` - Common exporter interface

### 6. Report Types (`report.ts`)

- `ProcessedIssue` - Processed issue for reporting
- `ReportMetrics` - Report statistics and metrics
- `TemplateData` - Template rendering data
- `ExporterResult` - Export operation result

### 7. Utility Types (`utils.ts`)

- `Result<T, E>` - Generic result wrapper
- `Pagination` - Pagination parameters
- `Filter`, `SortConfig` - Data manipulation types
- `ValidationResult` - Validation outcome types
- `LogLevel`, `LoggerConfig` - Logging types

## Usage Patterns

### Importing Types

```typescript
// Import from main index for commonly used types
import { SonarQubeIssue, AppConfig, ExportCommandOptions } from '../types';

// Import from specific modules for specialized types
import { FetchIssuesOptions } from '../types/service';
import { HtmlExporterOptions } from '../types/exporter';

// Import specific utility types
import { Result, LogLevel } from '../types/utils';
```

### Type Documentation

All types include comprehensive JSDoc documentation with:

- Purpose and usage description
- Parameter explanations
- Example usage where applicable
- Version information
- Author attribution

### Naming Conventions

- **Interfaces**: PascalCase with descriptive names (e.g., `SonarQubeConfig`)
- **Types**: PascalCase for type aliases (e.g., `IssueSeverity`)
- **Enums**: PascalCase with UPPER_CASE values (e.g., `LogLevel.ERROR`)
- **Generic Types**: Single letter or descriptive names (e.g., `Result<T, E>`)

## Benefits of This Organization

### 1. **Maintainability**

- Clear separation of concerns
- Easy to locate and modify specific types
- Reduced coupling between modules

### 2. **Developer Experience**

- Comprehensive IntelliSense support
- Clear import paths
- Well-documented interfaces

### 3. **Consistency**

- Standardized naming conventions
- Consistent documentation format
- Uniform error handling patterns

### 4. **Scalability**

- Easy to add new type modules
- Modular organization supports growth
- Clear boundaries between features

## Migration Notes

### Breaking Changes

- `ExportOptions` interface moved from CLI to `config.ts` (marked as deprecated)
- `FetchIssuesOptions` moved from service file to `service.ts` types
- `HtmlExporterOptions` moved from exporter file to `exporter.ts` types

### Backward Compatibility

- All major interfaces are re-exported from main types index
- Configuration module re-exports `AppConfig` for compatibility
- Import paths can be updated gradually

## Best Practices

### 1. **Type Definition**

```typescript
/**
 * Clear description of the interface purpose
 *
 * @interface InterfaceName
 * @description Detailed explanation of usage
 */
export interface InterfaceName {
  /** Property description */
  property: string;

  /** Optional property with default behavior explanation */
  optionalProperty?: number;
}
```

### 2. **Generic Types**

```typescript
/**
 * Generic type for reusable patterns
 *
 * @type GenericType
 * @description Explanation of generic parameters
 */
export type GenericType<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### 3. **Enum Definitions**

```typescript
/**
 * Enumeration of possible values
 *
 * @enum EnumName
 * @description When and how to use this enum
 */
export enum EnumName {
  /** First option description */
  OPTION_ONE = 'option1',

  /** Second option description */
  OPTION_TWO = 'option2',
}
```

## Future Considerations

- Consider adding runtime type validation using Zod schemas
- Evaluate adding branded types for enhanced type safety
- Consider generator types for automated API type generation
- Plan for OpenAPI schema integration for SonarQube types

## Contributing

When adding new types:

1. Place them in the appropriate module based on functionality
2. Add comprehensive JSDoc documentation
3. Follow established naming conventions
4. Update the main types index if widely used
5. Add usage examples in documentation
6. Consider backward compatibility impact
