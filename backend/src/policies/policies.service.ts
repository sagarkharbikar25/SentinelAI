import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PolicyEffect } from './dto/create-policy-rule.dto';

export interface PolicyRuleEntity {
  id: string;
  policyId: string;
  agentType?: string;
  toolName?: string;
  operation?: string;
  effect: PolicyEffect;
  reason: string;
}

export interface PolicyEntity {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  rules: PolicyRuleEntity[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PoliciesService {
  private policies: Map<string, PolicyEntity> = new Map();

  constructor() {
    this.seedDefaultPolicies();
  }

  private seedDefaultPolicies() {
    const defaultPolicy: PolicyEntity = {
      id: 'pol-data-protection-01',
      name: 'Default Enterprise Security & Data Protection',
      description: 'Global governance policy prohibiting unauthorized database deletions and unverified mass emails.',
      isActive: true,
      rules: [
        {
          id: 'rule-01',
          policyId: 'pol-data-protection-01',
          toolName: 'EXECUTE_SQL',
          operation: 'DROP',
          effect: PolicyEffect.DENY,
          reason: 'Executing DROP SQL statements is strictly forbidden.',
        },
        {
          id: 'rule-02',
          policyId: 'pol-data-protection-01',
          toolName: 'SEND_EMAIL',
          operation: 'MASS_SEND',
          effect: PolicyEffect.REQUIRE_CONFIRMATION,
          reason: 'Mass email dispatch requires human analyst confirmation.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(defaultPolicy.id, defaultPolicy);
  }

  async create(createPolicyDto: CreatePolicyDto) {
    const existing = Array.from(this.policies.values()).find(
      (p) => p.name.toLowerCase() === createPolicyDto.name.toLowerCase(),
    );

    if (existing) {
      throw new ConflictException(`Policy with name '${createPolicyDto.name}' already exists.`);
    }

    const policyId = `pol-${Date.now()}`;
    const rules: PolicyRuleEntity[] = createPolicyDto.rules.map((r, index) => ({
      id: `rule-${Date.now()}-${index}`,
      policyId,
      agentType: r.agentType,
      toolName: r.toolName,
      operation: r.operation,
      effect: r.effect,
      reason: r.reason,
    }));

    const newPolicy: PolicyEntity = {
      id: policyId,
      name: createPolicyDto.name,
      description: createPolicyDto.description,
      isActive: createPolicyDto.isActive ?? true,
      rules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(newPolicy.id, newPolicy);
    return newPolicy;
  }

  async findAll() {
    return Array.from(this.policies.values());
  }

  async findOne(id: string) {
    const policy = this.policies.get(id);
    if (!policy) {
      throw new NotFoundException(`Policy with ID '${id}' not found.`);
    }
    return policy;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto) {
    const policy = await this.findOne(id);

    if (updatePolicyDto.name) policy.name = updatePolicyDto.name;
    if (updatePolicyDto.description) policy.description = updatePolicyDto.description;
    if (updatePolicyDto.isActive !== undefined) policy.isActive = updatePolicyDto.isActive;
    policy.updatedAt = new Date().toISOString();

    return policy;
  }

  async remove(id: string) {
    await this.findOne(id);
    this.policies.delete(id);
    return { id, message: 'Policy deleted successfully.' };
  }
}
