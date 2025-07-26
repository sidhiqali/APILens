// OpenAPI 3.0+ Specification Types
export interface OpenAPISpec {
  // Required fields
  openapi: string; // e.g., "3.0.0", "3.1.0"
  info: InfoObject;
  paths: PathsObject;

  // Optional fields
  servers?: ServerObject[];
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;

  // Allow additional properties for extensions (x-*)
  [key: string]: any;
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  [key: string]: any;
}

export interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
  [key: string]: any;
}

export interface LicenseObject {
  name: string;
  url?: string;
  [key: string]: any;
}

export interface ServerObject {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariableObject>;
  [key: string]: any;
}

export interface ServerVariableObject {
  enum?: string[];
  default: string;
  description?: string;
  [key: string]: any;
}

export interface PathsObject {
  [path: string]: PathItemObject;
}

export interface PathItemObject {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  servers?: ServerObject[];
  parameters?: (ParameterObject | ReferenceObject)[];
  [key: string]: any;
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
  operationId?: string;
  parameters?: (ParameterObject | ReferenceObject)[];
  requestBody?: RequestBodyObject | ReferenceObject;
  responses: ResponsesObject;
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
  deprecated?: boolean;
  security?: SecurityRequirementObject[];
  servers?: ServerObject[];
  [key: string]: any;
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
  [key: string]: any;
}

export interface RequestBodyObject {
  description?: string;
  content: Record<string, MediaTypeObject>;
  required?: boolean;
  [key: string]: any;
}

export interface MediaTypeObject {
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  encoding?: Record<string, EncodingObject>;
  [key: string]: any;
}

export interface EncodingObject {
  contentType?: string;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  [key: string]: any;
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject | ReferenceObject;
}

export interface ResponseObject {
  description: string;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
  links?: Record<string, LinkObject | ReferenceObject>;
  [key: string]: any;
}

export interface CallbackObject {
  [expression: string]: PathItemObject;
}

export interface ExampleObject {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
  [key: string]: any;
}

export interface LinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: ServerObject;
  [key: string]: any;
}

export interface HeaderObject extends Omit<ParameterObject, 'name' | 'in'> {
  [key: string]: any;
}

export interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
  [key: string]: any;
}

export interface ReferenceObject {
  $ref: string;
}

export interface SchemaObject {
  // JSON Schema properties
  title?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: any[];
  type?:
    | 'null'
    | 'boolean'
    | 'object'
    | 'array'
    | 'number'
    | 'string'
    | 'integer';

  // Schema composition
  allOf?: (SchemaObject | ReferenceObject)[];
  oneOf?: (SchemaObject | ReferenceObject)[];
  anyOf?: (SchemaObject | ReferenceObject)[];
  not?: SchemaObject | ReferenceObject;

  // Object properties
  properties?: Record<string, SchemaObject | ReferenceObject>;
  additionalProperties?: boolean | SchemaObject | ReferenceObject;

  // Array properties
  items?: SchemaObject | ReferenceObject;

  // String properties
  format?: string;

  // Common properties
  description?: string;
  default?: any;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  example?: any;
  externalDocs?: ExternalDocumentationObject;
  deprecated?: boolean;
  xml?: XmlObject;

  // OpenAPI-specific
  discriminator?: DiscriminatorObject;

  [key: string]: any;
}

export interface DiscriminatorObject {
  propertyName: string;
  mapping?: Record<string, string>;
  [key: string]: any;
}

export interface XmlObject {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
  [key: string]: any;
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject | ReferenceObject>;
  responses?: Record<string, ResponseObject | ReferenceObject>;
  parameters?: Record<string, ParameterObject | ReferenceObject>;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
  links?: Record<string, LinkObject | ReferenceObject>;
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
  [key: string]: any;
}

export interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string; // For apiKey
  in?: 'query' | 'header' | 'cookie'; // For apiKey
  scheme?: string; // For http
  bearerFormat?: string; // For http with bearer
  flows?: OAuthFlowsObject; // For oauth2
  openIdConnectUrl?: string; // For openIdConnect
  [key: string]: any;
}

export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
  [key: string]: any;
}

export interface OAuthFlowObject {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
  [key: string]: any;
}

export interface SecurityRequirementObject {
  [name: string]: string[];
}

export interface ExternalDocumentationObject {
  description?: string;
  url: string;
  [key: string]: any;
}

// Utility types for your application
export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head'
  | 'trace';

export type ApiChangeType = 'added' | 'removed' | 'modified' | 'deprecated';

export type ChangeImpact = 'breaking' | 'non-breaking' | 'potentially-breaking';

export type ChangeSeverity = 'low' | 'medium' | 'high' | 'critical';
