import { PayloadRequest } from 'payload/types';

export interface Condition {
  field: string;
  operator: string;
  value: string;
}

export class WorkflowConditionEvaluator {
  async evaluateConditions(conditions: Condition[], doc: any): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions means always true
    }

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(doc, condition.field);
      const conditionMet = this.evaluateCondition(fieldValue, condition.operator, condition.value);
      
      if (!conditionMet) {
        return false; // All conditions must be met
      }
    }

    return true;
  }

  async evaluateWorkflowAssignment(workflow: any, doc: any): Promise<boolean> {
    // Check if workflow has assignment conditions
    if (!workflow.steps || workflow.steps.length === 0) {
      return false;
    }

    // For now, auto-assign if workflow is applicable to the collection
    // In a more complex system, you could add assignment conditions here
    return true;
  }

  private getFieldValue(doc: any, fieldPath: string): any {
    const fields = fieldPath.split('.');
    let value = doc;

    for (const field of fields) {
      if (value && typeof value === 'object' && field in value) {
        value = value[field];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: string): boolean {
    // Handle different data types
    const fieldType = typeof fieldValue;
    const expectedType = this.getExpectedType(expectedValue);

    // Convert values for comparison
    let convertedFieldValue = fieldValue;
    let convertedExpectedValue: any = expectedValue;

    if (fieldType === 'number' || expectedType === 'number') {
      convertedFieldValue = Number(fieldValue);
      convertedExpectedValue = Number(expectedValue);
    } else if (fieldType === 'boolean' || expectedType === 'boolean') {
      convertedFieldValue = Boolean(fieldValue);
      convertedExpectedValue = expectedValue.toLowerCase() === 'true';
    }

    switch (operator) {
      case 'eq':
        return convertedFieldValue === convertedExpectedValue;
      
      case 'ne':
        return convertedFieldValue !== convertedExpectedValue;
      
      case 'gt':
        return Number(convertedFieldValue) > Number(convertedExpectedValue);
      
      case 'lt':
        return Number(convertedFieldValue) < Number(convertedExpectedValue);
      
      case 'gte':
        return Number(convertedFieldValue) >= Number(convertedExpectedValue);
      
      case 'lte':
        return Number(convertedFieldValue) <= Number(convertedExpectedValue);
      
      case 'contains':
        if (typeof convertedFieldValue === 'string') {
          return convertedFieldValue.toLowerCase().includes(convertedExpectedValue.toLowerCase());
        }
        return false;
      
      case 'not_contains':
        if (typeof convertedFieldValue === 'string') {
          return !convertedFieldValue.toLowerCase().includes(convertedExpectedValue.toLowerCase());
        }
        return true;
      
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  private getExpectedType(value: string): string {
    // Try to determine the expected type based on the value
    if (value === 'true' || value === 'false') {
      return 'boolean';
    }
    
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return 'number';
    }
    
    return 'string';
  }

  // Helper method to evaluate complex conditions
  async evaluateComplexCondition(condition: string, doc: any): Promise<boolean> {
    // This could be extended to support more complex expressions
    // For now, we'll support simple field comparisons
    const match = condition.match(/^(\w+(?:\.\w+)*)\s*(eq|ne|gt|lt|gte|lte|contains|not_contains)\s*(.+)$/);
    
    if (!match) {
      console.warn(`Invalid condition format: ${condition}`);
      return false;
    }

    const [, field, operator, value] = match;
    return this.evaluateCondition(
      this.getFieldValue(doc, field),
      operator,
      value.trim()
    );
  }
} 