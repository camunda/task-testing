import { getTasklistUrl } from '../../lib/utils/getTasklistUrl';

describe('getTasklistUrl', function() {

  const userTaskKey = '12345';

  it('should return the correct URL', function() {
    const tasklistBaseUrl = 'http://localhost:3000';
    const expectedUrl = 'http://localhost:3000/12345';
    expect(getTasklistUrl(tasklistBaseUrl, userTaskKey)).to.eql(expectedUrl);
  });


  it('should return the correct URL with path', function() {
    const tasklistBaseUrl = 'http://camunda.com/tasklist';
    const expectedUrl = 'http://camunda.com/tasklist/12345';
    expect(getTasklistUrl(tasklistBaseUrl, userTaskKey)).to.eql(expectedUrl);
  });


  it('should handle trailing slash in base URL', function() {
    const tasklistBaseUrl = 'http://camunda.com/tasklist/';
    const expectedUrl = 'http://camunda.com/tasklist/12345';
    expect(getTasklistUrl(tasklistBaseUrl, userTaskKey)).to.eql(expectedUrl);
  });


  it('should handle multiple trailing slashes in base URL', function() {
    const tasklistBaseUrl = 'http://camunda.com/tasklist///';
    const expectedUrl = 'http://camunda.com/tasklist/12345';
    expect(getTasklistUrl(tasklistBaseUrl, userTaskKey)).to.eql(expectedUrl);
  });


  it('should return null for invalid base URL', function() {
    const tasklistBaseUrl = 'http://%';
    expect(getTasklistUrl(tasklistBaseUrl, userTaskKey)).to.be.null;
  });

});
