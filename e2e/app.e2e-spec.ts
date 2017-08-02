import { ApiMonitoringPage } from './app.po';

describe('api-monitoring App', () => {
  let page: ApiMonitoringPage;

  beforeEach(() => {
    page = new ApiMonitoringPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
