export default {
  'input': {
    'ScriptTask_1': '{\n  "foo": 1,\n  "bar": 2\n}',
    'ServiceTask_3': '{\n  "jobWorkerDelay": 5,\n  "failJob": false,\n  "terminate": false\n}',
    'ReceiveTask_1': '{\n  "correlationKey": "foo",\n  "messageDelay": 15\n}'
  },
  'output': {
    'ScriptTask_1': {
      'success': true,
      'variables': {
        '6755399441794129': {
          'name': 'foo',
          'value': 1,
          'scope': 'PROCESS'
        },
        '6755399441794130': {
          'name': 'bar',
          'value': 2,
          'scope': 'PROCESS'
        },
        '6755399441794135': {
          'name': 'baz',
          'value': 3,
          'scope': 'PROCESS'
        }
      },
      'operateUrl': 'https://bru-2.operate.camunda.io/e0759720-5b73-459c-8d0b-b21678073330/processes/6755399441794128',
      'executionLog': [
        {
          'type': 'status',
          'status': 'deployed',
          'data': {
            'processDefinitionId': 'Process_TaskTesting',
            'processDefinitionKey': '2251799814406014',
            'processDefinitionVersion': 6,
            'deploymentKey': '2251799814424120'
          },
          'timestamp': 1772981075036
        },
        {
          'type': 'status',
          'status': 'instance-started',
          'data': {
            'processInstanceKey': '6755399441794128',
            'processDefinitionId': 'Process_TaskTesting',
            'processDefinitionKey': '2251799814406014'
          },
          'timestamp': 1772981075150
        },
        {
          'type': 'element-instance',
          'data': {
            'type': 'SCRIPT_TASK',
            'state': 'ACTIVE',
            'elementId': 'ScriptTask_1',
            'elementName': 'Script',
            'startDate': '2026-03-08T14:44:36.106Z',
            'endDate': '2026-03-08T14:44:36.106Z',
            'elementInstanceKey': '6755399441794132'
          },
          'timestamp': 1772981076106
        },
        {
          'type': 'element-instance',
          'data': {
            'type': 'SCRIPT_TASK',
            'state': 'COMPLETED',
            'elementId': 'ScriptTask_1',
            'elementName': 'Script',
            'startDate': '2026-03-08T14:44:36.106Z',
            'endDate': '2026-03-08T14:44:36.106Z',
            'elementInstanceKey': '6755399441794132'
          },
          'timestamp': 1772981076106
        },
        {
          'type': 'status',
          'status': 'completed',
          'data': {
            'processInstanceKey': '6755399441794128'
          },
          'timestamp': 1772981081604
        }
      ],
      'startedAt': 1772981074756,
      'finishedAt': 1772981081604
    },
    'ServiceTask_1': {
      'success': true,
      'variables': {
        '2251799814425660': {
          'name': 'readTimeoutInSeconds',
          'value': 20,
          'scope': 'LOCAL'
        },
        '2251799814425661': {
          'name': 'authentication',
          'value': {
            'type': 'noAuth'
          },
          'scope': 'LOCAL'
        },
        '2251799814425662': {
          'name': 'method',
          'value': 'GET',
          'scope': 'LOCAL'
        },
        '2251799814425663': {
          'name': 'ignoreNullValues',
          'value': false,
          'scope': 'LOCAL'
        },
        '2251799814425664': {
          'name': 'connectionTimeoutInSeconds',
          'value': 20,
          'scope': 'LOCAL'
        },
        '2251799814425665': {
          'name': 'url',
          'value': 'https://camunda.com',
          'scope': 'LOCAL'
        },
        '2251799814425666': {
          'name': 'storeResponse',
          'value': false,
          'scope': 'LOCAL'
        },
        '2251799814425670': {
          'name': 'response',
          'value': "{\"status\":200,\"headers\":{\"Transfer-Encoding\":\"chunked\",\"X-nananana\":\"Batcache-Hit\",\"Alt-Svc\":\"h3=\\\":443\\\"; ma=86400\",\"Server\":\"nginx\",\"X-Content-Type-Options\":\"nosniff\",\"Server-Timing\":\"a8c-cdn, dc;desc=ams, cache;desc=HIT;dur=1.0\",\"Connection\":\"keep-alive\",\"Last-Modified\":\"Sun, 08 Mar 2026 00:01:04 GMT\",\"Date\":\"Sun, 08 Mar 2026 14:48:58 GMT\",\"Referrer-Policy\":\"no-referrer-when-downgrade\",\"X-Frame-Options\":\"SAMEORIGIN\",\"Host-Header\":\"wpcloud\",\"Strict-Transport-Security\":\"max-age=31536000\",\"Cache-Control\":\"max-age=75082, must-revalidate\",\"Content-Encoding\":\"br\",\"Vary\":[\"Accept-Encoding\",\"Cookie\"],\"X-XSS-Protection\":\"1; mode=block\",\"Link\":\"<https://camunda.com/>; rel=shortlink\",\"X-ac\":\"5.ams _atomic_ams HIT\",\"Content-Type\":\"text/html; charset=UTF-8\"},\"body\":\"<!DOCTYPE html>\\n<html lang=\\\"en-US\\\">\\n<head>\\n\\t<meta charset=\\\"UTF-8\\\">\\n\\t<meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0, viewport-fit=cover\\\" />\\t\\t<meta name='robots' content='index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' />\\n\\t<link rel=\\\"me\\\" href=\\\"https://mas.to/@camunda\\\"/>\\n\\t<script>\\n\\t\\twindow.dataLayer = window.dataLayer ||[];\\n\\t\\tfunction gtag(){dataLayer.push(arguments);}\\n\\t\\tgtag('consent','default',{\\n\\t\\t\\t'ad_storage':'denied',\\n\\t\\t\\t'analytics_storage':'denied',\\n\\t\\t\\t'ad_user_data':'denied',\\n\\t\\t\\t'ad_personalization':'denied',\\n\\t\\t\\t'wait_for_update': 500\\n\\t\\t});\\n\\t\\tgtag(\\\"set\\\", \\\"ads_data_redaction\\\", true);\\n\\t</script>\\n\\t\\n\\t<!-- Start VWO Async SmartCode -->\\n\\t<link rel=\\\"preconnect\\\" href=\\\"https://dev.visualwebsiteoptimizer.com\\\" />\\n\\t<script type='text/javascript' id='vwoCode'>\\n\\twindow._vwo_code || (function() {\\n\\tvar account_id=645934,\\n\\tversion=2.1,\\n\\tsettings_tolerance=2000,\\n\\thide_element='body',\\n\\thide_element_style = 'opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;transition:none !important;',\\n\\t/* DO NOT EDIT BELOW THIS LINE */\\n\\tf=false,w=window,d=document,v=d.querySelector('#vwoCode'),cK='_vwo_'+account_id+'_settings',cc={};try{var c=JSON.parse(localStorage.getItem('_vwo_'+account_id+'_config'));cc=c&&typeof c==='object'?c:{}}catch(e){}var stT=cc.stT==='session'?w.sessionStorage:w.localStorage;code={nonce:v&&v.nonce,use_existing_jquery:function(){return typeof use_existing_jquery!=='undefined'?use_existing_jquery:undefined},library_tolerance:function(){return typeof library_tolerance!=='undefined'?library_tolerance:undefined},settings_tolerance:function(){return cc.sT||settings_tolerance},hide_element_style:function(){return'{'+(cc.hES||hide_element_style)+'}'},hide_element:function(){if(performance.getEntriesByName('first-contentful-paint')[0]){return''}return typeof cc.hE==='string'?cc.hE:hide_element},getVersion:function(){return version},finish:function(e){if(!f){f=true;var t=d.getElementById('_vis_opt_path_hides');if(t)t.parentNode.removeChild(t);if(e)(new Image).src='https://dev.visualwebsiteoptimizer.com/ee.gif?a='+account_id+e}},finished:function(){return f},addScript:function(e){var t=d.createElement('script');t.type='text/javascript';if(e.src){t.src=e.src}else{t.text=e.text}v&&t.setAttribute('nonce',v.nonce);d.getElementsByTagName('head')[0].appendChild(t)},load:function(e,t){var n=this.getSettings(),i=d.createElement('script'),r=this;t=t||{};if(n){i.textContent=n;d.getElementsByTagName('head')[0].appendChild(i);if(!w.VWO||VWO.caE){stT.removeItem(cK);r.load(e)}}else{var o=new XMLHttpRequest;o.open('GET',e,true);o.withCredentials=!t.dSC;o.responseType=t.responseType||'text';o.onload=function(){if(t.onloadCb){return t.onloadCb(o,e)}if(o.status===200||o.status===304){_vwo_code.addScript({text:o.responseText})}else{_vwo_code.finish('&e=loading_failure:'+e)}};o.onerror=function(){if(t.onerrorCb){return t.onerrorCb(e)}_vwo_code.finish('&e=loading_failure:'+e)};o.send()}},getSettings:function(){try{var e=stT.getItem(cK);if(!e){return}e=JSON.parse(e);if(Date.now()>e.e){stT.removeItem(cK);return}return e.s}catch(e){return}},init:function(){if(d.URL.indexOf('__vwo_disable__')>-1)return;var e=this.settings_tolerance();w._vwo_settings_timer=setTimeout(function(){_vwo_code.finish();stT.removeItem(cK)},e);var t;if(this.hide_element()!=='body'){t=d.createElement('style');var n=this.hide_element(),i=n?n+this.hide_element_style():'',r=d.getElementsByTagName('head')[0];t.setAttribute('id','_vis_opt_path_hides');v&&t.setAttribute('nonce',v.nonce);t.setAttribute('type','text/css');if(t.styleSheet)t.styleSheet.cssText=i;else t.appendChild(d.createTextNode(i));r.appendChild(t)}else{t=d.getElementsByTagName('head')[0];var i=d.createElement('div');i.style.cssText='z-index: 2147483647 !important;position: fixed !important;left: 0 !important;top: 0 !important;width: 100% !important;height: 100% !important;background: white !important;';i.setAttribute('id','_vis_opt_path_hides');i.classList.add('_vis_hide_layer');t.parentNode.insertBefore(i,t.nextSibling)}var o=window._vis_opt_url||d.URL,s='https://dev.visualwebsiteoptimizer.com/j.php?a='+account_id+'&u='+encodeURIComponent(o)+'&vn='+version;if(w.location.search.indexOf('_vwo_xhr')!==-1){this.addScript({src:s})}else{this.load(s+'&x=true')}}};w._vwo_code=code;code.init();})();\\n\\t</script>\\n\\t<!-- End VWO Async SmartCode -->\\n\\n\\t<script src=\\\"https://cmp.osano.com/16CVvwSNKHi9t1grQ/2ce963c0-31c9-4b54-b052-d66a2a948ccc/osano.js\\\"></script>\\n\\n\\t<!-- Google Tag Manager -->\\n\\t<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\\n\\tnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\\n\\tj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\\n\\t'https://ssgtm.camunda.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\\n\\t})(window,document,'script','dataLayer','GTM-PP9MHKW');</script>\\n\\t<!-- End Google Tag Manager -->\\n\\t\\t\\n\\t<!-- This site is optimized with the Yoast SEO Premium plugin v26.9 (Yoast SEO v26.9) - https://yoast.com/product/yoast-seo-premium-wordpress/ -->\\n\\t<title>The Universal Process Orchestrator | Camunda</title>\\n\\t<meta name=\\\"description\\\" content=\\\"Camunda&#039;s process orchestration platform allows developers to design, automate and improve processes. Start your free trial today.\\\" />\\n\\t<link rel=\\\"canonical\\\" href=\\\"https://camunda.com/\\\" />\\n\\t<meta property=\\\"og:locale\\\" content=\\\"en_US\\\" />\\n\\t<meta property=\\\"og:type\\\" content=\\\"website\\\" />\\n\\t<meta property=\\\"og:title\\\" content=\\\"The Universal Process Orchestrator | Camunda\\\" />\\n\\t<meta property=\\\"og:description\\\" content=\\\"Camunda&#039;s process orchestration platform allows developers to design, automate and improve processes. Start your free trial today.\\\" />\\n\\t<meta property=\\\"og:url\\\" content=\\\"https://camunda.com/\\\" />\\n\\t<meta property=\\\"og:site_name\\\" content=\\\"Camunda\\\" />\\n\\t<meta property=\\\"article:modified_time\\\" content=\\\"2026-01-15T20:40:52+00:00\\\" />\\n\\t<meta property=\\\"og:image\\\" content=\\\"https://camunda.com/wp-content/uploads/2022/04/1200x627_Camunda_Homepage_Ftd-Image.png\\\" />\\n\\t<meta property=\\\"og:image:width\\\" content=\\\"1201\\\" />\\n\\t<meta property=\\\"og:image:height\\\" content=\\\"629\\\" />\\n\\t<meta property=\\\"og:image:type\\\" content=\\\"image/png\\\" />\\n\\t<meta name=\\\"twitter:card\\\" content=\\\"summary_large_image\\\" />\\n\\t<meta name=\\\"twitter:title\\\" content=\\\"The Universal Process Orchestrator | Camunda\\\" />\\n\\t<meta name=\\\"twitter:description\\\" content=\\\"Camunda&#039;s process orchestration platform allows developers to design, automate and improve processes. Start your free trial today.\\\" />\\n\\t<meta name=\\\"twitter:image\\\" content=\\\"https://camunda.com/wp-content/uploads/2022/04/1200x627_Camunda_Homepage_Ftd-Image.png\\\" />\\n\\t<script type=\\\"application/ld+json\\\" class=\\\"yoast-schema-graph\\\">{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@graph\\\":[{\\\"@type\\\":\\\"WebPage\\\",\\\"@id\\\":\\\"https://camunda.com/\\\",\\\"url\\\":\\\"https://camunda.com/\\\",\\\"name\\\":\\\"The Universal Process Orchestrator | Camunda\\\",\\\"isPartOf\\\":{\\\"@id\\\":\\\"https://camunda.com/#website\\\"},\\\"about\\\":{\\\"@id\\\":\\\"https://camunda.com/#organization\\\"},\\\"primaryImageOfPage\\\":{\\\"@id\\\":\\\"https://camunda.com/#primaryimage\\\"},\\\"image\\\":{\\\"@id\\\":\\\"https://camunda.com/#primaryimage\\\"},\\\"thumbnailUrl\\\":\\\"https://c",
          'scope': 'PROCESS'
        },
        '2251799814425671': {
          'name': 'status',
          'value': 200,
          'scope': 'PROCESS'
        }
      },
      'operateUrl': 'https://bru-2.operate.camunda.io/e0759720-5b73-459c-8d0b-b21678073330/processes/2251799814425656',
      'executionLog': [
        {
          'type': 'status',
          'status': 'deployed',
          'data': {
            'processDefinitionId': 'Process_TaskTesting',
            'processDefinitionKey': '2251799814425654',
            'processDefinitionVersion': 9,
            'deploymentKey': '2251799814425653'
          },
          'timestamp': 1772981336906
        },
        {
          'type': 'status',
          'status': 'instance-started',
          'data': {
            'processInstanceKey': '2251799814425656',
            'processDefinitionId': 'Process_TaskTesting',
            'processDefinitionKey': '2251799814425654'
          },
          'timestamp': 1772981337008
        },
        {
          'type': 'element-instance',
          'data': {
            'type': 'SERVICE_TASK',
            'state': 'ACTIVE',
            'elementId': 'ServiceTask_1',
            'elementName': 'REST',
            'startDate': '2026-03-08T14:48:57.968Z',
            'endDate': '2026-03-08T14:48:59.326Z',
            'elementInstanceKey': '2251799814425658'
          },
          'timestamp': 1772981337968
        },
        {
          'type': 'job',
          'data': {
            'state': 'CREATED',
            'type': 'io.camunda:http-json:1',
            'elementId': 'ServiceTask_1',
            'kind': 'BPMN_ELEMENT',
            'listenerEventType': 'UNSPECIFIED',
            'jobKey': '2251799814425667',
            'creationTime': '2026-03-08T14:48:57.968Z',
            'endTime': '2026-03-08T14:48:59.326Z'
          },
          'timestamp': 1772981337968
        },
        {
          'type': 'status',
          'status': 'completed',
          'data': {
            'processInstanceKey': '2251799814425656'
          },
          'timestamp': 1772981339264
        },
        {
          'type': 'element-instance',
          'data': {
            'type': 'SERVICE_TASK',
            'state': 'COMPLETED',
            'elementId': 'ServiceTask_1',
            'elementName': 'REST',
            'startDate': '2026-03-08T14:48:57.968Z',
            'endDate': '2026-03-08T14:48:59.326Z',
            'elementInstanceKey': '2251799814425658'
          },
          'timestamp': 1772981339326
        },
        {
          'type': 'job',
          'data': {
            'state': 'COMPLETED',
            'type': 'io.camunda:http-json:1',
            'elementId': 'ServiceTask_1',
            'kind': 'BPMN_ELEMENT',
            'listenerEventType': 'UNSPECIFIED',
            'jobKey': '2251799814425667',
            'creationTime': '2026-03-08T14:48:57.968Z',
            'endTime': '2026-03-08T14:48:59.326Z'
          },
          'timestamp': 1772981339326
        }
      ],
      'startedAt': 1772981336594,
      'finishedAt': 1772981339265
    },
    'ServiceTask_2': {
      'success': false,
      'variables': {
        '4503599628110850': {
          'name': 'readTimeoutInSeconds',
          'value': 20,
          'scope': 'LOCAL'
        },
        '4503599628110851': {
          'name': 'storeResponse',
          'value': false,
          'scope': 'LOCAL'
        },
        '4503599628110852': {
          'name': 'method',
          'value': 'GET',
          'scope': 'LOCAL'
        },
        '4503599628110853': {
          'name': 'ignoreNullValues',
          'value': false,
          'scope': 'LOCAL'
        },
        '4503599628110854': {
          'name': 'authentication',
          'value': {
            'type': 'noAuth'
          },
          'scope': 'LOCAL'
        },
        '4503599628110855': {
          'name': 'url',
          'value': 'https://camunda.foobar',
          'scope': 'LOCAL'
        },
        '4503599628110856': {
          'name': 'connectionTimeoutInSeconds',
          'value': 20,
          'scope': 'LOCAL'
        },
        '4503599628110859': {
          'name': 'error',
          'value': {
            'type': 'io.camunda.connector.api.error.ConnectorException',
            'code': '502',
            'variables': {
              'response': {
                'headers': {
                  'Content-Length': '88',
                  'X-Smokescreen-Error': 'Failed to resolve remote hostname: lookup camunda.foobar on 10.44.0.10:53: no such host',
                  'Content-Type': 'text/plain'
                },
                'body': 'Failed to resolve remote hostname: lookup camunda.foobar on 10.44.0.10:53: no such host\n'
              }
            },
            'message': 'Bad gateway'
          },
          'scope': 'LOCAL'
        }
      },
      'incident': {
        'processDefinitionId': 'Process_TaskTesting',
        'errorType': 'JOB_NO_RETRIES',
        'errorMessage': 'Bad gateway',
        'elementId': 'ServiceTask_2',
        'creationTime': '2026-03-08T14:49:56.212Z',
        'state': 'ACTIVE',
        'tenantId': '<default>',
        'incidentKey': '4503599628110864',
        'processDefinitionKey': '2251799814425654',
        'processInstanceKey': '4503599628110846',
        'elementInstanceKey': '4503599628110848',
        'jobKey': '4503599628110857'
      },
      'operateUrl': 'https://bru-2.operate.camunda.io/e0759720-5b73-459c-8d0b-b21678073330/processes/4503599628110846',
      'executionLog': [
        {
          'type': 'status',
          'status': 'deployed',
          'data': {
            'processDefinitionId': 'Process_TaskTesting',
            'processDefinitionKey': '2251799814425654',
            'processDefinitionVersion': 9,
            'deploymentKey': '2251799814426017'
          },
          'timestamp': 1772981394422
        },
        {
          'type': 'status',
          'status': 'instance-started',
          'data': {
            'processInstanceKey': '4503599628110846',
            'processDefinitionId': 'Process_TaskTesting',
            'processDefinitionKey': '2251799814425654'
          },
          'timestamp': 1772981394532
        },
        {
          'type': 'element-instance',
          'data': {
            'type': 'SERVICE_TASK',
            'state': 'ACTIVE',
            'elementId': 'ServiceTask_2',
            'elementName': 'REST Incident',
            'startDate': '2026-03-08T14:49:55.487Z',
            'elementInstanceKey': '4503599628110848'
          },
          'timestamp': 1772981395487
        },
        {
          'type': 'status',
          'status': 'incident',
          'data': {
            'processInstanceKey': '4503599628110846',
            'errorType': 'JOB_NO_RETRIES',
            'errorMessage': 'Bad gateway'
          },
          'timestamp': 1772981403807
        }
      ],
      'startedAt': 1772981394104,
      'finishedAt': 1772981403807
    },
    'ServiceTask_4': {
      'success': true,
      'variables': {
        'RPA_Result': 'https://foobar.com'
      },
      'operateUrl': 'https://camunda.com'
    }
  }
};