import { getOperateUrl } from '../../lib/utils/getOperateUrl';

describe('getOperateUrl', function() {

  const processInstanceKey = '12345';

  it('should return the correct URL', function() {
    const operateBaseUrl = 'http://localhost:3000';
    const expectedUrl = 'http://localhost:3000/processes/12345';
    expect(getOperateUrl(operateBaseUrl, processInstanceKey)).to.eql(expectedUrl);
  });


  it('should return the correct URL with path', function() {
    const operateBaseUrl = 'http://camunda.com/operate';
    const expectedUrl = 'http://camunda.com/operate/processes/12345';
    expect(getOperateUrl(operateBaseUrl, processInstanceKey)).to.eql(expectedUrl);
  });


  it('should handle trailing slash in base URL', function() {
    const operateBaseUrl = 'http://camunda.com/operate/';
    const expectedUrl = 'http://camunda.com/operate/processes/12345';
    expect(getOperateUrl(operateBaseUrl, processInstanceKey)).to.eql(expectedUrl);
  });


  it('should handle multiple trailing slashes in base URL', function() {
    const operateBaseUrl = 'http://camunda.com/operate///';
    const expectedUrl = 'http://camunda.com/operate/processes/12345';
    expect(getOperateUrl(operateBaseUrl, processInstanceKey)).to.eql(expectedUrl);
  });

});

