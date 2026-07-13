import type {
  ChecklistTemplateDto,
  NewChecklistTemplate,
  UpdateChecklistTemplate,
} from './api';

export interface ChecklistTemplateState {
  templates: ChecklistTemplateDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: NewChecklistTemplate) => Promise<void>;
  updateTemplate: (id: string, data: UpdateChecklistTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}
