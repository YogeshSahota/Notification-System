import { TemplateService } from '../src/modules/template/template.service';

describe('Template rendering', () => {
  const service = new TemplateService();

  it('replaces variables in body and subject', () => {
    const result = service.renderTemplate(
      'Hi {{name}}, code is {{otp}}.',
      'Hello {{name}}!',
      { name: 'Alice', otp: '1234' },
    );

    expect(result.body).toBe('Hi Alice, code is 1234.');
    expect(result.subject).toBe('Hello Alice!');
  });

  it('leaves unmatched variables as-is', () => {
    const result = service.renderTemplate('Hello {{name}}, {{unknown}}', null, { name: 'Bob' });
    expect(result.body).toBe('Hello Bob, {{unknown}}');
    expect(result.subject).toBeNull();
  });

  it('handles empty variables', () => {
    const result = service.renderTemplate('No vars {{here}}', null, {});
    expect(result.body).toBe('No vars {{here}}');
  });
});
