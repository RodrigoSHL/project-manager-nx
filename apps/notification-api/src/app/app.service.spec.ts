import { testConfig } from './test-config';
import { NotificationConfig } from './config/notification.config';

describe('Notification configuration', () => {
  it.each(['', 'short', 'x'.repeat(257), 'x'.repeat(32) + ' '])(
    'fails startup with an invalid service token',
    (token) => {
      expect(
        () =>
          new NotificationConfig(
            testConfig({ NOTIFICATION_SERVICE_TOKEN: token })
          )
      ).toThrow('NOTIFICATION_SERVICE_TOKEN');
    }
  );
  it('defaults to the reserved internal port', () => {
    expect(
      new NotificationConfig(
        testConfig({ NOTIFICATION_SERVICE_TOKEN: 'x'.repeat(32) })
      ).port
    ).toBe(3008);
  });
  it.each(['-1', '65536', 'bad'])('rejects invalid ports', (port) => {
    expect(
      () =>
        new NotificationConfig(
          testConfig({
            NOTIFICATION_SERVICE_TOKEN: 'x'.repeat(32),
            NOTIFICATION_API_PORT: port,
          })
        )
    ).toThrow('NOTIFICATION_API_PORT');
  });
});
