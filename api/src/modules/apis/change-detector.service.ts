import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiChange, ChangeDetail } from 'src/Schemas/api-change.schema';
import { Api } from 'src/Schemas/api.schema';
import { OpenAPISpec } from 'src/types/api.type';

interface ChangeResult {
  hasChanges: boolean;
  changes: ChangeDetail[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  changeType: 'breaking' | 'non-breaking' | 'deprecation' | 'addition';
  summary: string;
}

@Injectable()
export class ChangeDetectorService {
  private readonly logger = new Logger(ChangeDetectorService.name);

  constructor(
    @InjectModel(ApiChange.name) private apiChangeModel: Model<ApiChange>,
    @InjectModel(Api.name) private apiModel: Model<Api>,
  ) {}

  async detectChanges(
    oldSpec: OpenAPISpec,
    newSpec: OpenAPISpec,
    apiId: string,
  ): Promise<ChangeResult> {
    const changes: ChangeDetail[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let changeType: 'breaking' | 'non-breaking' | 'deprecation' | 'addition' =
      'non-breaking';

    const versionChanges = this.detectVersionChanges(oldSpec, newSpec);
    changes.push(...versionChanges);

    const pathChanges = this.detectPathChanges(oldSpec, newSpec);
    changes.push(...pathChanges);

    const schemaChanges = this.detectSchemaChanges(oldSpec, newSpec);
    changes.push(...schemaChanges);

    const securityChanges = this.detectSecurityChanges(oldSpec, newSpec);
    changes.push(...securityChanges);

    const analysis = this.analyzeChanges(changes);
    severity = analysis.severity;
    changeType = analysis.changeType;

    if (changes.length > 0) {
      await this.saveApiChange(
        apiId,
        oldSpec.info?.version || 'unknown',
        newSpec.info?.version || 'unknown',
        changes,
        severity,
        changeType,
      );

      return {
        hasChanges: true,
        changes,
        severity,
        changeType,
        summary: this.generateSummary(changes),
      };
    }

    return {
      hasChanges: false,
      changes: [],
      severity: 'low',
      changeType: 'non-breaking',
      summary: 'No changes detected',
    };
  }

  private detectVersionChanges(
    oldSpec: OpenAPISpec,
    newSpec: OpenAPISpec,
  ): ChangeDetail[] {
    const changes: ChangeDetail[] = [];

    if (oldSpec.info?.version !== newSpec.info?.version) {
      changes.push({
        path: 'info.version',
        changeType: 'modified',
        oldValue: oldSpec.info?.version,
        newValue: newSpec.info?.version,
        description: `Version updated from ${oldSpec.info?.version} to ${newSpec.info?.version}`,
      });
    }

    if (oldSpec.info?.title !== newSpec.info?.title) {
      changes.push({
        path: 'info.title',
        changeType: 'modified',
        oldValue: oldSpec.info?.title,
        newValue: newSpec.info?.title,
        description: `API title changed from "${oldSpec.info?.title}" to "${newSpec.info?.title}"`,
      });
    }

    return changes;
  }

  private detectPathChanges(
    oldSpec: OpenAPISpec,
    newSpec: OpenAPISpec,
  ): ChangeDetail[] {
    const changes: ChangeDetail[] = [];
    const oldPaths = Object.keys(oldSpec.paths || {});
    const newPaths = Object.keys(newSpec.paths || {});

    const removedPaths = oldPaths.filter((path) => !newPaths.includes(path));
    removedPaths.forEach((path) => {
      changes.push({
        path: `paths.${path}`,
        changeType: 'removed',
        oldValue: oldSpec.paths[path],
        description: `Endpoint removed: ${path}`,
      });
    });

    const addedPaths = newPaths.filter((path) => !oldPaths.includes(path));
    addedPaths.forEach((path) => {
      changes.push({
        path: `paths.${path}`,
        changeType: 'added',
        newValue: newSpec.paths[path],
        description: `New endpoint added: ${path}`,
      });
    });

    const commonPaths = oldPaths.filter((path) => newPaths.includes(path));
    commonPaths.forEach((path) => {
      const methodChanges = this.detectMethodChanges(
        oldSpec.paths[path],
        newSpec.paths[path],
        path,
      );
      changes.push(...methodChanges);
    });

    return changes;
  }

  private detectMethodChanges(
    oldPath: any,
    newPath: any,
    pathName: string,
  ): ChangeDetail[] {
    const changes: ChangeDetail[] = [];
    const httpMethods = [
      'get',
      'post',
      'put',
      'delete',
      'patch',
      'options',
      'head',
    ];

    httpMethods.forEach((method) => {
      const oldMethod = oldPath[method];
      const newMethod = newPath[method];

      if (oldMethod && !newMethod) {
        changes.push({
          path: `paths.${pathName}.${method}`,
          changeType: 'removed',
          oldValue: oldMethod,
          description: `HTTP method ${method.toUpperCase()} removed from ${pathName}`,
        });
      } else if (!oldMethod && newMethod) {
        changes.push({
          path: `paths.${pathName}.${method}`,
          changeType: 'added',
          newValue: newMethod,
          description: `HTTP method ${method.toUpperCase()} added to ${pathName}`,
        });
      } else if (oldMethod && newMethod) {
        const paramChanges = this.detectParameterChanges(
          oldMethod.parameters || [],
          newMethod.parameters || [],
          `${pathName}.${method}`,
        );
        changes.push(...paramChanges);

        const responseChanges = this.detectResponseChanges(
          oldMethod.responses || {},
          newMethod.responses || {},
          `${pathName}.${method}`,
        );
        changes.push(...responseChanges);
      }
    });

    return changes;
  }

  private detectParameterChanges(
    oldParams: any[],
    newParams: any[],
    methodPath: string,
  ): ChangeDetail[] {
    const changes: ChangeDetail[] = [];

    oldParams.forEach((oldParam) => {
      if (oldParam.required) {
        const stillExists = newParams.find(
          (p) => p.name === oldParam.name && p.in === oldParam.in,
        );
        if (!stillExists) {
          changes.push({
            path: `paths.${methodPath}.parameters.${oldParam.name}`,
            changeType: 'removed',
            oldValue: oldParam,
            description: `Required parameter '${oldParam.name}' removed from ${methodPath}`,
          });
        }
      }
    });

    newParams.forEach((newParam) => {
      if (newParam.required) {
        const existedBefore = oldParams.find(
          (p) => p.name === newParam.name && p.in === newParam.in,
        );
        if (!existedBefore) {
          changes.push({
            path: `paths.${methodPath}.parameters.${newParam.name}`,
            changeType: 'added',
            newValue: newParam,
            description: `New required parameter '${newParam.name}' added to ${methodPath}`,
          });
        }
      }
    });

    return changes;
  }

  private detectResponseChanges(
    oldResponses: any,
    newResponses: any,
    methodPath: string,
  ): ChangeDetail[] {
    const changes: ChangeDetail[] = [];
    const oldCodes = Object.keys(oldResponses);
    const newCodes = Object.keys(newResponses);

    const removedCodes = oldCodes.filter((code) => !newCodes.includes(code));
    removedCodes.forEach((code) => {
      changes.push({
        path: `paths.${methodPath}.responses.${code}`,
        changeType: 'removed',
        oldValue: oldResponses[code],
        description: `Response code ${code} removed from ${methodPath}`,
      });
    });

    const addedCodes = newCodes.filter((code) => !oldCodes.includes(code));
    addedCodes.forEach((code) => {
      changes.push({
        path: `paths.${methodPath}.responses.${code}`,
        changeType: 'added',
        newValue: newResponses[code],
        description: `New response code ${code} added to ${methodPath}`,
      });
    });

    return changes;
  }

  private detectSchemaChanges(
    oldSpec: OpenAPISpec,
    newSpec: OpenAPISpec,
  ): ChangeDetail[] {
    const changes: ChangeDetail[] = [];
    const oldSchemas = oldSpec.components?.schemas || {};
    const newSchemas = newSpec.components?.schemas || {};

    const oldSchemaNames = Object.keys(oldSchemas);
    const newSchemaNames = Object.keys(newSchemas);

    const removedSchemas = oldSchemaNames.filter(
      (name) => !newSchemaNames.includes(name),
    );
    removedSchemas.forEach((name) => {
      changes.push({
        path: `components.schemas.${name}`,
        changeType: 'removed',
        oldValue: oldSchemas[name],
        description: `Schema '${name}' removed`,
      });
    });

    const addedSchemas = newSchemaNames.filter(
      (name) => !oldSchemaNames.includes(name),
    );
    addedSchemas.forEach((name) => {
      changes.push({
        path: `components.schemas.${name}`,
        changeType: 'added',
        newValue: newSchemas[name],
        description: `New schema '${name}' added`,
      });
    });

    return changes;
  }

  private detectSecurityChanges(
    oldSpec: OpenAPISpec,
    newSpec: OpenAPISpec,
  ): ChangeDetail[] {
    const changes: ChangeDetail[] = [];

    const oldSecurity = JSON.stringify(oldSpec.security || []);
    const newSecurity = JSON.stringify(newSpec.security || []);

    if (oldSecurity !== newSecurity) {
      changes.push({
        path: 'security',
        changeType: 'modified',
        oldValue: oldSpec.security,
        newValue: newSpec.security,
        description: 'Security requirements changed',
      });
    }

    return changes;
  }

  private analyzeChanges(changes: ChangeDetail[]): {
    severity: 'low' | 'medium' | 'high' | 'critical';
    changeType: 'breaking' | 'non-breaking' | 'deprecation' | 'addition';
  } {
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let changeType: 'breaking' | 'non-breaking' | 'deprecation' | 'addition' =
      'non-breaking';

    const hasRemovals = changes.some((c) => c.changeType === 'removed');
    const hasRequiredParameterChanges = changes.some(
      (c) =>
        c.path.includes('parameters') && c.description.includes('required'),
    );
    const hasSecurityChanges = changes.some((c) => c.path.includes('security'));

    if (hasRemovals || hasRequiredParameterChanges) {
      severity = 'high';
      changeType = 'breaking';
    } else if (hasSecurityChanges) {
      severity = 'medium';
      changeType = 'breaking';
    } else if (changes.some((c) => c.changeType === 'added')) {
      severity = 'low';
      changeType = 'addition';
    }

    return { severity, changeType };
  }

  private generateSummary(changes: ChangeDetail[]): string {
    const added = changes.filter((c) => c.changeType === 'added').length;
    const removed = changes.filter((c) => c.changeType === 'removed').length;
    const modified = changes.filter((c) => c.changeType === 'modified').length;

    const parts: string[] = [];
    if (added > 0) parts.push(`${added} addition${added > 1 ? 's' : ''}`);
    if (removed > 0) parts.push(`${removed} removal${removed > 1 ? 's' : ''}`);
    if (modified > 0)
      parts.push(`${modified} modification${modified > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : 'No significant changes';
  }

  private async saveApiChange(
    apiId: string,
    fromVersion: string,
    toVersion: string,
    changes: ChangeDetail[],
    severity: 'low' | 'medium' | 'high' | 'critical',
    changeType: 'breaking' | 'non-breaking' | 'deprecation' | 'addition',
  ): Promise<void> {
    try {
      const impactScore = this.calculateImpactScore(changes, severity);

      await this.apiChangeModel.create({
        apiId: new Types.ObjectId(apiId),
        fromVersion,
        toVersion,
        changeType,
        severity,
        changes,
        detectedAt: new Date(),
        summary: this.generateSummary(changes),
        impactScore,
        acknowledged: false,
      });

      this.logger.log(
        `Saved API change record for API ${apiId}: ${severity} - ${changeType}`,
      );
    } catch (error) {
      this.logger.error(`Failed to save API change: ${error.message}`);
    }
  }

  private calculateImpactScore(
    changes: ChangeDetail[],
    severity: 'low' | 'medium' | 'high' | 'critical',
  ): number {
    const severityScores = { low: 10, medium: 30, high: 60, critical: 100 };
    const baseScore = severityScores[severity];

    const removalCount = changes.filter(
      (c) => c.changeType === 'removed',
    ).length;
    const additionCount = changes.filter(
      (c) => c.changeType === 'added',
    ).length;

    return Math.min(100, baseScore + removalCount * 20 + additionCount * 5);
  }

  async getApiChangeHistory(
    apiId: string,
    userId: string,
    limit: number = 20,
  ): Promise<any[]> {
    const api = await this.apiModel.findById(apiId);
    if (!api) {
      throw new NotFoundException('API not found');
    }
    if (api.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return await this.apiChangeModel
      .find({ apiId: new Types.ObjectId(apiId) })
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();
  }
}
