import { DEFAULT_BACKUP_WIDGET_ORIGIN } from '../constant';

describe('DEFAULT_BACKUP_WIDGET_ORIGIN', () => {
  it('points at the live production backup widget, not the development placeholder', () => {
    expect(DEFAULT_BACKUP_WIDGET_ORIGIN).toBe('https://backup.meshconnect.com');
  });
});
